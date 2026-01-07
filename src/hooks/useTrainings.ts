import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface Training {
  id: string;
  employee_id: string;
  titulo: string;
  descripcion?: string | null;
  tipo: string;
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'cancelado';
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  fecha_vencimiento?: string | null;
  instructor?: string | null;
  modalidad?: 'presencial' | 'virtual' | 'mixta' | null;
  duracion_horas?: number | null;
  calificacion?: number | null;
  certificado_url?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
  empleadoNombre?: string;
  empleadoDni?: string;
}

export const useTrainings = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchTrainings = async () => {
    if (!tenant?.id) {
      setTrainings([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('trainings')
        .select(`
          *,
          employees:employees!inner (*, tenant_id)
        `)
        .eq('employees.tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = ((data as any[]) || []).map((row) => {
        const emp = row.employees as any;
        const training: Training = {
          id: row.id,
          employee_id: row.employee_id,
          titulo: row.titulo,
          descripcion: row.descripcion ?? null,
          tipo: row.tipo,
          estado: row.estado,
          fecha_inicio: row.fecha_inicio ?? null,
          fecha_fin: row.fecha_fin ?? null,
          fecha_vencimiento: row.fecha_vencimiento ?? null,
          instructor: row.instructor ?? null,
          modalidad: row.modalidad ?? null,
          duracion_horas: row.duracion_horas ?? null,
          calificacion: row.calificacion ?? null,
          certificado_url: row.certificado_url ?? null,
          observaciones: row.observaciones ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
          empleadoDni: emp?.dni ?? ''
        };
        return training;
      });

      setTrainings(mapped);
    } catch (error) {
      console.error('Error fetching trainings:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las capacitaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addTraining = async (trainingData: Omit<Training, 'id' | 'created_at' | 'updated_at' | 'empleadoNombre' | 'empleadoDni'>) => {
    try {
      const insertPayload = {
        employee_id: trainingData.employee_id,
        titulo: trainingData.titulo,
        descripcion: trainingData.descripcion ?? null,
        tipo: trainingData.tipo,
        estado: trainingData.estado ?? 'pendiente',
        fecha_inicio: trainingData.fecha_inicio ?? null,
        fecha_fin: trainingData.fecha_fin ?? null,
        fecha_vencimiento: trainingData.fecha_vencimiento ?? null,
        instructor: trainingData.instructor ?? null,
        modalidad: trainingData.modalidad ?? null,
        duracion_horas: trainingData.duracion_horas ?? null,
        calificacion: trainingData.calificacion ?? null,
        certificado_url: trainingData.certificado_url ?? null,
        observaciones: trainingData.observaciones ?? null,
        tenant_id: tenant?.id,
      };

      const { data, error } = await (supabase as any)
        .from('trainings')
        .insert([insertPayload])
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const newTraining: Training = {
        id: data.id,
        employee_id: data.employee_id,
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        tipo: data.tipo,
        estado: data.estado,
        fecha_inicio: data.fecha_inicio ?? null,
        fecha_fin: data.fecha_fin ?? null,
        fecha_vencimiento: data.fecha_vencimiento ?? null,
        instructor: data.instructor ?? null,
        modalidad: data.modalidad ?? null,
        duracion_horas: data.duracion_horas ?? null,
        calificacion: data.calificacion ?? null,
        certificado_url: data.certificado_url ?? null,
        observaciones: data.observaciones ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      setTrainings((prev) => [newTraining, ...prev]);
      toast({ title: 'Éxito', description: 'Capacitación agregada correctamente' });
      return data;
    } catch (error) {
      console.error('Error adding training:', error);
      toast({ title: 'Error', description: 'No se pudo agregar la capacitación', variant: 'destructive' });
      throw error;
    }
  };

  const updateTraining = async (id: string, trainingData: Partial<Training>) => {
    try {
      const updatePayload = { ...trainingData };
      delete (updatePayload as any).empleadoNombre;
      delete (updatePayload as any).empleadoDni;

      const { data, error } = await (supabase as any)
        .from('trainings')
        .update(updatePayload)
        .eq('id', id)
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const updated: Training = {
        id: data.id,
        employee_id: data.employee_id,
        titulo: data.titulo,
        descripcion: data.descripcion ?? null,
        tipo: data.tipo,
        estado: data.estado,
        fecha_inicio: data.fecha_inicio ?? null,
        fecha_fin: data.fecha_fin ?? null,
        fecha_vencimiento: data.fecha_vencimiento ?? null,
        instructor: data.instructor ?? null,
        modalidad: data.modalidad ?? null,
        duracion_horas: data.duracion_horas ?? null,
        calificacion: data.calificacion ?? null,
        certificado_url: data.certificado_url ?? null,
        observaciones: data.observaciones ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      setTrainings((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast({ title: 'Éxito', description: 'Capacitación actualizada correctamente' });
      return data;
    } catch (error) {
      console.error('Error updating training:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la capacitación', variant: 'destructive' });
      throw error;
    }
  };

  const deleteTraining = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('trainings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTrainings((prev) => prev.filter((t) => t.id !== id));
      toast({ title: 'Éxito', description: 'Capacitación eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting training:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la capacitación', variant: 'destructive' });
      throw error;
    }
  };

  const updateTrainingStatus = async (id: string, newStatus: Training['estado']) => {
    await updateTraining(id, { estado: newStatus });
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchTrainings();
    }

    // Realtime updates
    const channel = (supabase as any)
      .channel('trainings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trainings' },
        () => {
          if (tenant?.id) fetchTrainings();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [tenant?.id]);

  return {
    trainings,
    loading,
    addTraining,
    updateTraining,
    deleteTraining,
    updateTrainingStatus,
    refetch: fetchTrainings,
  };
};