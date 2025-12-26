/**
 * Editor de Configuración del Cliente
 * 
 * Permite configurar:
 * - Nombre y logo de la empresa
 * - Colores de la marca
 * - Información de contacto
 * - Datos para documentos PDF
 */

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, Palette, FileText, Upload, Save, 
  CheckCircle, AlertCircle, Image as ImageIcon, LayoutGrid
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  getClientConfig, 
  updateClientConfig, 
  uploadClientLogo,
  ClientConfig 
} from "@/config/client";

// Lista de todos los módulos disponibles
const ALL_MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Panel general y estadísticas', isCore: true },
  { id: 'employees', name: 'Empleados', description: 'Gestión de legajos', isCore: true },
  { id: 'attendance', name: 'Asistencia', description: 'Control de asistencia', isCore: false },
  { id: 'vacations', name: 'Vacaciones', description: 'Gestión de vacaciones', isCore: false },
  { id: 'absences', name: 'Ausencias', description: 'Permisos y ausencias', isCore: false },
  { id: 'sanctions', name: 'Sanciones', description: 'Suspensiones y apercibimientos', isCore: false },
  { id: 'documents', name: 'Documentos', description: 'Gestión de documentos', isCore: false },
  { id: 'payroll', name: 'Nómina', description: 'Sueldos y pagos', isCore: false },
  { id: 'training', name: 'Capacitaciones', description: 'Formación y desarrollo', isCore: false },
  { id: 'uniforms', name: 'Uniformes', description: 'Entrega de uniformes', isCore: false },
  { id: 'performance', name: 'Desempeño', description: 'Evaluación de rendimiento', isCore: false },
  { id: 'selection', name: 'Selección', description: 'Reclutamiento', isCore: false },
  { id: 'declarations', name: 'Declaraciones', description: 'Declaraciones juradas', isCore: false },
  { id: 'consultations', name: 'Consultas', description: 'Visitas de consultores', isCore: false },
];

interface ClientConfigEditorProps {
  onSave?: () => void;
  showTitle?: boolean;
}

