import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface PerformanceEvaluation {
  id: string;
  employee_id: string;
  periodo: string;
  fecha_evaluacion: string;
  evaluador?: string | null;
  puntuacion_general?: number | null;
  comp_tecnicas?: number | null;
  comp_liderazgo?: number | null;
  comp_comunicacion?: number | null;
  comp_puntualidad?: number | null;
  comp_trabajo_equipo?: number | null;
  obj_cumplimiento?: number | null;
  obj_calidad?: number | null;
  obj_eficiencia?: number | null;
  estado: 'borrador' | 'en_progreso' | 'completado' | 'cancelado';
  observaciones?: string | null;
  fortalezas?: string[] | null;
  areas_desarrollo?: string[] | null;
  created_at: string;
  updated_at: string;
  empleadoNombre?: string;
  empleadoDni?: string;
}

export const usePerformanceEvaluations = () => {
  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchEvaluations = async () => {
    if (!tenant?.id) {
      setEvaluations([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('performance_evaluations')
        .select(`
          *,
          employees:employees!inner (*, tenant_id)
        `)
        .eq('employees.tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped = ((data as any[]) || []).map((row) => {
        const emp = row.employees as any;
        const evaluation: PerformanceEvaluation = {
          id: row.id,
          employee_id: row.employee_id,
          periodo: row.periodo,
          fecha_evaluacion: row.fecha_evaluacion,
          evaluador: row.evaluador ?? null,
          puntuacion_general: row.puntuacion_general ?? null,
          comp_tecnicas: row.comp_tecnicas ?? null,
          comp_liderazgo: row.comp_liderazgo ?? null,
          comp_comunicacion: row.comp_comunicacion ?? null,
          comp_puntualidad: row.comp_puntualidad ?? null,
          comp_trabajo_equipo: row.comp_trabajo_equipo ?? null,
          obj_cumplimiento: row.obj_cumplimiento ?? null,
          obj_calidad: row.obj_calidad ?? null,
          obj_eficiencia: row.obj_eficiencia ?? null,
          estado: row.estado,
          observaciones: row.observaciones ?? null,
          fortalezas: row.fortalezas ?? null,
          areas_desarrollo: row.areas_desarrollo ?? null,
          created_at: row.created_at,
          updated_at: row.updated_at,
          empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
          empleadoDni: emp?.dni ?? ''
        };
        return evaluation;
      });

      setEvaluations(mapped);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las evaluaciones',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvaluation = async (evaluationData: Omit<PerformanceEvaluation, 'id' | 'created_at' | 'updated_at' | 'empleadoNombre' | 'empleadoDni'>) => {
    try {
      const insertPayload = {
        employee_id: evaluationData.employee_id,
        periodo: evaluationData.periodo,
        fecha_evaluacion: evaluationData.fecha_evaluacion,
        evaluador: evaluationData.evaluador ?? null,
        puntuacion_general: evaluationData.puntuacion_general ?? null,
        comp_tecnicas: evaluationData.comp_tecnicas ?? null,
        comp_liderazgo: evaluationData.comp_liderazgo ?? null,
        comp_comunicacion: evaluationData.comp_comunicacion ?? null,
        comp_puntualidad: evaluationData.comp_puntualidad ?? null,
        comp_trabajo_equipo: evaluationData.comp_trabajo_equipo ?? null,
        obj_cumplimiento: evaluationData.obj_cumplimiento ?? null,
        obj_calidad: evaluationData.obj_calidad ?? null,
        obj_eficiencia: evaluationData.obj_eficiencia ?? null,
        estado: evaluationData.estado ?? 'en_progreso',
        observaciones: evaluationData.observaciones ?? null,
        fortalezas: evaluationData.fortalezas ?? null,
        areas_desarrollo: evaluationData.areas_desarrollo ?? null,
        tenant_id: tenant?.id,
      };

      const { data, error } = await (supabase as any)
        .from('performance_evaluations')
        .insert([insertPayload])
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const newEvaluation: PerformanceEvaluation = {
        id: data.id,
        employee_id: data.employee_id,
        periodo: data.periodo,
        fecha_evaluacion: data.fecha_evaluacion,
        evaluador: data.evaluador ?? null,
        puntuacion_general: data.puntuacion_general ?? null,
        comp_tecnicas: data.comp_tecnicas ?? null,
        comp_liderazgo: data.comp_liderazgo ?? null,
        comp_comunicacion: data.comp_comunicacion ?? null,
        comp_puntualidad: data.comp_puntualidad ?? null,
        comp_trabajo_equipo: data.comp_trabajo_equipo ?? null,
        obj_cumplimiento: data.obj_cumplimiento ?? null,
        obj_calidad: data.obj_calidad ?? null,
        obj_eficiencia: data.obj_eficiencia ?? null,
        estado: data.estado,
        observaciones: data.observaciones ?? null,
        fortalezas: data.fortalezas ?? null,
        areas_desarrollo: data.areas_desarrollo ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      setEvaluations((prev) => [newEvaluation, ...prev]);
      toast({ title: 'Éxito', description: 'Evaluación agregada correctamente' });
      return data;
    } catch (error) {
      console.error('Error adding evaluation:', error);
      toast({ title: 'Error', description: 'No se pudo agregar la evaluación', variant: 'destructive' });
      throw error;
    }
  };

  const updateEvaluation = async (id: string, evaluationData: Partial<PerformanceEvaluation>) => {
    try {
      const updatePayload = { ...evaluationData };
      delete (updatePayload as any).empleadoNombre;
      delete (updatePayload as any).empleadoDni;

      const { data, error } = await (supabase as any)
        .from('performance_evaluations')
        .update(updatePayload)
        .eq('id', id)
        .select(`*, employees:employees(*)`)
        .single();

      if (error) throw error;

      const emp = (data as any).employees;
      const updated: PerformanceEvaluation = {
        id: data.id,
        employee_id: data.employee_id,
        periodo: data.periodo,
        fecha_evaluacion: data.fecha_evaluacion,
        evaluador: data.evaluador ?? null,
        puntuacion_general: data.puntuacion_general ?? null,
        comp_tecnicas: data.comp_tecnicas ?? null,
        comp_liderazgo: data.comp_liderazgo ?? null,
        comp_comunicacion: data.comp_comunicacion ?? null,
        comp_puntualidad: data.comp_puntualidad ?? null,
        comp_trabajo_equipo: data.comp_trabajo_equipo ?? null,
        obj_cumplimiento: data.obj_cumplimiento ?? null,
        obj_calidad: data.obj_calidad ?? null,
        obj_eficiencia: data.obj_eficiencia ?? null,
        estado: data.estado,
        observaciones: data.observaciones ?? null,
        fortalezas: data.fortalezas ?? null,
        areas_desarrollo: data.areas_desarrollo ?? null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        empleadoNombre: emp ? `${emp.nombres ?? ''} ${emp.apellidos ?? ''}`.trim() : 'Empleado',
        empleadoDni: emp?.dni ?? ''
      };

      setEvaluations((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast({ title: 'Éxito', description: 'Evaluación actualizada correctamente' });
      return data;
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la evaluación', variant: 'destructive' });
      throw error;
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('performance_evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      toast({ title: 'Éxito', description: 'Evaluación eliminada correctamente' });
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar la evaluación', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchEvaluations();
    }

    // Realtime updates
    const channel = (supabase as any)
      .channel('performance-evaluations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'performance_evaluations' },
        () => {
          if (tenant?.id) fetchEvaluations();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [tenant?.id]);

  return {
    evaluations,
    loading,
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,
    refetch: fetchEvaluations,
  };
};