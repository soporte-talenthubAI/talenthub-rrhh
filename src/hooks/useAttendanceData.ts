import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  fecha: string;
  hora_entrada: string | null;
  hora_salida: string | null;
  horas_trabajadas: number | null;
  llegada_tarde: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export const useAttendanceData = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchRecords = async () => {
    if (!tenant?.id) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('fecha', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de asistencia",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{ ...record, tenant_id: tenant?.id }])
        .select()
        .single();

      if (error) throw error;

      setRecords(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding attendance record:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el registro de asistencia",
        variant: "destructive"
      });
      throw error;
    }
  };

  const bulkInsert = async (records: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const recordsWithTenant = records.map(r => ({ ...r, tenant_id: tenant?.id }));
      const { data, error } = await supabase
        .from('attendance')
        .insert(recordsWithTenant)
        .select();

      if (error) throw error;

      await fetchRecords(); // Refresh all records
      return data;
    } catch (error) {
      console.error('Error bulk inserting attendance records:', error);
      toast({
        title: "Error",
        description: "No se pudieron procesar todos los registros de asistencia",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateRecord = async (id: string, updates: Partial<AttendanceRecord>) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRecords(prev => prev.map(record => 
        record.id === id ? { ...record, ...data } : record
      ));
      return data;
    } catch (error) {
      console.error('Error updating attendance record:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro de asistencia",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRecords(prev => prev.filter(record => record.id !== id));
      toast({
        title: "Registro eliminado",
        description: "El registro de asistencia ha sido eliminado",
      });
    } catch (error) {
      console.error('Error deleting attendance record:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro de asistencia",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchRecords();
    }

    // Set up real-time subscription
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance'
        },
        () => {
          if (tenant?.id) fetchRecords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  return {
    records,
    loading,
    addRecord,
    bulkInsert,
    updateRecord,
    deleteRecord,
    refetch: fetchRecords
  };
};