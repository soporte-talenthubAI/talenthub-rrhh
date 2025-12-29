/**
 * Utilidades para el manejo correcto de fechas sin problemas de zona horaria
 */

/**
 * Formatea una fecha string (YYYY-MM-DD) como fecha local sin conversión de timezone
 * Evita el problema de mostrar un día anterior debido a conversiones UTC
 */
export const formatDateLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  
  try {
    // Dividir la fecha en partes para evitar problemas de timezone
    const parts = dateString.split('T')[0].split('-'); // Tomar solo la parte de fecha, ignorar tiempo
    if (parts.length !== 3) return '';
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Los meses en JS van de 0-11
    const day = parseInt(parts[2]);
    
    // Crear fecha local sin zona horaria
    const date = new Date(year, month, day);
    
    // Formatear en español argentino
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Error formateando fecha:', dateString, error);
    return '';
  }
};

/**
 * Convierte una fecha string a un objeto Date local (sin timezone)
 * Útil para cálculos de fechas
 */
export const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const parts = dateString.split('T')[0].split('-');
    if (parts.length !== 3) return null;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    
    return new Date(year, month, day);
  } catch (error) {
    console.error('Error parseando fecha:', dateString, error);
    return null;
  }
};

/**
 * Calcula años de servicio/antigüedad desde una fecha de ingreso
 */
export const calculateYearsOfService = (fechaIngreso: string | null | undefined): number => {
  const ingresoDate = parseLocalDate(fechaIngreso);
  if (!ingresoDate) return 0;
  
  const today = new Date();
  const years = today.getFullYear() - ingresoDate.getFullYear();
  
  // Ajustar si aún no ha pasado el cumpleaños de ingreso este año
  const hasPassedAnniversary = today.getMonth() > ingresoDate.getMonth() || 
    (today.getMonth() === ingresoDate.getMonth() && today.getDate() >= ingresoDate.getDate());
  
  return hasPassedAnniversary ? years : years - 1;
};

/**
 * Calcula antigüedad detallada (años, meses, días)
 */
export const calculateDetailedAntiquity = (fechaIngreso: string | null | undefined): { years: number; months: number; days: number } => {
  const ingresoDate = parseLocalDate(fechaIngreso);
  if (!ingresoDate) return { years: 0, months: 0, days: 0 };
  
  const today = new Date();
  
  let years = today.getFullYear() - ingresoDate.getFullYear();
  let months = today.getMonth() - ingresoDate.getMonth();
  let days = today.getDate() - ingresoDate.getDate();
  
  // Ajustar días negativos
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  // Ajustar meses negativos
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD para inputs type="date"
 */
export const getCurrentDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Redondeo personalizado para días de vacaciones:
 * - Si la parte decimal es <= 0.5: redondear hacia abajo
 * - Si la parte decimal es > 0.5: redondear hacia arriba
 * Ejemplo: 4.5 → 4, 4.6 → 5, 4.4 → 4
 */
export const roundVacationDays = (days: number): number => {
  const decimal = days - Math.floor(days);
  // Si es exactamente 0.5 o menos, redondear hacia abajo
  if (decimal <= 0.5) {
    return Math.floor(days);
  }
  // Si es mayor a 0.5, redondear hacia arriba
  return Math.ceil(days);
};
