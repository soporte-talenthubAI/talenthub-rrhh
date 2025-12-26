/**
 * Contexto de Tenant para Multi-Tenancy (Simplificado)
 *
 * Solo maneja:
 * - Información del tenant actual
 * - Plan asignado al tenant
 * - Módulos habilitados según el plan
 *
 * NO maneja precios ni límites de empleados (gestionados externamente)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// =====================================================
// TIPOS SIMPLIFICADOS
// =====================================================

interface SimpleTenant {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: 'basic' | 'professional' | 'enterprise';
}

interface TenantContextType {
  // Estado actual
  tenant: SimpleTenant | null;
  loading: boolean;
  error: string | null;

  // Módulos habilitados
  enabledModules: string[];
  isModuleEnabled: (moduleKey: string) => boolean;

  // Acciones
  switchTenant: (tenantId: string) => Promise<void>;
  refreshTenantData: () => Promise<void>;
}

// Contexto con valor por defecto
const TenantContext = createContext<TenantContextType | undefined>(undefined);

// Clave para localStorage
const TENANT_STORAGE_KEY = 'current_tenant_id';

// =====================================================
// PROVIDER
// =====================================================

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<SimpleTenant | null>(null);
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del tenant
  const loadTenantData = useCallback(async (tenantId: string) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Cargar información del tenant (cliente)
      const { data: tenantData, error: tenantError } = await (supabase as any)
        .from('talenthub_clients')
        .select('id, nombre, nombre_corto, logo_url, color_primario, color_secundario, status, plan')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;
      setTenant(tenantData);

      // 2. Cargar módulos habilitados para este cliente
      const { data: clientModules } = await (supabase as any)
        .from('talenthub_client_modules')
        .select('module:talenthub_modules(key)')
        .eq('client_id', tenantId)
        .eq('is_enabled', true);

      const moduleKeys = clientModules
        ?.map((cm: any) => cm.module?.key)
        .filter(Boolean) || [];

      setEnabledModules(moduleKeys);

      // Guardar tenant seleccionado
      localStorage.setItem(TENANT_STORAGE_KEY, tenantId);

    } catch (err) {
      console.error('Error loading tenant data:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar datos del tenant');
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar - buscar tenant del usuario
  const initializeTenant = useCallback(async () => {
    try {
      setLoading(true);

      // Verificar si hay un tenant guardado
      const savedTenantId = localStorage.getItem(TENANT_STORAGE_KEY);

      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sin usuario autenticado - limpiar estado
        setTenant(null);
        setEnabledModules([]);
        setLoading(false);
        return;
      }

      // Buscar tenants del usuario
      const { data: userTenants } = await (supabase as any)
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!userTenants || userTenants.length === 0) {
        // Usuario sin tenants asignados - podría ser un usuario nuevo
        // No mostrar error, simplemente dejar vacío
        setLoading(false);
        return;
      }

      // Determinar qué tenant cargar
      let tenantIdToLoad: string;

      if (savedTenantId && userTenants.some((t: any) => t.tenant_id === savedTenantId)) {
        // Usar tenant guardado si el usuario tiene acceso
        tenantIdToLoad = savedTenantId;
      } else {
        // Usar el primer tenant disponible
        tenantIdToLoad = userTenants[0].tenant_id;
      }

      await loadTenantData(tenantIdToLoad);

    } catch (err) {
      console.error('Error initializing tenant:', err);
      setError(err instanceof Error ? err.message : 'Error al inicializar');
      setLoading(false);
    }
  }, [loadTenantData]);

  // Cambiar de tenant
  const switchTenant = useCallback(async (tenantId: string) => {
    await loadTenantData(tenantId);
  }, [loadTenantData]);

  // Refrescar datos del tenant actual
  const refreshTenantData = useCallback(async () => {
    if (tenant?.id) {
      await loadTenantData(tenant.id);
    }
  }, [tenant?.id, loadTenantData]);

  // Verificar si un módulo está habilitado
  const isModuleEnabled = useCallback((moduleKey: string): boolean => {
    return enabledModules.includes(moduleKey);
  }, [enabledModules]);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_IN') {
          initializeTenant();
        } else if (event === 'SIGNED_OUT') {
          setTenant(null);
          setEnabledModules([]);
          localStorage.removeItem(TENANT_STORAGE_KEY);
        }
      }
    );

    // Inicializar al montar
    initializeTenant();

    return () => {
      authSubscription.unsubscribe();
    };
  }, [initializeTenant]);

  // Valor del contexto
  const contextValue: TenantContextType = useMemo(() => ({
    tenant,
    loading,
    error,
    enabledModules,
    isModuleEnabled,
    switchTenant,
    refreshTenantData,
  }), [
    tenant,
    loading,
    error,
    enabledModules,
    isModuleEnabled,
    switchTenant,
    refreshTenantData,
  ]);

  return (
    <TenantContext.Provider value={contextValue}>
      {children}
    </TenantContext.Provider>
  );
};

// =====================================================
// HOOKS
// =====================================================

// Hook para usar el contexto
export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Hook para verificar permisos de módulo
export const useModuleAccess = (moduleKey: string): { hasAccess: boolean; loading: boolean } => {
  const { isModuleEnabled, loading } = useTenant();
  return {
    hasAccess: isModuleEnabled(moduleKey),
    loading,
  };
};

export default TenantContext;
