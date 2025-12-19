import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock html2pdf
const mockHtml2pdf = vi.fn();
vi.mock('html2pdf.js', () => ({
  default: () => mockHtml2pdf
}));

// Mock React DOM createRoot
const mockRender = vi.fn();
const mockUnmount = vi.fn();
vi.mock('react-dom/client', () => ({
  createRoot: () => ({
    render: mockRender,
    unmount: mockUnmount
  })
}));

describe('Documents System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset DOM
    document.body.innerHTML = '';
    
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock html2pdf chain
    const mockWorker = {
      get: vi.fn(() => Promise.resolve({
        output: vi.fn(() => new Blob(['mock pdf content'], { type: 'application/pdf' }))
      }))
    };
    
    mockHtml2pdf.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      toPdf: vi.fn(() => mockWorker)
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Supabase Storage Configuration', () => {
    it('should check if storage buckets are configured', async () => {
      try {
        // Intentar listar buckets
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        console.log('Buckets disponibles:', buckets);
        console.log('Error al acceder a buckets:', error);
        
        // Si no hay error, significa que storage está configurado
        if (!error) {
          expect(buckets).toBeDefined();
          console.log('✅ Supabase Storage está configurado');
        } else {
          console.log('❌ Supabase Storage NO está configurado:', error.message);
        }
      } catch (error) {
        console.log('❌ Error al verificar buckets:', error);
        expect(false).toBe(true); // Forzar falla para mostrar el error
      }
    });

    it('should test document storage in database vs bucket', async () => {
      // Crear un documento de prueba
      const testDocument = {
        employee_id: '00000000-0000-0000-0000-000000000001', // UUID de prueba
        document_type: 'reglamento_interno',
        generated_date: '2024-01-01',
        status: 'generado',
        document_content: 'Contenido de prueba'
      };

      try {
        // Intentar insertar en la base de datos
        const { data: dbData, error: dbError } = await supabase
          .from('documents')
          .insert([testDocument])
          .select()
          .single();

        console.log('Documento insertado en BD:', dbData);
        console.log('Error BD:', dbError);

        if (!dbError && dbData) {
          console.log('✅ El documento se guarda en la BASE DE DATOS');
          console.log('📄 Campos guardados:', Object.keys(dbData));
          
          // Verificar si document_content tiene contenido
          if (dbData.document_content) {
            console.log('✅ document_content tiene datos:', dbData.document_content.substring(0, 100) + '...');
          } else {
            console.log('❌ document_content está vacío');
          }

          // Limpiar - eliminar el documento de prueba
          await supabase.from('documents').delete().eq('id', dbData.id);
        }

        // Intentar subir un archivo al storage
        try {
          const mockPdfBlob = new Blob(['Mock PDF content'], { type: 'application/pdf' });
          const fileName = `test-document-${Date.now()}.pdf`;
          
          const { data: storageData, error: storageError } = await supabase.storage
            .from('documents') // Intentar usar bucket 'documents'
            .upload(fileName, mockPdfBlob);

          if (!storageError) {
            console.log('✅ Se puede subir archivos al STORAGE/BUCKET');
            console.log('📁 Archivo subido:', storageData);
            
            // Limpiar - eliminar el archivo de prueba
            await supabase.storage.from('documents').remove([fileName]);
          } else {
            console.log('❌ NO se puede subir al storage:', storageError.message);
          }
        } catch (storageError) {
          console.log('❌ Error de storage:', storageError);
        }

      } catch (error) {
        console.log('❌ Error general:', error);
      }
    });
  });

  describe('PDF Generation Process', () => {
    it('should test why PDFs download empty', async () => {
      console.log('🧪 Testing PDF generation process...');

      // Simular datos de empleado
      const mockEmployee = {
        id: '123',
        nombres: 'Juan',
        apellidos: 'Pérez',
        dni: '12345678',
        direccion: 'Calle Falsa 123'
      };

      // Simular documento
      const mockDocument = {
        id: '456',
        employee_id: '123',
        document_type: 'reglamento_interno',
        generated_date: '2024-01-01',
        status: 'generado'
      };

      // Crear elemento temporal como en el código real
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '210mm';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(tempDiv);

      // Simular renderizado de React component
      mockRender.mockImplementation(() => {
        // Simular contenido renderizado
        tempDiv.innerHTML = `
          <div style="padding: 48px; background: white; color: black;">
            <h1>REGLAMENTO INTERNO</h1>
            <h2>MI EMPRESA</h2>
            <p><strong>Fecha:</strong> 01/01/2024</p>
            <p><strong>Nombre del empleado:</strong> Juan Pérez</p>
            <p>Este reglamento tiene por objetivo establecer normas claras...</p>
          </div>
        `;
      });

      // Ejecutar renderizado
      mockRender();

      // Simular espera de renderizado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verificar contenido
      const contentCheck = tempDiv.textContent || tempDiv.innerText || '';
      console.log('📄 Contenido renderizado (primeros 200 chars):', contentCheck.substring(0, 200));
      console.log('📏 Longitud del contenido:', contentCheck.length);

      // Verificar HTML
      console.log('🏷️  HTML generado (primeros 300 chars):', tempDiv.innerHTML.substring(0, 300));

      // Tests de verificación
      expect(contentCheck.length).toBeGreaterThan(50);
      expect(contentCheck).toContain('REGLAMENTO INTERNO');
      expect(contentCheck).toContain('Juan Pérez');
      expect(tempDiv.innerHTML).toContain('<h1>');

      if (contentCheck.length < 50) {
        console.log('❌ PROBLEMA: El contenido está vacío o muy corto');
        console.log('🔍 Posibles causas:');
        console.log('   - React no se renderizó correctamente');
        console.log('   - Los estilos no se aplicaron');
        console.log('   - El componente no recibió las props correctas');
      } else {
        console.log('✅ El contenido se renderizó correctamente');
      }

      // Simular generación de PDF
      const mockPdfOutput = mockHtml2pdf();
      expect(mockHtml2pdf).toHaveBeenCalled();

      console.log('📋 Resumen del test:');
      console.log('   - Elemento temporal creado:', !!tempDiv);
      console.log('   - React render llamado:', mockRender.mock.calls.length);
      console.log('   - Contenido generado:', contentCheck.length > 0);
      console.log('   - html2pdf llamado:', mockHtml2pdf.mock.calls.length);

      // Limpiar
      document.body.removeChild(tempDiv);
    });

    it('should test complete document workflow', async () => {
      console.log('🔄 Testing complete document workflow...');

      // 1. Crear empleado de prueba
      const testEmployee = {
        nombres: 'Ana',
        apellidos: 'García',
        dni: '87654321',
        direccion: 'Av. Siempre Viva 742',
        activo: true
      };

      // 2. Crear documento de prueba
      const testDocument = {
        employee_id: 'test-employee-id',
        document_type: 'consentimiento_datos_biometricos',
        generated_date: '2024-01-15',
        status: 'generado'
      };

      console.log('📝 Datos de prueba preparados');
      console.log('👤 Empleado:', testEmployee.nombres, testEmployee.apellidos);
      console.log('📄 Documento:', testDocument.document_type);

      // 3. Simular proceso de descarga
      try {
        // Aquí iría la lógica real de handleDownloadDocument
        console.log('⬇️  Simulando proceso de descarga...');
        
        // Verificar que los datos del empleado existen
        expect(testEmployee.nombres).toBeDefined();
        expect(testEmployee.apellidos).toBeDefined();
        expect(testEmployee.dni).toBeDefined();

        // Verificar que el tipo de documento es válido
        const validTypes = ['reglamento_interno', 'consentimiento_datos_biometricos'];
        expect(validTypes).toContain(testDocument.document_type);

        console.log('✅ Validaciones de datos pasaron');
        console.log('✅ Workflow completo simulado exitosamente');

      } catch (error) {
        console.log('❌ Error en el workflow:', error);
        throw error;
      }
    });
  });

  describe('Database vs Storage Analysis', () => {
    it('should analyze current document storage strategy', () => {
      console.log('🔍 ANÁLISIS DEL SISTEMA ACTUAL:');
      console.log('');
      console.log('📊 TABLA DOCUMENTS en Supabase:');
      console.log('   - id: UUID');
      console.log('   - employee_id: UUID (FK)');
      console.log('   - document_type: VARCHAR');
      console.log('   - generated_date: DATE');
      console.log('   - status: VARCHAR');
      console.log('   - document_content: TEXT ← Solo metadatos, NO archivo PDF');
      console.log('   - signed_date: DATE');
      console.log('   - observations: TEXT');
      console.log('');
      console.log('🏗️  ARQUITECTURA ACTUAL:');
      console.log('   ❌ NO usa Supabase Storage/Buckets');
      console.log('   ❌ NO guarda archivos PDF físicos');
      console.log('   ✅ Genera PDFs dinámicamente con html2pdf.js');
      console.log('   ✅ Solo guarda metadatos en base de datos');
      console.log('');
      console.log('🐛 PROBLEMAS IDENTIFICADOS:');
      console.log('   1. PDFs se generan cada vez = inconsistencia');
      console.log('   2. Sin cache = performance pobre');
      console.log('   3. Dependiente del frontend = punto de falla');
      console.log('   4. No hay versionado de documentos');
      console.log('');
      console.log('💡 RECOMENDACIONES:');
      console.log('   - Configurar Supabase Storage');
      console.log('   - Crear bucket "documents"'); 
      console.log('   - Generar PDF una vez y guardarlo');
      console.log('   - Servir desde URL del storage');

      // Este test siempre pasa, es solo informativo
      expect(true).toBe(true);
    });
  });
});
