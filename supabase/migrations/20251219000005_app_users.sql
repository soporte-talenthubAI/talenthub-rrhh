-- ============================================
-- Migración: Perfiles de Usuario (usa Supabase Auth)
-- Los usuarios se crean en Supabase Auth
-- Esta tabla guarda metadata adicional (rol, nombre, etc.)
-- ============================================

-- Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  apellido VARCHAR(255),
  rol VARCHAR(50) DEFAULT 'viewer' CHECK (rol IN ('admin', 'rrhh', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  ultimo_acceso TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_rol ON user_profiles(rol);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, nombre, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil en registro
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Admins pueden modificar perfiles
CREATE POLICY "Admins can update profiles" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND rol = 'admin'
    )
  );

-- Usuarios pueden actualizar su propio perfil (excepto rol)
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario - extiende auth.users de Supabase';
COMMENT ON COLUMN user_profiles.rol IS 'admin: acceso total, rrhh: gestión RRHH, viewer: solo lectura';
