-- =====================================================
-- MULTI-TENANT SCHEMA - Agregando tenant_id a todas las tablas
-- =====================================================
-- Esta migración convierte el sistema a multi-tenant centralizado
-- usando Row Level Security (RLS) para aislamiento de datos
--
-- IMPORTANTE: Solo modifica tablas que existen

-- =====================================================
-- 0. CREAR TABLAS FALTANTES (candidates, candidate_history)
-- =====================================================

-- Tabla de candidatos para reclutamiento
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_apellido VARCHAR(255),
  fecha_nacimiento DATE,
  edad INTEGER,
  sexo VARCHAR(20),
  localidad VARCHAR(255),
  numero_contacto VARCHAR(50),
  mail VARCHAR(255),
  vacante_postulada VARCHAR(255),
  disponibilidad VARCHAR(100),
  tipo_jornada_buscada VARCHAR(100),
  experiencia_laboral TEXT,
  conocimientos_habilidades TEXT,
  referencias_laborales TEXT,
  observaciones_reclutador TEXT,
  estado VARCHAR(50) DEFAULT 'nuevo' CHECK (estado IN (
    'nuevo', 'en_revision', 'entrevista', 'prueba_tecnica',
    'seleccionado', 'contratado', 'rechazado', 'descartado'
  )),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historial de cambios de estado de candidatos
CREATE TABLE IF NOT EXISTS public.candidate_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para candidates
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_history ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas iniciales
DROP POLICY IF EXISTS "Enable all for candidates" ON public.candidates;
CREATE POLICY "Enable all for candidates" ON public.candidates FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all for candidate_history" ON public.candidate_history;
CREATE POLICY "Enable all for candidate_history" ON public.candidate_history FOR ALL USING (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_candidates_estado ON public.candidates(estado);
CREATE INDEX IF NOT EXISTS idx_candidate_history_candidate ON public.candidate_history(candidate_id);

-- Trigger para updated_at en candidates
DROP TRIGGER IF EXISTS set_updated_at_candidates ON public.candidates;
CREATE TRIGGER set_updated_at_candidates
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 1. AGREGAR COLUMNA tenant_id A TABLAS EXISTENTES
-- =====================================================

-- Función helper para agregar columna solo si la tabla existe
DO $$
DECLARE
  tables_to_update TEXT[] := ARRAY[
    'employees',
    'attendance',
    'absences',
    'vacation_requests',
    'vacation_balances',
    'sanctions',
    'documents',
    'payroll',
    'trainings',
    'uniforms',
    'performance_evaluations',
    'candidates',
    'candidate_history',
    'applications',
    'declaraciones_domicilio',
    'visitas_consultores',
    'backup_logs'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_update LOOP
    -- Verificar si la tabla existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      -- Verificar si la columna ya existe
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN tenant_id UUID', tbl);
        RAISE NOTICE 'Added tenant_id to %', tbl;
      ELSE
        RAISE NOTICE 'tenant_id already exists in %', tbl;
      END IF;
    ELSE
      RAISE NOTICE 'Table % does not exist, skipping', tbl;
    END IF;
  END LOOP;
END $$;

-- Agregar foreign key a talenthub_clients solo si existe esa tabla
DO $$
DECLARE
  tables_to_update TEXT[] := ARRAY[
    'employees',
    'attendance',
    'absences',
    'vacation_requests',
    'vacation_balances',
    'sanctions',
    'documents',
    'payroll',
    'trainings',
    'uniforms',
    'performance_evaluations',
    'candidates',
    'candidate_history',
    'applications',
    'declaraciones_domicilio',
    'visitas_consultores',
    'backup_logs'
  ];
  tbl TEXT;
  fk_name TEXT;
BEGIN
  -- Solo continuar si existe la tabla talenthub_clients
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'talenthub_clients'
  ) THEN
    FOREACH tbl IN ARRAY tables_to_update LOOP
      -- Verificar si la tabla y columna existen
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
      ) THEN
        fk_name := tbl || '_tenant_id_fkey';
        -- Verificar si el FK ya existe
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = fk_name AND table_schema = 'public'
        ) THEN
          BEGIN
            EXECUTE format(
              'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (tenant_id) REFERENCES public.talenthub_clients(id)',
              tbl, fk_name
            );
            RAISE NOTICE 'Added FK for % to talenthub_clients', tbl;
          EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add FK for %: %', tbl, SQLERRM;
          END;
        END IF;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE 'talenthub_clients does not exist, skipping FK creation';
  END IF;
