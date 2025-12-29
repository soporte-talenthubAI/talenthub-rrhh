/**
 * Utilidades centralizadas para el cálculo de vacaciones
 * Según Ley de Contrato de Trabajo N° 20.744 Art. 150
 * 
 * ÚNICA FUENTE DE VERDAD para el cálculo de días de vacaciones
 */

import { roundVacationDays } from './dateUtils';

/**
 * Calcula los días de vacaciones según antigüedad
 * Ley de Contrato de Trabajo N° 20.744 Art. 150:
 * - Menos de 5 años: 14 días corridos
 * - 5 años cumplidos hasta menos de 10: 21 días corridos
 * - 10 años cumplidos hasta menos de 20: 28 días corridos
 * - 20 años o más: 35 días corridos
 * 
 * Para empleados que ingresaron en el año actual:
 * - Menos de 6 meses: 1 día por cada 20 días trabajados
 * - 6 meses o más: 14 días
 * 
 * @param fechaIngreso - Fecha de ingreso del empleado (string ISO o Date)
 * @param options - Opciones adicionales
 * @returns Días de vacaciones (redondeados según regla: <=0.5 abajo, >0.5 arriba)
 */
export const calculateVacationDays = (
  fechaIngreso: string | Date | null | undefined,
  options: {
    /** Año para el cual calcular (default: año actual) */
    year?: number;
    /** Si es true, retorna el valor sin redondear */
    raw?: boolean;
  } = {}
): number => {
  if (!fechaIngreso) return 0;

  const { year = new Date().getFullYear(), raw = false } = options;

  // Parsear fecha de ingreso
  let ingreso: Date;
  if (typeof fechaIngreso === 'string') {
    // Manejar formato ISO evitando problemas de timezone
    const parts = fechaIngreso.split('T')[0].split('-');
    if (parts.length !== 3) return 0;
    ingreso = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    ingreso = fechaIngreso;
  }

  // Fecha de corte: 31 de diciembre del año indicado
  const fechaCorte = new Date(year, 11, 31);

  // Si la fecha de ingreso es futura, no corresponden días
  if (ingreso > fechaCorte) return 0;

  // Caso especial: ingresó este año
  if (ingreso.getFullYear() === year) {
    // Calcular días trabajados desde ingreso hasta 31 de diciembre
    const diasTrabajados = Math.floor(
      (fechaCorte.getTime() - ingreso.getTime()) / (24 * 60 * 60 * 1000)
    ) + 1;

    // Calcular meses trabajados
    const mesesTrabajados = diasTrabajados / 30.44; // Promedio de días por mes

    let dias: number;
    if (mesesTrabajados < 6) {
      // Menos de 6 meses: 1 día por cada 20 días trabajados
      dias = diasTrabajados / 20;
    } else {
      // 6 meses o más: 14 días
      dias = 14;
    }

    return raw ? dias : roundVacationDays(dias);
  }

  // Calcular antigüedad en años completos al 31/12 del año indicado
  const antiguedadAnios = Math.floor(
    (fechaCorte.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );

  // Aplicar escala según LCT Art. 150
  let dias: number;
  if (antiguedadAnios < 0) {
    dias = 0;
  } else if (antiguedadAnios < 5) {
    // Menos de 5 años cumplidos: 14 días
    dias = 14;
  } else if (antiguedadAnios < 10) {
    // 5 años cumplidos hasta menos de 10: 21 días
    dias = 21;
  } else if (antiguedadAnios < 20) {
    // 10 años cumplidos hasta menos de 20: 28 días
    dias = 28;
  } else {
    // 20 años o más: 35 días
    dias = 35;
  }

  return raw ? dias : roundVacationDays(dias);
};

/**
 * Calcula la antigüedad en años completos
 */
export const calculateSeniorityYears = (
  fechaIngreso: string | Date | null | undefined,
  referenceDate?: Date
): number => {
  if (!fechaIngreso) return 0;

  let ingreso: Date;
  if (typeof fechaIngreso === 'string') {
    const parts = fechaIngreso.split('T')[0].split('-');
    if (parts.length !== 3) return 0;
    ingreso = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  } else {
    ingreso = fechaIngreso;
  }

  const reference = referenceDate || new Date();
  
  return Math.floor(
    (reference.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
};

/**
 * Obtiene el tramo de vacaciones según antigüedad
 */
export const getVacationTier = (
  fechaIngreso: string | Date | null | undefined
): { tier: string; days: number; nextTierYears?: number } => {
  const years = calculateSeniorityYears(fechaIngreso, new Date(new Date().getFullYear(), 11, 31));
  
  if (years < 5) {
    return { tier: 'Hasta 5 años', days: 14, nextTierYears: 5 - years };
  } else if (years < 10) {
    return { tier: '5 a 10 años', days: 21, nextTierYears: 10 - years };
  } else if (years < 20) {
    return { tier: '10 a 20 años', days: 28, nextTierYears: 20 - years };
  } else {
    return { tier: 'Más de 20 años', days: 35 };
  }
};

/**
 * Interfaz para balance de vacaciones
 */
export interface VacationBalance {
  totalDays: number;
  usedDays: number;
  availableDays: number;
  owedDays: number;
}

/**
 * Calcula el balance completo de vacaciones de un empleado
 */
export const calculateVacationBalance = (
  fechaIngreso: string | Date | null | undefined,
  usedDays: number = 0,
  owedDays: number = 0,
  year?: number
): VacationBalance => {
  const totalDays = calculateVacationDays(fechaIngreso, { year });
  const availableDays = Math.max(0, totalDays + owedDays - usedDays);

  return {
    totalDays,
    usedDays,
    availableDays,
    owedDays,
  };
};