export const ClientConfigEditor = ({ onSave, showTitle = true }: ClientConfigEditorProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [config, setConfig] = useState<ClientConfig>(getClientConfig());
  const [hasChanges, setHasChanges] = useState(false);

  // Detectar cambios
  useEffect(() => {
    const current = getClientConfig();
    const changed = JSON.stringify(config) !== JSON.stringify(current);
    setHasChanges(changed);
  }, [config]);

  // Actualizar campo
  const handleChange = (field: keyof ClientConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  // Guardar cambios
  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateClientConfig(config);
      
      if (success) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios se aplicarán inmediatamente",
        });
        setHasChanges(false);
        onSave?.();
      } else {
        throw new Error("No se pudo guardar");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Subir logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Archivo inválido",
        description: "Solo se permiten imágenes",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo muy grande",
        description: "El logo no puede superar 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const logoUrl = await uploadClientLogo(file);
      
      if (logoUrl) {
        setConfig(prev => ({ ...prev, logoUrl }));
        toast({
          title: "Logo subido",
          description: "El logo se actualizó correctamente",
        });
      } else {
        throw new Error("No se pudo subir");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo subir el logo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Configuración de la Empresa</h2>
            <p className="text-sm text-slate-400">
              Personaliza la información y apariencia del sistema
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}

      <Tabs defaultValue="empresa" className="space-y-4">
        <TabsList className="bg-slate-700">
          <TabsTrigger value="empresa" className="data-[state=active]:bg-emerald-600">
            <Building2 className="h-4 w-4 mr-2" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="branding" className="data-[state=active]:bg-emerald-600">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="documentos" className="data-[state=active]:bg-emerald-600">
            <FileText className="h-4 w-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="modulos" className="data-[state=active]:bg-emerald-600">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Módulos
          </TabsTrigger>
        </TabsList>

        {/* Empresa */}
        <TabsContent value="empresa">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Información de la Empresa</CardTitle>
              <CardDescription className="text-slate-400">
                Datos que aparecerán en documentos y la interfaz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre Completo</Label>
                  <Input
                    value={config.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    placeholder="Mi Empresa S.A."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre Corto</Label>
                  <Input
                    value={config.nombreCorto}
                    onChange={(e) => handleChange('nombreCorto', e.target.value)}
                    placeholder="Mi Empresa"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">CUIT</Label>
                  <Input
                    value={config.cuit}
                    onChange={(e) => handleChange('cuit', e.target.value)}
                    placeholder="30-12345678-9"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    type="email"
                    value={config.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="rrhh@empresa.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Teléfono</Label>
                  <Input
                    value={config.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="+54 351 1234567"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Título de la App</Label>
                  <Input
                    value={config.appTitle}
                    onChange={(e) => handleChange('appTitle', e.target.value)}
                    placeholder="Sistema RRHH"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Dirección</Label>
                <Textarea
                  value={config.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Av. Principal 123, Ciudad, Provincia"
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding */}
        <TabsContent value="branding">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Identidad Visual</CardTitle>
              <CardDescription className="text-slate-400">
                Logo y colores de la marca
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo */}
              <div className="space-y-4">
                <Label className="text-slate-300">Logo de la Empresa</Label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-lg bg-slate-700 border-2 border-dashed border-slate-500 flex items-center justify-center overflow-hidden">
                    {config.logoUrl ? (
                      <img 
                        src={config.logoUrl} 
                        alt="Logo" 
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-slate-500" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="border-slate-600"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Subiendo..." : "Subir Logo"}
                    </Button>
                    <p className="text-xs text-slate-400">
                      PNG, JPG o SVG. Máximo 5MB.
                    </p>
                  </div>
                </div>
              </div>

              {/* Colores */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Color Primario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorPrimario}
                      onChange={(e) => handleChange('colorPrimario', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorPrimario}
                      onChange={(e) => handleChange('colorPrimario', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Color Secundario</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorSecundario}
                      onChange={(e) => handleChange('colorSecundario', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorSecundario}
                      onChange={(e) => handleChange('colorSecundario', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Color de Fondo</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={config.colorFondo}
                      onChange={(e) => handleChange('colorFondo', e.target.value)}
                      className="w-12 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={config.colorFondo}
                      onChange={(e) => handleChange('colorFondo', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-lg border border-slate-600">
                <p className="text-sm text-slate-400 mb-3">Vista previa</p>
                <div 
                  className="p-4 rounded-lg flex items-center gap-4"
                  style={{ backgroundColor: config.colorFondo }}
                >
                  {config.logoUrl && (
                    <img src={config.logoUrl} alt="Logo" className="h-10" />
                  )}
                  <span 
                    className="font-bold"
                    style={{ color: config.colorPrimario }}
                  >
                    {config.nombre}
                  </span>
                  <span 
                    className="text-sm"
                    style={{ color: config.colorSecundario }}
                  >
                    {config.appTitle}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Configuración de Documentos</CardTitle>
              <CardDescription className="text-slate-400">
                Datos que aparecerán en los PDFs generados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Nombre del Firmante</Label>
                  <Input
                    value={config.firmaEmpresaNombre}
                    onChange={(e) => handleChange('firmaEmpresaNombre', e.target.value)}
                    placeholder="Juan Pérez"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Cargo del Firmante</Label>
                  <Input
                    value={config.firmaEmpresaCargo}
                    onChange={(e) => handleChange('firmaEmpresaCargo', e.target.value)}
                    placeholder="Gerente de RRHH"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Pie de Página para Documentos</Label>
                <Textarea
                  value={config.piePaginaDocumentos}
                  onChange={(e) => handleChange('piePaginaDocumentos', e.target.value)}
                  placeholder="Documento generado por Sistema RRHH - Confidencial"
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Módulos */}
        <TabsContent value="modulos">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Módulos Habilitados</CardTitle>
              <CardDescription className="text-slate-400">
                Selecciona qué módulos estarán disponibles para este cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {ALL_MODULES.map((module) => {
                  const isEnabled = config.modulosHabilitados?.includes(module.id) || module.isCore;
                  
                  return (
                    <div 
                      key={module.id}
                      className={cn(
                        "flex items-start space-x-3 p-3 rounded-lg border transition-colors",
                        isEnabled 
                          ? "bg-emerald-900/30 border-emerald-600" 
                          : "bg-slate-700/50 border-slate-600",
                        module.isCore && "opacity-75"
                      )}
                    >
                      <Checkbox
                        id={`module-${module.id}`}
                        checked={isEnabled}
                        disabled={module.isCore}
                        onCheckedChange={(checked) => {
                          const currentModules = config.modulosHabilitados?.filter(m => m != null) || [];
                          let newModules: string[];
                          
                          if (checked) {
                            newModules = [...new Set([...currentModules, module.id])];
                          } else {
                            newModules = currentModules.filter(m => m !== module.id);
                          }
                          
                          // Asegurar que los módulos core siempre estén
                          ALL_MODULES.filter(m => m.isCore).forEach(m => {
                            if (!newModules.includes(m.id)) {
                              newModules.push(m.id);
                            }
                          });
                          
                          setConfig(prev => ({ ...prev, modulosHabilitados: newModules }));
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <label 
                          htmlFor={`module-${module.id}`}
                          className="text-sm font-medium text-white cursor-pointer"
                        >
                          {module.name}
                          {module.isCore && (
                            <span className="ml-2 text-xs text-emerald-400">(Core)</span>
                          )}
                        </label>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {module.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong>Módulos habilitados:</strong>{' '}
                  {config.modulosHabilitados?.filter(m => m != null).length || 0} de {ALL_MODULES.length}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botón guardar flotante si hay cambios */}
      {hasChanges && !showTitle && (
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 shadow-lg"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClientConfigEditor;

