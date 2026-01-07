import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface Absence {
  id: string;
  employee_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo: string;
  motivo?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  certificado_medico: boolean;
  archivo_url?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
  empleadoNombre?: string;
  empleadoDni?: string;
}

export const useAbsences = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchAbsences = async () => {
    if (!tenant?.id) {
      setAbsences([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('absences')
        .select(`
          *,
          employees:employees!inner (*, tenant_id)
        `)
        .eq('employees.tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = ((data as any[]) || []).map((row) => {
        const emp = row.employees as any;
        const absence: Absence = {
          id: row.id,
          employee_id: row.employee_id,
          fecha_inicio: row.fecha_inicio,
          fecha_fin: row.fecha_fin,
          tipo: row.tipo,
          motivo: row.motivo || undefined,
          estado: row.estado,
          certificado_medico: !!row.certificado_medico,
          archivo_url: row.archivo_url ?? null,
          observaciones: row.observaciones ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
          empleadoDni: emp?.dni ?? ''
        };
        return absence;
      });

      setAbsences(mapped);
    } catch (error) {
      console.error('Error fetching absences:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las ausencias',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAbsence = async (absenceData: Omit<Absence, 'id' | 'created_at' | 'updated_at' | 'empleadoNombre' | 'empleadoDni'>) => {
    try {
      const insertPayload = {
        employee_id: absenceData.employee_id,
        fecha_inicio: absenceData.fecha_inicio,
        fecha_fin: absenceData.fecha_fin,
        tipo: absenceData.tipo,
        motivo: absenceData.motivo ?? null,
        estado: absenceData.estado ?? 'pendiente',
        certificado_medico: !!absenceData.certificado_medico,
        archivo_url: absenceData.archivo_url ?? null,
        observaciones: absenceData.observaciones ?? null,
        tenant_id: tenant?.id,
      };

      const { data, error } = await (supabase as any)
        .from('absences')
        .insert([insertPayload])
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const newAbsence: Absence = {
        id: data.id,
        employee_id: data.employee_id,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        tipo: data.tipo,
        motivo: data.motivo || undefined,
        estado: data.estado,
        certificado_medico: !!data.certificado_medico,
        archivo_url: data.archivo_url ?? null,
        observaciones: data.observaciones ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      setAbsences((prev) => [newAbsence, ...prev]);
      toast({ title: 'Éxito', description: 'Ausencia agregada correctamente' });
      return data;
    } catch (error) {
      console.error('Error adding absence:', error);
      toast({ title: 'Error', description: 'No se pudo agregar la ausencia', variant: 'destructive' });
      throw error;
    }
  };

  const updateAbsence = async (id: string, absenceData: Partial<Absence>) => {
    try {
      // Actualizar inmediatamente en el estado local (optimistic update)
      setAbsences((prev) => prev.map((a) => 
        a.id === id ? { ...a, ...absenceData } : a
      ));

      const { data, error } = await (supabase as any)
        .from('absences')
        .update(absenceData)
        .eq('id', id)
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const updated: Absence = {
        id: data.id,
        employee_id: data.employee_id,
        fecha_inicio: data.fecha_inicio,
        fecha_fin: data.fecha_fin,
        tipo: data.tipo,
        motivo: data.motivo || undefined,
        estado: data.estado,
        certificado_medico: !!data.certificado_medico,
        archivo_url: data.archivo_url ?? null,
        observaciones: data.observaciones ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      // Confirmar actualización con datos reales del servidor
      setAbsences((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast({ title: 'Éxito', description: 'Ausencia actualizada correctamente' });
      return data;
    } catch (error) {
      console.error('Error updating absence:', error);
      // Revertir el cambio optimista en caso de error
      await fetchAbsences();
      toast({ title: 'Error', description: 'No se pudo actualizar la ausencia', variant: 'destructive' });
      throw error;
    }
  };

  const deleteAbsence = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('absences')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setAbsences((prev) => prev.filter((a) => a.id !== id));
      toast({ title: 'Éxito', description: 'Ausencia eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting absence:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la ausencia', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchAbsences();
    }

    // Realtime updates
    const channel = (supabase as any)
      .channel('absences-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'absences' },
        () => {
          if (tenant?.id) fetchAbsences();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [tenant?.id]);

  return {
    absences,
    loading,
    addAbsence,
    updateAbsence,
    deleteAbsence,
    refetch: fetchAbsences,
  };
};