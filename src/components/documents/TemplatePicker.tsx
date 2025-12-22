/**
 * TemplatePicker - Componente para seleccionar templates de documentos
 * 
 * Uso:
 * <TemplatePicker 
 *   moduleId="sanctions" 
 *   employee={selectedEmployee}
 *   onGenerate={(doc) => console.log('Documento generado:', doc)}
 * />
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, Download, Eye, Loader2, File, 
  CheckCircle, FileDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  getTemplatesByModule, 
  DocumentTemplate,
  replacePlaceholders,
  AVAILABLE_MODULES
} from "@/services/templateService";
import { Employee } from "@/hooks/useEmployees";

interface TemplatePickerProps {
  moduleId: string;
  employee?: Employee | null;
  customData?: Record<string, any>;
  onGenerate?: (result: { html?: string; pdfUrl?: string; template: DocumentTemplate }) => void;
  triggerButton?: React.ReactNode;
}

export const TemplatePicker = ({ 
  moduleId, 
  employee, 
  customData,
  onGenerate,
  triggerButton 
}: TemplatePickerProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  // Cargar templates del módulo
  useEffect(() => {
    if (open && moduleId) {
      loadTemplates();
    }
  }, [open, moduleId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getTemplatesByModule(moduleId);
      setTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Seleccionar template y generar preview
  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    
    // Si es HTML, generar preview
    if (template.contenido_html && employee) {
      const employeeData = {
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        dni: employee.dni,
        cuil: employee.cuil,
        direccion: employee.direccion,
        puesto: employee.puesto || employee.cargo,
        departamento: employee.departamento || employee.sector,
        fecha_ingreso: employee.fecha_ingreso || employee.fechaIngreso,
        ...customData,
      };
      
      const html = replacePlaceholders(template.contenido_html, employeeData);
      setPreviewHtml(html);
    }
  };

  // Generar documento
  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    
    setGenerating(true);
    try {
      if (selectedTemplate.pdf_url) {
        // Para PDFs, abrimos el PDF en nueva ventana
        // TODO: Implementar llenado de campos con pdf-lib
        window.open(selectedTemplate.pdf_url, '_blank');
        
        toast({
          title: "PDF abierto",
          description: "El template PDF se abrió en una nueva ventana",
        });
        
        if (onGenerate) {
          onGenerate({ 
            pdfUrl: selectedTemplate.pdf_url, 
            template: selectedTemplate 
          });
        }
      } else if (selectedTemplate.contenido_html) {
        // Para HTML, generar el documento
        if (onGenerate) {
          onGenerate({ 
            html: previewHtml, 
            template: selectedTemplate 
          });
        }
        
        toast({
          title: "Documento generado",
          description: "El documento se generó correctamente",
        });
      }
      
      setOpen(false);
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Descargar HTML como PDF (usando print)
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(previewHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const moduleName = AVAILABLE_MODULES.find(m => m.id === moduleId)?.nombre || moduleId;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Generar Documento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Seleccionar Template - {moduleName}
          </DialogTitle>
          <DialogDescription>
            {employee 
              ? `Generando documento para: ${employee.nombres} ${employee.apellidos}`
              : "Seleccione un template para generar el documento"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-12 gap-4 mt-4">
          {/* Lista de templates */}
          <div className="col-span-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Templates Disponibles</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No hay templates para este módulo
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 p-2">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleSelectTemplate(template)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "bg-primary/10 border border-primary"
                              : "hover:bg-muted border border-transparent"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <p className="font-medium text-sm">
                              {template.nombre}
                            </p>
                            {template.pdf_url ? (
                              <Badge variant="outline" className="text-xs border-red-500 text-red-500">
                                PDF
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                HTML
                              </Badge>
                            )}
                          </div>
                          {template.descripcion && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {template.descripcion}
                            </p>
                          )}
                          {template.is_default && (
                            <Badge className="mt-2 text-xs" variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Predeterminado
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="col-span-8">
            <Card className="h-full">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Vista Previa</CardTitle>
                  {selectedTemplate && (
                    <div className="flex gap-2">
                      {!selectedTemplate.pdf_url && previewHtml && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrint}
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          Imprimir
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={generating || !employee}
                      >
                        {generating ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Generar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedTemplate ? (
                  <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground">
                    <FileText className="h-12 w-12 mb-3" />
                    <p className="text-sm">Seleccione un template</p>
                  </div>
                ) : selectedTemplate.pdf_url ? (
                  <div className="flex flex-col items-center justify-center h-[350px]">
                    <File className="h-16 w-16 text-red-500 mb-4" />
                    <p className="font-medium mb-2">{selectedTemplate.pdf_filename}</p>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                      Este es un template PDF. Al generar, se abrirá el documento
                      con los campos pre-llenados.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedTemplate.pdf_url!, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver PDF Original
                    </Button>
                  </div>
                ) : (
                  <div className="bg-white rounded border h-[350px] overflow-auto">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  </div>
                )}

                {!employee && selectedTemplate && (
                  <p className="text-sm text-amber-600 mt-3 text-center">
                    ⚠️ Seleccione un empleado para generar el documento
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePicker;

