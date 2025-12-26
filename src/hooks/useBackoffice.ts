/**
 * Hook para gestionar el backoffice de TalentHub
 * Solo se usa en el Supabase maestro de TalentHub
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TalentHubClient {
  id: string;
  nombre: string;
  nombre_corto: string | null;
  cuit: string | null;
  email_contacto: string | null;
  telefono: string | null;
  direccion: string | null;
  logo_url: string | null;
  color_primario: string;
  color_secundario: string;
  supabase_url: string | null;
  supabase_project_id: string | null;
  status: 'active' | 'suspended' | 'trial' | 'cancelled';
  plan: 'basic' | 'professional' | 'enterprise';
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentHubModule {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  orden: number;
  is_core: boolean;
  plan_minimo: string;
}

export interface ClientModule {
  id: string;
  client_id: string;
  module_id: string;
  is_enabled: boolean;
  enabled_at: string;
  config: Record<string, any>;
}

export interface TalentHubAdmin {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  role: 'super_admin' | 'support' | 'sales';
  is_active: boolean;
  last_login: string | null;
}

export const useBackoffice = () => {
  const [clients, setClients] = useState<TalentHubClient[]>([]);
  const [modules, setModules] = useState<TalentHubModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBackofficeAvailable, setIsBackofficeAvailable] = useState(false);
  const { toast } = useToast();

  // Verificar si las tablas de backoffice existen
  const checkBackofficeAvailable = async () => {
    try {
      const { error } = await supabase
        .from('talenthub_modules')
        .select('id')
        .limit(1);
      
      setIsBackofficeAvailable(!error);
      return !error;
    } catch {
      setIsBackofficeAvailable(false);
      return false;
    }
  };

  // Cargar módulos disponibles
  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('talenthub_modules')
        .select('*')
        .order('orden');

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
    }
  };

  // Cargar clientes
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('talenthub_clients')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Crear cliente
  const createClient = async (clientData: Omit<TalentHubClient, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('talenthub_clients')
        .insert([clientData])
        .select()
        .single();

      if (error) throw error;

      // Habilitar módulos core automáticamente
      const coreModules = modules.filter(m => m.is_core);
      if (coreModules.length > 0) {
        await supabase
          .from('talenthub_client_modules')
          .insert(coreModules.map(m => ({
            client_id: data.id,
            module_id: m.id,
            is_enabled: true
          })));
      }

      setClients(prev => [...prev, data]);
      toast({
        title: "Cliente creado",
        description: `${data.nombre} ha sido registrado correctamente`,
      });

      return data;
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Actualizar cliente
  const updateClient = async (id: string, clientData: Partial<TalentHubClient>) => {
    try {
      const { data, error } = await supabase
        .from('talenthub_clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setClients(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Cliente actualizado",
        description: "Los cambios se guardaron correctamente",
      });

      return data;
    } catch (error) {
      console.error('Error updating client:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Eliminar cliente
  const deleteClient = async (id: string) => {
    try {
      // Primero eliminar módulos asociados
      await supabase
        .from('talenthub_client_modules')
        .delete()
        .eq('client_id', id);

      // Luego eliminar el cliente
      const { error } = await supabase
        .from('talenthub_clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClients(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado correctamente",
      });

      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Obtener módulos de un cliente
  const getClientModules = async (clientId: string): Promise<ClientModule[]> => {
    try {
      const { data, error } = await supabase
        .from('talenthub_client_modules')
        .select('*')
        .eq('client_id', clientId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching client modules:', error);
      return [];
    }
  };

  // Habilitar/deshabilitar módulo para cliente
  const toggleClientModule = async (
    clientId: string, 
    moduleId: string, 
    enable: boolean
  ): Promise<boolean> => {
    try {
      if (enable) {
        // Verificar si ya existe el registro
        const { data: existing } = await supabase
          .from('talenthub_client_modules')
          .select('id')
          .eq('client_id', clientId)
          .eq('module_id', moduleId)
          .single();

        if (existing) {
          // Actualizar
          await supabase
            .from('talenthub_client_modules')
            .update({ is_enabled: true, enabled_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          // Crear
          await supabase
            .from('talenthub_client_modules')
            .insert([{
              client_id: clientId,
              module_id: moduleId,
              is_enabled: true
            }]);
        }
      } else {
        // Deshabilitar
        await supabase
          .from('talenthub_client_modules')
          .update({ is_enabled: false })
          .eq('client_id', clientId)
          .eq('module_id', moduleId);
      }

      const module = modules.find(m => m.id === moduleId);
      toast({
        title: enable ? "Módulo habilitado" : "Módulo deshabilitado",
        description: `${module?.nombre || moduleId} ${enable ? 'activado' : 'desactivado'}`,
      });

      return true;
    } catch (error) {
      console.error('Error toggling module:', error);
      toast({
        title: "Error",
        description: "No se pudo cambiar el estado del módulo",
        variant: "destructive",
      });
      return false;
    }
  };

  // Registrar acción de admin
  const logAdminAction = async (
    adminId: string,
    action: string,
    entityType?: string,
    entityId?: string,
    details?: Record<string, any>
  ) => {
    try {
      await supabase
        .from('talenthub_admin_logs')
        .insert([{
          admin_id: adminId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          details
        }]);
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  // Inicializar
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const available = await checkBackofficeAvailable();
      if (available) {
        await Promise.all([fetchModules(), fetchClients()]);
      }
      setLoading(false);
    };
    init();
  }, []);

  return {
    // Estado
    clients,
    modules,
    loading,
    isBackofficeAvailable,

    // Acciones
    createClient,
    updateClient,
    deleteClient,
    getClientModules,
    toggleClientModule,
    logAdminAction,
    refetch: () => Promise.all([fetchModules(), fetchClients()]),
  };
};

