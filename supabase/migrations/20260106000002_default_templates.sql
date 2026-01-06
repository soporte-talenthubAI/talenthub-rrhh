-- =====================================================
-- TEMPLATES POR DEFECTO PARA MÓDULOS
-- =====================================================
-- Agrega templates base que pueden ser personalizados por empresa
-- =====================================================

-- Primero, verificar/crear los tipos de template necesarios
INSERT INTO document_template_types (id, nombre, descripcion, categoria, campos_requeridos)
VALUES 
  ('certificado_vacaciones', 'Certificado de Vacaciones', 'Notificación de período de vacaciones', 'vacaciones', ARRAY['empleado_nombre', 'dni', 'fecha_inicio', 'fecha_fin', 'dias']),
  ('constancia_trabajo', 'Constancia de Trabajo', 'Certificado de trabajo activo', 'empleados', ARRAY['empleado_nombre', 'dni', 'puesto', 'fecha_ingreso']),
  ('recibo_uniforme', 'Recibo de Uniforme', 'Constancia de entrega de uniforme', 'uniformes', ARRAY['empleado_nombre', 'dni']),
  ('certificado_capacitacion', 'Certificado de Capacitación', 'Certificado de curso completado', 'capacitaciones', ARRAY['empleado_nombre', 'dni', 'titulo_capacitacion', 'fecha']),
  ('apercibimiento', 'Apercibimiento', 'Notificación de apercibimiento', 'sanciones', ARRAY['empleado_nombre', 'dni', 'motivo']),
  ('suspension', 'Suspensión', 'Notificación de suspensión', 'sanciones', ARRAY['empleado_nombre', 'dni', 'motivo', 'dias_suspension']),
  ('declaracion_domicilio', 'Declaración Jurada de Domicilio', 'Declaración de domicilio', 'declaraciones', ARRAY['empleado_nombre', 'dni', 'direccion'])
ON CONFLICT (id) DO NOTHING;

-- Template por defecto: Certificado de Vacaciones
INSERT INTO document_templates (
  template_type_id,
  nombre,
  version,
  contenido_html,
  formato,
  orientacion,
  margenes,
  incluir_logo,
  incluir_fecha,
  requiere_firma_empleado,
  requiere_firma_empresa,
  is_active,
  is_default,
  module_id,
  descripcion
) VALUES (
  'certificado_vacaciones',
  'Notificación de Vacaciones - Default',
  '1.0',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0; font-size: 18px;">{{empresa_nombre}}</h2>
    <p style="margin: 5px 0; font-size: 12px;">{{empresa_direccion}}</p>
  </div>
  
  <h1 style="text-align: center; font-size: 20px; margin: 30px 0; border-bottom: 2px solid #000; padding-bottom: 10px;">NOTIFICACIÓN DE VACACIONES</h1>
  
  <div style="margin-bottom: 20px;">
    <p><strong>Nombre y Apellido:</strong> {{empleado_nombre}}</p>
    <p><strong>DNI:</strong> {{empleado_dni}}</p>
    <p><strong>Puesto:</strong> {{empleado_puesto}}</p>
    <p><strong>Sector:</strong> {{empleado_sector}}</p>
  </div>
  
  <p style="line-height: 1.8; text-align: justify;">
    En cumplimiento de la Legislación vigente Art. 154 de la Ley de Contrato de Trabajo, se le notifica que su período de descanso anual es de <strong>{{dias}} días</strong>, comenzando desde el <strong>{{fecha_inicio}}</strong> hasta el <strong>{{fecha_fin}}</strong> inclusive.
  </p>
  
  <p style="margin: 20px 0;">Sin otro particular, saludamos atentamente.</p>
  
  <div style="margin: 30px 0;">
    <p><strong>Empleador:</strong> {{empresa_nombre}}</p>
    <p><strong>CUIT:</strong> {{empresa_cuit}}</p>
    <p><strong>Domicilio:</strong> {{empresa_direccion}}</p>
  </div>
  
  <p><strong>Fecha de emisión:</strong> {{fecha_actual}}</p>
  
  <div style="margin-top: 50px; border-top: 2px solid #000; padding-top: 20px;">
    <p style="font-style: italic;">Me notifico de la comunicación que antecede, tomando debida nota.</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #000; padding-top: 5px;">
          <p style="margin: 0;">Firma del Empleado</p>
        </div>
      </div>
      <div style="text-align: center; width: 200px;">
        <p style="margin: 0;">Fecha: _______________</p>
      </div>
    </div>
  </div>
  
  <div style="margin-top: 40px; border-top: 2px solid #000; padding-top: 20px;">
    <p style="font-style: italic;">Certifico haber gozado del período de vacaciones arriba mencionado, reintegrándome en la fecha de conformidad a mis ocupaciones.</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #000; padding-top: 5px;">
          <p style="margin: 0;">Firma del Empleado</p>
        </div>
      </div>
      <div style="text-align: center; width: 200px;">
        <p style="margin: 0;">Fecha Reintegro: _______________</p>
      </div>
    </div>
  </div>
</div>',
  'A4',
  'portrait',
  '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  true,
  true,
  true,
  true,
  true,
  true,
  'vacations',
  'Template por defecto para notificaciones de vacaciones. Personalizable desde el backoffice.'
) ON CONFLICT (template_type_id, nombre) DO NOTHING;

