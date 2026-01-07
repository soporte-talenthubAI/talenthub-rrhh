import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface SanctionStats {
  totalSanctions: number;
  suspensions: number;
  warnings: number;
  thisMonthSanctions: number;
}

export const useSanctionStats = () => {
  const [stats, setStats] = useState<SanctionStats>({
    totalSanctions: 0,
    suspensions: 0,
    warnings: 0,
    thisMonthSanctions: 0
  });
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();

  const fetchSanctionStats = async () => {
    if (!tenant?.id) {
      setStats({
        totalSanctions: 0,
        suspensions: 0,
        warnings: 0,
        thisMonthSanctions: 0
      });
      setLoading(false);
      return;
    }

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      // Get all sanctions filtered by tenant
      const { data: sanctionsData, error } = await supabase
        .from('sanctions')
        .select('tipo, fecha_documento, created_at')
        .eq('tenant_id', tenant.id);

      if (error) {
        // Sanctions table not found or error
        // Set default values if table doesn't exist
        setStats({
          totalSanctions: 0,
          suspensions: 0,
          warnings: 0,
          thisMonthSanctions: 0
        });
        return;
      }

      const sanctions = sanctionsData || [];
      const total = sanctions.length;
      
      // Count by type
      const suspensions = sanctions.filter((s: any) => 
        s.tipo === 'suspension' || s.tipo === 'suspensión'
      ).length;
      
      const warnings = sanctions.filter((s: any) => 
        s.tipo === 'apercibimiento' || s.tipo === 'advertencia'
      ).length;
      
      // Count this month's sanctions
      const thisMonth = sanctions.filter((s: any) => {
        const sanctionDate = new Date(s.fecha_documento || s.created_at);
        return sanctionDate.getMonth() + 1 === currentMonth && 
               sanctionDate.getFullYear() === currentYear;
      }).length;

      setStats({
        totalSanctions: total,
        suspensions,
        warnings,
        thisMonthSanctions: thisMonth
      });
    } catch (error) {
      console.error('Error fetching sanction stats:', error);
      // Fallback data
      setStats({
        totalSanctions: 0,
        suspensions: 0,
        warnings: 0,
        thisMonthSanctions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchSanctionStats();
    }
  }, [tenant?.id]);

  return {
    stats,
    loading,
    refetch: fetchSanctionStats
  };
};
