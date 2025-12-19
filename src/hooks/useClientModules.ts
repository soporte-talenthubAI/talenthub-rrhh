/**
 * Hook para gestionar los módulos habilitados del cliente actual
 * 
 * Este hook se usa en cada instancia de cliente para:
 * 1. Verificar qué módulos tiene habilitados
 * 2. Mostrar/ocultar módulos en el sidebar según configuración
 * 
 * Funciona de dos maneras:
 * - Si existe la tabla client_config: lee de la BD
 * - Si no existe: habilita todos los módulos (fallback para desarrollo)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface EnabledModule {
  id: string;
  is_enabled: boolean;
  config?: Record<string, any>;
}

// Lista completa de módulos disponibles
export const ALL_MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', isCore: true },
  { id: 'employees', name: 'Empleados', icon: 'Users', isCore: true },
  { id: 'attendance', name: 'Asistencia', icon: 'Clock', isCore: false },
  { id: 'vacations', name: 'Vacaciones', icon: 'Calendar', isCore: false },
  { id: 'absences', name: 'Ausencias', icon: 'CalendarOff', isCore: false },
  { id: 'sanctions', name: 'Sanciones', icon: 'AlertTriangle', isCore: false },
  { id: 'documents', name: 'Documentos', icon: 'FileText', isCore: false },
  { id: 'payroll', name: 'Nómina', icon: 'DollarSign', isCore: false },
  { id: 'training', name: 'Capacitaciones', icon: 'GraduationCap', isCore: false },
  { id: 'uniforms', name: 'Uniformes', icon: 'Shirt', isCore: false },
  { id: 'performance', name: 'Desempeño', icon: 'TrendingUp', isCore: false },
  { id: 'selection', name: 'Selección', icon: 'UserPlus', isCore: false },
  { id: 'declarations', name: 'Declaraciones', icon: 'ClipboardList', isCore: false },
  { id: 'consultations', name: 'Consultas', icon: 'MessageSquare', isCore: false },
  { id: 'calendar', name: 'Calendario', icon: 'CalendarDays', isCore: false },
  { id: 'reports', name: 'Reportes', icon: 'BarChart3', isCore: false },
] as const;

export type ModuleId = typeof ALL_MODULES[number]['id'];

export const useClientModules = () => {
  const [enabledModules, setEnabledModules] = useState<Set<ModuleId>>(new Set());
  const [loading, setLoading] = useState(true);
  const [configTableExists, setConfigTableExists] = useState(false);

  // Verificar si existe la tabla de configuración de cliente
  const checkConfigTable = async (): Promise<boolean> => {
    try {
      // Intentar leer de client_modules_config (tabla local del cliente)
      const { error } = await supabase
        .from('client_modules_config')
        .select('module_id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  };

  // Cargar módulos habilitados desde la BD
  const fetchEnabledModules = async () => {
    try {
      const tableExists = await checkConfigTable();
      setConfigTableExists(tableExists);

      if (tableExists) {
        // Leer configuración desde la BD
        const { data, error } = await supabase
          .from('client_modules_config')
          .select('module_id, is_enabled')
          .eq('is_enabled', true);

        if (!error && data) {
          const enabled = new Set(data.map(m => m.module_id as ModuleId));
          // Siempre agregar módulos core
          ALL_MODULES.filter(m => m.isCore).forEach(m => enabled.add(m.id as ModuleId));
          setEnabledModules(enabled);
        } else {
          // Si hay error, habilitar todos
          setEnabledModules(new Set(ALL_MODULES.map(m => m.id as ModuleId)));
        }
      } else {
        // Si no existe la tabla, habilitar todos los módulos (desarrollo/demo)
        setEnabledModules(new Set(ALL_MODULES.map(m => m.id as ModuleId)));
      }
    } catch (error) {
      console.error('Error loading client modules:', error);
      // Fallback: habilitar todos
      setEnabledModules(new Set(ALL_MODULES.map(m => m.id as ModuleId)));
    } finally {
      setLoading(false);
    }
  };

  // Verificar si un módulo está habilitado
  const isModuleEnabled = (moduleId: ModuleId): boolean => {
    // Módulos core siempre habilitados
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (module?.isCore) return true;
    
    return enabledModules.has(moduleId);
  };

  // Obtener lista de módulos habilitados con metadata
  const getEnabledModulesList = () => {
    return ALL_MODULES.filter(m => isModuleEnabled(m.id as ModuleId));
  };

  useEffect(() => {
    fetchEnabledModules();
  }, []);

  return {
    enabledModules,
    loading,
    configTableExists,
    isModuleEnabled,
    getEnabledModulesList,
    allModules: ALL_MODULES,
    refetch: fetchEnabledModules,
  };
};

