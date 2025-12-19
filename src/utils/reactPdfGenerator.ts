import React from "react";
import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import ConsentimientoSimple from "@/components/documents/templates/ConsentimientoSimple";
import ReglamentoInternoSimple from "@/components/documents/templates/ReglamentoInternoSimple";
import { clientConfig } from "@/config/client";
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
  };
  generatedDate: string;
  documentId: string;
  // Datos adicionales para documentos específicos
  sanction?: DynamicPDFParams['sanction'];
  vacation?: DynamicPDFParams['vacation'];
  training?: DynamicPDFParams['training'];
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
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

// Función compartida para generar PDF usando componentes React
// Ahora intenta primero usar templates dinámicos de la BD
export const generatePDFFromReactComponents = async (params: GeneratePDFParams): Promise<PDFGenerationResult> => {
  const { documentType, employeeData, generatedDate, documentId, sanction, vacation, training } = params;
  
  const isPreview = documentId.startsWith('preview_');
  console.log('🚀 [PDF Generator] Iniciando generación', isPreview ? '(PREVIEW)' : '(GUARDAR)');
  
  // 1. INTENTAR USAR GENERADOR DINÁMICO PRIMERO
  try {
    console.log('📄 [PDF Generator] Intentando usar templates dinámicos...');
    
    const dynamicResult = await generateDynamicPDF({
      templateType: documentType,
      employeeData: {
        nombres: employeeData.nombres,
        apellidos: employeeData.apellidos,
        dni: employeeData.dni,
        direccion: employeeData.direccion,
        cuil: employeeData.cuil,
        puesto: employeeData.puesto,
        departamento: employeeData.departamento,
        fecha_ingreso: employeeData.fecha_ingreso,
      },
      documentId,
      sanction,
      vacation,
      training,
    });
    
    if (dynamicResult.success) {
      console.log('✅ [PDF Generator] PDF generado con sistema dinámico', 
        dynamicResult.usedDynamicTemplate ? '(template BD)' : '(fallback jsPDF)');
      return {
        success: true,
        pdfUrl: dynamicResult.pdfUrl,
        blob: dynamicResult.blob,
        usedDynamicTemplate: dynamicResult.usedDynamicTemplate,
      };
    }
  } catch (error) {
    console.warn('⚠️ [PDF Generator] Error en generador dinámico, usando método legacy:', error);
  }
  
  // 2. FALLBACK: MÉTODO LEGACY CON REACT COMPONENTS
  console.log('🔄 [PDF Generator] Usando método legacy (React components)');

  try {
    // Crear div temporal COMPLETAMENTE VISIBLE para html2canvas
    const tempDiv = window.document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '0';
    tempDiv.style.left = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.height = 'auto';
    tempDiv.style.minHeight = '297mm';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.zIndex = '10000';
    tempDiv.style.visibility = 'visible';
    tempDiv.style.opacity = '1';
    tempDiv.style.display = 'block';
    tempDiv.style.overflow = 'visible';
    
    // Hacer scroll hacia arriba para asegurar que el div esté en viewport
    window.scrollTo(0, 0);
    
    window.document.body.appendChild(tempDiv);
    
    console.log('📍 [REACT PDF] Div temporal creado y agregado al DOM');

    const root = createRoot(tempDiv);

    const employeeName = `${employeeData.nombres} ${employeeData.apellidos}`;
    // Formatear fecha correctamente evitando problemas de zona horaria
    const dateObj = new Date(generatedDate + 'T12:00:00'); // Agregar hora para evitar problemas de zona horaria
    const formattedDate = dateObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    console.log('📄 [REACT PDF] Renderizando para:', employeeName, 'Fecha:', formattedDate);

    // Renderizar el componente React correspondiente
    if (documentType === 'consentimiento_datos_biometricos') {
      root.render(
        React.createElement(ConsentimientoSimple, {
          employeeName: employeeName,
          employeeDni: employeeData.dni,
          employeeAddress: employeeData.direccion || 'Sin dirección registrada',
          date: formattedDate
        })
      );
    } else if (documentType === 'reglamento_interno') {
      root.render(
        React.createElement(ReglamentoInternoSimple, {
          employeeName: employeeName,
          date: formattedDate
        })
      );
    } else {
      throw new Error(`Tipo de documento no soportado: ${documentType}`);
    }

    // Esperar a que React renderice completamente el contenido
    await new Promise(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            // Verificar que el contenido se haya renderizado
            const hasContent = tempDiv.innerHTML.length > 100;
            console.log('🔍 [REACT PDF] Contenido renderizado:', hasContent, 'Longitud HTML:', tempDiv.innerHTML.length);
            resolve(undefined);
          }, 2000); // Aún más tiempo para renderizado completo
        });
      });
    });

    console.log('✅ [REACT PDF] Componente renderizado, verificando contenido...');
    console.log('📏 [REACT PDF] Contenido del div temporal:', tempDiv.innerHTML.substring(0, 500));
    console.log('📐 [REACT PDF] Dimensiones del div:', {
      width: tempDiv.offsetWidth,
      height: tempDiv.offsetHeight,
      scrollHeight: tempDiv.scrollHeight
    });

    // Configuración html2pdf
    const options = {
      margin: [10, 10, 10, 10],
      filename: `${documentType}_${employeeData.dni}_${generatedDate}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0,
        width: 794,
        windowWidth: 794,
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
    console.log('🔄 [REACT PDF] Iniciando html2pdf...');
    const worker = (html2pdf as any)().from(tempDiv).set(options).toPdf();
    console.log('⚙️ [REACT PDF] Obteniendo PDF...');
    const pdf = await worker.get('pdf');
    console.log('📄 [REACT PDF] Generando blob...');
    const blob = pdf.output('blob');

    console.log('📦 [REACT PDF] PDF generado, tamaño:', blob.size, 'bytes');
    
    if (blob.size < 10000) {
      console.error('⚠️ [REACT PDF] PDF muy pequeño o posiblemente vacío (tamaño:', blob.size, 'bytes). Contenido del div:', tempDiv.innerHTML.substring(0, 1000));
      console.log('🔄 [REACT PDF] Activando fallback automático...');
    }

    // Limpiar DOM
    root.unmount();
    if (window.document.body.contains(tempDiv)) {
      window.document.body.removeChild(tempDiv);
    }

    if (blob.size === 0 || blob.size < 10000) {
      console.error('❌ [REACT PDF] PDF vacío o muy pequeño, intentando método alternativo...');
      
      // Método alternativo: usar jsPDF directamente como fallback
      const { jsPDF } = await import('jspdf');
      const fallbackDoc = new jsPDF();
      
      if (documentType === 'consentimiento_datos_biometricos') {
        // Consentimiento de Datos Biométricos
        fallbackDoc.setFontSize(16);
        fallbackDoc.text('CONSTANCIA DE CONSENTIMIENTO PARA USO DE', 20, 30);
        fallbackDoc.text('CAMARAS DE VIGILANCIA Y DATOS BIOMETRICOS', 20, 45);
        
        fallbackDoc.setFontSize(12);
        fallbackDoc.text(`Fecha: ${formattedDate}`, 20, 70);
        fallbackDoc.text(`Empleado: ${employeeName}`, 20, 85);
        fallbackDoc.text(`DNI: ${employeeData.dni}`, 20, 100);
        fallbackDoc.text(`Direccion: ${employeeData.direccion || 'Sin direccion registrada'}`, 20, 115);
        
        fallbackDoc.text('En la ciudad de Cordoba Capital, comparece el/la trabajador/a', 20, 140);
        fallbackDoc.text(`${employeeName}, DNI N° ${employeeData.dni}, quien manifiesta`, 20, 155);
        fallbackDoc.text('prestar su consentimiento expreso para el uso de camaras de', 20, 170);
        fallbackDoc.text('vigilancia y datos biometricos en las instalaciones de', 20, 185);
        fallbackDoc.text('la empresa.', 20, 200);
        
        fallbackDoc.text('Firma del empleado:', 20, 240);
        fallbackDoc.text('_________________________', 20, 260);
        fallbackDoc.text(`Aclaracion: ${employeeName}`, 20, 275);
        fallbackDoc.text(`DNI: ${employeeData.dni}`, 20, 290);
        fallbackDoc.text(`Fecha: ${formattedDate}`, 20, 305);
        
      } else if (documentType === 'reglamento_interno') {
        // Reglamento Interno
        fallbackDoc.setFontSize(18);
        fallbackDoc.text('REGLAMENTO INTERNO', 20, 30);
        fallbackDoc.setFontSize(16);
        fallbackDoc.text(clientConfig.nombre.toUpperCase(), 20, 50);
        
        fallbackDoc.setFontSize(12);
        fallbackDoc.text(`Fecha: ${formattedDate}`, 20, 75);
        fallbackDoc.text(`Nombre del empleado: ${employeeName}`, 20, 90);
        
        fallbackDoc.text('Este reglamento tiene por objetivo establecer normas claras', 20, 115);
        fallbackDoc.text('de convivencia, obligaciones, derechos y procedimientos que', 20, 130);
        fallbackDoc.text('garanticen un ambiente de trabajo ordenado, seguro y', 20, 145);
        fallbackDoc.text('respetuoso para todos.', 20, 160);
        
        fallbackDoc.setFontSize(14);
        fallbackDoc.text('1. OBLIGACIONES Y DEBERES DE LOS EMPLEADOS', 20, 185);
        
        fallbackDoc.setFontSize(12);
        fallbackDoc.text('• Cumplir con las obligaciones propias del puesto de trabajo', 25, 205);
        fallbackDoc.text('• Observar las ordenes e instrucciones impartidas', 25, 220);
        fallbackDoc.text('• Guardar secreto de las informaciones reservadas', 25, 235);
        fallbackDoc.text('• Conservar los instrumentos de trabajo', 25, 250);
        
        fallbackDoc.text('Firma del empleado:', 20, 280);
        fallbackDoc.text('_________________________', 20, 300);
        fallbackDoc.text(`Aclaracion: ${employeeName}`, 20, 315);
        fallbackDoc.text(`Fecha: ${formattedDate}`, 20, 330);
      }
      
      const fallbackBlob = fallbackDoc.output('blob');
      console.log('🔄 [REACT PDF] Usando PDF de fallback, tamaño:', fallbackBlob.size, 'bytes');
      
      // Usar el blob de fallback
      const finalBlob = fallbackBlob;
      
      // Limpiar DOM
      root.unmount();
      if (window.document.body.contains(tempDiv)) {
        window.document.body.removeChild(tempDiv);
      }
      
      // Continuar con el proceso usando el fallback
      if (!isPreview) {
        const fileName = `${documentId}_${documentType}_${employeeData.dni}_${Date.now()}.pdf`;
        console.log('☁️ [REACT PDF] Subiendo fallback a Supabase:', fileName);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, finalBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('❌ [REACT PDF] Error subiendo fallback:', uploadError);
          throw new Error(`Error subiendo archivo: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);

        return {
          success: true,
          pdfUrl: urlData.publicUrl,
          blob: finalBlob
        };
      } else {
        return {
          success: true,
          blob: finalBlob
        };
      }
    }

    // Solo subir a Supabase si NO es preview
    if (!isPreview) {
      const fileName = `${documentId}_${documentType}_${employeeData.dni}_${Date.now()}.pdf`;
      console.log('☁️ [REACT PDF] Subiendo a Supabase:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [REACT PDF] Error subiendo:', uploadError);
        throw new Error(`Error subiendo archivo: ${uploadError.message}`);
      }

      console.log('✅ [REACT PDF] Archivo subido exitosamente');

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) {
        throw new Error('No se pudo obtener la URL del archivo');
      }

      console.log('🎉 [REACT PDF] Proceso completado exitosamente');

      return {
        success: true,
        pdfUrl: urlData.publicUrl,
        blob: blob
      };
    } else {
      console.log('📥 [REACT PDF] Preview generado - NO se sube a Supabase');
      
      return {
        success: true,
        blob: blob
      };
    }

  } catch (error) {
    console.error('❌ [REACT PDF] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
};

// Función simple para firmar (actualizar estado)
export const signPDF = async (params: SignPDFParams): Promise<PDFGenerationResult> => {
  console.log('✍️ [REACT PDF] Firmando documento:', params.documentId);
  
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
    
    console.log('✅ [REACT PDF] Documento firmado exitosamente');
    
    return {
      success: true
    };
    
  } catch (error) {
    console.error('❌ [REACT PDF] Error firmando documento:', error);
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