END $$;

-- Client Config - asociar a tenant (tabla especial)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_config'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'client_config' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.client_config ADD COLUMN tenant_id UUID;
      RAISE NOTICE 'Added tenant_id to client_config';
    END IF;
  END IF;
END $$;

-- Document Templates - por tenant
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'document_templates'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'document_templates' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.document_templates ADD COLUMN tenant_id UUID;
      RAISE NOTICE 'Added tenant_id to document_templates';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 2. CREAR ÍNDICES PARA tenant_id (solo si existen)
-- =====================================================

DO $$
DECLARE
  tables_to_index TEXT[] := ARRAY[
    'employees',
    'attendance',
    'absences',
    'vacation_requests',
    'vacation_balances',
    'sanctions',
    'documents',
    'payroll',
    'trainings',
    'uniforms',
    'performance_evaluations',
    'candidates',
    'candidate_history',
    'applications',
    'declaraciones_domicilio',
    'visitas_consultores',
    'client_config'
  ];
  tbl TEXT;
  idx_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_index LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      idx_name := 'idx_' || tbl || '_tenant';
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = idx_name
      ) THEN
        EXECUTE format('CREATE INDEX %I ON public.%I(tenant_id)', idx_name, tbl);
        RAISE NOTICE 'Created index % on %', idx_name, tbl;
      END IF;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 3. TABLA DE USUARIOS POR TENANT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- ID del usuario en auth.users
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('admin', 'rrhh', 'viewer')),
  is_active BOOLEAN DEFAULT true,
  invited_by UUID,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_access TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tenant_id),
  UNIQUE(email, tenant_id)
);

-- Agregar FK a talenthub_clients si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'talenthub_clients'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'tenant_users_tenant_id_fkey' AND table_schema = 'public'
    ) THEN
      ALTER TABLE public.tenant_users
      ADD CONSTRAINT tenant_users_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.talenthub_clients(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON public.tenant_users(email);

-- =====================================================
-- 4. FUNCIÓN PARA OBTENER EL TENANT DEL USUARIO ACTUAL
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  current_tenant UUID;
BEGIN
  -- Primero intentar obtener de los claims del JWT
  BEGIN
    current_tenant := (current_setting('request.jwt.claims', true)::json->>'tenant_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    current_tenant := NULL;
  END;

  IF current_tenant IS NOT NULL THEN
    RETURN current_tenant;
  END IF;

  -- Si no hay claim, buscar en tenant_users
  SELECT tenant_id INTO current_tenant
  FROM public.tenant_users
  WHERE user_id = auth.uid()
  AND is_active = true
  LIMIT 1;

  RETURN current_tenant;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si el usuario tiene acceso a un tenant
CREATE OR REPLACE FUNCTION public.user_has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF check_tenant_id IS NULL THEN
    RETURN true; -- Permitir datos sin tenant (migración)
  END IF;

  -- Verificar si el usuario está asignado al tenant
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE user_id = auth.uid()
    AND tenant_id = check_tenant_id
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para obtener el rol del usuario en el tenant actual
CREATE OR REPLACE FUNCTION public.get_user_tenant_role()
RETURNS VARCHAR AS $$
DECLARE
  user_role VARCHAR;
BEGIN
  SELECT role INTO user_role
  FROM public.tenant_users
  WHERE user_id = auth.uid()
  AND tenant_id = public.get_current_tenant_id()
  AND is_active = true
  LIMIT 1;

  RETURN COALESCE(user_role, 'viewer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- 5. ROW LEVEL SECURITY PARA TENANT_USERS
-- =====================================================

ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant assignments" ON public.tenant_users;
CREATE POLICY "Users can view their tenant assignments" ON public.tenant_users
FOR SELECT USING (true); -- Permitir lectura para verificar acceso

DROP POLICY IF EXISTS "Users can manage tenant users" ON public.tenant_users;
CREATE POLICY "Users can manage tenant users" ON public.tenant_users
FOR ALL USING (true); -- Backoffice tiene acceso completo

-- =====================================================
-- 6. POLÍTICAS RLS PARA TABLAS OPERATIVAS
-- =====================================================

-- Crear políticas de aislamiento por tenant para cada tabla existente
DO $$
DECLARE
  tables_to_secure TEXT[] := ARRAY[
    'employees',
    'attendance',
    'absences',
    'vacation_requests',
    'vacation_balances',
    'sanctions',
    'documents',
    'payroll',
    'trainings',
    'uniforms',
    'performance_evaluations',
    'candidates',
    'candidate_history',
    'applications',
    'declaraciones_domicilio',
    'visitas_consultores',
    'client_config'
  ];
  tbl TEXT;
  policy_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_secure LOOP
    -- Verificar si la tabla existe y tiene tenant_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      policy_name := 'tenant_isolation_' || tbl;

      -- Eliminar política existente si hay
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl);

      -- Crear nueva política permisiva (para no romper funcionalidad existente)
      -- La política permite:
      -- 1. Datos sin tenant_id (datos legacy/migración)
      -- 2. Datos del tenant actual del usuario
      -- 3. Acceso total si no hay usuario autenticado (para backoffice)
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL USING (
          tenant_id IS NULL OR
          public.user_has_tenant_access(tenant_id) OR
          auth.uid() IS NULL
        )',
        policy_name, tbl
      );

      RAISE NOTICE 'Created RLS policy % on %', policy_name, tbl;
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- 7. TRIGGERS PARA AUTO-ASIGNAR tenant_id
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_assign_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se especificó tenant_id, usar el del usuario actual
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.get_current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear triggers para cada tabla existente
DO $$
DECLARE
  tables_to_trigger TEXT[] := ARRAY[
    'employees',
    'attendance',
    'absences',
    'vacation_requests',
    'vacation_balances',
    'sanctions',
    'documents',
    'payroll',
    'trainings',
    'uniforms',
    'performance_evaluations',
    'candidates',
    'candidate_history',
    'applications',
    'declaraciones_domicilio',
    'visitas_consultores'
  ];
  tbl TEXT;
  trigger_name TEXT;
BEGIN
  FOREACH tbl IN ARRAY tables_to_trigger LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'tenant_id'
    ) THEN
      trigger_name := 'auto_tenant_id_' || tbl;
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trigger_name, tbl);
      EXECUTE format(
        'CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.auto_assign_tenant_id()',
        trigger_name, tbl
      );
      RAISE NOTICE 'Created trigger % on %', trigger_name, tbl;
    END IF;
  END LOOP;
