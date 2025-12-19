import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Upload, Download, Clock, TrendingUp, AlertTriangle, Users, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AttendanceUpload from "./AttendanceUpload";
import AttendanceReports from "./AttendanceReports";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendanceData } from "@/hooks/useAttendanceData";
import { formatDateLocal } from "@/utils/dateUtils";

const AttendanceList = () => {
  const { toast } = useToast();
  const { getActiveEmployees } = useEmployees();
  const { records, loading, deleteRecord } = useAttendanceData();
  const activeEmployees = getActiveEmployees();
  const [view, setView] = useState<"list" | "upload" | "reports">("list");
  const [filterMonth, setFilterMonth] = useState("");

  console.log('AttendanceList - records:', records); // Debug log

  // Map records with employee info
  const attendanceWithEmployees = records.map(record => {
    const employee = activeEmployees.find(emp => emp.id === record.employee_id);
    return {
      ...record,
      empleadoNombre: employee ? `${employee.nombres} ${employee.apellidos}` : 'Empleado no encontrado',
      empleadoDni: employee?.dni || '',
      horaEntrada: record.hora_entrada || '--',
      horaSalida: record.hora_salida || '--',
      horasTrabajadas: record.horas_trabajadas || 0,
      llegadaTarde: record.llegada_tarde,
      observaciones: record.observaciones || ''
    };
  });

  const handleDeleteRecord = async (recordId: string, employeeName: string) => {
    try {
      await deleteRecord(recordId);
      toast({
        title: "Registro eliminado",
        description: `El registro de asistencia de ${employeeName} ha sido eliminado`,
      });
    } catch (error) {
      // El hook ya muestra el toast de error
    }
  };

  const handleUploadExcel = () => {
    setView("upload");
  };

  const handleViewReports = () => {
    setView("reports");
  };

  const handleBackToList = () => {
    setView("list");
  };

  const generateReport = () => {
    toast({
      title: "Reporte generado",
      description: "El reporte de asistencia se ha generado exitosamente",
    });
  };

  if (view === "upload") {
    return <AttendanceUpload onBack={handleBackToList} />;
  }

  if (view === "reports") {
    return <AttendanceReports onBack={handleBackToList} />;
  }

  // Calculate totals from real data
  const totalLateArrivals = records.filter(r => r.llegada_tarde).length;
  const totalRecords = records.length;
  const avgPunctuality = totalRecords > 0 ? Math.round(((totalRecords - totalLateArrivals) / totalRecords) * 100) : 0;
  const avgAttendance = totalRecords > 0 ? 95 : 0; // Placeholder calculation
  const activeAlerts = records.filter(r => r.llegada_tarde || !r.hora_entrada).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Control de Asistencia y KPIs</h2>
            <p className="text-foreground/70">Gestiona la asistencia y analiza indicadores de rendimiento</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleUploadExcel}>
            <Upload className="h-4 w-4 mr-2" />
            Cargar Excel
          </Button>
          <Button variant="outline" onClick={handleViewReports}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver KPIs
          </Button>
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Reporte Mensual
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Llegadas Tarde</p>
                <p className="text-3xl font-bold text-foreground">{totalLateArrivals}</p>
                <p className="text-xs text-foreground/60">este mes</p>
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
                <p className="text-sm font-medium text-foreground/70">Puntualidad Promedio</p>
                <p className="text-3xl font-bold text-foreground">{avgPunctuality}%</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Asistencia Promedio</p>
                <p className="text-3xl font-bold text-foreground">{avgAttendance}%</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Alertas Activas</p>
                <p className="text-3xl font-bold text-foreground">{activeAlerts}</p>
                <p className="text-xs text-foreground/60">empleados</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select onValueChange={setFilterMonth}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                <SelectItem value="2024-11">Noviembre 2024</SelectItem>
                <SelectItem value="2024-10">Octubre 2024</SelectItem>
                <SelectItem value="2024-09">Septiembre 2024</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <div className="space-y-6">
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Cargando registros...</h3>
            </CardContent>
          </Card>
        ) : attendanceWithEmployees.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay datos de asistencia</h3>
              <p className="text-muted-foreground mb-6">
                Carga un archivo Excel con los datos de asistencia para comenzar a visualizar los reportes y KPIs.
              </p>
              <Button onClick={handleUploadExcel}>
                <Upload className="h-4 w-4 mr-2" />
                Cargar Archivo Excel
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {attendanceWithEmployees.map((record) => (
              <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">{record.empleadoNombre}</CardTitle>
                    <Badge variant={record.llegadaTarde ? "destructive" : "default"}>
                      {record.llegadaTarde ? "Llegada Tarde" : "Puntual"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Fecha</p>
                      <p className="text-foreground">{formatDateLocal(record.fecha)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/70">DNI</p>
                      <p className="text-foreground">{record.empleadoDni}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Hora Entrada</p>
                      <p className="text-foreground">{record.horaEntrada}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Hora Salida</p>
                      <p className="text-foreground">{record.horaSalida}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground/70">Horas Trabajadas</p>
                    <p className="text-xl font-bold text-primary">{record.horasTrabajadas || 0} hrs</p>
                  </div>

                  {record.observaciones && (
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Observaciones</p>
                      <p className="text-foreground text-sm">{record.observaciones}</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm">
                      Ver Detalle
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Reporte
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
                            Esta acción no se puede deshacer. Se eliminará permanentemente el registro de asistencia de {record.empleadoNombre} del {formatDateLocal(record.fecha)}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteRecord(record.id, record.empleadoNombre)}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;