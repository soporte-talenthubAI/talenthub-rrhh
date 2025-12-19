import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PayrollRecord {
  id: string;
  employee_id: string;
  type: "salary" | "advance" | "bonus" | "deduction";
  amount: number;
  period: string;
  payment_date: string;
  status: "pending" | "paid";
  description?: string;
  reversal_of_id?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export const usePayroll = () => {
  const queryClient = useQueryClient();

  const { data: payrollRecords = [], isLoading } = useQuery({
    queryKey: ["payroll"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll")
        .select("*")
        .order("payment_date", { ascending: false });

      if (error) throw error;
      // Si la columna status no existe, asumir "paid" por defecto para compatibilidad
      return (data || []).map((record: any) => ({
        ...record,
        status: record.status || "paid",
      })) as PayrollRecord[];
    },
  });

  const createPayroll = useMutation({
    mutationFn: async (payrollData: Omit<PayrollRecord, "id" | "created_at" | "updated_at" | "reversal_of_id" | "cancelled_at" | "cancellation_reason"> & { status?: "pending" | "paid" }) => {
      // Establecer status como 'paid' por defecto si no se especifica
      const dataToInsert: any = {
        ...payrollData,
        status: payrollData.status || "paid",
      };

      const { data, error } = await supabase
        .from("payroll")
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        // Si el error es que la columna no existe, intentar sin status
        if (error.message?.includes("status") || error.message?.includes("column")) {
          console.warn("La columna 'status' no existe. Ejecute la migración: 20251101000000_add_status_to_payroll.sql");
          const { status, ...dataWithoutStatus } = dataToInsert;
          const { data: dataWithoutStatusField, error: errorWithoutStatus } = await supabase
            .from("payroll")
            .insert([dataWithoutStatus])
            .select()
            .single();
          
          if (errorWithoutStatus) throw errorWithoutStatus;
          return { ...dataWithoutStatusField, status: "paid" } as PayrollRecord;
        }
        throw error;
      }
      return { ...data, status: data.status || "paid" } as PayrollRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Registro de pago guardado correctamente");
    },
    onError: (error) => {
      console.error("Error creating payroll:", error);
      toast.error("Error al guardar el registro de pago");
    },
  });

  const updatePayroll = useMutation({
    mutationFn: async ({ id, ...payrollData }: Partial<PayrollRecord> & { id: string }) => {
      // Obtener el registro completo para verificar el status
      const { data: record, error: fetchError } = await supabase
        .from("payroll")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Verificar si el registro tiene status y si es "paid"
      const recordStatus = (record as any)?.status;
      if (recordStatus === "paid") {
        throw new Error("No se pueden editar registros de pago que ya han sido marcados como pagados. Use la función de anulación en su lugar.");
      }

      // Preparar los datos para actualizar
      const { status, ...dataToUpdate } = payrollData;
      const updateData: any = { ...dataToUpdate };
      
      // Solo incluir status si se está actualizando
      if (status !== undefined && recordStatus !== undefined) {
        updateData.status = status;
      }

      const { data, error } = await supabase
        .from("payroll")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        // Si el error es que status no existe, intentar sin status
        if (error.message?.includes("status") || error.message?.includes("column") || error.message?.includes("does not exist")) {
          console.warn("La columna 'status' no existe. Ejecute la migración: 20251101000000_add_status_to_payroll.sql");
          const { status: _, ...dataWithoutStatus } = updateData;
          const { data: dataWithoutStatusField, error: errorWithoutStatus } = await supabase
            .from("payroll")
            .update(dataWithoutStatus)
            .eq("id", id)
            .select()
            .single();
          
          if (errorWithoutStatus) throw errorWithoutStatus;
          return { ...dataWithoutStatusField, status: "paid" } as PayrollRecord;
        }
        throw error;
      }
      return { ...data, status: (data as any).status || "paid" } as PayrollRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Registro de pago actualizado correctamente");
    },
    onError: (error: any) => {
      console.error("Error updating payroll:", error);
      toast.error(error.message || "Error al actualizar el registro de pago");
    },
  });

  const deletePayroll = useMutation({
    mutationFn: async (id: string) => {
      // Obtener el registro para verificar el status
      const { data: record, error: fetchError } = await supabase
        .from("payroll")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) {
        // Si el error es sobre columnas que no existen, permitir eliminación (compatibilidad)
        if (fetchError.message?.includes("status") || fetchError.message?.includes("column") || fetchError.message?.includes("does not exist")) {
          console.warn("La columna 'status' no existe. Ejecute la migración: 20251101000000_add_status_to_payroll.sql. Permitiendo eliminación por compatibilidad.");
        } else {
          throw fetchError;
        }
      } else {
        // Verificar si el registro tiene status y si es "paid"
        const recordStatus = (record as any)?.status;
        if (recordStatus === "paid") {
          throw new Error("No se puede eliminar un registro de pago que ya ha sido marcado como pagado. Use la función de anulación en su lugar.");
        }
      }

      const { error } = await supabase
        .from("payroll")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Registro de pago eliminado correctamente");
    },
    onError: (error: any) => {
      console.error("Error deleting payroll:", error);
      toast.error(error.message || "Error al eliminar el registro de pago");
    },
  });

  const cancelPayroll = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      // Obtener el registro original
      const { data: originalRecord, error: fetchError } = await supabase
        .from("payroll")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      if (!originalRecord) {
        throw new Error("Registro de pago no encontrado");
      }

      // Verificar si la columna status existe
      const recordStatus = originalRecord.status || "paid";
      
      if (recordStatus !== "paid") {
        throw new Error("Solo se pueden anular registros que están marcados como pagados");
      }

      // Determinar el tipo inverso para la anulación
      let reversalType: "salary" | "advance" | "bonus" | "deduction";
      if (originalRecord.type === "deduction") {
        reversalType = "salary";
      } else {
        reversalType = "deduction";
      }

      // Crear el registro de reversión
      const reversalRecord: any = {
        employee_id: originalRecord.employee_id,
        type: reversalType,
        amount: originalRecord.amount,
        period: originalRecord.period,
        payment_date: new Date().toISOString().split('T')[0],
        description: `Anulación de pago ${originalRecord.id}. ${reason || "Sin razón especificada"}`,
        status: "paid",
        reversal_of_id: id,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
      };

      const { data: newRecord, error: insertError } = await supabase
        .from("payroll")
        .insert([reversalRecord])
        .select()
        .single();

      if (insertError) {
        if (insertError.message?.includes("status") || 
            insertError.message?.includes("reversal_of_id") ||
            insertError.message?.includes("cancelled_at") ||
            insertError.message?.includes("cancellation_reason") ||
            insertError.message?.includes("column") ||
            insertError.message?.includes("does not exist")) {
          throw new Error(
            "La funcionalidad de anulación requiere ejecutar la migración de base de datos. " +
            "Ejecute: 20251101000000_add_status_to_payroll.sql en Supabase SQL Editor."
          );
        }
        throw insertError;
      }

      return { ...newRecord, status: newRecord.status || "paid" } as PayrollRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payroll"] });
      toast.success("Pago anulado correctamente. Se ha creado un registro de reversión.");
    },
    onError: (error: any) => {
      console.error("Error cancelling payroll:", error);
      toast.error(error.message || "Error al anular el pago");
    },
  });

  return {
    payrollRecords,
    isLoading,
    createPayroll,
    updatePayroll,
    deletePayroll,
    cancelPayroll,
  };
};
