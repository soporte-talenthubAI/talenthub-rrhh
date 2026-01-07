import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface VacationRequest {
  id: string;
  employee_id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_solicitados: number;
  motivo?: string;
  periodo?: string;
  observaciones?: string;
  estado: string;
  created_at: string;
  updated_at: string;
  employee?: {
    nombres: string;
    apellidos: string;
    dni: string;
  };
}

export interface VacationBalance {
  id: string;
  employee_id: string;
  year: number;
  dias_totales: number;
  dias_usados: number;
  created_at: string;
  updated_at: string;
}

export const useVacations = () => {
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [vacationBalances, setVacationBalances] = useState<VacationBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchVacationRequests = async () => {
    // Si no hay tenant, no cargar datos
    if (!tenant?.id) {
      setVacationRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .select(`
          *,
          employee:employees!inner (
            nombres,
            apellidos,
            dni,
            tenant_id
          )
        `)
        .eq('employee.tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVacationRequests(data || []);
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las solicitudes de vacaciones",
        variant: "destructive",
      });
    }
  };

  const fetchVacationBalances = async () => {
    // Si no hay tenant, no cargar datos
    if (!tenant?.id) {
      setVacationBalances([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vacation_balances')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('year', { ascending: false });

      if (error) throw error;
      setVacationBalances(data || []);
    } catch (error) {
      console.error('❌ Error fetching vacation balances:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los balances de vacaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addVacationRequest = async (requestData: Omit<VacationRequest, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .insert([{
          ...requestData,
          tenant_id: tenant?.id
        }])
        .select(`
          *,
          employee:employees (
            nombres,
            apellidos,
            dni
          )
        `)
        .single();

      if (error) throw error;

      setVacationRequests(prev => [data, ...prev]);
      
      toast({
        title: "Éxito",
        description: "Solicitud de vacaciones creada correctamente",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la solicitud de vacaciones",
        variant: "destructive",
      });
      throw error;
    }
  };

  const approveVacationRequest = async (requestId: string) => {
    try {
      // Get the request details first
      const { data: request, error: requestError } = await supabase
        .from('vacation_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Update request status
      const { error: updateError } = await supabase
        .from('vacation_requests')
        .update({ estado: 'aprobado' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Update vacation balance - subtract days from available
      const currentYear = new Date().getFullYear();
      const { data: balance, error: balanceError } = await supabase
        .from('vacation_balances')
        .select('*')
        .eq('employee_id', request.employee_id)
        .eq('year', currentYear)
        .eq('tenant_id', tenant?.id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') throw balanceError;

      if (balance) {
        const newUsedDays = balance.dias_usados + request.dias_solicitados;
        
        const { data: updatedBalance, error: updateBalanceError } = await supabase
          .from('vacation_balances')
          .update({ 
            dias_usados: newUsedDays
          })
          .eq('id', balance.id)
          .select()
          .single();

        if (updateBalanceError) throw updateBalanceError;
      } else {
        
        // Crear balance inicial para el empleado
        const { data: employeeData } = await supabase
          .from('employees')
          .select('fecha_ingreso')
          .eq('id', request.employee_id)
          .single();
          
        let vacationDays = 14; // Default
        if (employeeData?.fecha_ingreso) {
          const { data: calculatedDays } = await supabase
            .rpc('calculate_vacation_days', { fecha_ingreso: employeeData.fecha_ingreso });
          vacationDays = calculatedDays || 14;
        }
        
        const { data: newBalance, error: createBalanceError } = await supabase
          .from('vacation_balances')
          .insert({
            employee_id: request.employee_id,
            year: currentYear,
            dias_totales: vacationDays,
            dias_usados: request.dias_solicitados,
            tenant_id: tenant?.id
          })
          .select()
          .single();
          
        if (createBalanceError) throw createBalanceError;
      }

      // Refresh data
      await Promise.all([fetchVacationRequests(), fetchVacationBalances()]);
      
      toast({
        title: "Éxito",
        description: "Solicitud de vacaciones aprobada",
      });
    } catch (error) {
      console.error('❌ Error approving vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar la solicitud",
        variant: "destructive",
      });
    }
  };

  const rejectVacationRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('vacation_requests')
        .update({ estado: 'rechazado' })
        .eq('id', requestId);

      if (error) throw error;

      await fetchVacationRequests();
      
      toast({
        title: "Éxito",
        description: "Solicitud de vacaciones rechazada",
      });
    } catch (error) {
      console.error('Error rejecting vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar la solicitud",
        variant: "destructive",
      });
    }
  };

  const updateVacationBalance = async (
    employeeId: string, 
    year: number, 
    balanceData: Partial<Pick<VacationBalance, 'dias_totales' | 'dias_usados'>>
  ) => {
    try {
      const { data, error } = await supabase
        .from('vacation_balances')
        .upsert([
          {
            employee_id: employeeId,
            year,
            tenant_id: tenant?.id,
            ...balanceData
          }
        ])
        .select()
        .single();

      if (error) throw error;

      await fetchVacationBalances();
      
      toast({
        title: "Éxito",
        description: "Balance de vacaciones actualizado",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating vacation balance:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el balance de vacaciones",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getTotalAvailableDays = async (employeeId: string, year: number): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('get_total_available_days', { 
          employee_id: employeeId, 
          year 
        });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error getting total available days:', error);
      return 0;
    }
  };

  const updateVacationRequest = async (requestId: string, requestData: Partial<VacationRequest>) => {
    try {
      const { data, error } = await supabase
        .from('vacation_requests')
        .update(requestData)
        .eq('id', requestId)
        .select(`
          *,
          employee:employees (
            nombres,
            apellidos,
            dni
          )
        `)
        .single();

      if (error) throw error;

      await fetchVacationRequests();
      
      toast({
        title: "Éxito",
        description: "Solicitud actualizada correctamente",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la solicitud",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteVacationRequest = async (requestId: string) => {
    try {
      // Verificar que la solicitud no esté aprobada
      const request = vacationRequests.find(r => r.id === requestId);
      if (request?.estado === 'aprobado') {
        toast({
          title: "No permitido",
          description: "No se puede eliminar una solicitud aprobada",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('vacation_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      await fetchVacationRequests();
      
      toast({
        title: "Éxito",
        description: "Solicitud eliminada correctamente",
      });
    } catch (error) {
      console.error('Error deleting vacation request:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la solicitud",
        variant: "destructive",
      });
    }
  };

  const getEmployeeVacationBalance = (employeeId: string, year?: number) => {
    const targetYear = year || new Date().getFullYear();
    const balance = vacationBalances.find(
      balance => balance.employee_id === employeeId && balance.year === targetYear
    );
    return balance;
  };

  useEffect(() => {
    if (tenant?.id) {
      Promise.all([fetchVacationRequests(), fetchVacationBalances()]);
    }
  }, [tenant?.id]);

  return {
    vacationRequests,
    vacationBalances,
    loading,
    addVacationRequest,
    updateVacationRequest,
    approveVacationRequest,
    rejectVacationRequest,
    deleteVacationRequest,
    updateVacationBalance,
    getTotalAvailableDays,
    getEmployeeVacationBalance,
    refetch: () => Promise.all([fetchVacationRequests(), fetchVacationBalances()])
  };
};