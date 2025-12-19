import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Plus, Search, Clock, User, FileText, AlertCircle, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AbsenceForm from "./AbsenceForm";
import AbsenceDetail from "./AbsenceDetail";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useAbsences } from "@/hooks/useAbsences";
import { formatDateLocal } from "@/utils/dateUtils";

const AbsencesModule = () => {
  // AbsencesModule rendering
  const { toast } = useToast();
  const { getActiveEmployees } = useEmployees();
  const activeEmployees = getActiveEmployees();
  
  console.log('AbsencesModule - activeEmployees:', activeEmployees); // Debug log
  const [view, setView] = useState<"list" | "form" | "detail">("list");
  console.log("📋 Current view:", view);
  const [selectedAbsence, setSelectedAbsence] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterYear, setFilterYear] = useState("");

  // Datos reales de ausencias
  const { absences, loading, deleteAbsence } = useAbsences();

  // Adaptar a forma esperada por la UI existente
  const items = absences.map((a) => ({
    id: a.id,
    empleadoId: a.employee_id,
    empleadoNombre: a.empleadoNombre || '',
    empleadoDni: a.empleadoDni || '',
    fechaInicio: a.fecha_inicio,
    fechaFin: a.fecha_fin,
    tipo: a.tipo,
    motivo: a.motivo || '',
    estado: a.estado,
    certificadoMedico: a.certificado_medico,
    archivo: a.archivo_url,
    observaciones: a.observaciones || ''
  }));

  // Forzar actualización cuando cambian los datos
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Actualizar cuando cambien las ausencias
  useEffect(() => {
    setRefreshKey(prev => prev + 1);
  }, [absences]);

  const filteredAbsences = items.filter(absence => {
    const matchesSearch = absence.empleadoNombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === "all" || absence.tipo === filterType;
    const matchesStatus = !filterStatus || filterStatus === "all" || absence.estado === filterStatus;
    const matchesEmployee = !filterEmployee || filterEmployee === "all" || absence.empleadoId === filterEmployee;
    
    // Filtro por mes y año
    const absenceDate = new Date(absence.fechaInicio);
    const matchesMonth = !filterMonth || filterMonth === "all" || (absenceDate.getMonth() + 1).toString() === filterMonth;
    const matchesYear = !filterYear || filterYear === "all" || absenceDate.getFullYear().toString() === filterYear;
    
    return matchesSearch && matchesType && matchesStatus && matchesEmployee && matchesMonth && matchesYear;
  });

  // Obtener años únicos de las ausencias para el filtro
  const availableYears = [...new Set(items.map(absence => new Date(absence.fechaInicio).getFullYear()))].sort((a, b) => b - a);

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" }
  ];

  const handleNewAbsence = () => {
    setSelectedAbsence(null);
    setView("form");
  };

  const handleViewAbsence = (absence: any) => {
    setSelectedAbsence(absence);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedAbsence(null);
  };

  const handleDeleteAbsence = async (absenceId: string) => {
    try {
      await deleteAbsence(absenceId);
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const generateReport = () => {
    toast({
      title: "Reporte generado",
      description: "El reporte de ausencias se ha generado exitosamente",
    });
  };

  if (view === "form") {
    return <AbsenceForm onBack={handleBackToList} absence={selectedAbsence} employees={activeEmployees} />;
  }

  if (view === "detail" && selectedAbsence) {
    return <AbsenceDetail absence={selectedAbsence} onBack={handleBackToList} />;
  }

  // Rendering list view with filtered absences

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <AlertCircle className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Ausencias y Permisos</h2>
            <p className="text-foreground/70">Administra las ausencias, permisos y certificados médicos</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Reporte de Ausencias
          </Button>
          <Button onClick={handleNewAbsence}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Ausencia
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Ausencias Pendientes</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(a => a.estado === "pendiente").length}
                </p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Por Enfermedad</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(a => a.tipo === "enfermedad").length}
                </p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Motivos Personales</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(a => a.tipo === "personal" || a.tipo === "paternidad" || a.tipo === "familiar").length}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Con Certificado</p>
                <p className="text-3xl font-bold text-foreground">
                  {items.filter(a => a.certificadoMedico || a.archivo).length}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <FileText className="h-6 w-6 text-success" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select onValueChange={setFilterEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los empleados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los empleados</SelectItem>
                {activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.nombres} {employee.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de ausencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="enfermedad">Enfermedad</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="paternidad">Paternidad</SelectItem>
                <SelectItem value="familiar">Familiar</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setFilterMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setFilterYear}>
              <SelectTrigger>
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-foreground/70">
              Mostrando {filteredAbsences.length} de {items.length} ausencias
            </p>
            
            <Select onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Absence List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Lista de Ausencias y Permisos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAbsences.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron ausencias
              </h3>
              <p className="text-foreground/70">
                No hay ausencias que coincidan con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Empleado</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Período</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Tipo</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Certificado</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground/70">Motivo</th>
                    <th className="text-center py-3 px-4 font-medium text-foreground/70">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsences.map((absence) => (
                    <tr key={absence.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">{absence.empleadoNombre}</div>
                          <div className="text-sm text-foreground/70">DNI: {absence.empleadoDni}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="text-foreground">
                            {formatDateLocal(absence.fechaInicio)}
                          </div>
                          <div className="text-foreground/70">
                            al {formatDateLocal(absence.fechaFin)}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="outline" className="capitalize">
                          {absence.tipo}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge 
                          variant={
                            absence.estado === "aprobado" 
                              ? "default" 
                              : absence.estado === "pendiente" 
                              ? "secondary" 
                              : "destructive"
                          }
                        >
                          {absence.estado === "aprobado" ? "Aprobado" : absence.estado === "pendiente" ? "Pendiente" : "Rechazado"}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        {absence.certificadoMedico || absence.archivo ? (
                          <Badge variant="default" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">No</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-foreground max-w-[200px] truncate" title={absence.motivo}>
                          {absence.motivo}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-1 justify-center">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleViewAbsence(absence)}
                            className="text-xs"
                          >
                            Ver
                          </Button>
                          {(absence.certificadoMedico || absence.archivo) && (
                            <Button variant="outline" size="sm" className="text-xs">
                              <Download className="h-3 w-3" />
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
                                <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la ausencia de {absence.empleadoNombre}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAbsence(absence.id)}>
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
    </div>
  );
};

export default AbsencesModule;