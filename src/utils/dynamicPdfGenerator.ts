/**
 * Generador de PDF Dinámico
 * 
 * Flujo:
 * 1. Intenta cargar template desde Supabase (document_templates)
 * 2. Si existe, usa el HTML del template con placeholders reemplazados
 * 3. Si no existe, usa los componentes React como fallback
 * 
 * Beneficios:
 * - Templates personalizables por cliente
 * - No requiere deploy para cambiar templates
 * - Fallback a código existente para compatibilidad
 */

import html2pdf from "html2pdf.js";
import { jsPDF } from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import { clientConfig } from "@/config/client";
import { formatDateLocal, getCurrentDateString } from "@/utils/dateUtils";
import { 
  getTemplateByType, 
  replacePlaceholders, 
  checkTemplatesTableExists,
  EmployeeData as TemplateEmployeeData 
} from "@/services/templateService";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Tipos
export interface DynamicPDFParams {
  templateType: string;
  employeeData: {
    id?: string;
    nombres: string;
    apellidos: string;
    dni: string;
    cuil?: string;
    direccion?: string;
    puesto?: string;
    departamento?: string;
    fecha_ingreso?: string;
  };
  documentId: string;
  customData?: Record<string, any>;
  // Datos específicos según tipo de documento
  sanction?: {
    motivo: string;
    fecha_hecho?: string;
    lugar_hecho?: string;
    dias_suspension?: number;
    fecha_inicio?: string;
    fecha_reincorporacion?: string;
  };
  vacation?: {
    fecha_inicio: string;
    fecha_fin: string;
    dias: number;
  };
  training?: {
    titulo: string;
    fecha: string;
    duracion?: string;
    instructor?: string;
  };
}

export interface PDFResult {
  success: boolean;
  blob?: Blob;
  pdfUrl?: string;
  error?: string;
  usedDynamicTemplate: boolean;
}

// Mapeo de tipos de documento a tipos de template en BD
const TEMPLATE_TYPE_MAP: Record<string, string> = {
  'consentimiento_datos_biometricos': 'consentimiento_biometrico',
  'reglamento_interno': 'reglamento_interno',
  'apercibimiento': 'apercibimiento',
  'suspension': 'suspension',
  'despido_periodo_prueba': 'despido_periodo_prueba',
  'certificado_vacaciones': 'certificado_vacaciones',
  'constancia_trabajo': 'constancia_trabajo',
  'recibo_uniforme': 'recibo_uniforme',
  'certificado_capacitacion': 'certificado_capacitacion',
};

/**
 * Genera un PDF usando templates dinámicos de Supabase
 * Con fallback a jsPDF si no hay template
 */
export async function generateDynamicPDF(params: DynamicPDFParams): Promise<PDFResult> {
  const { templateType, employeeData, documentId, customData } = params;
  const isPreview = documentId.startsWith('preview_');
  
  console.log('📄 [DYNAMIC PDF] Iniciando generación:', templateType, isPreview ? '(PREVIEW)' : '(GUARDAR)');

  try {
    // 1. Verificar si existen las tablas de templates
    const tablesExist = await checkTemplatesTableExists();
    
    if (tablesExist) {
      // 2. Intentar obtener template dinámico
      const mappedType = TEMPLATE_TYPE_MAP[templateType] || templateType;
      const template = await getTemplateByType(mappedType);
      
      if (template && template.contenido_html) {
        console.log('✅ [DYNAMIC PDF] Template dinámico encontrado:', template.nombre);
        return await generateFromDynamicTemplate(template.contenido_html, params, isPreview);
      } else {
        console.log('ℹ️ [DYNAMIC PDF] No hay template dinámico, usando fallback');
      }
    } else {
      console.log('ℹ️ [DYNAMIC PDF] Tablas de templates no existen, usando fallback');
    }
    
    // 3. Fallback: usar jsPDF directamente
    return await generateWithJsPDFFallback(params, isPreview);
    
  } catch (error) {
    console.error('❌ [DYNAMIC PDF] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      usedDynamicTemplate: false
    };
  }
}

/**
 * Genera PDF desde template HTML dinámico
 */
