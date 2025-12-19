-- Agregar campo status a la tabla payroll (primero sin NOT NULL para permitir valores existentes)
-- Valores: 'pending' (pendiente) o 'paid' (pagado)
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid';

-- Actualizar todos los registros existentes a 'paid' (ya que todos se muestran como pagados)
UPDATE public.payroll
SET status = 'paid'
WHERE status IS NULL;

-- Agregar el constraint CHECK después de actualizar los valores
ALTER TABLE public.payroll
DROP CONSTRAINT IF EXISTS payroll_status_check;

ALTER TABLE public.payroll
ADD CONSTRAINT payroll_status_check CHECK (status IN ('pending', 'paid'));

-- Ahora hacer el campo NOT NULL después de actualizar los valores
ALTER TABLE public.payroll
ALTER COLUMN status SET NOT NULL;

-- Agregar campos para rastrear anulaciones
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS reversal_of_id UUID REFERENCES public.payroll(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Crear índice para mejorar las consultas por status
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);

-- Crear índice para las anulaciones
CREATE INDEX IF NOT EXISTS idx_payroll_reversal_of_id ON public.payroll(reversal_of_id);

-- Modificar la política de eliminación para prevenir la eliminación de registros pagados
-- Primero eliminamos la política existente
DROP POLICY IF EXISTS "Anyone can delete payroll" ON public.payroll;

-- Creamos una nueva política que solo permite eliminar registros con status 'pending'
CREATE POLICY "Only delete pending payroll"
  ON public.payroll
  FOR DELETE
  USING (status = 'pending');

