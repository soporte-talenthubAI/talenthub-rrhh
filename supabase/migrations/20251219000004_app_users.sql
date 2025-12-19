-- =====================================================
-- USUARIOS DE LA APLICACIÓN
-- =====================================================
-- Tabla para gestionar usuarios que acceden al sistema RRHH
-- Se administran desde el Backoffice

CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Credenciales
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  
  -- Información personal
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  
  -- Rol y permisos
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'rrhh', 'viewer')),
  -- admin: acceso total
  -- rrhh: puede crear/editar empleados, documentos, etc.
  -- viewer: solo lectura
  
  -- Estado
  is_active BOOLEAN DEFAULT true,
  must_change_password BOOLEAN DEFAULT true, -- obligar cambio en primer login
  
  -- Tracking
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INT DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID -- referencia al admin que lo creó
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_app_users_active ON public.app_users(is_active);

-- RLS
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (se gestionan desde backoffice)
CREATE POLICY "Allow all access to app_users" ON public.app_users FOR ALL USING (true);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at_app_users ON public.app_users;
CREATE TRIGGER set_updated_at_app_users
  BEFORE UPDATE ON public.app_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERTAR USUARIO ADMIN POR DEFECTO
-- =====================================================
-- Password: admin123 (en producción cambiar inmediatamente)
-- El hash es simplemente para desarrollo, en producción usar bcrypt

INSERT INTO public.app_users (
  email, 
  password_hash, 
  nombre, 
  apellido, 
  role, 
  is_active,
  must_change_password
) VALUES (
  'admin@empresa.com',
  'admin123', -- En producción: hash con bcrypt
  'Administrador',
  'Sistema',
  'admin',
  true,
  true
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- FUNCIÓN PARA VALIDAR LOGIN
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_app_user_login(
  p_email VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  user_id UUID,
  user_email VARCHAR,
  user_nombre VARCHAR,
  user_apellido VARCHAR,
  user_role VARCHAR,
  must_change_password BOOLEAN
) AS $$
BEGIN
  -- Actualizar último login y contador
  UPDATE public.app_users
  SET 
    last_login = NOW(),
    login_count = login_count + 1
  WHERE email = p_email 
    AND password_hash = p_password 
    AND is_active = true;
  
  -- Retornar datos del usuario
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.nombre,
    au.apellido,
    au.role,
    au.must_change_password
  FROM public.app_users au
  WHERE au.email = p_email 
    AND au.password_hash = p_password 
    AND au.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

