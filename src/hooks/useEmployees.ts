import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface Employee {
  id: string;
  dni: string;
  nombres: string;
  apellidos: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  fecha_ingreso: string;
  puesto?: string;
  departamento?: string;
  salario?: number;
  tipo_contrato?: string;
  estado: string;
  // Legacy fields for compatibility
  fechaIngreso?: string;
  cuil?: string;
  idHuella?: string;
  cargo?: string;
  sector?: string;
  tipoContrato?: string;
  fechaNacimiento?: string;
  estadoCivil?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  parentescoEmergencia?: string;
  nivelEducativo?: string;
  titulo?: string;
  otrosConocimientos?: string;
  grupoSanguineo?: string;
  alergias?: string;
  medicacionHabitual?: string;
  obraSocial?: string;
  observaciones?: string;
  tieneHijos?: string;
  nombresHijos?: string;
  tieneLicencia?: string;
  tipoLicencia?: string[];
  fotoDni?: any;
  fotoCarnet?: any;
}

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const toDbEmployee = (input: Partial<Employee>) => {
    // Helper function to safely convert to number or null
    const toNumber = (value: any) => {
      if (value === null || value === undefined || value === '' || value === 0) {
        return null;
      }
      const num = Number(value);
      return isNaN(num) ? null : num;
    };

    const db: Record<string, any> = {
      dni: input.dni,
      nombres: input.nombres,
      apellidos: input.apellidos,
      email: input.email || null,
      telefono: input.telefono || null,
      direccion: input.direccion || null,
      fecha_nacimiento: input.fecha_nacimiento || input.fechaNacimiento || null,
      fecha_ingreso: input.fecha_ingreso || input.fechaIngreso || null,
      puesto: input.puesto || input.cargo || null,
      departamento: input.departamento || input.sector || null,
      salario: toNumber(input.salario),
      tipo_contrato: input.tipo_contrato || input.tipoContrato || null,
      estado: input.estado || 'activo',
      // Extended fields
      cuil: input.cuil || null,
      id_huella: input.idHuella || null,
      contacto_emergencia: input.contactoEmergencia || null,
      telefono_emergencia: input.telefonoEmergencia || null,
      parentesco_emergencia: input.parentescoEmergencia || null,
      nivel_educativo: input.nivelEducativo || null,
      titulo: input.titulo || null,
      otros_conocimientos: input.otrosConocimientos || null,
      grupo_sanguineo: input.grupoSanguineo || null,
      alergias: input.alergias || null,
      medicacion_habitual: input.medicacionHabitual || null,
      obra_social: input.obraSocial || null,
      observaciones: input.observaciones || null,
      tiene_hijos: input.tieneHijos || null,
      nombres_hijos: input.nombresHijos || null,
      tiene_licencia: input.tieneLicencia || null,
      tipo_licencia: input.tipoLicencia || null,
      estado_civil: input.estadoCivil || null,
    };
    // Remove undefined keys
    Object.keys(db).forEach((k) => db[k] === undefined && delete db[k]);
    return db;
  };

  const fetchEmployees = async () => {
    try {
      let query = supabase
        .from('employees')
        .select('*')
        .order('apellidos', { ascending: true });

      // Filtrar por tenant si existe
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Map database fields to include legacy compatibility
      const mappedEmployees = (data || []).map(emp => ({
        ...emp,
        fechaIngreso: emp.fecha_ingreso,
        fechaNacimiento: emp.fecha_nacimiento,
        cargo: emp.puesto,
        sector: emp.departamento,
        tipoContrato: emp.tipo_contrato,
        idHuella: emp.id_huella,
        // Map extended fields for UI compatibility
        contactoEmergencia: emp.contacto_emergencia,
        telefonoEmergencia: emp.telefono_emergencia,
        parentescoEmergencia: emp.parentesco_emergencia,
        nivelEducativo: emp.nivel_educativo,
        otrosConocimientos: emp.otros_conocimientos,
        grupoSanguineo: emp.grupo_sanguineo,
        medicacionHabitual: emp.medicacion_habitual,
        obraSocial: emp.obra_social,
        tieneHijos: emp.tiene_hijos,
        nombresHijos: emp.nombres_hijos,
        tieneLicencia: emp.tiene_licencia,
        tipoLicencia: Array.isArray(emp.tipo_licencia) ? emp.tipo_licencia : (emp.tipo_licencia ? [emp.tipo_licencia] : []),
        estadoCivil: emp.estado_civil
      }));
      
      setEmployees(mappedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    try {
      // Validar campos obligatorios antes de enviar a la BD
      if (!employeeData.dni || !employeeData.nombres || !employeeData.apellidos || 
          (!employeeData.fecha_ingreso && !employeeData.fechaIngreso)) {
        throw new Error('Los campos DNI, nombres, apellidos y fecha de ingreso son obligatorios');
      }

      if (!tenant?.id) {
        throw new Error('No hay tenant seleccionado');
      }

      const dbEmployee = {
        ...toDbEmployee(employeeData),
        tenant_id: tenant.id, // Asignar al tenant actual
      };
      const { data, error } = await supabase
        .from('employees')
        .insert([dbEmployee] as any)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => [...prev, { 
        ...data, 
        fechaIngreso: data.fecha_ingreso, 
        fechaNacimiento: data.fecha_nacimiento, 
        cargo: data.puesto, 
        sector: data.departamento, 
        tipoContrato: data.tipo_contrato,
        idHuella: data.id_huella,
        contactoEmergencia: data.contacto_emergencia,
        telefonoEmergencia: data.telefono_emergencia,
        parentescoEmergencia: data.parentesco_emergencia,
        nivelEducativo: data.nivel_educativo,
        otrosConocimientos: data.otros_conocimientos,
        grupoSanguineo: data.grupo_sanguineo,
        medicacionHabitual: data.medicacion_habitual,
        obraSocial: data.obra_social,
        tieneHijos: data.tiene_hijos,
        nombresHijos: data.nombres_hijos,
        tieneLicencia: data.tiene_licencia,
        tipoLicencia: Array.isArray(data.tipo_licencia) ? data.tipo_licencia : (data.tipo_licencia ? [data.tipo_licencia] : []),
        estadoCivil: data.estado_civil
      }]);
      
      // Create initial vacation balance for current year
      const currentYear = new Date().getFullYear();
      const vacationDays = await calculateVacationDays(dbEmployee.fecha_ingreso);
      
      await supabase
        .from('vacation_balances')
        .insert([{
          employee_id: data.id,
          year: currentYear,
          dias_totales: vacationDays,
          dias_usados: 0
        }]);

      toast({
        title: "Éxito",
        description: "Empleado agregado correctamente",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el empleado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateEmployee = async (id: string, employeeData: Partial<Employee>) => {
    try {
      const dbUpdate = toDbEmployee(employeeData);
      // Avoid violating NOT NULL by not sending nulls on update
      Object.keys(dbUpdate).forEach((k) => {
        if (dbUpdate[k] === null) delete dbUpdate[k];
      });
      if (Object.keys(dbUpdate).length === 0) {
        toast({ title: 'Sin cambios', description: 'No hay cambios para actualizar.' });
        return null as any;
      }

      const { data, error } = await supabase
        .from('employees')
        .update(dbUpdate as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setEmployees(prev => prev.map(emp => emp.id === id ? { 
        ...data, 
        fechaIngreso: data.fecha_ingreso, 
        fechaNacimiento: data.fecha_nacimiento, 
        cargo: data.puesto, 
        sector: data.departamento, 
        tipoContrato: data.tipo_contrato,
        idHuella: data.id_huella,
        contactoEmergencia: data.contacto_emergencia,
        telefonoEmergencia: data.telefono_emergencia,
        parentescoEmergencia: data.parentesco_emergencia,
        nivelEducativo: data.nivel_educativo,
        otrosConocimientos: data.otros_conocimientos,
        grupoSanguineo: data.grupo_sanguineo,
        medicacionHabitual: data.medicacion_habitual,
        obraSocial: data.obra_social,
        tieneHijos: data.tiene_hijos,
        nombresHijos: data.nombres_hijos,
        tieneLicencia: data.tiene_licencia,
        tipoLicencia: Array.isArray(data.tipo_licencia) ? data.tipo_licencia : (data.tipo_licencia ? [data.tipo_licencia] : []),
        estadoCivil: data.estado_civil
      } : emp));
      
      toast({
        title: "Éxito",
        description: "Empleado actualizado correctamente",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el empleado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteEmployee = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEmployees(prev => prev.filter(emp => emp.id !== id));
      
      toast({
        title: "Éxito",
        description: "Empleado eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el empleado",
        variant: "destructive",
      });
      throw error;
    }
  };

  const importEmployees = async (employeesData: Omit<Employee, 'id'>[]) => {
    try {
      const dbEmployees = employeesData.map((e) => toDbEmployee(e));
      const { data, error } = await supabase
        .from('employees')
        .insert(dbEmployees as any)
        .select();

      if (error) throw error;

      // Create vacation balances for imported employees
      const currentYear = new Date().getFullYear();
      const balancesToInsert = await Promise.all(
        (data || []).map(async (employee) => {
          const vacationDays = await calculateVacationDays(employee.fecha_ingreso);
          return {
            employee_id: employee.id,
            year: currentYear,
            dias_totales: vacationDays,
            dias_usados: 0
          };
        })
      );

      await supabase
        .from('vacation_balances')
        .insert(balancesToInsert as any);

      const mapped = (data || []).map(emp => ({
        ...emp,
        fechaIngreso: emp.fecha_ingreso,
        fechaNacimiento: emp.fecha_nacimiento,
        cargo: emp.puesto,
        sector: emp.departamento,
        tipoContrato: emp.tipo_contrato,
        idHuella: emp.id_huella,
        contactoEmergencia: emp.contacto_emergencia,
        telefonoEmergencia: emp.telefono_emergencia,
        parentescoEmergencia: emp.parentesco_emergencia,
        nivelEducativo: emp.nivel_educativo,
        otrosConocimientos: emp.otros_conocimientos,
        grupoSanguineo: emp.grupo_sanguineo,
        medicacionHabitual: emp.medicacion_habitual,
        obraSocial: emp.obra_social,
        tieneHijos: emp.tiene_hijos,
        nombresHijos: emp.nombres_hijos,
        tieneLicencia: emp.tiene_licencia,
        tipoLicencia: Array.isArray(emp.tipo_licencia) ? emp.tipo_licencia : (emp.tipo_licencia ? [emp.tipo_licencia] : []),
        estadoCivil: emp.estado_civil
      }));
      setEmployees(prev => [...prev, ...mapped]);
      
      toast({
        title: "Éxito",
        description: `${data?.length || 0} empleados importados correctamente`,
      });
      
      return data?.length || 0;
    } catch (error) {
      console.error('Error importing employees:', error);
      toast({
        title: "Error",
        description: "No se pudieron importar los empleados",
        variant: "destructive",
      });
      throw error;
    }
  };

  const calculateVacationDays = async (fechaIngreso: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .rpc('calculate_vacation_days', { fecha_ingreso: fechaIngreso });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error calculating vacation days:', error);
      return 0;
    }
  };

  const getActiveEmployees = () => {
    return employees.filter(emp => emp.estado === 'activo');
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchEmployees();
    }
  }, [tenant?.id]);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    importEmployees,
    getActiveEmployees,
    calculateVacationDays,
    refetch: fetchEmployees
  };
};