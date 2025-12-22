/**
 * Servicio para gestionar templates de documentos dinámicos
 * Los templates se almacenan en Supabase y pueden personalizarse por cliente
 */

import { supabase } from "@/integrations/supabase/client";
import { clientConfig } from "@/config/client";
import { formatDateLocal, getCurrentDateString } from "@/utils/dateUtils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
export interface DocumentTemplate {
  id: string;
  template_type_id: string;
  nombre: string;
  version: string;
  contenido_html: string | null;
  template_url: string | null;
  formato: string;
  orientacion: string;
  margenes: { top: number; right: number; bottom: number; left: number };
  incluir_logo: boolean;
  incluir_fecha: boolean;
  requiere_firma_empleado: boolean;
  requiere_firma_empresa: boolean;
  is_active: boolean;
  is_default: boolean;
  // Nuevos campos para PDF templates
  module_id: string | null;
  pdf_url: string | null;
  pdf_filename: string | null;
  pdf_fields: string[] | null;
  descripcion: string | null;
  instrucciones: string | null;
}

// Lista de módulos disponibles
export const AVAILABLE_MODULES = [
  { id: 'employees', nombre: 'Empleados', icon: 'Users' },
  { id: 'vacations', nombre: 'Vacaciones', icon: 'Calendar' },
  { id: 'absences', nombre: 'Ausencias', icon: 'CalendarOff' },
  { id: 'sanctions', nombre: 'Sanciones', icon: 'AlertTriangle' },
  { id: 'documents', nombre: 'Documentos', icon: 'FileText' },
  { id: 'payroll', nombre: 'Nómina', icon: 'DollarSign' },
  { id: 'training', nombre: 'Capacitaciones', icon: 'GraduationCap' },
  { id: 'uniforms', nombre: 'Uniformes', icon: 'Shirt' },
  { id: 'performance', nombre: 'Desempeño', icon: 'TrendingUp' },
  { id: 'declarations', nombre: 'Declaraciones', icon: 'ClipboardList' },
];

export interface TemplateType {
  id: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  campos_requeridos: string[];
}

export interface EmployeeData {
  id?: string;
  nombres: string;
  apellidos: string;
  dni: string;
  cuil?: string;
  direccion?: string;
  puesto?: string;
  departamento?: string;
  fecha_ingreso?: string;
  // Campos adicionales para sanciones
  sanction?: {
    motivo: string;
    fecha_hecho?: string;
    lugar_hecho?: string;
    dias_suspension?: number;
    fecha_inicio?: string;
    fecha_reincorporacion?: string;
  };
  // Campos para vacaciones
  vacation?: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
  };
  // Campos para capacitaciones
  training?: {
    titulo: string;
    fecha: string;
    duracion?: string;
    instructor?: string;
  };
}

/**
 * Obtiene todos los tipos de template disponibles
 */
