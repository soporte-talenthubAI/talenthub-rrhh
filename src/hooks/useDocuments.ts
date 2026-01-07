import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface Document {
  id: string;
  employee_id: string;
  document_type: string;
  generated_date: string;
  status: string;
  document_content?: string;
  signed_date?: string;
  observations?: string;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  // Datos del empleado
  empleadoNombre?: string;
  empleadoDni?: string;
}

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { tenant } = useTenant();

  const fetchDocuments = async () => {
    if (!tenant?.id) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          employees:employee_id!inner (
            nombres,
            apellidos,
            dni,
            tenant_id
          )
        `)
        .eq('employees.tenant_id', tenant.id)
        .order('generated_date', { ascending: false });

      if (error) throw error;

      const mappedDocuments = (data || []).map((doc: any) => ({
        ...doc,
        empleadoNombre: doc.employees 
          ? `${doc.employees.nombres} ${doc.employees.apellidos}`
          : 'Sin asignar',
        empleadoDni: doc.employees?.dni || 'N/A'
      }));

      setDocuments(mappedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenant?.id) {
      fetchDocuments();
    }
  }, [tenant?.id]);

  const addDocument = async (documentData: Omit<Document, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .insert([{ ...documentData, tenant_id: tenant?.id }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Documento generado",
        description: "El documento se ha generado exitosamente",
      });

      await fetchDocuments();
      return data; // Retornar el documento creado
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDocument = async (id: string, documentData: Partial<Document>) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update(documentData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Documento actualizado",
        description: "El documento se ha actualizado exitosamente",
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error updating document:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el documento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente",
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    documents,
    loading,
    addDocument,
    updateDocument,
    deleteDocument,
    refetch: fetchDocuments,
  };
};