-- Template por defecto: Constancia de Trabajo
INSERT INTO document_templates (
  template_type_id,
  nombre,
  version,
  contenido_html,
  formato,
  orientacion,
  margenes,
  incluir_logo,
  incluir_fecha,
  requiere_firma_empleado,
  requiere_firma_empresa,
  is_active,
  is_default,
  module_id,
  descripcion
) VALUES (
  'constancia_trabajo',
  'Constancia de Trabajo - Default',
  '1.0',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="margin: 0; font-size: 18px;">{{empresa_nombre}}</h2>
    <p style="margin: 5px 0; font-size: 12px;">CUIT: {{empresa_cuit}}</p>
    <p style="margin: 5px 0; font-size: 12px;">{{empresa_direccion}}</p>
  </div>
  
  <h1 style="text-align: center; font-size: 20px; margin: 30px 0;">CONSTANCIA DE TRABAJO</h1>
  
  <p style="line-height: 1.8; text-align: justify;">
    Por medio de la presente se deja constancia que el/la Sr/a. <strong>{{empleado_nombre}}</strong>, 
    DNI N° <strong>{{empleado_dni}}</strong>, CUIL <strong>{{empleado_cuil}}</strong>, 
    se desempeña en esta empresa desde el <strong>{{empleado_fecha_ingreso}}</strong> 
    hasta la fecha, ocupando el cargo de <strong>{{empleado_puesto}}</strong> 
    en el sector de <strong>{{empleado_sector}}</strong>.
  </p>
  
  <p style="line-height: 1.8; text-align: justify; margin-top: 20px;">
    Se extiende la presente a pedido del interesado, para ser presentada ante quien corresponda.
  </p>
  
  <p style="margin: 30px 0;"><strong>Fecha de emisión:</strong> {{fecha_actual_texto}}</p>
  
  <div style="margin-top: 80px; text-align: center;">
    <div style="display: inline-block; width: 250px;">
      <div style="border-top: 1px solid #000; padding-top: 5px;">
        <p style="margin: 0;">Firma y Sello de la Empresa</p>
      </div>
    </div>
  </div>
</div>',
  'A4',
  'portrait',
  '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  true,
  true,
  false,
  true,
  true,
  true,
  'employees',
  'Template por defecto para constancias de trabajo.'
) ON CONFLICT (template_type_id, nombre) DO NOTHING;

-- Template por defecto: Apercibimiento
INSERT INTO document_templates (
  template_type_id,
  nombre,
  version,
  contenido_html,
  formato,
  orientacion,
  margenes,
  incluir_logo,
  incluir_fecha,
  requiere_firma_empleado,
  requiere_firma_empresa,
  is_active,
  is_default,
  module_id,
  descripcion
) VALUES (
  'apercibimiento',
  'Apercibimiento - Default',
  '1.0',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="margin: 0; font-size: 18px;">{{empresa_nombre}}</h2>
  </div>
  
  <h1 style="text-align: center; font-size: 20px; margin: 30px 0;">APERCIBIMIENTO</h1>
  
  <div style="margin-bottom: 20px;">
    <p><strong>Empleado:</strong> {{empleado_nombre}}</p>
    <p><strong>DNI:</strong> {{empleado_dni}}</p>
    <p><strong>Legajo:</strong> {{empleado_cuil}}</p>
    <p><strong>Puesto:</strong> {{empleado_puesto}}</p>
  </div>
  
  <p style="line-height: 1.8; text-align: justify;">
    Por medio de la presente, se le comunica formalmente que se le aplica un <strong>APERCIBIMIENTO</strong> 
    en virtud de la siguiente situación:
  </p>
  
  <div style="margin: 20px; padding: 15px; border: 1px solid #ccc; background: #f9f9f9;">
    <p style="margin: 0;"><strong>Motivo:</strong> {{motivo}}</p>
    <p style="margin: 10px 0 0 0;"><strong>Fecha del hecho:</strong> {{fecha_hecho}}</p>
  </div>
  
  <p style="line-height: 1.8; text-align: justify;">
    Se le hace saber que de reiterarse conductas similares, la empresa se reserva el derecho 
    de aplicar sanciones de mayor gravedad, de acuerdo a lo establecido en la Ley de Contrato 
    de Trabajo y el Reglamento Interno de la empresa.
  </p>
  
  <p style="margin: 30px 0;"><strong>Fecha:</strong> {{fecha_actual}}</p>
  
  <div style="margin-top: 50px;">
    <p style="font-style: italic;">Me notifico del presente apercibimiento:</p>
    
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #000; padding-top: 5px;">
          <p style="margin: 0;">Firma del Empleado</p>
        </div>
      </div>
      <div style="text-align: center; width: 200px;">
        <div style="border-top: 1px solid #000; padding-top: 5px;">
          <p style="margin: 0;">Firma del Empleador</p>
        </div>
      </div>
    </div>
  </div>
</div>',
  'A4',
  'portrait',
  '{"top": 20, "right": 20, "bottom": 20, "left": 20}',
  true,
  true,
  true,
  true,
  true,
  true,
  'sanctions',
  'Template por defecto para apercibimientos.'
) ON CONFLICT (template_type_id, nombre) DO NOTHING;

-- Agregar constraint único para evitar duplicados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_template_type_nombre'
  ) THEN
    ALTER TABLE document_templates 
    ADD CONSTRAINT unique_template_type_nombre UNIQUE (template_type_id, nombre);
  END IF;
EXCEPTION WHEN others THEN
  NULL; -- Si ya existe, ignorar
END $$;

-- Comentarios
COMMENT ON COLUMN document_templates.is_default IS 'true = template base del sistema, false = template personalizado por empresa';
COMMENT ON COLUMN document_templates.module_id IS 'ID del módulo al que pertenece este template (vacations, employees, sanctions, etc.)';

