-- =====================================================
-- SISTEMA DE SUSCRIPCIONES
-- =====================================================
-- Gestión completa de planes, suscripciones, facturación y límites

-- =====================================================
-- 1. TABLA DE PLANES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id VARCHAR(50) PRIMARY KEY, -- 'basic', 'professional', 'enterprise'
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,

  -- Precios (en centavos para evitar decimales)
  precio_mensual_cents INTEGER NOT NULL DEFAULT 0,
  precio_anual_cents INTEGER NOT NULL DEFAULT 0,
  moneda VARCHAR(3) DEFAULT 'USD',

  -- Límites del plan
  max_employees INTEGER DEFAULT 50,
  max_users INTEGER DEFAULT 5,
  max_storage_mb INTEGER DEFAULT 1024, -- 1GB por defecto
  max_documents_month INTEGER DEFAULT 100,

  -- Features incluidas (JSONB para flexibilidad)
  features JSONB DEFAULT '[]',

  -- Módulos incluidos (array de IDs de módulos)
  modules_included TEXT[] DEFAULT ARRAY['dashboard', 'employees'],

  -- Estado
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true, -- Visible en pricing page
  sort_order INTEGER DEFAULT 0,

  -- Metadata
  stripe_product_id VARCHAR(100), -- ID del producto en Stripe
  stripe_price_monthly_id VARCHAR(100), -- ID del precio mensual en Stripe
  stripe_price_yearly_id VARCHAR(100), -- ID del precio anual en Stripe

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO public.subscription_plans (
  id, nombre, descripcion,
  precio_mensual_cents, precio_anual_cents,
  max_employees, max_users, max_storage_mb, max_documents_month,
  features, modules_included, sort_order
) VALUES
  (
    'basic',
    'Plan Básico',
    'Ideal para pequeñas empresas que inician su digitalización de RRHH',
    2900, 29000, -- $29/mes o $290/año (16% descuento)
    50, 3, 512, 50,
    '["Gestión de empleados", "Control de asistencia", "Vacaciones básicas", "Soporte por email"]'::jsonb,
    ARRAY['dashboard', 'employees', 'attendance', 'vacations', 'absences', 'training', 'uniforms', 'declarations', 'calendar'],
    1
  ),
  (
    'professional',
    'Plan Profesional',
    'Para empresas en crecimiento que necesitan más control y automatización',
    5900, 59000, -- $59/mes o $590/año
    200, 10, 2048, 200,
    '["Todo del plan Básico", "Generación de documentos", "Nómina y adelantos", "Evaluaciones de desempeño", "Selección de personal", "Reportes avanzados", "Soporte prioritario"]'::jsonb,
    ARRAY['dashboard', 'employees', 'attendance', 'vacations', 'absences', 'sanctions', 'documents', 'payroll', 'training', 'uniforms', 'performance', 'selection', 'declarations', 'calendar', 'reports'],
    2
  ),
  (
    'enterprise',
    'Plan Enterprise',
    'Solución completa para grandes empresas con necesidades avanzadas',
    9900, 99000, -- $99/mes o $990/año
    -1, -1, 10240, -1, -- -1 = ilimitado
    '["Todo del plan Profesional", "Consultas especializadas", "API personalizada", "Integraciones custom", "SLA garantizado", "Soporte dedicado 24/7", "Capacitación incluida"]'::jsonb,
    ARRAY['dashboard', 'employees', 'attendance', 'vacations', 'absences', 'sanctions', 'documents', 'payroll', 'training', 'uniforms', 'performance', 'selection', 'declarations', 'consultations', 'calendar', 'reports'],
    3
  )
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  precio_mensual_cents = EXCLUDED.precio_mensual_cents,
  precio_anual_cents = EXCLUDED.precio_anual_cents,
  max_employees = EXCLUDED.max_employees,
  max_users = EXCLUDED.max_users,
  max_storage_mb = EXCLUDED.max_storage_mb,
  max_documents_month = EXCLUDED.max_documents_month,
  features = EXCLUDED.features,
  modules_included = EXCLUDED.modules_included,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- =====================================================