async function generateFromDynamicTemplate(
  htmlTemplate: string, 
  params: DynamicPDFParams,
  isPreview: boolean
): Promise<PDFResult> {
  const { employeeData, documentId, templateType, sanction, vacation, training, customData } = params;
  
  // Preparar datos para reemplazo de placeholders
  const templateData: TemplateEmployeeData = {
    nombres: employeeData.nombres,
    apellidos: employeeData.apellidos,
    dni: employeeData.dni,
    cuil: employeeData.cuil,
    direccion: employeeData.direccion,
    puesto: employeeData.puesto,
    departamento: employeeData.departamento,
    fecha_ingreso: employeeData.fecha_ingreso,
  };
  
  // Agregar datos específicos
  if (sanction) templateData.sanction = sanction;
  if (vacation) templateData.vacation = vacation;
  if (training) templateData.training = training;
  
  // Reemplazar placeholders
  const processedHtml = replacePlaceholders(htmlTemplate, templateData, customData);
  
  // Crear div temporal para renderizar HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = processedHtml;
  tempDiv.style.position = 'absolute';
  tempDiv.style.top = '0';
  tempDiv.style.left = '0';
  tempDiv.style.width = '210mm';
  tempDiv.style.backgroundColor = 'white';
  tempDiv.style.zIndex = '-1000';
  document.body.appendChild(tempDiv);
  
  try {
    // Esperar renderizado
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Configuración html2pdf
    const options = {
      margin: [10, 10, 10, 10],
      filename: `${templateType}_${employeeData.dni}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },
      pagebreak: { mode: ['css', 'legacy'] },
    };
    
    // Generar PDF
    const worker = (html2pdf as any)().from(tempDiv).set(options).toPdf();
    const pdf = await worker.get('pdf');
    const blob = pdf.output('blob') as Blob;
    
    console.log('📦 [DYNAMIC PDF] PDF generado desde template, tamaño:', blob.size, 'bytes');
    
    // Limpiar
    document.body.removeChild(tempDiv);
    
    // Verificar tamaño mínimo
    if (blob.size < 5000) {
      console.warn('⚠️ [DYNAMIC PDF] PDF muy pequeño, posible error de renderizado');
      return await generateWithJsPDFFallback(params, isPreview);
    }
    
    // Subir si no es preview
    if (!isPreview) {
      const result = await uploadToStorage(blob, documentId, templateType, employeeData.dni);
      return {
        success: true,
        blob,
        pdfUrl: result.url,
        usedDynamicTemplate: true
      };
    }
    
    return {
      success: true,
      blob,
      usedDynamicTemplate: true
    };
    
  } catch (error) {
    // Limpiar en caso de error
    if (document.body.contains(tempDiv)) {
      document.body.removeChild(tempDiv);
    }
    throw error;
  }
}

/**
 * Fallback: Genera PDF con jsPDF directamente
 */
async function generateWithJsPDFFallback(
  params: DynamicPDFParams,
  isPreview: boolean
): Promise<PDFResult> {
  const { templateType, employeeData, documentId, sanction, vacation, training } = params;
  
  console.log('🔄 [DYNAMIC PDF] Usando jsPDF fallback para:', templateType);
  
  const doc = new jsPDF();
  const nombreCompleto = `${employeeData.nombres} ${employeeData.apellidos}`.trim();
  const fechaActual = formatDateLocal(getCurrentDateString());
  const fechaTexto = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  // Configurar documento según tipo
  switch (templateType) {
    case 'consentimiento_datos_biometricos':
      generateConsentimientoBiometrico(doc, nombreCompleto, employeeData, fechaActual, fechaTexto);
      break;
      
    case 'reglamento_interno':
      generateReglamentoInterno(doc, nombreCompleto, employeeData, fechaActual);
      break;
      
    case 'apercibimiento':
      generateApercibimiento(doc, nombreCompleto, employeeData, fechaTexto, sanction);
      break;
      
    case 'suspension':
      generateSuspension(doc, nombreCompleto, employeeData, fechaTexto, sanction);
      break;
      
    case 'despido_periodo_prueba':
      generateDespidoPeriodoPrueba(doc, nombreCompleto, employeeData, fechaTexto);
      break;
      
    case 'certificado_vacaciones':
      generateCertificadoVacaciones(doc, nombreCompleto, employeeData, fechaActual, vacation);
      break;
      
    case 'certificado_capacitacion':
      generateCertificadoCapacitacion(doc, nombreCompleto, employeeData, fechaActual, training);
      break;
      
    default:
      generateDocumentoGenerico(doc, templateType, nombreCompleto, employeeData, fechaActual);
  }
  
  const blob = doc.output('blob');
  console.log('📦 [DYNAMIC PDF] PDF fallback generado, tamaño:', blob.size, 'bytes');
  
  // Subir si no es preview
  if (!isPreview) {
    const result = await uploadToStorage(blob, documentId, templateType, employeeData.dni);
    return {
      success: true,
      blob,
      pdfUrl: result.url,
      usedDynamicTemplate: false
    };
  }
  
  return {
    success: true,
    blob,
    usedDynamicTemplate: false
  };
}

/**
 * Sube PDF a Supabase Storage
 */
async function uploadToStorage(
  blob: Blob, 
  documentId: string, 
  templateType: string, 
  dni: string
): Promise<{ url: string }> {
  const fileName = `${documentId}_${templateType}_${dni}_${Date.now()}.pdf`;
  
  console.log('☁️ [DYNAMIC PDF] Subiendo a Supabase:', fileName);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, blob, {
      contentType: 'application/pdf',
      cacheControl: '3600',
      upsert: false
    });
    
  if (error) {
    throw new Error(`Error subiendo archivo: ${error.message}`);
  }
  
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(fileName);
    
  console.log('✅ [DYNAMIC PDF] Archivo subido exitosamente');
  
  return { url: urlData.publicUrl };
}

// ============================================
// GENERADORES ESPECÍFICOS POR TIPO (FALLBACK)
// ============================================

function generateConsentimientoBiometrico(
  doc: jsPDF, 
  nombre: string, 
  emp: DynamicPDFParams['employeeData'],
  fecha: string,
  fechaTexto: string
) {
  doc.setFontSize(10);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('CONSTANCIA DE CONSENTIMIENTO PARA USO DE', 105, 35, { align: 'center' });
  doc.text('CÁMARAS DE VIGILANCIA Y DATOS BIOMÉTRICOS', 105, 42, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`Fecha: ${fecha}`, 20, 60);
  
  const texto1 = `En la ciudad de Córdoba Capital, comparece el/la trabajador/a ${nombre}, DNI Nº ${emp.dni}, con domicilio en ${emp.direccion || '________________________'}, quien manifiesta prestar su consentimiento expreso en los términos de la Ley de Protección de Datos Personales N° 25.326 y normativa laboral aplicable.`;
  
  const lines1 = doc.splitTextToSize(texto1, 170);
  doc.text(lines1, 20, 75);
  
  doc.setFontSize(12);
  doc.text('1. CÁMARAS DE VIGILANCIA', 20, 110);
  
  doc.setFontSize(10);
  const texto2 = `El/la trabajador/a declara haber sido informado/a de la existencia de cámaras de seguridad instaladas en las instalaciones de la empresa ${clientConfig.nombre}, cuya finalidad exclusiva es la prevención de riesgos, seguridad de las personas, resguardo de bienes materiales y control del cumplimiento de normas laborales.`;
  const lines2 = doc.splitTextToSize(texto2, 170);
  doc.text(lines2, 20, 120);
  
  doc.setFontSize(12);
  doc.text('2. DATOS BIOMÉTRICOS', 20, 150);
  
  doc.setFontSize(10);
  const texto3 = 'Asimismo, el/la trabajador/a presta su consentimiento para el registro y tratamiento de sus datos biométricos (huella dactilar) con el único fin de control de acceso y registro de jornada laboral.';
  const lines3 = doc.splitTextToSize(texto3, 170);
  doc.text(lines3, 20, 160);
  
  doc.setFontSize(12);
  doc.text('3. DECLARACIÓN', 20, 190);
  
  doc.setFontSize(10);
  const texto4 = 'PRESTA SU CONSENTIMIENTO para ser filmado/a durante el desarrollo de sus tareas laborales y para el uso de sus datos biométricos, entendiendo que serán utilizados únicamente para los fines mencionados y bajo estricta confidencialidad.';
  const lines4 = doc.splitTextToSize(texto4, 170);
  doc.text(lines4, 20, 200);
  
  // Firmas
  doc.line(30, 250, 90, 250);
  doc.text('FIRMA DEL EMPLEADO', 40, 256);
  doc.text(`Aclaración: ${nombre}`, 30, 264);
  doc.text(`DNI: ${emp.dni}`, 30, 270);
  
  doc.line(120, 250, 180, 250);
  doc.text(clientConfig.nombreCorto || clientConfig.nombre, 135, 256);
  doc.text('Representante Legal', 130, 264);
}

function generateReglamentoInterno(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fecha: string
) {
  doc.setFontSize(16);
  doc.text('REGLAMENTO INTERNO', 105, 25, { align: 'center' });
  doc.setFontSize(14);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 35, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${fecha}`, 20, 50);
  doc.text(`Empleado: ${nombre}`, 20, 58);
  
  doc.setFontSize(11);
  const intro = 'Este reglamento tiene por objetivo establecer normas claras de convivencia, obligaciones, derechos y procedimientos que garanticen un ambiente de trabajo ordenado, seguro y respetuoso para todos.';
  const introLines = doc.splitTextToSize(intro, 170);
  doc.text(introLines, 20, 70);
  
  doc.setFontSize(12);
  doc.text('1. OBLIGACIONES Y DEBERES DE LOS EMPLEADOS', 20, 95);
  
  doc.setFontSize(10);
  const obligaciones = [
    '• Cumplir con las obligaciones propias del puesto de trabajo',
    '• Observar las órdenes e instrucciones impartidas por superiores',
    '• Guardar secreto de las informaciones reservadas de la empresa',
    '• Conservar los instrumentos de trabajo provistos',
    '• Respetar los horarios de ingreso y egreso establecidos',
  ];
  
  let y = 105;
  obligaciones.forEach(ob => {
    doc.text(ob, 25, y);
    y += 8;
  });
  
  doc.setFontSize(12);
  doc.text('2. PROHIBICIONES', 20, 155);
  
  doc.setFontSize(10);
  const prohibiciones = [
    '• Presentarse al trabajo bajo efectos de alcohol o sustancias',
    '• Utilizar recursos de la empresa para fines personales',
    '• Revelar información confidencial a terceros',
    '• Faltar al trabajo sin aviso ni justificación',
  ];
  
  y = 165;
  prohibiciones.forEach(pr => {
    doc.text(pr, 25, y);
    y += 8;
  });
  
  doc.setFontSize(11);
  doc.text('Declaro haber leído y comprendido el presente reglamento:', 20, 210);
  
  // Firma
  doc.line(70, 250, 140, 250);
  doc.text('Firma del empleado', 90, 258);
  doc.text(`Aclaración: ${nombre}`, 70, 268);
  doc.text(`Fecha: ${fecha}`, 70, 276);
}

function generateApercibimiento(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fechaTexto: string,
  sanction?: DynamicPDFParams['sanction']
) {
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Córdoba, ${fechaTexto}`, 20, 40);
  
  doc.text(`Sr/a: ${emp.apellidos}, ${emp.nombres}`, 20, 55);
  doc.text(`DNI: ${emp.dni}`, 20, 63);
  
  const motivo = sanction?.motivo || '[Describir motivo del apercibimiento]';
  const fechaHecho = sanction?.fecha_hecho ? formatDateLocal(sanction.fecha_hecho) : '[Fecha del hecho]';
  const lugarHecho = sanction?.lugar_hecho || '';
  
  doc.setFontSize(11);
  doc.text('Por medio de la presente, procedemos a notificarle de manera', 20, 80);
  doc.text('fehaciente que se ha resuelto aplicar un APERCIBIMIENTO.', 20, 88);
  
  doc.setFontSize(10);
  const textoMotivo = `Atento a ${motivo}, ocurrido el día ${fechaHecho}${lugarHecho ? ` en ${lugarHecho}` : ''}.`;
  const lineasMotivo = doc.splitTextToSize(textoMotivo, 170);
  doc.text(lineasMotivo, 20, 105);
  
  const exhortacion = 'Por ello, se le aplica un apercibimiento y se lo exhorta a que, en lo sucesivo, adecúe su conducta a las pautas de cumplimiento normativo del Art. 16 del CCT 422/05 y al reglamento interno de la empresa, bajo apercibimiento de aplicar sanciones de mayor gravedad.';
  const lineasExhortacion = doc.splitTextToSize(exhortacion, 170);
  doc.text(lineasExhortacion, 20, 130);
  
  doc.setFontSize(9);
  doc.text('//Seguidamente, notifico de la comunicación que me antecede.', 20, 165);
  doc.text(`Córdoba, ${fechaTexto}.`, 20, 175);
  
  doc.setFontSize(10);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 195, { align: 'center' });
  
  // Firma
  doc.line(70, 240, 140, 240);
  doc.text('Firma del trabajador', 90, 248);
  doc.text('Aclaración: ___________________________', 60, 258);
  doc.text('DNI: ___________________________', 60, 268);
}

function generateSuspension(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fechaTexto: string,
  sanction?: DynamicPDFParams['sanction']
) {
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Córdoba, ${fechaTexto}`, 20, 40);
  
  doc.text(`Sr/a: ${emp.apellidos}, ${emp.nombres}`, 20, 55);
  doc.text(`DNI: ${emp.dni}`, 20, 63);
  
  const motivo = sanction?.motivo || '[Describir motivo de la suspensión]';
  const dias = sanction?.dias_suspension || '[X]';
  const fechaInicio = sanction?.fecha_inicio ? formatDateLocal(sanction.fecha_inicio) : '[Fecha inicio]';
  const fechaReincorporacion = sanction?.fecha_reincorporacion ? formatDateLocal(sanction.fecha_reincorporacion) : '[Fecha reincorporación]';
  
  doc.setFontSize(11);
  doc.text('Por medio de la presente, procedemos a notificarle de manera', 20, 80);
  doc.text(`fehaciente que se ha resuelto aplicar una SUSPENSIÓN de ${dias} día(s).`, 20, 88);
  
  doc.setFontSize(10);
  const textoMotivo = `Atento a ${motivo}.`;
  const lineasMotivo = doc.splitTextToSize(textoMotivo, 170);
  doc.text(lineasMotivo, 20, 105);
  
  doc.text(`Fecha de inicio de suspensión: ${fechaInicio}`, 20, 130);
  doc.text(`Fecha de reincorporación: ${fechaReincorporacion}`, 20, 140);
  
  doc.setFontSize(9);
  doc.text('//Seguidamente, notifico de la comunicación que me antecede.', 20, 165);
  doc.text(`Córdoba, ${fechaTexto}.`, 20, 175);
  
  doc.setFontSize(10);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 195, { align: 'center' });
  
  // Firma
  doc.line(70, 240, 140, 240);
  doc.text('Firma del trabajador', 90, 248);
  doc.text('Aclaración: ___________________________', 60, 258);
  doc.text('DNI: ___________________________', 60, 268);
}

