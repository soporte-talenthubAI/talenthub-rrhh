import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Plus, Search, Download, BookOpen, Award, Users, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import TrainingForm from "./TrainingForm";
import TrainingDetail from "./TrainingDetail";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useTrainings } from "@/hooks/useTrainings";
import { formatDateLocal } from "@/utils/dateUtils";

const TrainingList = () => {
  const { toast } = useToast();
  const { getActiveEmployees } = useEmployees();
  const activeEmployees = getActiveEmployees();
  const { trainings, loading, updateTrainingStatus, deleteTraining } = useTrainings();
  
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  // Adaptar a forma esperada por la UI existente
  const items = trainings.map((t) => ({
    id: t.id,
    titulo: t.titulo,
    empleadoId: t.employee_id,
    empleadoNombre: t.empleadoNombre || '',
    fecha: t.fecha_inicio || t.created_at.split('T')[0],
    duracion: t.duracion_horas || 0,
    tipo: t.tipo,
    instructor: t.instructor || 'Sin asignar',
    estado: t.estado,
    certificacion: !!t.certificado_url,
    observaciones: t.observaciones || ''
  }));

  const totalHours = items.reduce((sum, t) => sum + (t.duracion || 0), 0);

  const filteredTrainings = items.filter(training => {
    const matchesSearch = (
      training.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      training.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesType = !filterType || filterType === "all" || training.tipo === filterType;
    return matchesSearch && matchesType;
  });

  const handleStatusChange = async (trainingId: string, newStatus: any) => {
    try {
      await updateTrainingStatus(trainingId, newStatus);
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const handleDeleteTraining = async (trainingId: string) => {
    try {
      await deleteTraining(trainingId);
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const handleNewTraining = () => {
    setSelectedTraining(null);
    setView("form");
  };

  const handleViewTraining = (training: any) => {
    setSelectedTraining(training);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedTraining(null);
  };

  const generateReport = () => {
    toast({
      title: "Reporte generado",
      description: "El reporte de capacitaciones se ha generado exitosamente",
    });
  };

  if (view === "form") {
    return <TrainingForm onBack={handleBackToList} training={selectedTraining} employees={activeEmployees} />;
  }

  if (view === "detail" && selectedTraining) {
    return <TrainingDetail training={selectedTraining} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Formación y Registros</h2>
            <p className="text-foreground/70">Gestiona las capacitaciones y entregas de uniformes</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Reporte General
          </Button>
          <Button onClick={handleNewTraining}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Capacitación
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Total Capacitaciones</p>
                <p className="text-3xl font-bold text-foreground">{items.length}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Completadas</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(t => t.estado === "completado").length}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Award className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">En Progreso</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(t => t.estado === "en_progreso").length}
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <Users className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Horas Totales</p>
                <p className="text-3xl font-bold text-foreground">{totalHours}</p>
                <p className="text-xs text-foreground/60">este mes</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <GraduationCap className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Buscar por capacitación o empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="seguridad">Seguridad</SelectItem>
                <SelectItem value="tecnica">Técnico</SelectItem>
                <SelectItem value="administrativa">Administrativo</SelectItem>
                <SelectItem value="calidad">Calidad</SelectItem>
                <SelectItem value="liderazgo">Liderazgo</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Training List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-pulse">
              <GraduationCap className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/70">Cargando capacitaciones...</p>
            </div>
          </div>
        ) : filteredTrainings.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-12 text-center">
                <GraduationCap className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {items.length === 0 ? "No hay capacitaciones registradas" : "No se encontraron capacitaciones"}
                </h3>
                <p className="text-foreground/70">
                  {items.length === 0 
                    ? "Comienza creando la primera capacitación" 
                    : "No hay capacitaciones que coincidan con los filtros seleccionados."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredTrainings.map((training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-foreground">{training.titulo}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={training.estado} 
                      onValueChange={(value) => handleStatusChange(training.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_progreso">En Progreso</SelectItem>
                        <SelectItem value="completado">Completado</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={
                      training.estado === "completado" ? "default" : 
                      training.estado === "en_progreso" ? "secondary" :
                      training.estado === "cancelado" ? "destructive" : "outline"
                    }>
                      {training.estado === "completado" ? "Completado" : 
                       training.estado === "en_progreso" ? "En Progreso" :
                       training.estado === "cancelado" ? "Cancelado" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground/70">Empleado</p>
                  <p className="text-foreground">{training.empleadoNombre}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Fecha</p>
                    <p className="text-foreground">{formatDateLocal(training.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Duración</p>
                    <p className="text-foreground">{training.duracion} horas</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Tipo</p>
                    <Badge variant="outline">
                      {training.tipo === "seguridad" ? "Seguridad" : 
                       training.tipo === "tecnica" ? "Técnico" : 
                       training.tipo === "administrativa" ? "Administrativo" :
                       training.tipo === "calidad" ? "Calidad" :
                       training.tipo === "liderazgo" ? "Liderazgo" : "Otro"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/70">Certificación</p>
                    {training.certificacion ? (
                      <Badge variant="default">Sí</Badge>
                    ) : (
                      <Badge variant="outline">No</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground/70">Instructor</p>
                  <p className="text-foreground text-sm">{training.instructor}</p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewTraining(training)}>
                    Ver Detalle
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Certificado
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente la capacitación "{training.titulo}" de {training.empleadoNombre}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTraining(training.id)}>
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TrainingList;