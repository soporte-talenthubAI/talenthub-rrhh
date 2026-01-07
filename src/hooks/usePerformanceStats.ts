import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface PerformanceStats {
  totalEvaluations: number;
  completedEvaluations: number;
  inProgressEvaluations: number;
  averageScore: number;
  highPerformers: number;
  needsImprovement: number;
}

export const usePerformanceStats = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalEvaluations: 0,
    completedEvaluations: 0,
    inProgressEvaluations: 0,
    averageScore: 0,
    highPerformers: 0,
    needsImprovement: 0
  });
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();

  const fetchPerformanceStats = async () => {
    if (!tenant?.id) {
      setStats({
        totalEvaluations: 0,
        completedEvaluations: 0,
        inProgressEvaluations: 0,
        averageScore: 0,
        highPerformers: 0,
        needsImprovement: 0
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('performance_evaluations')
        .select('estado, puntuacion_general')
        .eq('tenant_id', tenant.id);

      if (error) throw error;

      const evaluations = data || [];
      const completed = evaluations.filter((e: any) => e.estado === 'completado').length;
      const inProgress = evaluations.filter((e: any) => e.estado === 'en_progreso').length;
      const total = evaluations.length;
      
      const validScores = evaluations.filter((e: any) => e.puntuacion_general !== null);
      const avgScore = validScores.length > 0 
        ? Math.round(validScores.reduce((sum: number, e: any) => sum + e.puntuacion_general, 0) / validScores.length)
        : 0;
      
      const highPerformers = validScores.filter((e: any) => e.puntuacion_general >= 90).length;
      const needsImprovement = validScores.filter((e: any) => e.puntuacion_general < 80).length;

      setStats({
        totalEvaluations: total,
        completedEvaluations: completed,
        inProgressEvaluations: inProgress,
        averageScore: avgScore,
        highPerformers,
        needsImprovement
      });
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchPerformanceStats();
    }

    // Set up real-time subscription
    const channel = (supabase as any)
      .channel('performance-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'performance_evaluations'
        },
        () => {
          if (tenant?.id) fetchPerformanceStats();
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [tenant?.id]);

  return {
    stats,
    loading,
    refetch: fetchPerformanceStats
  };
};