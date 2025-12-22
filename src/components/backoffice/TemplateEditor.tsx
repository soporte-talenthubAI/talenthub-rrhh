/**
 * Editor de Templates de Documentos
 * 
 * Permite:
 * - Ver lista de templates disponibles
 * - Editar contenido HTML de templates
 * - Previsualizar templates con datos de ejemplo
 * - Crear nuevos templates
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, Code, Eye, Save, Plus, Copy, 
  ChevronLeft, AlertCircle, CheckCircle, Trash2,
  Upload, File, Download, FolderOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  getTemplateTypes, 
  getAllTemplates, 
  saveTemplate, 
  deleteTemplate,
  replacePlaceholders,
  saveTemplateWithPDF,
  DocumentTemplate,
  TemplateType,
  AVAILABLE_MODULES
} from "@/services/templateService";

// Datos de ejemplo para preview
const SAMPLE_DATA = {
  nombres: "Juan Carlos",
  apellidos: "Pérez González",
  dni: "30456789",
  cuil: "20-30456789-3",
  direccion: "Av. Siempre Viva 123, Córdoba",
  puesto: "Operario de Producción",
  departamento: "Producción",
  fecha_ingreso: "2022-03-15",
  sanction: {
    motivo: "Llegada tardía reiterada sin justificación",
    fecha_hecho: "2024-12-18",
    lugar_hecho: "Planta de Producción",
    dias_suspension: 2,
    fecha_inicio: "2024-12-20",
    fecha_reincorporacion: "2024-12-22",
  },
  vacation: {
    fecha_inicio: "2025-01-15",
    fecha_fin: "2025-01-28",
    dias: 14,
  },
  training: {
    titulo: "Seguridad e Higiene en el Trabajo",
    fecha: "2024-12-15",
    duracion: "4 horas",
    instructor: "Ing. María García",
  },
};

// Lista de placeholders disponibles
const PLACEHOLDERS = [
  { category: "Empleado", items: [
    { key: "{{empleado_nombre}}", desc: "Nombre completo" },
    { key: "{{empleado_nombres}}", desc: "Nombres" },
    { key: "{{empleado_apellidos}}", desc: "Apellidos" },
    { key: "{{empleado_dni}}", desc: "DNI" },
    { key: "{{empleado_cuil}}", desc: "CUIL" },
    { key: "{{empleado_direccion}}", desc: "Dirección" },
    { key: "{{empleado_puesto}}", desc: "Puesto" },
    { key: "{{empleado_sector}}", desc: "Sector/Departamento" },
    { key: "{{empleado_fecha_ingreso}}", desc: "Fecha de ingreso" },
  ]},
  { category: "Empresa", items: [
    { key: "{{empresa_nombre}}", desc: "Nombre de la empresa" },
    { key: "{{empresa_cuit}}", desc: "CUIT" },
    { key: "{{empresa_direccion}}", desc: "Dirección" },
  ]},
  { category: "Fecha", items: [
    { key: "{{fecha_actual}}", desc: "Fecha actual (dd/mm/yyyy)" },
    { key: "{{fecha_actual_texto}}", desc: "Fecha en texto" },
  ]},
  { category: "Sanción", items: [
    { key: "{{motivo}}", desc: "Motivo de la sanción" },
    { key: "{{fecha_hecho}}", desc: "Fecha del hecho" },
    { key: "{{lugar_hecho}}", desc: "Lugar del hecho" },
    { key: "{{dias_suspension}}", desc: "Días de suspensión" },
    { key: "{{fecha_inicio}}", desc: "Fecha inicio suspensión" },
    { key: "{{fecha_reincorporacion}}", desc: "Fecha reincorporación" },
  ]},
  { category: "Vacaciones", items: [
    { key: "{{fecha_inicio}}", desc: "Fecha inicio vacaciones" },
    { key: "{{fecha_fin}}", desc: "Fecha fin vacaciones" },
    { key: "{{dias}}", desc: "Días de vacaciones" },
  ]},
];

interface TemplateEditorProps {
  onBack?: () => void;
}

export const TemplateEditor = ({ onBack }: TemplateEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templateTypes, setTemplateTypes] = useState<TemplateType[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    nombre: "",
    template_type_id: "",
    module_id: "",
    descripcion: "",
  });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [filterModule, setFilterModule] = useState<string>("all");

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [types, temps] = await Promise.all([
        getTemplateTypes(),
        getAllTemplates(),
      ]);
      setTemplateTypes(types);
      setTemplates(temps);
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

  // Seleccionar template
  const handleSelectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setEditedContent(template.contenido_html || "");
    updatePreview(template.contenido_html || "");
  };

  // Actualizar preview
  const updatePreview = (html: string) => {
    try {
      const processed = replacePlaceholders(html, SAMPLE_DATA);
      setPreviewHtml(processed);
    } catch (error) {
      console.error("Error processing preview:", error);
      setPreviewHtml(html);
    }
  };

  // Guardar cambios
  const handleSave = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    try {
      const result = await saveTemplate({
        id: selectedTemplate.id,
        template_type_id: selectedTemplate.template_type_id,
        nombre: selectedTemplate.nombre,
        contenido_html: editedContent,
      });
      
      if (result) {
        toast({
          title: "Template guardado",
          description: "Los cambios se guardaron correctamente",
        });
        
        // Actualizar lista local
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplate.id ? { ...t, contenido_html: editedContent } : t
        ));
        setSelectedTemplate(prev => prev ? { ...prev, contenido_html: editedContent } : null);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Crear nuevo template
  const handleCreateTemplate = async () => {
    if (!newTemplate.nombre || !newTemplate.template_type_id || !newTemplate.module_id) {
      toast({
        title: "Campos requeridos",
        description: "Complete nombre, tipo y módulo",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    try {
      const defaultHtml = pdfFile ? null : `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; padding: 40px; }
    h1 { text-align: center; }
    .header { text-align: center; margin-bottom: 30px; }
    .empresa { font-weight: bold; font-size: 16px; }
    .firma { margin-top: 80px; text-align: center; }
    .firma-linea { border-top: 1px solid #000; width: 200px; margin: 0 auto; padding-top: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">{{empresa_nombre}}</div>
  </div>
  
  <h1>${newTemplate.nombre.toUpperCase()}</h1>
  
  <p>Fecha: {{fecha_actual}}</p>
  
  <p>Empleado: {{empleado_nombre}}</p>
  <p>DNI: {{empleado_dni}}</p>
  
  <!-- Agregue aquí el contenido del documento -->
  
  <div class="firma">
    <div class="firma-linea">Firma del empleado</div>
  </div>
</body>
</html>`;

      const result = await saveTemplateWithPDF({
        template_type_id: newTemplate.template_type_id,
        nombre: newTemplate.nombre,
        module_id: newTemplate.module_id,
        descripcion: newTemplate.descripcion,
        contenido_html: defaultHtml,
        is_active: true,
        is_default: false,
      }, pdfFile || undefined);
      
      if (result) {
        toast({
          title: "Template creado",
          description: pdfFile 
            ? "Template PDF subido correctamente" 
            : "Template HTML creado correctamente",
        });
        
        setTemplates(prev => [...prev, result]);
        setShowNewDialog(false);
        setNewTemplate({ nombre: "", template_type_id: "", module_id: "", descripcion: "" });
        setPdfFile(null);
        handleSelectTemplate(result);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Manejar selección de archivo PDF
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Archivo inválido",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Archivo muy grande",
          description: "El archivo no puede superar 10MB",
          variant: "destructive",
        });
        return;
      }
      setPdfFile(file);
    }
  };

  // Filtrar templates por módulo
  const filteredTemplates = filterModule === "all" 
    ? templates 
    : templates.filter(t => t.module_id === filterModule);

  // Copiar placeholder al portapapeles
  const copyPlaceholder = (placeholder: string) => {
    navigator.clipboard.writeText(placeholder);
    toast({
      title: "Copiado",
      description: `${placeholder} copiado al portapapeles`,
    });
  };

  // Eliminar template
  const handleDelete = async () => {
    if (!selectedTemplate) return;
    
    if (!confirm("¿Está seguro de eliminar este template?")) return;
    
    try {
      await deleteTemplate(selectedTemplate.id);
      toast({
        title: "Template eliminado",
        description: "El template fue desactivado",
      });
      
      setTemplates(prev => prev.filter(t => t.id !== selectedTemplate.id));
      setSelectedTemplate(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el template",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Cargando templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="text-slate-300">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">Editor de Templates</h2>
            <p className="text-sm text-slate-400">
              Personaliza los documentos PDF para cada cliente
            </p>
          </div>
        </div>
        
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Nuevo Template</DialogTitle>
              <DialogDescription className="text-slate-400">
                Sube un PDF o crea un template HTML
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nombre del Template *</Label>
                <Input
                  value={newTemplate.nombre}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Constancia de Trabajo"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Módulo *</Label>
                  <Select
                    value={newTemplate.module_id}
                    onValueChange={(v) => setNewTemplate(prev => ({ ...prev, module_id: v }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Seleccione módulo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODULES.map(mod => (
                        <SelectItem key={mod.id} value={mod.id}>
                          {mod.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-300">Tipo de Documento *</Label>
                  <Select
                    value={newTemplate.template_type_id}
                    onValueChange={(v) => setNewTemplate(prev => ({ ...prev, template_type_id: v }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Seleccione tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templateTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-300">Descripción</Label>
                <Input
                  value={newTemplate.descripcion}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Descripción breve del template"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              {/* Upload PDF */}
              <div className="space-y-2">
                <Label className="text-slate-300">Archivo PDF (opcional)</Label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <File className="h-8 w-8 text-emerald-400" />
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{pdfFile.name}</p>
                        <p className="text-slate-400 text-xs">
                          {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPdfFile(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm">
                        Click para subir PDF
                      </p>
                      <p className="text-slate-500 text-xs mt-1">
                        Máximo 10MB
                      </p>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Si no subes un PDF, se creará un template HTML editable
                </p>
              </div>
              
              <Button 
                onClick={handleCreateTemplate} 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={saving}
              >
                {saving ? "Creando..." : pdfFile ? "Subir Template PDF" : "Crear Template HTML"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Lista de Templates */}
        <div className="col-span-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <span>Templates</span>
                <Badge variant="secondary" className="text-xs">
                  {filteredTemplates.length}
                </Badge>
              </CardTitle>
              {/* Filtro por módulo */}
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los módulos</SelectItem>
                  <Separator className="my-1" />
                  {AVAILABLE_MODULES.map(mod => (
                    <SelectItem key={mod.id} value={mod.id}>
                      {mod.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[450px]">
                <div className="space-y-1 p-3">
                  {filteredTemplates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleSelectTemplate(template)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "bg-emerald-600/30 border border-emerald-500"
                          : "bg-slate-700/50 hover:bg-slate-700 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-white text-sm truncate flex-1">
                          {template.nombre}
                        </p>
                        {template.pdf_url && (
                          <Badge variant="outline" className="text-xs border-red-500 text-red-400 ml-2">
                            PDF
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {template.template_type_id}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {template.module_id && (
                          <Badge variant="secondary" className="text-xs">
                            {AVAILABLE_MODULES.find(m => m.id === template.module_id)?.nombre || template.module_id}
                          </Badge>
                        )}
                        {template.is_default && (
                          <Badge className="text-xs bg-emerald-600">
                            Default
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {filteredTemplates.length === 0 && (
                    <p className="text-center text-slate-400 py-8 text-sm">
                      {filterModule === "all" 
                        ? "No hay templates. Crea uno nuevo."
                        : "No hay templates para este módulo."}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Editor */}
        <div className="col-span-9">
          {selectedTemplate ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      {selectedTemplate.nombre}
                      {selectedTemplate.pdf_url && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-400">
                          PDF
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Tipo: {selectedTemplate.template_type_id}
                      {selectedTemplate.module_id && (
                        <span className="ml-2">
                          | Módulo: {AVAILABLE_MODULES.find(m => m.id === selectedTemplate.module_id)?.nombre}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedTemplate.pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedTemplate.pdf_url!, '_blank')}
                        className="border-slate-600 text-slate-300"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {!selectedTemplate.pdf_url && (
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? "Guardando..." : "Guardar"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Si es PDF, mostrar visor de PDF */}
                {selectedTemplate.pdf_url ? (
                  <div className="space-y-4">
                    <div className="bg-slate-900 rounded-lg p-4 text-center">
                      <File className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">
                        {selectedTemplate.pdf_filename || 'Template PDF'}
                      </p>
                      <p className="text-slate-400 text-sm mb-4">
                        Este template es un archivo PDF. Los campos se llenarán automáticamente
                        con la información del empleado al generar el documento.
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={() => window.open(selectedTemplate.pdf_url!, '_blank')}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver PDF
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = selectedTemplate.pdf_url!;
                            a.download = selectedTemplate.pdf_filename || 'template.pdf';
                            a.click();
                          }}
                          className="border-slate-600 text-slate-300"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                    
                    {/* Iframe para preview del PDF */}
                    <div className="bg-white rounded-lg overflow-hidden">
                      <iframe
                        src={selectedTemplate.pdf_url}
                        className="w-full h-[500px] border-0"
                        title="PDF Preview"
                      />
                    </div>
                  </div>
                ) : (
                  /* Si es HTML, mostrar editor */
                  <Tabs defaultValue="editor" className="space-y-4">
                    <TabsList className="bg-slate-700">
                      <TabsTrigger value="editor" className="data-[state=active]:bg-emerald-600">
                        <Code className="h-4 w-4 mr-2" />
                        Editor HTML
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="data-[state=active]:bg-emerald-600">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                      <TabsTrigger value="placeholders" className="data-[state=active]:bg-emerald-600">
                        <FileText className="h-4 w-4 mr-2" />
                        Variables
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="editor">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => {
                          setEditedContent(e.target.value);
                          updatePreview(e.target.value);
                        }}
                        className="font-mono text-sm bg-slate-900 border-slate-600 text-slate-200 min-h-[400px]"
                        placeholder="Escriba el HTML del template aquí..."
                      />
                    </TabsContent>

                    <TabsContent value="preview">
                      <div className="bg-white rounded-lg p-4 min-h-[400px]">
                        <iframe
                          srcDoc={previewHtml}
                          className="w-full h-[400px] border-0"
                          title="Template Preview"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="placeholders">
                      <div className="grid grid-cols-2 gap-4">
                        {PLACEHOLDERS.map((group) => (
                          <Card key={group.category} className="bg-slate-700/50 border-slate-600">
                            <CardHeader className="py-3">
                              <CardTitle className="text-white text-sm">{group.category}</CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <div className="space-y-2">
                                {group.items.map((item) => (
                                  <div
                                    key={item.key}
                                    className="flex items-center justify-between p-2 bg-slate-800 rounded"
                                  >
                                    <div>
                                      <code className="text-emerald-400 text-xs">{item.key}</code>
                                      <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyPlaceholder(item.key)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center h-[500px] text-slate-400">
                <FileText className="h-16 w-16 mb-4 text-slate-600" />
                <p>Seleccione un template para editar</p>
                <p className="text-sm mt-2">o cree uno nuevo con el botón "Nuevo Template"</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;

