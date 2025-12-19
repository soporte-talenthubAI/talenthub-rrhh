-- =====================================================
-- CONFIGURACIÓN DEL CLIENTE
-- =====================================================
-- Esta tabla almacena la configuración de cada cliente
-- Se carga al iniciar la app y permite personalización
-- sin necesidad de redeploy

CREATE TABLE IF NOT EXISTS public.client_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Información de la empresa
  nombre VARCHAR(255) NOT NULL DEFAULT 'Mi Empresa',
  nombre_corto VARCHAR(100) DEFAULT 'Empresa',
  cuit VARCHAR(20),
  direccion TEXT,
  telefono VARCHAR(50),
  email VARCHAR(255),
  
  -- Branding
  logo_url TEXT, -- URL del logo en bucket de Supabase
  favicon_url TEXT,
  color_primario VARCHAR(7) DEFAULT '#16a34a',
  color_secundario VARCHAR(7) DEFAULT '#0891b2',
  color_fondo VARCHAR(7) DEFAULT '#f8fafc',
  
  -- Configuración de la app
  app_title VARCHAR(100) DEFAULT 'Sistema RRHH',
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  fecha_formato VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  moneda VARCHAR(10) DEFAULT 'ARS',
  
  -- Módulos habilitados (JSON array de IDs)
  modulos_habilitados JSONB DEFAULT '["dashboard", "employees"]',
  
  -- Configuración de documentos
  firma_empresa_nombre VARCHAR(255),
  firma_empresa_cargo VARCHAR(100),
  pie_pagina_documentos TEXT,
  
  -- Metadata
  is_configured BOOLEAN DEFAULT false, -- true cuando el cliente completó setup
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Solo debe haber UN registro de configuración por base de datos
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_config_singleton ON public.client_config ((true));

-- Insertar configuración por defecto
INSERT INTO public.client_config (
  nombre, 
  nombre_corto, 
  app_title,
  is_configured
) VALUES (
  'Mi Empresa',
  'Empresa', 
  'Sistema RRHH',
  false
) ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;

-- Permitir lectura a todos (la app necesita leer la config)
CREATE POLICY "Allow public read config" ON public.client_config 
FOR SELECT USING (true);

-- Permitir update a todos (por ahora, luego restringir)
CREATE POLICY "Allow update config" ON public.client_config 
FOR UPDATE USING (true);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at_client_config ON public.client_config;
CREATE TRIGGER set_updated_at_client_config
  BEFORE UPDATE ON public.client_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- BUCKET PARA LOGOS
-- =====================================================

-- Crear bucket para assets del cliente (logos, etc.)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('client-assets', 'client-assets', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas para el bucket de assets
DO $$
BEGIN
  -- Política para leer
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public read assets" ON storage.objects
    FOR SELECT USING (bucket_id = 'client-assets');
  END IF;
  
  -- Política para subir
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public insert assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public insert assets" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'client-assets');
  END IF;
  
  -- Política para actualizar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public update assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public update assets" ON storage.objects
    FOR UPDATE USING (bucket_id = 'client-assets');
  END IF;
  
  -- Política para eliminar
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow public delete assets' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow public delete assets" ON storage.objects
    FOR DELETE USING (bucket_id = 'client-assets');
  END IF;
END $$;

