import { jsPDF } from 'jspdf';
import { supabase } from "@/integrations/supabase/client";
import { clientConfig } from "@/config/client";
import { formatDateLocal } from "@/utils/dateUtils";
import { generateDynamicPDF, DynamicPDFParams } from "@/utils/dynamicPdfGenerator";

export interface GeneratePDFParams {
  documentType: string;
  employeeData: {
    nombres: string;
    apellidos: string;
    dni: string;
    direccion?: string;
    cuil?: string;
    puesto?: string;
    departamento?: string;
    fecha_ingreso?: string;
    employee?: any;
    sanction?: any;
  };
  generatedDate: string;
  documentId: string;
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  url?: string;
  error?: string;
  blob?: Blob;
  usedDynamicTemplate?: boolean;
}

export interface SignPDFParams {
  documentId: string;
  signature?: string;
  signatureCode?: string;
  signedDate: string;
}

// Función que genera PDF - INTENTA USAR TEMPLATES DINÁMICOS PRIMERO
export const generatePDFDirectly = async (params: GeneratePDFParams): Promise<PDFGenerationResult> => {
  const { documentType, employeeData, generatedDate, documentId } = params;
  
  const isPreview = documentId.startsWith('preview_');
  console.log('📄 [PDF Generator] Iniciando generación:', documentType, isPreview ? '(PREVIEW)' : '(GUARDAR)');

  try {
    // 1. INTENTAR USAR GENERADOR DINÁMICO PRIMERO
    try {
      console.log('🔄 [PDF Generator] Intentando usar templates dinámicos...');
      
      // Extraer datos de sanción si existe
      const sanction = employeeData.sanction;
      const sanctionData: DynamicPDFParams['sanction'] = sanction ? {
        motivo: sanction.motivo,
        fecha_hecho: sanction.fecha_hecho,
        lugar_hecho: sanction.lugar_hecho,
        dias_suspension: sanction.dias_suspension,
        fecha_inicio: sanction.fecha_inicio,
        fecha_reincorporacion: sanction.fecha_reincorporacion,
      } : undefined;
      
      const dynamicResult = await generateDynamicPDF({
        templateType: documentType,
        employeeData: {
          nombres: employeeData.nombres,
          apellidos: employeeData.apellidos,
          dni: employeeData.dni,
          direccion: employeeData.direccion,
          cuil: employeeData.cuil,
          puesto: employeeData.puesto || employeeData.employee?.puesto,
          departamento: employeeData.departamento || employeeData.employee?.departamento,
          fecha_ingreso: employeeData.fecha_ingreso || employeeData.employee?.fecha_ingreso,
        },
        documentId,
        sanction: sanctionData,
      });
      
      if (dynamicResult.success) {
        console.log('✅ [PDF Generator] PDF generado con sistema dinámico', 
          dynamicResult.usedDynamicTemplate ? '(template BD)' : '(fallback jsPDF)');
        return {
          success: true,
          pdfUrl: dynamicResult.pdfUrl,
          url: dynamicResult.pdfUrl,
          blob: dynamicResult.blob,
          usedDynamicTemplate: dynamicResult.usedDynamicTemplate,
        };
      }
    } catch (error) {
      console.warn('⚠️ [PDF Generator] Error en generador dinámico, usando método legacy:', error);
    }
    
    // 2. FALLBACK: MÉTODO LEGACY CON JSPDF DIRECTO
    console.log('🔄 [PDF Generator] Usando método legacy (jsPDF directo)');
    // Validar que los datos necesarios estén presentes
    if (!employeeData || !employeeData.nombres || !employeeData.apellidos) {
      throw new Error(`Datos del empleado incompletos: ${JSON.stringify(employeeData)}`);
    }
    
    if (!generatedDate) {
      throw new Error(`Fecha de generación no proporcionada: ${generatedDate}`);
    }
    
    if (!documentType) {
      throw new Error(`Tipo de documento no proporcionado: ${documentType}`);
    }
    
    const doc = new jsPDF();
    
    const employeeName = `${employeeData.nombres} ${employeeData.apellidos}`;
    // Formatear fecha correctamente evitando problemas de zona horaria
    const dateObj = new Date(generatedDate + 'T12:00:00');
    const formattedDate = dateObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Generating PDF for employee

    if (documentType === 'consentimiento_datos_biometricos') {
      // Consentimiento de Datos Biométricos - VERSIÓN COMPLETA CON MÚLTIPLES PÁGINAS
      let yPos = 25;
      
      // ENCABEZADO
      doc.setFontSize(14);
      doc.text('CONSTANCIA DE CONSENTIMIENTO PARA USO DE', 105, yPos, { align: 'center' });
      yPos += 10;
      doc.text('CÁMARAS DE VIGILANCIA Y DATOS BIOMÉTRICOS', 105, yPos, { align: 'center' });
      yPos += 25;
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${formattedDate}`, 20, yPos);
      yPos += 20;
      
      // PÁRRAFO PRINCIPAL
      const mainText = `En la ciudad de Córdoba Capital, comparece el/la trabajador/a ${employeeName}, DNI Nº ${employeeData.dni}, con domicilio en ${employeeData.direccion || 'Sin dirección registrada'}, quien manifiesta prestar su consentimiento expreso en los términos de la Ley de Protección de Datos Personales N° 25.326 y normativa laboral aplicable.`;
      
      const splitMainText = doc.splitTextToSize(mainText, 170);
      doc.text(splitMainText, 20, yPos);
      yPos += splitMainText.length * 5 + 12;
      
      // SECCIÓN 1: CÁMARAS DE VIGILANCIA
      doc.setFontSize(14);
      doc.text('1. CÁMARAS DE VIGILANCIA', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      const camarasIntro = `El/la trabajador/a declara haber sido informado/a de la existencia de cámaras de seguridad instaladas en las instalaciones de la empresa ${clientConfig.nombre} (en adelante "la Empresa"), cuya finalidad exclusiva es la prevención de riesgos, seguridad de las personas, resguardo de bienes materiales y control del cumplimiento de normas laborales.`;
      const splitCamarasIntro = doc.splitTextToSize(camarasIntro, 170);
      doc.text(splitCamarasIntro, 20, yPos);
      yPos += splitCamarasIntro.length * 5 + 8;
      
      // Lista de cámaras
      const camarasItems = [
        'Las cámaras se encuentran ubicadas en espacios comunes y áreas de trabajo, sin invadir espacios privados.',
        'Las imágenes captadas podrán ser utilizadas como medio de prueba en caso de ser necesario y se almacenarán por un período limitado conforme a la política interna de la Empresa.'
      ];
      
      camarasItems.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 5 + 4;
      });
      yPos += 10;
      
      // SECCIÓN 2: DATOS BIOMÉTRICOS
      doc.setFontSize(14);
      doc.text('2. DATOS BIOMÉTRICOS – REGISTRO DE HUELLA DIGITAL', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      const bioIntro = 'El/la trabajador/a presta consentimiento para la recolección y tratamiento de su dato biométrico (huella digital) con la finalidad de:';
      const splitBioIntro = doc.splitTextToSize(bioIntro, 170);
      doc.text(splitBioIntro, 20, yPos);
      yPos += splitBioIntro.length * 5 + 8;
      
      // Lista de finalidades biométricas
      const bioItems = [
        'Registrar su asistencia y puntualidad mediante el reloj biométrico implementado por la Empresa.',
        'Garantizar la correcta administración de la jornada laboral.'
      ];
      
      bioItems.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 5 + 4;
      });
      yPos += 10;
      
      // Párrafo sobre confidencialidad
      const confidencialidadText = 'Los datos biométricos serán tratados con carácter estrictamente confidencial, almacenados en soportes digitales seguros y utilizados únicamente para la finalidad descripta. No serán cedidos a terceros, salvo obligación legal.';
      const splitConfidencialidad = doc.splitTextToSize(confidencialidadText, 170);
      doc.text(splitConfidencialidad, 20, yPos);
      yPos += splitConfidencialidad.length * 5 + 10;
      
      // NUEVA PÁGINA
      doc.addPage();
      yPos = 30;
      
      // SECCIÓN 3: DERECHOS DEL TRABAJADOR
      doc.setFontSize(14);
      doc.text('3. DERECHOS DEL TRABAJADOR/A', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text('El/la trabajador/a reconoce que:', 20, yPos);
      yPos += 15;
      
      // Lista de derechos
      const derechosItems = [
        'Puede ejercer en cualquier momento sus derechos de acceso, rectificación, actualización o supresión de los datos conforme lo establece la Ley N° 25.326.',
        'Su consentimiento puede ser revocado mediante notificación fehaciente a la Empresa, sin efectos retroactivos sobre el tratamiento ya realizado.'
      ];
      
      derechosItems.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 5 + 4;
      });
      yPos += 12;
      
      // SECCIÓN DE FIRMAS
      doc.setFontSize(12);
      doc.text('FIRMA DEL TRABAJADOR/A', 20, yPos);
      yPos += 15;
      
      doc.text(`Nombre y Apellido: ${employeeName}`, 20, yPos);
      yPos += 12;
      
      doc.text(`DNI: ${employeeData.dni}`, 20, yPos);
      yPos += 12;
      
      doc.text(`Fecha: ${formattedDate}`, 20, yPos);
      yPos += 18;
      
      doc.text('Firma: _________________________________', 20, yPos);
      yPos += 25;
      
      // FIRMA DE LA EMPRESA
      doc.text('FIRMA DE LA EMPRESA', 20, yPos);
      yPos += 15;
      
      doc.text('Representante: _________________________________', 20, yPos);
      yPos += 12;
      
      doc.text('Cargo: _________________________________', 20, yPos);
      yPos += 12;
      
      doc.text(`Fecha: ${formattedDate}`, 20, yPos);
      yPos += 12;
      
      doc.text('Firma: _________________________________', 20, yPos);
      
    } else if (documentType === 'reglamento_interno') {
      // Reglamento Interno - VERSIÓN COMPLETA CON MÚLTIPLES PÁGINAS
      let yPos = 30;
      
      // PÁGINA 1 - ENCABEZADO
      doc.setFontSize(18);
      doc.text('REGLAMENTO INTERNO', 105, yPos, { align: 'center' });
      yPos += 15;
      doc.setFontSize(16);
      doc.text(clientConfig.nombre.toUpperCase(), 105, yPos, { align: 'center' });
      yPos += 20;
      
      doc.setFontSize(12);
      doc.text(`Fecha: ${formattedDate}`, 20, yPos);
      yPos += 10;
      doc.text(`Nombre del empleado: ${employeeName}`, 20, yPos);
      yPos += 15;
      
      const introText = 'Este reglamento tiene por objetivo establecer normas claras de convivencia, obligaciones, derechos y procedimientos que garanticen un ambiente de trabajo ordenado, seguro y respetuoso para todos.';
      const splitIntroText = doc.splitTextToSize(introText, 170);
      doc.text(splitIntroText, 20, yPos);
      yPos += splitIntroText.length * 5 + 8;
      
      // SECCIÓN 1: OBLIGACIONES Y DEBERES
      doc.setFontSize(13);
      doc.text('1. OBLIGACIONES Y DEBERES DE LOS EMPLEADOS', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const obligaciones = [
        'Cumplir con las obligaciones propias del puesto de trabajo, conforme a los principios de buena fe, diligencia y responsabilidad.',
        'Mantener el orden y aseo de los lugares de acceso común y convivencia con compañeros de trabajo.',
        'Cuidar y conservar en condiciones óptimas las herramientas, maquinarias, elementos de limpieza y demás materiales de trabajo.',
        'Cumplir y respetar las medidas de seguridad e higiene establecidas por la empresa.'
      ];
      
      obligaciones.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 4 + 2;
      });
      yPos += 6;
      
      // SECCIÓN 2: DERECHOS DE LOS EMPLEADOS
      doc.setFontSize(13);
      doc.text('2. DERECHOS DE LOS EMPLEADOS', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const derechos = [
        'Desempeñarse en un ambiente sano, seguro y libre de riesgos innecesarios.',
        'Conocer los riesgos inherentes a su puesto de trabajo.',
        'Percibir una retribución justa acorde a las tareas realizadas.',
        'Recibir los elementos de trabajo y de protección personal necesarios según la tarea a realizar.',
        'Acceder al descanso vacacional anual conforme a la normativa vigente.'
      ];
      
      derechos.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 4 + 2;
      });
      
      // NUEVA PÁGINA
      doc.addPage();
      yPos = 25;
      
      // SECCIÓN 3: NORMAS DE TRABAJO
      doc.setFontSize(13);
      doc.text('3. NORMAS DE TRABAJO DENTRO DE LA GRANJA', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const normas = [
        'Queda prohibido fumar en las zonas de trabajo.',
        'No se podrá utilizar el teléfono celular en horario laboral, salvo para fines estrictamente laborales.',
        'Mantener en todo momento un trato de respeto y educación hacia compañeros, superiores y público en general.',
        'Presentarse al trabajo con higiene personal adecuada y con el uniforme limpio y en buen estado.',
        'Queda prohibido jugar con herramientas de trabajo o darles un uso indebido.',
        'Es obligatorio el uso de gafas de seguridad cuando la tarea lo requiera.'
      ];
      
      normas.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 4 + 2;
      });
      yPos += 6;
      
      // SECCIÓN 4: PROHIBICIONES
      doc.setFontSize(13);
      doc.text('4. PROHIBICIONES', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const prohibiciones = [
        'Faltar al trabajo sin causa justificada o sin autorización previa.',
        'Sustraer de la empresa herramientas, insumos, materia prima o productos elaborados.',
        'Presentarse al trabajo en estado de embriaguez.',
        'Presentarse bajo los efectos de narcóticos o drogas enervantes, salvo prescripción médica debidamente acreditada.'
      ];
      
      prohibiciones.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 4 + 2;
      });
      yPos += 6;
      
      // SECCIÓN 5: CERTIFICADOS Y AUSENCIAS
      doc.setFontSize(13);
      doc.text('5. CERTIFICADOS Y AUSENCIAS', 20, yPos);
      yPos += 10;
      
      doc.setFontSize(12);
      const ausencias = [
        'En caso de enfermedad, el trabajador deberá avisar con al menos 2 horas de anticipación sobre su ausencia, salvo situaciones de urgencia.',
        'El certificado médico deberá ser cargado en el formulario de ausencias dentro de las 24 horas de producida la falta.',
        'Las vacaciones deberán solicitarse en el mes de octubre indicando las fechas de preferencia. La empresa, en base a la demanda productiva y organización interna, asignará los períodos entre noviembre y abril.',
        'La falta de presentación del certificado en tiempo y forma dará lugar al descuento del día no trabajado.'
      ];
      
      ausencias.forEach(item => {
        const splitItem = doc.splitTextToSize(`• ${item}`, 165);
        doc.text(splitItem, 25, yPos);
        yPos += splitItem.length * 4 + 2;
      });
      
      // FIRMA
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text('Firma del empleado:', 20, yPos);
      yPos += 12;
      doc.text('_________________________', 20, yPos);
      yPos += 10;
      doc.text(`Aclaración: ${employeeName}`, 20, yPos);
      yPos += 8;
      doc.text(`Fecha: ${formattedDate}`, 20, yPos);
      
    } else if (documentType === 'apercibimiento') {
      // Apercibimiento Template
      const sanction = employeeData.sanction;
      const employee = employeeData.employee;
      
      let yPos = 30;
      
      // ENCABEZADO
      doc.setFontSize(14);
      doc.text(clientConfig.nombre.toUpperCase(), 105, yPos, { align: 'center' });
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text(`Córdoba, ${formattedDate}`, 20, yPos);
      yPos += 15;
      
      doc.text(`Sr/a: ${employee.apellidos}, ${employee.nombres}`, 20, yPos);
      yPos += 8;
      doc.text(`DNI: ${employee.dni}`, 20, yPos);
      yPos += 15;
      
      // CONTENIDO
      const notificacion = 'Por medio de la presente, procedemos a notificarle de manera fehaciente que se ha resuelto aplicar un Apercibimiento.';
      const splitNotif = doc.splitTextToSize(notificacion, 170);
      doc.text(splitNotif, 20, yPos);
      yPos += splitNotif.length * 4 + 6;
      
      const motivo = `Atento a ${sanction.motivo.toLowerCase()}, ocurrido el día ${new Date(sanction.fecha_hecho || sanction.fecha_documento).toLocaleDateString('es-AR')}${sanction.lugar_hecho ? ` en ${sanction.lugar_hecho}` : ''}.`;
      const splitMotivo = doc.splitTextToSize(motivo, 170);
      doc.text(splitMotivo, 20, yPos);
      yPos += splitMotivo.length * 4 + 6;
      
      const exhorto = 'Por ello, se le aplica un apercibimiento y se lo exhorta a que, en lo sucesivo, adecúe su conducta a las pautas de cumplimiento normativo del Art. 16 del CCT 422/05 y al reglamento interno de la empresa, bajo apercibimiento de aplicar sanciones de mayor gravedad.';
      const splitExhorto = doc.splitTextToSize(exhorto, 170);
      doc.text(splitExhorto, 20, yPos);
      yPos += splitExhorto.length * 4 + 6;
      
      doc.text('//Seguidamente, notifico de la comunicación que me antecede.', 20, yPos);
      yPos += 12;
      
      doc.text(`Córdoba, ${formattedDate}.`, 20, yPos);
      yPos += 18;
      
      doc.text(clientConfig.nombre.toUpperCase(), 105, yPos, { align: 'center' });
      yPos += 25;
      
      // FIRMA
      doc.text('Firma del trabajador: _______________________________', 20, yPos);
      yPos += 8;
      doc.text('Aclaración: _______________________________', 20, yPos);
      yPos += 8;
      doc.text('DNI: _______________________________', 20, yPos);
      
      if (sanction.observaciones) {
        yPos += 12;
        doc.setFontSize(10);
        const obs = `Observaciones: ${sanction.observaciones}`;
        const splitObs = doc.splitTextToSize(obs, 170);
        doc.text(splitObs, 20, yPos);
      }
      
    } else if (documentType === 'despido_periodo_prueba') {
      // Despido - Período de Prueba Template
      let yPos = 30;
      
      // ENCABEZADO
      doc.setFontSize(16);
      doc.text(clientConfig.nombre, 105, yPos, { align: 'center' });
      yPos += 10;
      
      doc.setFontSize(10);
      doc.text('20-24088189-7', 105, yPos, { align: 'center' });
      yPos += 7;
      doc.text('Av. José Hernández 90 – Río Primero', 105, yPos, { align: 'center' });
      yPos += 20;
      
      doc.setFontSize(12);
      doc.text(`Río Primero, Córdoba – ${formattedDate}`, 190, yPos, { align: 'right' });
      yPos += 20;
      
      doc.text(`Al Sr. ${employeeData.apellidos} ${employeeData.nombres}`, 20, yPos);
      yPos += 10;
      doc.text(`DNI: ${employeeData.dni}`, 20, yPos);
      yPos += 20;
      
      // REFERENCIA
      doc.setFontSize(14);
      const refText = 'Ref.: Comunicación de finalización de la relación laboral durante el período de prueba.';
      const splitRef = doc.splitTextToSize(refText, 170);
      doc.text(splitRef, 20, yPos);
      yPos += splitRef.length * 5 + 10;
      
      // CUERPO
      doc.setFontSize(11);
      const parrafo1 = `Por medio de la presente, le informamos que hemos decidido dar por finalizada la relación laboral que lo vincula con esta empresa a partir del día ${formattedDate}, conforme lo dispuesto por el Artículo 92 bis de la Ley de Contrato de Trabajo N.º 20.744, encontrándose usted dentro del período de prueba legalmente establecido.`;
      const splitP1 = doc.splitTextToSize(parrafo1, 170);
      doc.text(splitP1, 20, yPos);
      yPos += splitP1.length * 5 + 8;
      
      const parrafo2 = 'La extinción de la relación laboral no obedece a causa disciplinaria alguna y, por tratarse de una desvinculación dentro del período de prueba, no corresponde el pago de indemnización por despido, conforme a lo establecido en la legislación vigente.';
      const splitP2 = doc.splitTextToSize(parrafo2, 170);
      doc.text(splitP2, 20, yPos);
      yPos += splitP2.length * 5 + 8;
      
      const parrafo3 = 'En los próximos días podrá retirar su liquidación final, recibo correspondiente y demás documentación laboral, incluyendo su certificado de trabajo conforme al Art. 80 de la LCT.';
      const splitP3 = doc.splitTextToSize(parrafo3, 170);
      doc.text(splitP3, 20, yPos);
      yPos += splitP3.length * 5 + 8;
      
      doc.text('Sin otro particular, saludamos a usted atentamente.', 20, yPos);
      yPos += 30;
      
      // FIRMAS
      doc.setFontSize(11);
      doc.text('Firma del empleador:', 20, yPos);
      yPos += 15;
      doc.text('Nombre: ____________________________', 20, yPos);
      yPos += 10;
      doc.text('Cargo: ____________________________', 20, yPos);
      yPos += 25;
      
      doc.text('Firma del trabajador:', 20, yPos);
      yPos += 15;
      doc.text('Nombre: ____________________________', 20, yPos);
      yPos += 10;
      doc.text('DNI: ____________________________', 20, yPos);
      yPos += 10;
      doc.text('Fecha de recepción: __________________', 20, yPos);
      
    } else if (documentType === 'sancion') {
      // Sanción Template
      const sanction = employeeData.sanction;
      const employee = employeeData.employee;
      
      let yPos = 30;
      
      // ENCABEZADO
      doc.setFontSize(14);
      doc.text(clientConfig.nombre.toUpperCase(), 105, yPos, { align: 'center' });
      yPos += 15;
      
      doc.setFontSize(12);
      doc.text(`Córdoba, ${formattedDate}`, 20, yPos);
      yPos += 15;
      
      doc.text(`Sr/a: ${employee.apellidos}, ${employee.nombres}`, 20, yPos);
      yPos += 8;
      doc.text(`CUIL: ${employee.cuil || employee.dni}`, 20, yPos);
      yPos += 15;
      
      // CONTENIDO
      const notificacion = 'Por medio de la presente, procedemos a notificarle de manera fehaciente que se ha resuelto aplicar una sanción.';
      const splitNotif = doc.splitTextToSize(notificacion, 170);
      doc.text(splitNotif, 20, yPos);
      yPos += splitNotif.length * 4 + 6;
      
      const motivo = `Atento a ${sanction.motivo.toLowerCase()}, ocurrido el día ${new Date(sanction.fecha_hecho || sanction.fecha_documento).toLocaleDateString('es-AR')}${sanction.lugar_hecho ? ` en ${sanction.lugar_hecho}` : ''}.`;
      const splitMotivo = doc.splitTextToSize(motivo, 170);
      doc.text(splitMotivo, 20, yPos);
      yPos += splitMotivo.length * 4 + 6;
      
      const suspension = `Por ello, se le aplican ${sanction.dias_suspension} días de suspensión sin goce de haberes, a partir del día ${formatDateLocal(sanction.fecha_inicio)}, debiendo reincorporarse el día ${formatDateLocal(sanction.fecha_reincorporacion)}.`;
      const splitSuspension = doc.splitTextToSize(suspension, 170);
      doc.text(splitSuspension, 20, yPos);
      yPos += splitSuspension.length * 4 + 6;
      
      const exhorto = 'Se lo exhorta a que, en lo sucesivo, adecúe su conducta a las pautas de cumplimiento normativo del Art. 16 del CCT 422/05 y al reglamento interno de la empresa, bajo apercibimiento de aplicar sanciones de mayor gravedad.';
      const splitExhorto = doc.splitTextToSize(exhorto, 170);
      doc.text(splitExhorto, 20, yPos);
      yPos += splitExhorto.length * 4 + 6;
      
      doc.text('//Seguidamente, notificó de la comunicación que me antecede.', 20, yPos);
      yPos += 12;
      
      doc.text(`Córdoba, ${formattedDate}.`, 20, yPos);
      yPos += 18;
      
      doc.text(clientConfig.nombre.toUpperCase(), 105, yPos, { align: 'center' });
      yPos += 25;
      
      // FIRMA
      doc.text('Firma del trabajador: _______________________________', 20, yPos);
      yPos += 8;
      doc.text('Aclaración: _______________________________', 20, yPos);
      yPos += 8;
      doc.text('DNI: _______________________________', 20, yPos);
      
      if (sanction.observaciones) {
        yPos += 12;
        doc.setFontSize(10);
        const obs = `Observaciones: ${sanction.observaciones}`;
        const splitObs = doc.splitTextToSize(obs, 170);
        doc.text(splitObs, 20, yPos);
      }
      
    } else {
      throw new Error(`Tipo de documento no soportado: ${documentType}`);
    }

    // Generar blob
    const blob = doc.output('blob');
    console.log('📦 [DIRECT PDF] PDF generado con jsPDF directo, tamaño:', blob.size, 'bytes');

    if (blob.size === 0) {
      throw new Error('El PDF generado está vacío');
    }

    // Solo subir a Supabase si NO es preview
    if (!isPreview) {
      const fileName = `${documentId}_${documentType}_${employeeData.dni}_${Date.now()}.pdf`;
      console.log('☁️ [DIRECT PDF] Subiendo a Supabase:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [DIRECT PDF] Error subiendo:', uploadError);
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      console.log('✅ [DIRECT PDF] Archivo subido exitosamente');

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      console.log('🎉 [DIRECT PDF] Proceso completado exitosamente');

      return {
        success: true,
        pdfUrl: urlData.publicUrl,
        url: urlData.publicUrl,
        blob: blob
      };
    } else {
      console.log('📥 [DIRECT PDF] Preview generado - NO se sube a Supabase');
      
      return {
        success: true,
        blob: blob
      };
    }

  } catch (error) {
    console.error('❌ [DIRECT PDF] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función simple para firmar (actualizar estado)
export const signPDF = async (params: SignPDFParams): Promise<PDFGenerationResult> => {
  console.log('✍️ [DIRECT PDF] Firmando documento:', params.documentId);
  
  try {
    // Actualizar documento en la base de datos
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'firmado',
        signed_date: params.signedDate,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.documentId);
    
    if (updateError) {
      throw new Error(`Error actualizando documento: ${updateError.message}`);
    }
    
    console.log('✅ [DIRECT PDF] Documento firmado exitosamente');
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ [DIRECT PDF] Error firmando documento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función para descargar PDF desde Supabase Storage
export const downloadPDFFromStorage = async (fileName: string): Promise<Blob> => {
  const { data, error } = await supabase.storage
    .from('documents')
    .download(fileName);

  if (error) {
    throw new Error(`Error descargando archivo: ${error.message}`);
  }

  return data;
};

// Función para eliminar PDF de Supabase Storage
export const deletePDFFromStorage = async (fileName: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('documents')
    .remove([fileName]);

  if (error) {
    throw new Error(`Error eliminando archivo: ${error.message}`);
  }
};
