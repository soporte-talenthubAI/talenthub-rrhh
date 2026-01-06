-- =====================================================
-- CATÁLOGOS PERSONALIZABLES POR EMPRESA
-- =====================================================
-- Permite que cada empresa defina sus propios:
-- - Puestos/Cargos
-- - Sectores/Departamentos  
-- - Tipos de Contrato
-- - Motivos de Licencia
-- - Tipos de Documentos
-- =====================================================

-- Tabla de catálogos personalizables
CREATE TABLE IF NOT EXISTS custom_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Tipo de catálogo
  catalog_type VARCHAR(50) NOT NULL,
  -- Valores: 'puestos', 'sectores', 'tipos_contrato', 'motivos_licencia', 'tipos_documento'
  
  -- Valor del ítem
  value VARCHAR(100) NOT NULL,
  
  -- Etiqueta para mostrar
  label VARCHAR(150) NOT NULL,
  
  -- Descripción opcional
  description TEXT,
  
  -- Orden de visualización
  sort_order INTEGER DEFAULT 0,
  
  -- Si está activo (para soft delete)
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(catalog_type, value)
);

-- Índices
CREATE INDEX idx_custom_catalogs_type ON custom_catalogs(catalog_type);
CREATE INDEX idx_custom_catalogs_active ON custom_catalogs(catalog_type, is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_custom_catalogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_custom_catalogs_updated_at ON custom_catalogs;
CREATE TRIGGER trigger_custom_catalogs_updated_at
  BEFORE UPDATE ON custom_catalogs
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_catalogs_updated_at();

-- RLS
ALTER TABLE custom_catalogs ENABLE ROW LEVEL SECURITY;

-- Políticas: usuarios autenticados pueden leer, solo admin puede escribir
CREATE POLICY "custom_catalogs_select_authenticated" ON custom_catalogs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_catalogs_insert_authenticated" ON custom_catalogs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "custom_catalogs_update_authenticated" ON custom_catalogs
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "custom_catalogs_delete_authenticated" ON custom_catalogs
  FOR DELETE TO authenticated USING (true);

-- =====================================================
-- VALORES POR DEFECTO PARA NUEVAS EMPRESAS
-- =====================================================

-- Puestos/Cargos por defecto
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('puestos', 'operario-produccion', 'Operario Producción', 1),
  ('puestos', 'operario-mantenimiento', 'Operario Mantenimiento', 2),
  ('puestos', 'administracion', 'Administración', 3),
  ('puestos', 'recursos-humanos', 'Recursos Humanos', 4),
  ('puestos', 'chofer', 'Chofer', 5),
  ('puestos', 'supervisor', 'Supervisor', 6),
  ('puestos', 'gerente', 'Gerente', 7),
  ('puestos', 'director', 'Director', 8)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- Sectores/Departamentos por defecto
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('sectores', 'produccion', 'Producción', 1),
  ('sectores', 'administracion', 'Administración', 2),
  ('sectores', 'mantenimiento', 'Mantenimiento', 3),
  ('sectores', 'rrhh', 'Recursos Humanos', 4),
  ('sectores', 'comercial', 'Comercial', 5),
  ('sectores', 'logistica', 'Logística', 6),
  ('sectores', 'calidad', 'Calidad', 7)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- Tipos de Contrato por defecto
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('tipos_contrato', 'indefinido', 'Contrato por tiempo indeterminado', 1),
  ('tipos_contrato', 'temporal', 'Contrato temporal', 2),
  ('tipos_contrato', 'obra', 'Contrato por obra o servicio', 3),
  ('tipos_contrato', 'pasantia', 'Pasantía', 4),
  ('tipos_contrato', 'eventual', 'Trabajo eventual', 5)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- Motivos de Licencia por defecto
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('motivos_licencia', 'vacaciones-anuales', 'Vacaciones Anuales', 1),
  ('motivos_licencia', 'licencia-medica', 'Licencia Médica', 2),
  ('motivos_licencia', 'maternidad', 'Licencia por Maternidad', 3),
  ('motivos_licencia', 'paternidad', 'Licencia por Paternidad', 4),
  ('motivos_licencia', 'matrimonio', 'Licencia por Matrimonio', 5),
  ('motivos_licencia', 'fallecimiento', 'Licencia por Fallecimiento', 6),
  ('motivos_licencia', 'estudio', 'Licencia por Estudio', 7),
  ('motivos_licencia', 'asuntos-personales', 'Asuntos Personales', 8)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- Tipos de Documento por defecto
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('tipos_documento', 'contrato', 'Contrato de Trabajo', 1),
  ('tipos_documento', 'recibo', 'Recibo de Sueldo', 2),
  ('tipos_documento', 'certificado', 'Certificado', 3),
  ('tipos_documento', 'constancia', 'Constancia', 4),
  ('tipos_documento', 'legajo', 'Documento de Legajo', 5),
  ('tipos_documento', 'licencia', 'Licencia', 6),
  ('tipos_documento', 'sancion', 'Sanción/Apercibimiento', 7)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- Estados del Empleado (parcialmente personalizable)
INSERT INTO custom_catalogs (catalog_type, value, label, sort_order) VALUES
  ('estados_empleado', 'activo', 'Activo', 1),
  ('estados_empleado', 'inactivo', 'Inactivo', 2),
  ('estados_empleado', 'licencia', 'En Licencia', 3),
  ('estados_empleado', 'suspension', 'Suspendido', 4),
  ('estados_empleado', 'baja', 'Baja', 5)
ON CONFLICT (catalog_type, value) DO NOTHING;

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON TABLE custom_catalogs IS 'Catálogos personalizables por empresa (puestos, sectores, etc.)';
COMMENT ON COLUMN custom_catalogs.catalog_type IS 'Tipo: puestos, sectores, tipos_contrato, motivos_licencia, tipos_documento, estados_empleado';
COMMENT ON COLUMN custom_catalogs.value IS 'Valor técnico (slug) usado internamente';
COMMENT ON COLUMN custom_catalogs.label IS 'Etiqueta visible para el usuario';

