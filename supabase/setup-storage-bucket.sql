-- Script para configurar el bucket de storage para un nuevo cliente
-- Ejecutar en Supabase SQL Editor después de crear el proyecto

-- 1. Crear el bucket "documentos" si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'documentos',
  'documentos', 
  false,
  10485760  -- 10MB límite
)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Anyone can view documentos files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to documentos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update documentos files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from documentos" ON storage.objects;

-- 4. Crear políticas RLS para el bucket "documentos"
CREATE POLICY "Anyone can view documentos files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documentos');

CREATE POLICY "Anyone can upload to documentos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Anyone can update documentos files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'documentos');

CREATE POLICY "Anyone can delete from documentos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'documentos');

-- 5. Verificar que el bucket se creó correctamente
SELECT * FROM storage.buckets WHERE id = 'documentos';

