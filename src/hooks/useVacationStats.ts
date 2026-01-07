import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface VacationStats {
  totalUsedDays: number;
  totalAvailableDays: number;
  totalEmployees: number;
  averageUsedDays: number;
}

export const useVacationStats = () => {
  const [stats, setStats] = useState<VacationStats>({
    totalUsedDays: 0,
    totalAvailableDays: 0,
    totalEmployees: 0,
    averageUsedDays: 0
  });
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();

  const fetchVacationStats = async () => {
    if (!tenant?.id) {
      setStats({
        totalUsedDays: 0,
        totalAvailableDays: 0,
        totalEmployees: 0,
        averageUsedDays: 0
      });
      setLoading(false);
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      
      // Get vacation balances for current year filtered by tenant
      const { data: balances, error: balancesError } = await supabase
        .from('vacation_balances')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('year', currentYear);

      if (balancesError) throw balancesError;

      if (balances && balances.length > 0) {
        const totalUsed = balances.reduce((sum, bal) => sum + (bal.dias_usados || 0), 0);
        const totalAvailable = balances.reduce((sum, bal) => 
          sum + ((bal.dias_totales || 0) - (bal.dias_usados || 0)), 0);
        const totalEmployees = balances.length;
        const averageUsed = totalEmployees > 0 ? totalUsed / totalEmployees : 0;

        setStats({
          totalUsedDays: totalUsed,
          totalAvailableDays: totalAvailable,
          totalEmployees,
          averageUsedDays: Math.round(averageUsed * 10) / 10
        });
      }
    } catch (error) {
      console.error('Error fetching vacation stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchVacationStats();
    }
  }, [tenant?.id]);

  return {
    stats,
    loading,
    refetch: fetchVacationStats
  };
};