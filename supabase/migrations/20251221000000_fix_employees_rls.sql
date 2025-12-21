-- ============================================
-- FIX: Solución para error "permission denied for table employees"
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Verificar estado actual de RLS y políticas
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'employees';

-- Ver políticas existentes
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'employees';

-- ============================================
-- 2. OPCIÓN A: Recrear políticas RLS (RECOMENDADO)
-- ============================================

-- Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Anyone can view employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can update employees" ON public.employees;
DROP POLICY IF EXISTS "Anyone can delete employees" ON public.employees;

-- Asegurar que RLS está habilitado
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Crear políticas permisivas
CREATE POLICY "Anyone can view employees" 
  ON public.employees 
  FOR SELECT 
  USING (true);

CREATE POLICY "Anyone can insert employees" 
  ON public.employees 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Anyone can update employees" 
  ON public.employees 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Anyone can delete employees" 
  ON public.employees 
  FOR DELETE 
  USING (true);

-- ============================================
-- 3. Hacer lo mismo para todas las tablas relacionadas
-- ============================================

-- vacation_balances
DROP POLICY IF EXISTS "Anyone can view vacation balances" ON public.vacation_balances;
DROP POLICY IF EXISTS "Anyone can insert vacation balances" ON public.vacation_balances;
DROP POLICY IF EXISTS "Anyone can update vacation balances" ON public.vacation_balances;
DROP POLICY IF EXISTS "Anyone can delete vacation balances" ON public.vacation_balances;

ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vacation balances" ON public.vacation_balances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vacation balances" ON public.vacation_balances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vacation balances" ON public.vacation_balances FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vacation balances" ON public.vacation_balances FOR DELETE USING (true);

-- vacation_requests
DROP POLICY IF EXISTS "Anyone can view vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Anyone can insert vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Anyone can update vacation requests" ON public.vacation_requests;
DROP POLICY IF EXISTS "Anyone can delete vacation requests" ON public.vacation_requests;

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vacation requests" ON public.vacation_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert vacation requests" ON public.vacation_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update vacation requests" ON public.vacation_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete vacation requests" ON public.vacation_requests FOR DELETE USING (true);

-- absences
DROP POLICY IF EXISTS "Anyone can view absences" ON public.absences;
DROP POLICY IF EXISTS "Anyone can insert absences" ON public.absences;
DROP POLICY IF EXISTS "Anyone can update absences" ON public.absences;
DROP POLICY IF EXISTS "Anyone can delete absences" ON public.absences;

ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view absences" ON public.absences FOR SELECT USING (true);
CREATE POLICY "Anyone can insert absences" ON public.absences FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update absences" ON public.absences FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete absences" ON public.absences FOR DELETE USING (true);

-- attendance
DROP POLICY IF EXISTS "Anyone can view attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anyone can insert attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anyone can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Anyone can delete attendance" ON public.attendance;

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete attendance" ON public.attendance FOR DELETE USING (true);

-- documents
DROP POLICY IF EXISTS "Anyone can view documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can insert documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can update documents" ON public.documents;
DROP POLICY IF EXISTS "Anyone can delete documents" ON public.documents;

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Anyone can insert documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete documents" ON public.documents FOR DELETE USING (true);

-- sanctions
DROP POLICY IF EXISTS "Anyone can view sanctions" ON public.sanctions;
DROP POLICY IF EXISTS "Anyone can insert sanctions" ON public.sanctions;
DROP POLICY IF EXISTS "Anyone can update sanctions" ON public.sanctions;
DROP POLICY IF EXISTS "Anyone can delete sanctions" ON public.sanctions;

ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sanctions" ON public.sanctions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert sanctions" ON public.sanctions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sanctions" ON public.sanctions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete sanctions" ON public.sanctions FOR DELETE USING (true);

-- trainings
DROP POLICY IF EXISTS "Anyone can view trainings" ON public.trainings;
DROP POLICY IF EXISTS "Anyone can insert trainings" ON public.trainings;
DROP POLICY IF EXISTS "Anyone can update trainings" ON public.trainings;
DROP POLICY IF EXISTS "Anyone can delete trainings" ON public.trainings;

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view trainings" ON public.trainings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert trainings" ON public.trainings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update trainings" ON public.trainings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete trainings" ON public.trainings FOR DELETE USING (true);

-- uniforms
DROP POLICY IF EXISTS "Anyone can view uniforms" ON public.uniforms;
DROP POLICY IF EXISTS "Anyone can insert uniforms" ON public.uniforms;
DROP POLICY IF EXISTS "Anyone can update uniforms" ON public.uniforms;
DROP POLICY IF EXISTS "Anyone can delete uniforms" ON public.uniforms;

ALTER TABLE public.uniforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view uniforms" ON public.uniforms FOR SELECT USING (true);
CREATE POLICY "Anyone can insert uniforms" ON public.uniforms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update uniforms" ON public.uniforms FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete uniforms" ON public.uniforms FOR DELETE USING (true);

-- performance_evaluations
DROP POLICY IF EXISTS "Anyone can view performance_evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Anyone can insert performance_evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Anyone can update performance_evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Anyone can delete performance_evaluations" ON public.performance_evaluations;

ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view performance_evaluations" ON public.performance_evaluations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert performance_evaluations" ON public.performance_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update performance_evaluations" ON public.performance_evaluations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete performance_evaluations" ON public.performance_evaluations FOR DELETE USING (true);

-- payroll
DROP POLICY IF EXISTS "Anyone can view payroll" ON public.payroll;
DROP POLICY IF EXISTS "Anyone can insert payroll" ON public.payroll;
DROP POLICY IF EXISTS "Anyone can update payroll" ON public.payroll;
DROP POLICY IF EXISTS "Anyone can delete payroll" ON public.payroll;

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payroll" ON public.payroll FOR SELECT USING (true);
CREATE POLICY "Anyone can insert payroll" ON public.payroll FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update payroll" ON public.payroll FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete payroll" ON public.payroll FOR DELETE USING (true);

-- client_config
DROP POLICY IF EXISTS "Anyone can view client_config" ON public.client_config;
DROP POLICY IF EXISTS "Anyone can update client_config" ON public.client_config;

ALTER TABLE public.client_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view client_config" ON public.client_config FOR SELECT USING (true);
CREATE POLICY "Anyone can update client_config" ON public.client_config FOR UPDATE USING (true);

-- user_profiles (políticas específicas para usuarios autenticados)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.user_profiles;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Permitir a usuarios actualizar su perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Permitir inserción para el trigger de auth
CREATE POLICY "Allow insert for auth trigger" ON public.user_profiles
  FOR INSERT WITH CHECK (true);

-- ============================================
-- 4. Verificar que todo está correcto
-- ============================================

SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- ============================================
-- ¡LISTO! Refresca la página de la aplicación
-- ============================================