function generateDespidoPeriodoPrueba(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fechaTexto: string
) {
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Córdoba, ${fechaTexto}`, 20, 40);
  
  doc.text(`Sr/a: ${emp.apellidos}, ${emp.nombres}`, 20, 55);
  doc.text(`DNI: ${emp.dni}`, 20, 63);
  
  doc.setFontSize(11);
  doc.text('COMUNICACIÓN DE EXTINCIÓN DEL CONTRATO', 105, 80, { align: 'center' });
  doc.text('DE TRABAJO EN PERÍODO DE PRUEBA', 105, 88, { align: 'center' });
  
  doc.setFontSize(10);
  const texto = `Por medio de la presente, le comunicamos que en uso de las facultades conferidas por el Art. 92 bis de la Ley de Contrato de Trabajo N° 20.744, hemos decidido dar por finalizada la relación laboral durante el período de prueba.`;
  const lineas = doc.splitTextToSize(texto, 170);
  doc.text(lineas, 20, 105);
  
  doc.text('Agradecemos los servicios prestados.', 20, 145);
  doc.text('Sin otro particular, saludamos atentamente.', 20, 160);
  
  doc.text(clientConfig.nombre.toUpperCase(), 105, 190, { align: 'center' });
  
  // Firma
  doc.text('NOTIFICACIÓN:', 20, 220);
  doc.line(70, 250, 140, 250);
  doc.text('Firma del trabajador', 90, 258);
  doc.text('Aclaración: ___________________________', 60, 268);
  doc.text('DNI: ___________________________', 60, 278);
}

function generateCertificadoVacaciones(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fecha: string,
  vacation?: DynamicPDFParams['vacation']
) {
  doc.setFontSize(14);
  doc.text('CERTIFICADO DE VACACIONES', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha de emisión: ${fecha}`, 20, 65);
  
  const fechaInicio = vacation?.fecha_inicio ? formatDateLocal(vacation.fecha_inicio) : '[Fecha inicio]';
  const fechaFin = vacation?.fecha_fin ? formatDateLocal(vacation.fecha_fin) : '[Fecha fin]';
  const dias = vacation?.dias || '[X]';
  
  doc.setFontSize(11);
  const texto = `Se certifica que ${nombre}, DNI ${emp.dni}, empleado/a de ${clientConfig.nombre}, gozará de sus vacaciones anuales correspondientes desde el día ${fechaInicio} hasta el día ${fechaFin}, totalizando ${dias} días corridos.`;
  const lineas = doc.splitTextToSize(texto, 170);
  doc.text(lineas, 20, 85);
  
  doc.text('Se extiende el presente certificado a los fines que correspondan.', 20, 130);
  
  // Firma empresa
  doc.line(120, 200, 180, 200);
  doc.text(clientConfig.nombreCorto || clientConfig.nombre, 130, 208);
  doc.text('Recursos Humanos', 135, 216);
}

