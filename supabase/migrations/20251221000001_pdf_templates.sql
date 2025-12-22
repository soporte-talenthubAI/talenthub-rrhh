-- =====================================================
-- TEMPLATES PDF DINÁMICOS
-- Permite subir PDFs como templates y asignarlos a módulos
-- =====================================================

-- 1. Agregar columnas a document_templates
ALTER TABLE public.document_templates 
ADD COLUMN IF NOT EXISTS module_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_filename VARCHAR(255),
ADD COLUMN IF NOT EXISTS pdf_fields JSONB DEFAULT '[]', -- campos del PDF que se pueden llenar
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS instrucciones TEXT; -- instrucciones para el usuario

-- 2. Agregar referencia al módulo (opcional, para validación)
-- Los module_id válidos son: employees, vacations, absences, sanctions, documents, 
-- payroll, training, uniforms, performance, selection, declarations, consultations

-- 3. Agregar más tipos de template
INSERT INTO public.document_template_types (id, nombre, descripcion, categoria, campos_requeridos) VALUES
  ('entrega_uniforme', 'Entrega de Uniforme', 'Constancia de entrega de uniformes/EPP', 'uniforms', '["empleado_nombre", "empleado_dni", "items", "fecha"]'),
  ('evaluacion_desempeno', 'Evaluación de Desempeño', 'Formulario de evaluación de desempeño', 'performance', '["empleado_nombre", "periodo", "puntuacion", "observaciones"]'),
  ('solicitud_vacaciones', 'Solicitud de Vacaciones', 'Formulario de solicitud de vacaciones', 'vacations', '["empleado_nombre", "fecha_inicio", "fecha_fin", "dias"]'),
  ('declaracion_domicilio', 'Declaración de Domicilio', 'Declaración jurada de domicilio', 'declarations', '["empleado_nombre", "empleado_dni", "domicilio"]'),
  ('recibo_adelanto', 'Recibo de Adelanto', 'Recibo de adelanto de sueldo', 'payroll', '["empleado_nombre", "monto", "fecha"]'),
  ('alta_empleado', 'Alta de Empleado', 'Formulario de alta de nuevo empleado', 'employees', '["empleado_nombre", "empleado_dni", "fecha_ingreso", "puesto"]'),
  ('certificado_trabajo', 'Certificado de Trabajo', 'Certificado de relación laboral', 'employees', '["empleado_nombre", "empleado_dni", "puesto", "fecha_ingreso"]'),
  ('constancia_capacitacion', 'Constancia de Capacitación', 'Certificado de asistencia a capacitación', 'training', '["empleado_nombre", "titulo", "fecha", "duracion"]')
ON CONFLICT (id) DO NOTHING;

-- 4. Crear bucket para templates PDF (esto se hace vía Supabase Dashboard o CLI)
-- El bucket se llamará: document-templates

-- 5. Agregar índice para búsqueda por módulo
CREATE INDEX IF NOT EXISTS idx_document_templates_module ON public.document_templates(module_id);

-- 6. Actualizar políticas RLS para permitir upload
DROP POLICY IF EXISTS "Anyone can manage templates" ON public.document_templates;
CREATE POLICY "Anyone can manage templates" ON public.document_templates FOR ALL USING (true) WITH CHECK (true);

-- 7. Agregar campos de placeholder a template_placeholders
INSERT INTO public.template_placeholders (id, categoria, descripcion, ejemplo) VALUES
  -- Uniformes
  ('uniforme_tipo', 'uniforme', 'Tipo de uniforme/EPP', 'Camisa, Pantalón, Zapatos'),
  ('uniforme_talle', 'uniforme', 'Talle del uniforme', 'M, L, XL'),
  ('uniforme_cantidad', 'uniforme', 'Cantidad entregada', '2'),
  ('uniforme_temporada', 'uniforme', 'Temporada', 'Verano 2025'),
  
  -- Vacaciones
  ('vacaciones_dias', 'vacaciones', 'Días de vacaciones', '14'),
  ('vacaciones_periodo', 'vacaciones', 'Período de vacaciones', '2024'),
  ('vacaciones_saldo', 'vacaciones', 'Saldo disponible', '7'),
  
  -- Pagos
  ('pago_monto', 'pago', 'Monto del pago', '$50,000'),
  ('pago_concepto', 'pago', 'Concepto del pago', 'Adelanto de sueldo'),
  ('pago_periodo', 'pago', 'Período del pago', 'Diciembre 2024'),
  
  -- Evaluación
  ('evaluacion_periodo', 'evaluacion', 'Período evaluado', '2024'),
  ('evaluacion_puntuacion', 'evaluacion', 'Puntuación general', '8.5/10'),
  ('evaluacion_comentarios', 'evaluacion', 'Comentarios del evaluador', 'Buen desempeño general')
ON CONFLICT (id) DO NOTHING;

-- 8. Vista para obtener templates por módulo
CREATE OR REPLACE VIEW public.templates_by_module AS
SELECT 
  dt.id,
  dt.nombre,
  dt.descripcion,
  dt.module_id,
  dt.template_type_id,
  dtt.nombre as tipo_nombre,
  dtt.categoria,
  dt.pdf_url,
  dt.pdf_filename,
  dt.pdf_fields,
  dt.contenido_html,
  dt.is_active,
  dt.is_default,
  dt.created_at
FROM public.document_templates dt
LEFT JOIN public.document_template_types dtt ON dt.template_type_id = dtt.id
WHERE dt.is_active = true
ORDER BY dt.module_id, dt.nombre;

-- 9. Función para obtener templates de un módulo
CREATE OR REPLACE FUNCTION public.get_module_templates(p_module_id VARCHAR)
RETURNS TABLE (
  id UUID,
  nombre VARCHAR,
  descripcion TEXT,
  tipo_nombre VARCHAR,
  pdf_url TEXT,
  has_pdf BOOLEAN,
  pdf_fields JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dt.id,
    dt.nombre,
    dt.descripcion,
    dtt.nombre as tipo_nombre,
    dt.pdf_url,
    (dt.pdf_url IS NOT NULL) as has_pdf,
    dt.pdf_fields
  FROM public.document_templates dt
  LEFT JOIN public.document_template_types dtt ON dt.template_type_id = dtt.id
  WHERE dt.module_id = p_module_id
    AND dt.is_active = true
  ORDER BY dt.is_default DESC, dt.nombre;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.document_templates IS 'Templates de documentos PDF para cada módulo. Pueden ser HTML o PDF subidos.';