END $$;

-- Trigger para tenant_users updated_at
DROP TRIGGER IF EXISTS set_updated_at_tenant_users ON public.tenant_users;
CREATE TRIGGER set_updated_at_tenant_users
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VISTA DE ESTADÍSTICAS POR TENANT
-- =====================================================

CREATE OR REPLACE VIEW public.tenant_statistics AS
SELECT
  tc.id as tenant_id,
  tc.nombre as tenant_nombre,
  tc.plan,
  tc.status,
  COALESCE((SELECT COUNT(*) FROM public.employees e WHERE e.tenant_id = tc.id), 0) as total_employees,
  COALESCE((SELECT COUNT(*) FROM public.tenant_users tu WHERE tu.tenant_id = tc.id AND tu.is_active = true), 0) as total_users,
  COALESCE((SELECT COUNT(*) FROM public.documents d WHERE d.tenant_id = tc.id), 0) as total_documents,
  tc.created_at,
  tc.updated_at
FROM public.talenthub_clients tc
WHERE tc.status != 'cancelled';

-- =====================================================
-- 9. FUNCIÓN PARA SETUP DE NUEVO TENANT
-- =====================================================

CREATE OR REPLACE FUNCTION public.setup_new_tenant(
  p_tenant_id UUID,
  p_admin_user_id UUID,
  p_admin_email VARCHAR
)
RETURNS VOID AS $$
BEGIN
  -- Crear asignación de usuario admin al tenant
  INSERT INTO public.tenant_users (user_id, tenant_id, email, role, is_active)
  VALUES (p_admin_user_id, p_tenant_id, p_admin_email, 'admin', true)
  ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = 'admin', is_active = true;

  -- Crear configuración inicial del cliente si la tabla existe
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'client_config'
  ) THEN
    INSERT INTO public.client_config (tenant_id, is_configured)
    VALUES (p_tenant_id, false)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.tenant_users IS 'Asociación de usuarios a tenants con roles';
COMMENT ON FUNCTION public.get_current_tenant_id() IS 'Obtiene el tenant_id del usuario autenticado actual';
COMMENT ON FUNCTION public.user_has_tenant_access(UUID) IS 'Verifica si el usuario tiene acceso a un tenant específico';
COMMENT ON FUNCTION public.setup_new_tenant(UUID, UUID, VARCHAR) IS 'Configura un nuevo tenant con su usuario admin inicial';