-- 2. TABLA DE SUSCRIPCIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.talenthub_clients(id) ON DELETE CASCADE,
  plan_id VARCHAR(50) NOT NULL REFERENCES public.subscription_plans(id),

  -- Estado de la suscripción
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'active',      -- Suscripción activa
    'trial',       -- Período de prueba
    'past_due',    -- Pago pendiente
    'canceled',    -- Cancelada por el usuario
    'suspended',   -- Suspendida por falta de pago
    'expired'      -- Expirada
  )),

  -- Ciclo de facturación
  billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),

  -- Fechas importantes
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  canceled_at TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,

  -- Integración con Stripe
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  stripe_payment_method_id VARCHAR(100),

  -- Descuentos y promociones
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  discount_end_date TIMESTAMP WITH TIME ZONE,
  promo_code VARCHAR(50),

  -- Límites personalizados (override del plan)
  custom_max_employees INTEGER,
  custom_max_users INTEGER,
  custom_max_storage_mb INTEGER,

  -- Módulos adicionales habilitados (además de los del plan)
  additional_modules TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.talenthub_admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tenant_id) -- Un tenant solo puede tener una suscripción activa
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- =====================================================
-- 3. HISTORIAL DE SUSCRIPCIONES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  tenant_id UUID NOT NULL REFERENCES public.talenthub_clients(id) ON DELETE CASCADE,

  -- Cambio realizado
  action VARCHAR(50) NOT NULL CHECK (action IN (
    'created',
    'upgraded',
    'downgraded',
    'renewed',
    'canceled',
    'suspended',
    'reactivated',
    'trial_started',
    'trial_ended',
    'payment_failed',
    'payment_success'
  )),

  -- Detalles del cambio
  previous_plan_id VARCHAR(50),
  new_plan_id VARCHAR(50),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  -- Información adicional
  details JSONB DEFAULT '{}',
  performed_by UUID, -- Admin o sistema

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_tenant ON public.subscription_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON public.subscription_history(subscription_id);

-- =====================================================
-- 4. FACTURAS / INVOICES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.talenthub_clients(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  -- Información de la factura
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending',
    'paid',
    'failed',
    'refunded',
    'void'
  )),

  -- Montos (en centavos)
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  discount_cents INTEGER DEFAULT 0,
  tax_cents INTEGER DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  moneda VARCHAR(3) DEFAULT 'USD',

  -- Período facturado
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,

  -- Fechas de pago
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Integración con Stripe
  stripe_invoice_id VARCHAR(100),
  stripe_payment_intent_id VARCHAR(100),
  stripe_receipt_url TEXT,

  -- PDF de la factura
  pdf_url TEXT,

  -- Detalles (items facturados)
  line_items JSONB DEFAULT '[]',

  -- Información del cliente al momento de facturar
  billing_info JSONB DEFAULT '{}',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON public.invoices(stripe_invoice_id);

-- Secuencia para número de factura
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;

