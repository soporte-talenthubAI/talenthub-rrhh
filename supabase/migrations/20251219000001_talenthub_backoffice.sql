-- =====================================================
-- TALENTHUB BACKOFFICE - Sistema de Administración
-- =====================================================

-- 1. Tabla de administradores TalentHub (super usuarios)
CREATE TABLE IF NOT EXISTS public.talenthub_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'support' CHECK (role IN ('super_admin', 'support', 'sales')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de clientes (tenants)
CREATE TABLE IF NOT EXISTS public.talenthub_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Información básica
  nombre VARCHAR(255) NOT NULL,
  nombre_corto VARCHAR(100),
  cuit VARCHAR(20),
  
  -- Contacto
  email_contacto VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  
  -- Configuración visual
  logo_url TEXT,
  color_primario VARCHAR(7) DEFAULT '#16a34a',
  color_secundario VARCHAR(7) DEFAULT '#0891b2',
  
  -- Supabase del cliente
  supabase_url TEXT,
  supabase_project_id VARCHAR(100),
  
  -- Estado y suscripción
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IN ('basic', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  notas TEXT,
  created_by UUID REFERENCES public.talenthub_admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Catálogo de módulos disponibles
CREATE TABLE IF NOT EXISTS public.talenthub_modules (
  id VARCHAR(50) PRIMARY KEY, -- ej: 'employees', 'vacations', 'payroll'
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono VARCHAR(50), -- nombre del icono (lucide)
  orden INT DEFAULT 0,
  is_core BOOLEAN DEFAULT false, -- módulos que siempre están habilitados
  plan_minimo VARCHAR(50) DEFAULT 'basic', -- plan mínimo requerido
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Módulos habilitados por cliente
CREATE TABLE IF NOT EXISTS public.talenthub_client_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.talenthub_clients(id) ON DELETE CASCADE,
  module_id VARCHAR(50) REFERENCES public.talenthub_modules(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enabled_by UUID REFERENCES public.talenthub_admins(id),
  config JSONB DEFAULT '{}', -- configuración específica del módulo para el cliente
  UNIQUE(client_id, module_id)
);

-- 5. Log de acciones de administradores
CREATE TABLE IF NOT EXISTS public.talenthub_admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES public.talenthub_admins(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50), -- 'client', 'module', 'template', etc.
  entity_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERTAR MÓDULOS POR DEFECTO
-- =====================================================

INSERT INTO public.talenthub_modules (id, nombre, descripcion, icono, orden, is_core, plan_minimo) VALUES
  ('dashboard', 'Dashboard', 'Panel principal con KPIs y resumen', 'LayoutDashboard', 1, true, 'basic'),
  ('employees', 'Empleados', 'Gestión de legajos y datos de empleados', 'Users', 2, true, 'basic'),
  ('attendance', 'Asistencia', 'Control de asistencia y fichadas', 'Clock', 3, false, 'basic'),
  ('vacations', 'Vacaciones', 'Solicitudes y balance de vacaciones', 'Calendar', 4, false, 'basic'),
  ('absences', 'Ausencias', 'Gestión de ausencias y permisos', 'CalendarOff', 5, false, 'basic'),
  ('sanctions', 'Sanciones', 'Apercibimientos y suspensiones', 'AlertTriangle', 6, false, 'basic'),
  ('documents', 'Documentos', 'Generación y firma de documentos', 'FileText', 7, false, 'professional'),
  ('payroll', 'Nómina', 'Gestión de pagos y adelantos', 'DollarSign', 8, false, 'professional'),
  ('training', 'Capacitaciones', 'Registro de capacitaciones', 'GraduationCap', 9, false, 'basic'),
  ('uniforms', 'Uniformes', 'Entrega de uniformes y EPP', 'Shirt', 10, false, 'basic'),
  ('performance', 'Desempeño', 'Evaluaciones de desempeño', 'TrendingUp', 11, false, 'professional'),
  ('selection', 'Selección', 'Proceso de reclutamiento', 'UserPlus', 12, false, 'professional'),
  ('declarations', 'Declaraciones', 'Declaraciones juradas', 'ClipboardList', 13, false, 'basic'),
  ('consultations', 'Consultas', 'Visitas de consultores', 'MessageSquare', 14, false, 'enterprise'),
  ('calendar', 'Calendario', 'Eventos y recordatorios', 'CalendarDays', 15, false, 'basic'),
  ('reports', 'Reportes', 'Informes y estadísticas', 'BarChart3', 16, false, 'professional')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERTAR ADMIN INICIAL
-- =====================================================

-- Password: TalentHub2024! (hasheado con bcrypt)
-- En producción, usar: SELECT crypt('TalentHub2024!', gen_salt('bf'));
INSERT INTO public.talenthub_admins (email, password_hash, nombre, apellido, role) VALUES
  ('soporte@talenthub.com', '$2a$10$rQvHnYjGxwq9jXgGnVQzxO8XPR5uNQv5YLtIhBgvR3q/qk5qS5bC6', 'TalentHub', 'Soporte', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_talenthub_clients_status ON public.talenthub_clients(status);
CREATE INDEX IF NOT EXISTS idx_talenthub_client_modules_client ON public.talenthub_client_modules(client_id);
CREATE INDEX IF NOT EXISTS idx_talenthub_admin_logs_admin ON public.talenthub_admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_talenthub_admin_logs_created ON public.talenthub_admin_logs(created_at);

-- =====================================================
-- RLS POLICIES (deshabilitadas para admins)
-- =====================================================

ALTER TABLE public.talenthub_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talenthub_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talenthub_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talenthub_client_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talenthub_admin_logs ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (el backoffice tiene acceso total)
CREATE POLICY "Admins have full access to admins" ON public.talenthub_admins FOR ALL USING (true);
CREATE POLICY "Admins have full access to clients" ON public.talenthub_clients FOR ALL USING (true);
CREATE POLICY "Admins have full access to modules" ON public.talenthub_modules FOR ALL USING (true);
CREATE POLICY "Admins have full access to client_modules" ON public.talenthub_client_modules FOR ALL USING (true);
CREATE POLICY "Admins have full access to logs" ON public.talenthub_admin_logs FOR ALL USING (true);

-- =====================================================
-- FUNCIÓN PARA TRIGGER DE UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_talenthub_admins ON public.talenthub_admins;
CREATE TRIGGER set_updated_at_talenthub_admins
  BEFORE UPDATE ON public.talenthub_admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_talenthub_clients ON public.talenthub_clients;
CREATE TRIGGER set_updated_at_talenthub_clients
  BEFORE UPDATE ON public.talenthub_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