export async function getTemplateTypes(): Promise<TemplateType[]> {
  const { data, error } = await supabase
    .from("document_template_types")
    .select("*")
    .order("nombre");

  if (error) {
    console.error("Error fetching template types:", error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene un template específico por tipo
 * Prioriza templates específicos del cliente sobre los globales
 */
export async function getTemplateByType(templateTypeId: string): Promise<DocumentTemplate | null> {
  // Primero buscar template del cliente (cuando implementemos multi-tenant)
  // Por ahora, buscar el template por defecto
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("template_type_id", templateTypeId)
    .eq("is_active", true)
    .eq("is_default", true)
    .single();

  if (error) {
    console.warn(`No se encontró template para tipo: ${templateTypeId}`, error);
    return null;
  }

  return data;
}

/**
 * Obtiene todos los templates activos
 */
export async function getAllTemplates(): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("is_active", true)
    .order("nombre");

  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return data || [];
}

/**
 * Reemplaza los placeholders en un template con datos reales
 */
export function replacePlaceholders(
  htmlContent: string,
  employeeData: EmployeeData,
  customData?: Record<string, string>
): string {
  let result = htmlContent;

  // Datos de la empresa (desde config del cliente)
  const empresaData: Record<string, string> = {
    "{{empresa_nombre}}": clientConfig.nombre,
    "{{empresa_cuit}}": clientConfig.cuit || "",
    "{{empresa_direccion}}": clientConfig.direccion || "",
    "{{empresa_telefono}}": clientConfig.telefono || "",
    "{{empresa_email}}": clientConfig.email || "",
  };

  // Datos del empleado
  const nombreCompleto = `${employeeData.nombres} ${employeeData.apellidos}`.trim();
  const empleadoData: Record<string, string> = {
    "{{empleado_nombre}}": nombreCompleto,
    "{{empleado_nombres}}": employeeData.nombres,
    "{{empleado_apellidos}}": employeeData.apellidos,
    "{{empleado_dni}}": employeeData.dni || "",
    "{{empleado_cuil}}": employeeData.cuil || employeeData.dni || "",
    "{{empleado_direccion}}": employeeData.direccion || "________________________",
    "{{empleado_puesto}}": employeeData.puesto || "",
    "{{empleado_sector}}": employeeData.departamento || "",
    "{{empleado_fecha_ingreso}}": employeeData.fecha_ingreso 
      ? formatDateLocal(employeeData.fecha_ingreso) 
      : "",
  };

  // Datos de fecha
  const today = new Date();
  const fechaData: Record<string, string> = {
    "{{fecha_actual}}": formatDateLocal(getCurrentDateString()),
    "{{fecha_actual_texto}}": format(today, "dd 'de' MMMM 'de' yyyy", { locale: es }),
    "{{hora_actual}}": format(today, "HH:mm"),
  };

  // Datos de sanción (si aplica)
  const sancionData: Record<string, string> = {};
  if (employeeData.sanction) {
    const s = employeeData.sanction;
    sancionData["{{motivo}}"] = s.motivo || "";
    sancionData["{{fecha_hecho}}"] = s.fecha_hecho 
      ? format(new Date(s.fecha_hecho.split('T')[0].split('-').map(Number).reduce((d, v, i) => 
          i === 0 ? new Date(v, 0, 1) : i === 1 ? new Date(d.getFullYear(), v - 1, 1) : new Date(d.getFullYear(), d.getMonth(), v), new Date())), 
          "dd 'de' MMMM 'de' yyyy", { locale: es })
      : "";
    sancionData["{{lugar_hecho}}"] = s.lugar_hecho || "";
    sancionData["{{dias_suspension}}"] = s.dias_suspension?.toString() || "";
    sancionData["{{fecha_inicio}}"] = s.fecha_inicio 
      ? formatDateLocal(s.fecha_inicio) 
      : "";
    sancionData["{{fecha_reincorporacion}}"] = s.fecha_reincorporacion 
      ? formatDateLocal(s.fecha_reincorporacion) 
      : "";
  }

  // Datos de vacaciones (si aplica)
  const vacacionesData: Record<string, string> = {};
  if (employeeData.vacation) {
    const v = employeeData.vacation;
    vacacionesData["{{fecha_inicio}}"] = formatDateLocal(v.fecha_inicio);
    vacacionesData["{{fecha_fin}}"] = formatDateLocal(v.fecha_fin);
    vacacionesData["{{dias}}"] = v.dias.toString();
  }

  // Datos de capacitación (si aplica)
  const capacitacionData: Record<string, string> = {};
  if (employeeData.training) {
    const t = employeeData.training;
    capacitacionData["{{titulo_capacitacion}}"] = t.titulo;
    capacitacionData["{{fecha}}"] = formatDateLocal(t.fecha);
    capacitacionData["{{duracion}}"] = t.duracion || "";
    capacitacionData["{{instructor}}"] = t.instructor || "";
  }

  // Combinar todos los datos
  const allReplacements: Record<string, string> = {
    ...empresaData,
    ...empleadoData,
    ...fechaData,
    ...sancionData,
    ...vacacionesData,
    ...capacitacionData,
    ...(customData || {}),
  };

  // Reemplazar todos los placeholders
  for (const [placeholder, value] of Object.entries(allReplacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  // Manejar placeholders condicionales simples {{#campo}}...{{/campo}}
  result = result.replace(/\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs, (match, field, content) => {
    const value = allReplacements[`{{${field}}}`];
    return value && value.trim() ? content : '';
  });

  return result;
}

/**
 * Genera un documento HTML a partir de un template y datos
 */
export async function generateDocumentFromTemplate(
  templateTypeId: string,
  employeeData: EmployeeData,
  customData?: Record<string, string>
): Promise<{ html: string; template: DocumentTemplate } | null> {
  const template = await getTemplateByType(templateTypeId);
  
  if (!template || !template.contenido_html) {
    console.error(`Template no encontrado o sin contenido: ${templateTypeId}`);
    return null;
  }

  const html = replacePlaceholders(template.contenido_html, employeeData, customData);
  
  return { html, template };
}

/**
 * Guarda un nuevo template o actualiza uno existente
 */
export async function saveTemplate(
  template: Partial<DocumentTemplate> & { template_type_id: string; nombre: string }
): Promise<DocumentTemplate | null> {
  if (template.id) {
    // Actualizar
    const { data, error } = await supabase
      .from("document_templates")
      .update(template)
      .eq("id", template.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return null;
    }
    return data;
  } else {
    // Crear nuevo
    const { data, error } = await supabase
      .from("document_templates")
      .insert([template])
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return null;
    }
    return data;
  }
}

/**
 * Elimina un template (soft delete - solo lo desactiva)
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
  const { error } = await supabase
    .from("document_templates")
    .update({ is_active: false })
    .eq("id", templateId);

  if (error) {
    console.error("Error deleting template:", error);
    return false;
  }
  return true;
}

/**
 * Verifica si las tablas de templates existen
 * (para mantener compatibilidad con bases de datos sin migrar)
 */
export async function checkTemplatesTableExists(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("document_templates")
      .select("id")
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtiene templates por módulo
 */
export async function getTemplatesByModule(moduleId: string): Promise<DocumentTemplate[]> {
  const { data, error } = await supabase
    .from("document_templates")
    .select("*")
    .eq("module_id", moduleId)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("nombre");

  if (error) {
    console.error("Error fetching templates by module:", error);
    return [];
  }

  return data || [];
}

/**
 * Sube un archivo PDF al storage y retorna la URL
 */
export async function uploadTemplatePDF(
  file: File,
  templateName: string
): Promise<{ url: string; filename: string } | null> {
  try {
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedName = templateName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${sanitizedName}_${timestamp}.pdf`;

    // Subir archivo al bucket 'documents' en carpeta 'templates'
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`templates/${filename}`, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return null;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`templates/${filename}`);

    return {
      url: urlData.publicUrl,
      filename: file.name,
    };
  } catch (error) {
    console.error('Error in uploadTemplatePDF:', error);
    return null;
  }
}

/**
 * Elimina un PDF del storage
 */
export async function deleteTemplatePDF(pdfUrl: string): Promise<boolean> {
  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = pdfUrl.split('/');
    const filename = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from('documents')
      .remove([`templates/${filename}`]);

    if (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteTemplatePDF:', error);
    return false;
  }
}

/**
 * Guarda un template con PDF
 */
export async function saveTemplateWithPDF(
  template: Partial<DocumentTemplate> & { template_type_id: string; nombre: string },
  pdfFile?: File
): Promise<DocumentTemplate | null> {
  try {
    let pdfData: { url: string; filename: string } | null = null;

    // Si hay un archivo PDF, subirlo primero
    if (pdfFile) {
      pdfData = await uploadTemplatePDF(pdfFile, template.nombre);
      if (!pdfData) {
        console.error('Failed to upload PDF');
        return null;
      }
    }

    // Preparar datos del template
    const templateData: any = {
      ...template,
    };

    if (pdfData) {
      templateData.pdf_url = pdfData.url;
      templateData.pdf_filename = pdfData.filename;
    }

    // Guardar en la base de datos
    return await saveTemplate(templateData);
  } catch (error) {
    console.error('Error in saveTemplateWithPDF:', error);
    return null;
  }
}

