import { useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import ConsentimientoDatosBiometricos from "./templates/ConsentimientoDatosBiometricos";
import ReglamentoInterno from "./templates/ReglamentoInterno";
import DocumentPreview from "./DocumentPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Search, Download, Eye, Trash2, CheckCircle, Clock, PenTool } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import DocumentForm from "./DocumentForm";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useDocuments } from "@/hooks/useDocuments";
import { generateAndUploadPDF, downloadPDFFromStorage, deletePDFFromStorage, signPDF } from "@/utils/pdfGenerator";
import { formatDateLocal } from "@/utils/dateUtils";

const DocumentsModule = () => {
  const { toast } = useToast();
  const { getActiveEmployees } = useEmployees();
  const activeEmployees = getActiveEmployees();
  const { documents, loading, addDocument, updateDocument, deleteDocument } = useDocuments();
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  const [view, setView] = useState<"list" | "form">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const documentTypes = [
    { value: "reglamento_interno", label: "Reglamento Interno" },
    { value: "consentimiento_datos_biometricos", label: "Constancia de Consentimiento para Uso de Cámaras de Vigilancia y Datos Biométricos" },
    { value: "despido_periodo_prueba", label: "Despido - Período de Prueba" },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.empleadoNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === "all" || doc.document_type === filterType;
    const matchesStatus = !filterStatus || filterStatus === "all" || doc.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleNewDocument = () => {
    setView("form");
  };

  const handleBackToList = () => {
    setView("list");
  };

  const handleSaveDocument = async (documentData: any) => {
    console.log('📝 [DOCUMENTS MODULE] Guardando documento:', documentData);
    
    const newDoc = await addDocument(documentData);
    console.log('✅ [DOCUMENTS MODULE] Documento guardado:', newDoc);
    
    if (newDoc) {
      console.log('🚀 [DOCUMENTS MODULE] Iniciando generación de PDF para documento:', newDoc.id);
      
      // Buscar empleado para obtener datos completos
      const employee = activeEmployees.find(e => e.id === newDoc.employee_id);
      if (!employee) {
        console.error('❌ [DOCUMENTS MODULE] Empleado no encontrado:', newDoc.employee_id);
        return newDoc;
      }
      
      console.log('👤 [DOCUMENTS MODULE] Empleado encontrado:', employee.nombres, employee.apellidos);
      console.log('🔍 [DOCUMENTS MODULE] Datos completos del empleado:', {
        id: employee.id,
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        dni: employee.dni,
        direccion: employee.direccion,
        email: employee.email
      });
      
      // Preparar datos para PDF
      const pdfParams = {
        documentType: newDoc.document_type,
        employeeData: {
          nombres: employee.nombres,
          apellidos: employee.apellidos,
          dni: employee.dni,
          direccion: employee.direccion || '',
        },
        generatedDate: newDoc.generated_date,
        documentId: newDoc.id,
      };
      
      console.log('📤 [DOCUMENTS MODULE] Enviando parámetros a generateAndUploadPDF:', pdfParams);
      
      // Usar la utilidad centralizada de generación de PDF
      const pdfResult = await generateAndUploadPDF(pdfParams);
      
      console.log('📊 [DOCUMENTS MODULE] Resultado PDF:', pdfResult);
      
      if (pdfResult.success && pdfResult.pdfUrl) {
        console.log('✅ [DOCUMENTS MODULE] PDF generado, actualizando documento con URL...');
        
        // Actualizar el documento con la URL del PDF
        await updateDocument(newDoc.id, { pdf_url: pdfResult.pdfUrl });
        console.log('🔗 [DOCUMENTS MODULE] Documento actualizado con PDF URL:', pdfResult.pdfUrl);
      } else {
        console.error('❌ [DOCUMENTS MODULE] Error generando PDF:', pdfResult.error);
      }
    }
    
    return newDoc;
  };

  const handleDeleteDocument = async (documentId: string) => {
    await deleteDocument(documentId);
  };

  const handleSignDocument = async (documentId: string) => {
    try {
      console.log('✍️ [DOCUMENTS MODULE] Iniciando firma de documento:', documentId);
      
      const signResult = await signPDF({
        documentId: documentId,
        signedDate: new Date().toISOString().split('T')[0],
        signatureCode: `SIGN_${Date.now()}` // Código único de firma
      });
      
      if (signResult.success) {
        toast({
          title: "Documento firmado",
          description: "El documento ha sido firmado exitosamente",
        });
        
        // Los documentos se actualizarán automáticamente por el hook
        console.log('✅ [DOCUMENTS MODULE] Documento firmado, estado actualizado');
      } else {
        throw new Error(signResult.error || 'Error desconocido');
      }
      
    } catch (error) {
      console.error('❌ [DOCUMENTS MODULE] Error firmando documento:', error);
      toast({
        title: "Error",
        description: "No se pudo firmar el documento: " + (error instanceof Error ? error.message : 'Error desconocido'),
        variant: "destructive",
      });
    }
  };

  const handleToggleDocumentStatus = async (document: any) => {
    const newStatus = document.status === 'generado' ? 'firmado' : 'generado';
    const updateData: any = { status: newStatus };
    
    if (newStatus === 'firmado' && !document.signed_date) {
      updateData.signed_date = new Date().toISOString().split('T')[0];
    }
    
    await updateDocument(document.id, updateData);
  };

  const handleDownloadDocument = async (docRecord: any) => {
    try {
      console.log('📥 [DOWNLOAD] Iniciando descarga para documento:', docRecord.id);
      console.log('🔗 [DOWNLOAD] PDF URL:', docRecord.pdf_url);
      
      // Si existe pdf_url, descargar desde el bucket
      if (docRecord.pdf_url) {
        // Extraer solo el nombre del archivo de la URL completa
        const fileName = docRecord.pdf_url.split('/').pop();
        console.log('📁 [DOWNLOAD] Nombre de archivo extraído:', fileName);
        
        const { data, error } = await supabase.storage
          .from('documents')
          .download(fileName);

        if (error) {
          console.error('❌ [DOWNLOAD] Error descargando:', error);
          throw error;
        }

        console.log('✅ [DOWNLOAD] Archivo descargado exitosamente');
        
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);

        toast({
          title: "PDF descargado",
          description: "El documento se ha descargado exitosamente",
        });
        return;
      }

      // Si no existe, generar y subir el PDF primero
      const employee = activeEmployees.find(e => e.id === docRecord.employee_id);
      if (!employee) {
        toast({
          title: "Error",
          description: "No se encontraron los datos del empleado",
          variant: "destructive",
        });
        return;
      }
      
      // Generar el PDF y subirlo
      const pdfResult = await generateAndUploadPDF(docRecord);
      
      if (!pdfResult.success || !pdfResult.pdfUrl) {
        throw new Error(pdfResult.error || 'Error generando PDF');
      }
      
      // Extraer el nombre del archivo de la URL
      const fileName = pdfResult.pdfUrl.split('/').pop();
      
      // Descargar el archivo recién subido
      const { data, error } = await supabase.storage
        .from('documents')
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "PDF descargado",
        description: "El documento se ha descargado exitosamente",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF",
        variant: "destructive",
      });
    }
  };

  const handleViewDocument = (docRecord: any) => {
    // Encontrar los datos completos del empleado para la vista previa
    const employee = activeEmployees.find(e => e.id === docRecord.employee_id);
    if (!employee) {
      toast({
        title: "Error",
        description: "No se encontraron los datos del empleado",
        variant: "destructive",
      });
      return;
    }

    setPreviewDoc({
      documentType: docRecord.document_type,
      employeeData: {
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        dni: employee.dni,
        direccion: employee.direccion || "",
      },
      generatedDate: docRecord.generated_date,
    });
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType ? docType.label : type;
  };

  if (view === "form") {
    return (
      <DocumentForm
        onBack={handleBackToList}
        onSave={handleSaveDocument}
        employees={activeEmployees}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Documentos</h2>
            <p className="text-foreground/70">Generar y administrar documentos para firma de empleados</p>
          </div>
        </div>
        <Button onClick={handleNewDocument}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Documento
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {documentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="generado">Generado</SelectItem>
                <SelectItem value="firmado">Firmado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-foreground/70">
              Mostrando {filteredDocuments.length} de {documents.length} documentos
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron documentos
              </h3>
              <p className="text-foreground/70 mb-4">
                Comienza generando un nuevo documento para tus empleados.
              </p>
              <Button onClick={handleNewDocument}>
                <Plus className="h-4 w-4 mr-2" />
                Generar Primer Documento
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Empleado</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Tipo de Documento</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Fecha Generación</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Fecha Firma</th>
                    <th className="text-center py-3 px-4 font-medium text-foreground/70">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document) => (
                    <tr key={document.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">{document.empleadoNombre}</div>
                          <div className="text-sm text-foreground/70">DNI: {document.empleadoDni}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-foreground">
                          {getDocumentTypeLabel(document.document_type)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-foreground">
                          {new Date(document.generated_date + 'T12:00:00').toLocaleDateString('es-AR')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleDocumentStatus(document)}
                          className="cursor-pointer"
                        >
                          <Badge 
                            variant={document.status === "firmado" ? "default" : "secondary"}
                            className="hover:opacity-80 transition-opacity"
                          >
                            {document.status === "firmado" ? (
                              <><CheckCircle className="h-3 w-3 mr-1 inline" />Firmado</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1 inline" />Generado</>
                            )}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-foreground">
                          {document.signed_date 
                            ? formatDateLocal(document.signed_date)
                            : '-'
                          }
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-1 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDocument(document)}
                            className="text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Ver
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadDocument(document)}
                            className="text-xs"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          {document.status === 'generado' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSignDocument(document.id)}
                              className="text-xs text-green-600 hover:text-green-700"
                              title="Firmar documento"
                            >
                              <PenTool className="h-3 w-3" />
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-xs text-destructive">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El documento será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteDocument(document.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      {previewDoc && (
        <DocumentPreview
          documentType={previewDoc.documentType}
          employeeData={previewDoc.employeeData}
          generatedDate={previewDoc.generatedDate}
          onClose={() => setPreviewDoc(null)}
          onConfirm={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};

export default DocumentsModule;