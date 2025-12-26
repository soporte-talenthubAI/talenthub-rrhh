/**
 * Cliente de Supabase configurado para Multi-Tenant
 *
 * ARQUITECTURA MULTI-TENANT:
 * - Una base de datos central para todos los clientes
 * - Aislamiento de datos mediante Row Level Security (RLS)
 * - tenant_id en cada tabla operativa
 *
 * El tenant_id se inyecta automáticamente en las queries mediante:
 * 1. Claims del JWT (preferido para RLS)
 * 2. Tabla tenant_users para verificar acceso
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Variables de entorno (OBLIGATORIAS)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables existan
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Faltan variables de entorno de Supabase.\n' +
    'Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env o en Vercel.'
  );
}

// Log para debug (solo en desarrollo)
if (import.meta.env.DEV) {
  console.log('🔧 [SUPABASE] Conectando a:', SUPABASE_URL.substring(0, 30) + '...');
}

// Clave para almacenar el tenant_id actual
const CURRENT_TENANT_KEY = 'current_tenant_id';

/**
 * Cliente principal de Supabase
 *
 * Import: import { supabase } from "@/integrations/supabase/client";
 */
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      // Headers adicionales si se necesitan
    },
  },
});

/**
 * Obtener el tenant_id actual del localStorage
 */
export const getCurrentTenantId = (): string | null => {
  return localStorage.getItem(CURRENT_TENANT_KEY);
};

/**
 * Establecer el tenant_id actual
 * Esto se usa cuando el usuario selecciona/cambia de tenant
 */
export const setCurrentTenantId = (tenantId: string | null): void => {
  if (tenantId) {
    localStorage.setItem(CURRENT_TENANT_KEY, tenantId);
    if (import.meta.env.DEV) {
      console.log('🏢 [TENANT] Establecido:', tenantId);
    }
  } else {
    localStorage.removeItem(CURRENT_TENANT_KEY);
  }
};

/**
 * Limpiar el tenant actual (al cerrar sesión)
 */
export const clearCurrentTenant = (): void => {
  localStorage.removeItem(CURRENT_TENANT_KEY);
};

/**
 * Helper para agregar filtro de tenant a las queries
 *
 * Uso:
 * const { data } = await supabase
 *   .from('employees')
 *   .select('*')
 *   .eq('tenant_id', getTenantFilter())
 */
export const getTenantFilter = (): string => {
  const tenantId = getCurrentTenantId();
  if (!tenantId) {
    console.warn('⚠️ [TENANT] No hay tenant_id establecido');
  }
  return tenantId || '';
};

/**
 * Helper para crear un objeto con tenant_id para inserts
 *
 * Uso:
 * await supabase.from('employees').insert({
 *   ...employeeData,
 *   ...withTenantId()
 * })
 */
export const withTenantId = (): { tenant_id: string } | Record<string, never> => {
  const tenantId = getCurrentTenantId();
  return tenantId ? { tenant_id: tenantId } : {};
};

/**
 * Crear un cliente de Supabase para operaciones de backoffice
 * (sin filtro de tenant para admins)
 */
export const getBackofficeClient = (): SupabaseClient<Database> => {
  return supabase;
};

/**
 * Verificar si el usuario actual tiene acceso a un tenant específico
 */
export const verifyTenantAccess = async (tenantId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('tenant_users')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    return !!data;
  } catch {
    return false;
  }
};

/**
 * Obtener todos los tenants a los que tiene acceso el usuario actual
 */
export const getUserTenants = async (): Promise<Array<{ tenant_id: string; role: string }>> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    return data || [];
  } catch {
    return [];
  }
};

// Escuchar cambios de autenticación para limpiar tenant al cerrar sesión
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    clearCurrentTenant();
  }
});