/**
 * Editor de Catálogos Personalizables
 * Permite configurar puestos, sectores, tipos de contrato, etc.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useCustomCatalogs, CatalogType, CatalogItem } from "@/hooks/useCustomCatalogs";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Briefcase, 
  Building2, 
  FileText, 
  Calendar,
  Users,
  GripVertical
} from "lucide-react";

interface CatalogConfig {
  type: CatalogType;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const CATALOG_CONFIGS: CatalogConfig[] = [
  {
    type: 'puestos',
    title: 'Puestos / Cargos',
    description: 'Roles y posiciones en la empresa',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    type: 'sectores',
    title: 'Sectores / Departamentos',
    description: 'Áreas de la organización',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    type: 'tipos_contrato',
    title: 'Tipos de Contrato',
    description: 'Modalidades de contratación',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    type: 'motivos_licencia',
    title: 'Motivos de Licencia',
    description: 'Tipos de licencias y ausencias',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    type: 'estados_empleado',
    title: 'Estados del Empleado',
    description: 'Estados posibles del personal',
    icon: <Users className="h-5 w-5" />,
  },
];

interface CustomCatalogsEditorProps {
  onBack?: () => void;
}

const CustomCatalogsEditor = ({ onBack }: CustomCatalogsEditorProps) => {
  const { toast } = useToast();
  const { catalogs, loading, addItem, updateItem, deleteItem, refresh } = useCustomCatalogs();
  
  const [activeTab, setActiveTab] = useState<CatalogType>('puestos');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ value: '', label: '', description: '' });
  const [newItemForm, setNewItemForm] = useState({ label: '', description: '' });
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleStartEdit = (item: CatalogItem) => {
    setEditingItem(item.id);
    setEditForm({
      value: item.value,
      label: item.label,
      description: item.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    
    const success = await updateItem(editingItem, {
      label: editForm.label,
      description: editForm.description || undefined,
    });

    if (success) {
      toast({
        title: "Guardado",
        description: "El ítem se actualizó correctamente.",
      });
      setEditingItem(null);
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el ítem.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({ value: '', label: '', description: '' });
  };

  const handleAddNew = async () => {
    if (!newItemForm.label.trim()) {
      toast({
        title: "Error",
        description: "El nombre es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    // Generar value desde label
    const value = newItemForm.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const success = await addItem(
      activeTab,
      value,
      newItemForm.label,
      newItemForm.description || undefined
    );

    if (success) {
      toast({
        title: "Agregado",
        description: `Se agregó "${newItemForm.label}" correctamente.`,
      });
      setNewItemForm({ label: '', description: '' });
      setIsAddingNew(false);
    } else {
      toast({
        title: "Error",
        description: "No se pudo agregar el ítem. Puede que ya exista.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!confirm(`¿Eliminar "${item.label}"? Los empleados con este valor asignado no serán afectados.`)) {
      return;
    }

    const success = await deleteItem(item.id);

    if (success) {
      toast({
        title: "Eliminado",
        description: `Se eliminó "${item.label}".`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo eliminar el ítem.",
        variant: "destructive",
      });
    }
  };

  const currentConfig = CATALOG_CONFIGS.find(c => c.type === activeTab);
  const currentItems = catalogs[activeTab] || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/70">Cargando catálogos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Personalización del Legajo
          </h2>
          <p className="text-foreground/70">
            Configura los campos personalizables para tu empresa
          </p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Volver
          </Button>
        )}
      </div>

      {/* Tabs por tipo de catálogo */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CatalogType)}>
        <TabsList className="grid grid-cols-5 mb-6">
          {CATALOG_CONFIGS.map((config) => (
            <TabsTrigger
              key={config.type}
              value={config.type}
              className="flex items-center gap-2"
            >
              {config.icon}
              <span className="hidden md:inline">{config.title.split(' / ')[0]}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {CATALOG_CONFIGS.map((config) => (
          <TabsContent key={config.type} value={config.type}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {config.icon}
                    </div>
                    <div>
                      <CardTitle>{config.title}</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  <Button onClick={() => setIsAddingNew(true)} disabled={isAddingNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Formulario para agregar nuevo */}
                {isAddingNew && activeTab === config.type && (
                  <Card className="mb-4 border-primary">
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <Label>Nombre *</Label>
                          <Input
                            placeholder="Ej: Supervisor de Planta"
                            value={newItemForm.label}
                            onChange={(e) => setNewItemForm({ ...newItemForm, label: e.target.value })}
                            autoFocus
                          />
                        </div>
                        <div>
                          <Label>Descripción</Label>
                          <Input
                            placeholder="Opcional"
                            value={newItemForm.description}
                            onChange={(e) => setNewItemForm({ ...newItemForm, description: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={handleAddNew}>
                          <Save className="h-4 w-4 mr-2" />
                          Guardar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsAddingNew(false);
                            setNewItemForm({ label: '', description: '' });
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Lista de items */}
                <div className="space-y-2">
                  {currentItems.length === 0 ? (
                    <div className="text-center py-8 text-foreground/50">
                      <p>No hay ítems configurados.</p>
                      <p className="text-sm">Haz clic en "Agregar" para crear el primero.</p>
                    </div>
                  ) : (
                    currentItems.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        {editingItem === item.id ? (
                          // Modo edición
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2">
                              <Input
                                value={editForm.label}
                                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                placeholder="Nombre"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Descripción"
                              />
                              <Button size="sm" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Modo visualización
                          <>
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-4 w-4 text-foreground/30 cursor-grab" />
                              <Badge variant="outline" className="font-mono text-xs">
                                {index + 1}
                              </Badge>
                              <div>
                                <p className="font-medium text-foreground">{item.label}</p>
                                {item.description && (
                                  <p className="text-sm text-foreground/60">{item.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStartEdit(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Ayuda */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Los cambios se aplican inmediatamente. 
                    Los empleados existentes con valores eliminados conservarán su valor actual.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default CustomCatalogsEditor;