function generateCertificadoCapacitacion(
  doc: jsPDF,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fecha: string,
  training?: DynamicPDFParams['training']
) {
  doc.setFontSize(16);
  doc.text('CERTIFICADO DE CAPACITACIÓN', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 45, { align: 'center' });
  
  const titulo = training?.titulo || '[Título de la capacitación]';
  const fechaCapacitacion = training?.fecha ? formatDateLocal(training.fecha) : fecha;
  const duracion = training?.duracion || '';
  const instructor = training?.instructor || '';
  
  doc.setFontSize(11);
  const texto = `Se certifica que ${nombre}, DNI ${emp.dni}, ha completado satisfactoriamente la capacitación:`;
  const lineas = doc.splitTextToSize(texto, 170);
  doc.text(lineas, 20, 70);
  
  doc.setFontSize(14);
  doc.text(`"${titulo}"`, 105, 95, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Fecha: ${fechaCapacitacion}`, 20, 115);
  if (duracion) doc.text(`Duración: ${duracion}`, 20, 125);
  if (instructor) doc.text(`Instructor: ${instructor}`, 20, 135);
  
  doc.setFontSize(11);
  doc.text('Se extiende el presente certificado a los fines que correspondan.', 20, 160);
  
  // Firma
  doc.line(120, 220, 180, 220);
  doc.text(clientConfig.nombreCorto || clientConfig.nombre, 130, 228);
  doc.text('Recursos Humanos', 135, 236);
}

function generateDocumentoGenerico(
  doc: jsPDF,
  tipo: string,
  nombre: string,
  emp: DynamicPDFParams['employeeData'],
  fecha: string
) {
  doc.setFontSize(14);
  doc.text('DOCUMENTO', 105, 30, { align: 'center' });
  doc.setFontSize(12);
  doc.text(clientConfig.nombre.toUpperCase(), 105, 45, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(`Tipo: ${tipo}`, 20, 65);
  doc.text(`Fecha: ${fecha}`, 20, 75);
  doc.text(`Empleado: ${nombre}`, 20, 85);
  doc.text(`DNI: ${emp.dni}`, 20, 95);
  
  doc.text('Este documento fue generado automáticamente.', 20, 130);
  
  // Firma
  doc.line(70, 200, 140, 200);
  doc.text('Firma del empleado', 90, 210);
}

// Exportar tipos para uso externo
export type { DynamicPDFParams, PDFResult };

