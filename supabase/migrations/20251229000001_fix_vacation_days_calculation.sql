-- Fix: Corregir cálculo de días de vacaciones según LCT Art. 150
-- Problema: Se usaba <= en vez de < para los límites de antigüedad
-- Esto causaba que empleados con exactamente 5 años recibieran 14 días en vez de 21

DROP FUNCTION IF EXISTS public.calculate_vacation_days(date);

CREATE OR REPLACE FUNCTION public.calculate_vacation_days(fecha_ingreso date)
RETURNS NUMERIC(5,2)
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  fecha_corte DATE := DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' - INTERVAL '1 day'; -- 31 de diciembre del año actual
  dias_trabajados INTEGER;
  antiguedad_anios INTEGER;
  meses_trabajados NUMERIC;
BEGIN
  -- Calcular antigüedad en años completos al 31 de diciembre
  antiguedad_anios := EXTRACT(YEAR FROM AGE(fecha_corte, fecha_ingreso));
  
  -- Si ingresó este año, verificar casos especiales
  IF EXTRACT(YEAR FROM fecha_ingreso) = EXTRACT(YEAR FROM CURRENT_DATE) THEN
    -- Calcular días trabajados desde ingreso hasta 31 de diciembre (días calendario)
    dias_trabajados := fecha_corte - fecha_ingreso + 1;
    
    -- Calcular meses trabajados
    meses_trabajados := EXTRACT(EPOCH FROM AGE(fecha_corte, fecha_ingreso)) / (30.44 * 24 * 60 * 60);
    
    -- Si trabajó menos de 6 meses: 1 día de vacaciones por cada 20 días de trabajo efectivo
    IF meses_trabajados < 6 THEN
      RETURN ROUND(dias_trabajados / 20.0, 2);
    ELSE
      -- Si trabajó 6 meses o más en el año, le corresponden 14 días
      RETURN 14;
    END IF;
  END IF;
  
  -- Para empleados con antigüedad de años completos (según Ley de Contrato de Trabajo N° 20.744 Art. 150)
  -- FIX: Usar < en vez de <= para que al cumplir el umbral se pase al siguiente tramo
  -- Ejemplo: Con 5 años cumplidos (antiguedad_anios = 5), corresponden 21 días, no 14
  CASE 
    WHEN antiguedad_anios < 0 THEN RETURN 0;   -- Fecha futura (error)
    WHEN antiguedad_anios < 5 THEN RETURN 14;  -- Menos de 5 años cumplidos: 14 días corridos
    WHEN antiguedad_anios < 10 THEN RETURN 21; -- 5 años cumplidos hasta menos de 10: 21 días corridos  
    WHEN antiguedad_anios < 20 THEN RETURN 28; -- 10 años cumplidos hasta menos de 20: 28 días corridos
    ELSE RETURN 35;                            -- 20 años cumplidos o más: 35 días corridos
  END CASE;
END;
$function$;

-- Agregar comentario a la función
COMMENT ON FUNCTION public.calculate_vacation_days(date) IS 
'Calcula los días de vacaciones según la Ley de Contrato de Trabajo N° 20.744 Art. 150.
Escala:
- Menos de 5 años: 14 días corridos
- 5 a menos de 10 años: 21 días corridos
- 10 a menos de 20 años: 28 días corridos
- 20 años o más: 35 días corridos
La antigüedad se calcula al 31/12 del año en curso.';

