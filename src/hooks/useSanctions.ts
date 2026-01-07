import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface Sanction {
  id: string;
  employee_id: string;
  tipo: 'apercibimiento' | 'sancion';
  fecha_documento: string;
  motivo: string;
  lugar_hecho?: string;
  fecha_hecho?: string;
  dias_suspension?: number;
  fecha_inicio?: string;
  fecha_reincorporacion?: string;
  pdf_url?: string;
  estado: 'activo' | 'anulado';
  observaciones?: string;
  created_at: string;
  updated_at: string;
}

export const useSanctions = () => {
  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchSanctions = async () => {
    if (!tenant?.id) {
      setSanctions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sanctions')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('fecha_documento', { ascending: false });

      if (error) throw error;
      setSanctions((data || []) as Sanction[]);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al cargar sanciones',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchSanctions();
    }
  }, [tenant?.id]);

  const addSanction = async (sanctionData: Omit<Sanction, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('sanctions')
        .insert({ ...sanctionData, tenant_id: tenant?.id })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Sanción registrada',
        description: `Se ha registrado el ${sanctionData.tipo} correctamente.`,
      });

      await fetchSanctions();
      return { data, error: null };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al registrar sanción',
        description: error.message,
      });
      return { data: null, error };
    }
  };

  const updateSanction = async (id: string, sanctionData: Partial<Sanction>) => {
    try {
      const { error } = await supabase
        .from('sanctions')
        .update(sanctionData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sanción actualizada',
        description: 'Los datos se actualizaron correctamente.',
      });

      await fetchSanctions();
      return { error: null };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar sanción',
        description: error.message,
      });
      return { error };
    }
  };

  const deleteSanction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sanctions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sanción eliminada',
        description: 'El registro se eliminó correctamente.',
      });

      await fetchSanctions();
      return { error: null };
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar sanción',
        description: error.message,
      });
      return { error };
    }
  };

  return {
    sanctions,
    loading,
    addSanction,
    updateSanction,
    deleteSanction,
    refetch: fetchSanctions,
  };
};