-- =====================================================
-- 5. USO Y MÉTRICAS POR TENANT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.talenthub_clients(id) ON DELETE CASCADE,

  -- Período de medición
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Métricas de uso
  employees_count INTEGER DEFAULT 0,
  active_users_count INTEGER DEFAULT 0,
  documents_generated INTEGER DEFAULT 0,
  storage_used_mb NUMERIC(10,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,

  -- Alertas
  employees_limit_reached BOOLEAN DEFAULT false,
  storage_limit_reached BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tenant_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON public.tenant_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_period ON public.tenant_usage(period_start);

-- =====================================================
-- 6. CÓDIGOS PROMOCIONALES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,

  -- Tipo de descuento
  discount_type VARCHAR(20) DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value INTEGER NOT NULL, -- % o centavos según el tipo

  -- Restricciones
  applicable_plans TEXT[] DEFAULT ARRAY[]::TEXT[], -- Vacío = todos los planes
  max_uses INTEGER, -- NULL = ilimitado
  current_uses INTEGER DEFAULT 0,

  -- Período válido
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,

  -- Para nuevos clientes solamente
  new_customers_only BOOLEAN DEFAULT false,

  -- Duración del descuento
  duration_months INTEGER DEFAULT 1, -- Cuántos meses aplica el descuento

  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.talenthub_admins(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar algunos códigos de ejemplo
INSERT INTO public.promo_codes (code, discount_type, discount_value, duration_months, valid_until, new_customers_only)
VALUES
  ('WELCOME20', 'percent', 20, 3, NOW() + INTERVAL '1 year', true),
  ('ANNUAL50', 'percent', 50, 12, NOW() + INTERVAL '1 year', false)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 7. FUNCIONES ÚTILES
-- =====================================================

-- Función para obtener los límites efectivos de un tenant
CREATE OR REPLACE FUNCTION public.get_tenant_limits(p_tenant_id UUID)
RETURNS TABLE (
  max_employees INTEGER,
  max_users INTEGER,
  max_storage_mb INTEGER,
  max_documents_month INTEGER,
  modules_allowed TEXT[]
) AS $$
DECLARE
  v_subscription RECORD;
  v_plan RECORD;
BEGIN
  -- Obtener suscripción activa
  SELECT * INTO v_subscription
  FROM public.subscriptions
  WHERE tenant_id = p_tenant_id
  AND status IN ('active', 'trial')
  LIMIT 1;

  IF v_subscription IS NULL THEN
    -- Sin suscripción, límites mínimos
    RETURN QUERY SELECT 5, 1, 100, 10, ARRAY['dashboard', 'employees']::TEXT[];
    RETURN;
  END IF;

  -- Obtener plan
  SELECT * INTO v_plan
  FROM public.subscription_plans
  WHERE id = v_subscription.plan_id;

  -- Retornar límites (custom override > plan default)
  RETURN QUERY SELECT
    COALESCE(v_subscription.custom_max_employees, v_plan.max_employees),
    COALESCE(v_subscription.custom_max_users, v_plan.max_users),
    COALESCE(v_subscription.custom_max_storage_mb, v_plan.max_storage_mb),
    v_plan.max_documents_month,
    v_plan.modules_included || v_subscription.additional_modules;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si un tenant puede agregar más empleados
CREATE OR REPLACE FUNCTION public.can_add_employee(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
  v_current_count INTEGER;
BEGIN
  SELECT * INTO v_limits FROM public.get_tenant_limits(p_tenant_id);

  -- -1 significa ilimitado
  IF v_limits.max_employees = -1 THEN
    RETURN true;
  END IF;

  SELECT COUNT(*) INTO v_current_count
  FROM public.employees
  WHERE tenant_id = p_tenant_id;

  RETURN v_current_count < v_limits.max_employees;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para verificar si un módulo está habilitado para un tenant
CREATE OR REPLACE FUNCTION public.is_module_enabled(p_tenant_id UUID, p_module_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  v_limits RECORD;
BEGIN
  SELECT * INTO v_limits FROM public.get_tenant_limits(p_tenant_id);
  RETURN p_module_id = ANY(v_limits.modules_allowed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Función para crear una suscripción trial
CREATE OR REPLACE FUNCTION public.create_trial_subscription(
  p_tenant_id UUID,
  p_plan_id VARCHAR DEFAULT 'professional',
  p_trial_days INTEGER DEFAULT 14
)
RETURNS UUID AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    trial_start,
    trial_end,
    current_period_start,
    current_period_end
  ) VALUES (
    p_tenant_id,
    p_plan_id,
    'trial',
    'monthly',
    NOW(),
    NOW() + (p_trial_days || ' days')::INTERVAL,
    NOW(),
    NOW() + (p_trial_days || ' days')::INTERVAL
  )
  RETURNING id INTO v_subscription_id;

  -- Registrar en historial
  INSERT INTO public.subscription_history (
    subscription_id,
    tenant_id,
    action,
    new_plan_id,
    new_status,
    details
  ) VALUES (
    v_subscription_id,
    p_tenant_id,
    'trial_started',
    p_plan_id,
    'trial',
    jsonb_build_object('trial_days', p_trial_days)
  );

  -- Actualizar estado del cliente
  UPDATE public.talenthub_clients
  SET status = 'trial',
      plan = p_plan_id,
      trial_ends_at = NOW() + (p_trial_days || ' days')::INTERVAL
  WHERE id = p_tenant_id;

  RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar número de factura
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS VARCHAR AS $$
BEGIN
  RETURN 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger para registrar cambios en suscripciones
CREATE OR REPLACE FUNCTION public.log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO public.subscription_history (
      subscription_id,
      tenant_id,
      action,
      previous_plan_id,
      new_plan_id,
      previous_status,
      new_status
    ) VALUES (
      NEW.id,
      NEW.tenant_id,
      CASE
        WHEN NEW.status = 'active' AND OLD.status = 'trial' THEN 'trial_ended'
        WHEN NEW.status = 'active' AND OLD.status = 'suspended' THEN 'reactivated'
        WHEN NEW.status = 'canceled' THEN 'canceled'
        WHEN NEW.status = 'suspended' THEN 'suspended'
        ELSE 'updated'
      END,
      OLD.plan_id,
      NEW.plan_id,
      OLD.status,
      NEW.status
    );
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.plan_id != NEW.plan_id THEN
    INSERT INTO public.subscription_history (
      subscription_id,
      tenant_id,
      action,
      previous_plan_id,
      new_plan_id,
      previous_status,
      new_status
    ) VALUES (
      NEW.id,
      NEW.tenant_id,
      CASE
        WHEN NEW.plan_id > OLD.plan_id THEN 'upgraded'
        ELSE 'downgraded'
      END,
      OLD.plan_id,
      NEW.plan_id,
      OLD.status,
      NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS subscription_change_trigger ON public.subscriptions;
CREATE TRIGGER subscription_change_trigger
AFTER UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.log_subscription_change();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_subscription_plans ON public.subscription_plans;
CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_invoices ON public.invoices;
CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. RLS POLICIES
-- =====================================================

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Plans son públicos para lectura
CREATE POLICY "Plans are public" ON public.subscription_plans
FOR SELECT USING (is_active = true AND is_public = true);

-- Suscripciones solo visibles por el tenant o admins
CREATE POLICY "Subscriptions visible to tenant" ON public.subscriptions
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id() OR
  public.user_has_tenant_access(tenant_id)
);

-- Solo backoffice puede modificar suscripciones
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
FOR ALL USING (true); -- El backoffice tiene acceso completo

-- Historial visible por tenant
CREATE POLICY "History visible to tenant" ON public.subscription_history
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id() OR
  public.user_has_tenant_access(tenant_id)
);

-- Facturas visibles por tenant
CREATE POLICY "Invoices visible to tenant" ON public.invoices
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id() OR
  public.user_has_tenant_access(tenant_id)
);

-- Usage visible por tenant
CREATE POLICY "Usage visible to tenant" ON public.tenant_usage
FOR SELECT USING (
  tenant_id = public.get_current_tenant_id() OR
  public.user_has_tenant_access(tenant_id)
);

-- Promo codes públicos para validación
CREATE POLICY "Promo codes are public" ON public.promo_codes
FOR SELECT USING (is_active = true AND (valid_until IS NULL OR valid_until > NOW()));

-- =====================================================
-- 10. VISTA DE ESTADO DE SUSCRIPCIÓN
-- =====================================================

CREATE OR REPLACE VIEW public.subscription_status AS
SELECT
  s.id as subscription_id,
  s.tenant_id,
  tc.nombre as tenant_nombre,
  s.plan_id,
  sp.nombre as plan_nombre,
  s.status,
  s.billing_cycle,
  s.trial_end,
  s.current_period_end,
  s.cancel_at_period_end,

  -- Precios
  CASE WHEN s.billing_cycle = 'monthly'
    THEN sp.precio_mensual_cents
    ELSE sp.precio_anual_cents
  END as precio_cents,

  -- Descuento activo
  CASE WHEN s.discount_percent > 0 AND (s.discount_end_date IS NULL OR s.discount_end_date > NOW())
    THEN s.discount_percent
    ELSE 0
  END as discount_active,

  -- Límites efectivos
  COALESCE(s.custom_max_employees, sp.max_employees) as max_employees,
  COALESCE(s.custom_max_users, sp.max_users) as max_users,
  COALESCE(s.custom_max_storage_mb, sp.max_storage_mb) as max_storage_mb,

  -- Días restantes
  CASE
    WHEN s.status = 'trial' THEN EXTRACT(DAY FROM s.trial_end - NOW())::INTEGER
    ELSE EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER
  END as days_remaining,

  s.created_at,
  s.updated_at
FROM public.subscriptions s
JOIN public.talenthub_clients tc ON tc.id = s.tenant_id
JOIN public.subscription_plans sp ON sp.id = s.plan_id;

-- =====================================================
-- 11. COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.subscription_plans IS 'Catálogo de planes de suscripción disponibles';
COMMENT ON TABLE public.subscriptions IS 'Suscripciones activas de cada tenant';
COMMENT ON TABLE public.subscription_history IS 'Historial de cambios en suscripciones';
COMMENT ON TABLE public.invoices IS 'Facturas generadas por suscripciones';
COMMENT ON TABLE public.tenant_usage IS 'Métricas de uso por período para cada tenant';
COMMENT ON TABLE public.promo_codes IS 'Códigos promocionales para descuentos';

COMMENT ON FUNCTION public.get_tenant_limits(UUID) IS 'Obtiene los límites efectivos de un tenant según su plan';
COMMENT ON FUNCTION public.can_add_employee(UUID) IS 'Verifica si un tenant puede agregar más empleados según su plan';
COMMENT ON FUNCTION public.is_module_enabled(UUID, VARCHAR) IS 'Verifica si un módulo está habilitado para un tenant';
COMMENT ON FUNCTION public.create_trial_subscription(UUID, VARCHAR, INTEGER) IS 'Crea una suscripción de prueba para un nuevo tenant';
