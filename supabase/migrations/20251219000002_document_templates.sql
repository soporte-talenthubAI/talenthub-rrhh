-- =====================================================
-- TEMPLATES DE DOCUMENTOS DINÁMICOS
-- =====================================================

-- 1. Catálogo de tipos de template
CREATE TABLE IF NOT EXISTS public.document_template_types (
  id VARCHAR(50) PRIMARY KEY, -- ej: 'consentimiento_biometrico', 'reglamento_interno'
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  categoria VARCHAR(50) DEFAULT 'general', -- 'legal', 'rrhh', 'general'
  campos_requeridos JSONB DEFAULT '[]', -- campos que el template necesita
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Templates de documentos (por cliente o globales)
CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificación
  template_type_id VARCHAR(50) REFERENCES public.document_template_types(id),
  nombre VARCHAR(255) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Si es NULL, es template global; si tiene valor, es específico del cliente
  -- (para multi-tenant futuro, por ahora todos son globales en cada Supabase)
  tenant_id UUID, -- Referencia opcional a cliente específico
  
  -- Contenido del template
  -- Opción 1: HTML con placeholders {{nombre}}, {{dni}}, etc.
  contenido_html TEXT,
  
  -- Opción 2: URL del archivo en Storage
  template_url TEXT,
  
  -- Configuración de formato
  formato VARCHAR(10) DEFAULT 'A4', -- A4, Letter, Legal
  orientacion VARCHAR(10) DEFAULT 'portrait', -- portrait, landscape
  margenes JSONB DEFAULT '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  
  -- Encabezado y pie (opcional)
  incluir_logo BOOLEAN DEFAULT true,
  incluir_fecha BOOLEAN DEFAULT true,
  incluir_numero_pagina BOOLEAN DEFAULT true,
  texto_pie TEXT, -- ej: "Generado por Sistema RRHH - {{empresa}}"
  
  -- Firma
  requiere_firma_empleado BOOLEAN DEFAULT true,
  requiere_firma_empresa BOOLEAN DEFAULT true,
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false, -- template por defecto para este tipo
  
  -- Metadata
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Placeholders disponibles para templates
CREATE TABLE IF NOT EXISTS public.template_placeholders (
  id VARCHAR(50) PRIMARY KEY, -- ej: 'empleado_nombre', 'empresa_nombre'
  categoria VARCHAR(50), -- 'empleado', 'empresa', 'fecha', 'documento'
  descripcion TEXT,
  ejemplo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERTAR TIPOS DE TEMPLATE POR DEFECTO
-- =====================================================

INSERT INTO public.document_template_types (id, nombre, descripcion, categoria, campos_requeridos) VALUES
  ('consentimiento_biometrico', 'Consentimiento Datos Biométricos', 'Autorización para uso de cámaras y datos biométricos', 'legal', '["empleado_nombre", "empleado_dni", "empleado_direccion", "fecha"]'),
  ('reglamento_interno', 'Reglamento Interno', 'Reglamento interno de la empresa', 'legal', '["empleado_nombre", "fecha"]'),
  ('apercibimiento', 'Apercibimiento', 'Notificación de apercibimiento', 'sanciones', '["empleado_nombre", "empleado_dni", "fecha_hecho", "motivo", "lugar_hecho"]'),
  ('suspension', 'Suspensión', 'Notificación de suspensión', 'sanciones', '["empleado_nombre", "empleado_dni", "fecha_hecho", "motivo", "dias_suspension", "fecha_inicio", "fecha_reincorporacion"]'),
  ('despido_periodo_prueba', 'Despido Período de Prueba', 'Comunicación de fin de relación laboral en período de prueba', 'legal', '["empleado_nombre", "empleado_dni", "fecha"]'),
  ('certificado_vacaciones', 'Certificado de Vacaciones', 'Certificado de goce de vacaciones', 'rrhh', '["empleado_nombre", "empleado_dni", "fecha_inicio", "fecha_fin", "dias"]'),
  ('constancia_trabajo', 'Constancia de Trabajo', 'Certificado de relación laboral', 'rrhh', '["empleado_nombre", "empleado_dni", "puesto", "fecha_ingreso"]'),
  ('recibo_uniforme', 'Recibo de Uniforme', 'Constancia de entrega de uniformes', 'rrhh', '["empleado_nombre", "items_entregados", "fecha"]'),
  ('certificado_capacitacion', 'Certificado de Capacitación', 'Certificado de asistencia a capacitación', 'rrhh', '["empleado_nombre", "titulo_capacitacion", "fecha", "duracion", "instructor"]')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERTAR PLACEHOLDERS DISPONIBLES
-- =====================================================

INSERT INTO public.template_placeholders (id, categoria, descripcion, ejemplo) VALUES
  -- Empleado
  ('empleado_nombre', 'empleado', 'Nombre completo del empleado', 'Juan Pérez'),
  ('empleado_nombres', 'empleado', 'Nombres del empleado', 'Juan Carlos'),
  ('empleado_apellidos', 'empleado', 'Apellidos del empleado', 'Pérez González'),
  ('empleado_dni', 'empleado', 'DNI del empleado', '12345678'),
  ('empleado_cuil', 'empleado', 'CUIL del empleado', '20-12345678-9'),
  ('empleado_direccion', 'empleado', 'Dirección del empleado', 'Av. Siempre Viva 123'),
  ('empleado_puesto', 'empleado', 'Puesto del empleado', 'Operario'),
  ('empleado_sector', 'empleado', 'Sector/Departamento', 'Producción'),
  ('empleado_fecha_ingreso', 'empleado', 'Fecha de ingreso', '01/01/2020'),
  ('empleado_antiguedad', 'empleado', 'Antigüedad en la empresa', '4 años, 2 meses'),
  
  -- Empresa
  ('empresa_nombre', 'empresa', 'Nombre de la empresa', 'Mi Empresa S.A.'),
  ('empresa_cuit', 'empresa', 'CUIT de la empresa', '30-12345678-9'),
  ('empresa_direccion', 'empresa', 'Dirección de la empresa', 'Calle Principal 456'),
  ('empresa_telefono', 'empresa', 'Teléfono de contacto', '+54 11 1234-5678'),
  ('empresa_email', 'empresa', 'Email de RRHH', 'rrhh@miempresa.com'),
  
  -- Fechas
  ('fecha_actual', 'fecha', 'Fecha actual', '19/12/2024'),
  ('fecha_actual_texto', 'fecha', 'Fecha actual en texto', '19 de diciembre de 2024'),
  ('hora_actual', 'fecha', 'Hora actual', '14:30'),
  
  -- Documento
  ('documento_numero', 'documento', 'Número de documento', 'DOC-2024-001'),
  ('documento_tipo', 'documento', 'Tipo de documento', 'Consentimiento')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERTAR TEMPLATES POR DEFECTO (HTML)
-- =====================================================

INSERT INTO public.document_templates (template_type_id, nombre, contenido_html, is_default) VALUES
(
  'consentimiento_biometrico',
  'Consentimiento Datos Biométricos - Default',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; padding: 40px; }
    h1 { text-align: center; font-size: 18px; margin-bottom: 30px; }
    h2 { font-size: 14px; margin-top: 25px; }
    .header { text-align: center; margin-bottom: 30px; }
    .empresa { font-weight: bold; font-size: 16px; }
    .fecha { margin-bottom: 20px; }
    .firma { margin-top: 80px; display: flex; justify-content: space-between; }
    .firma-box { text-align: center; width: 40%; }
    .firma-linea { border-top: 1px solid #000; padding-top: 5px; margin-top: 60px; }
    .footer { margin-top: 40px; font-size: 10px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">{{empresa_nombre}}</div>
  </div>
  
  <h1>CONSTANCIA DE CONSENTIMIENTO PARA USO DE CÁMARAS DE VIGILANCIA Y DATOS BIOMÉTRICOS</h1>
  
  <p class="fecha"><strong>Fecha:</strong> {{fecha_actual}}</p>
  
  <p>En la ciudad de Córdoba Capital, comparece el/la trabajador/a <strong>{{empleado_nombre}}</strong>, DNI Nº <strong>{{empleado_dni}}</strong>, con domicilio en <strong>{{empleado_direccion}}</strong>, quien manifiesta prestar su consentimiento expreso en los términos de la Ley de Protección de Datos Personales N° 25.326 y normativa laboral aplicable.</p>
  
  <h2>1. CÁMARAS DE VIGILANCIA</h2>
  <p>El/la trabajador/a declara haber sido informado/a de la existencia de cámaras de seguridad instaladas en las instalaciones de la empresa {{empresa_nombre}} (en adelante "la Empresa"), cuya finalidad exclusiva es la prevención de riesgos, seguridad de las personas, resguardo de bienes materiales y control del cumplimiento de normas laborales.</p>
  
  <h2>2. DATOS BIOMÉTRICOS</h2>
  <p>Asimismo, el/la trabajador/a presta su consentimiento para el registro y tratamiento de sus datos biométricos (huella dactilar) con el único fin de control de acceso y registro de jornada laboral.</p>
  
  <h2>3. DECLARACIÓN</h2>
  <p><strong>PRESTA SU CONSENTIMIENTO</strong> para ser filmado/a durante el desarrollo de sus tareas laborales y para el uso de sus datos biométricos, entendiendo que serán utilizados únicamente para los fines mencionados y bajo estricta confidencialidad.</p>
  
  <div class="firma">
    <div class="firma-box">
      <div class="firma-linea">FIRMA DEL EMPLEADO</div>
      <p>Aclaración: {{empleado_nombre}}</p>
      <p>DNI: {{empleado_dni}}</p>
    </div>
    <div class="firma-box">
      <div class="firma-linea">{{empresa_nombre}}</div>
      <p>Representante Legal</p>
    </div>
  </div>
  
  <div class="footer">
    Generado el {{fecha_actual}} - Sistema RRHH {{empresa_nombre}}
  </div>
</body>
</html>',
  true
),
(
  'apercibimiento',
  'Apercibimiento - Default',
  '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.6; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; }
    .empresa { font-weight: bold; font-size: 16px; }
    p { text-align: justify; margin-bottom: 15px; }
    .firma { margin-top: 80px; text-align: center; }
    .firma-linea { border-top: 1px solid #000; width: 250px; margin: 60px auto 5px auto; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">{{empresa_nombre}}</div>
  </div>
  
  <p>Córdoba, {{fecha_actual_texto}}</p>
  
  <p><strong>Sr/a:</strong> {{empleado_apellidos}}, {{empleado_nombres}}<br>
  <strong>DNI:</strong> {{empleado_dni}}</p>
  
  <p>Por medio de la presente, procedemos a notificarle de manera fehaciente que se ha resuelto aplicar un <strong>Apercibimiento</strong>.</p>
  
  <p>Atento a {{motivo}}, ocurrido el día {{fecha_hecho}}{{#lugar_hecho}} en {{lugar_hecho}}{{/lugar_hecho}}.</p>
  
  <p>Por ello, se le aplica un apercibimiento y se lo exhorta a que, en lo sucesivo, adecúe su conducta a las pautas de cumplimiento normativo del Art. 16 del CCT 422/05 y al reglamento interno de la empresa, bajo apercibimiento de aplicar sanciones de mayor gravedad.</p>
  
  <p><em>//Seguidamente, notifico de la comunicación que me antecede.</em></p>
  
  <p>Córdoba, {{fecha_actual_texto}}.</p>
  
  <p style="text-align: center; font-weight: bold;">{{empresa_nombre}}</p>
  
  <div class="firma">
    <div class="firma-linea">Firma del trabajador</div>
    <p>Aclaración: ___________________________</p>
    <p>DNI: ___________________________</p>
  </div>
</body>
</html>',
  true
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_document_templates_type ON public.document_templates(template_type_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON public.document_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON public.document_templates(is_active);

-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE public.document_template_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_placeholders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read template types" ON public.document_template_types FOR SELECT USING (true);
CREATE POLICY "Anyone can read templates" ON public.document_templates FOR SELECT USING (true);
CREATE POLICY "Anyone can read placeholders" ON public.template_placeholders FOR SELECT USING (true);

-- Solo admins pueden modificar
CREATE POLICY "Anyone can manage templates" ON public.document_templates FOR ALL USING (true);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at_document_templates ON public.document_templates;
CREATE TRIGGER set_updated_at_document_templates
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

