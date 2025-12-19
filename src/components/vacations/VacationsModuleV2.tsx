import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Download, Plus, Search, Clock, User, FileText, Trash2, Pencil } from "lucide-react";
import VacationForm from "./VacationFormV2";
import VacationDetail from "./VacationDetail";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useVacations } from "@/hooks/useVacations";
import html2pdf from "html2pdf.js";
import { clientConfig } from "@/config/client";
import { formatDateLocal } from "@/utils/dateUtils";

export const VacationsModule = () => {
  const { toast } = useToast();
  const { employees, getActiveEmployees } = useEmployees();
  const { 
    vacationRequests, 
    vacationBalances,
    addVacationRequest,
    updateVacationRequest,
    approveVacationRequest, 
    rejectVacationRequest,
    deleteVacationRequest,
    getEmployeeVacationBalance,
    refetch
  } = useVacations();

  // Wrapper functions to ensure UI refresh
  const handleApproveVacation = async (requestId: string) => {
    try {
      await approveVacationRequest(requestId);
      // Force refresh to ensure UI updates
      await refetch();
      // Navigate back to list if we're in detail view
      if (view === "detail") {
        setView("list");
        setSelectedVacation(null);
      }
    } catch (error) {
      console.error('❌ Error approving vacation:', error);
    }
  };

  const handleRejectVacation = async (requestId: string) => {
    try {
      await rejectVacationRequest(requestId);
      await refetch();
      if (view === "detail") {
        setView("list");
        setSelectedVacation(null);
      }
    } catch (error) {
      console.error('Error rejecting vacation:', error);
    }
  };

  const [view, setView] = useState<"list" | "form" | "detail" | "edit">("list");
  const [selectedVacation, setSelectedVacation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");

  const handleEditVacation = (vacation: any) => {
    setSelectedVacation(vacation);
    setView("edit");
  };

  // Helper: calculate vacation days for current year using calendar days and decimals
  const calcVacationDaysCurrentYear = (fechaIngreso?: string) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const now = new Date();
    const fechaCorte = new Date(now.getFullYear(), 11, 31);

    // If joined this year, use proportional rule
    if (ingreso.getFullYear() === now.getFullYear()) {
      const diasTrabajados = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const mesesTrabajados = (fechaCorte.getTime() - ingreso.getTime()) / (30.44 * 24 * 60 * 60 * 1000);
      if (mesesTrabajados < 6) {
        return Math.round((diasTrabajados / 20) * 100) / 100; // 2 decimales
      }
      return 14;
    }

    // Full years per law
    const antiguedadAnios = Math.floor((fechaCorte.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (antiguedadAnios <= 5) return 14;
    if (antiguedadAnios <= 10) return 21;
    if (antiguedadAnios <= 20) return 28;
    return 35;
  };

  // Create employees with vacation information from database
  const employeesWithVacations = useMemo(() => {
    return getActiveEmployees().map(employee => {
      const currentYear = new Date().getFullYear();
      const balance = getEmployeeVacationBalance(employee.id, currentYear);

      const computedDays = calcVacationDaysCurrentYear(employee.fecha_ingreso || employee.fechaIngreso);
      const totalDays = balance && balance.dias_totales > 0 ? balance.dias_totales : computedDays;
      const usados = balance?.dias_usados || 0;

      return {
        ...employee,
        vacationDays: totalDays,
        usedDays: usados,
        availableDays: Math.round(((totalDays - usados) + Number.EPSILON) * 100) / 100,
      };
    });
  }, [employees, vacationBalances, getActiveEmployees, getEmployeeVacationBalance]);

  // Function to calculate days between dates
  const calculateRequestDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // +1 to include final day
  };

  // Generate vacation certificate PDF
  const generateVacationCertificate = async (vacation: any) => {
    if (!vacation || vacation.estado !== "aprobado") {
      toast({
        title: "Error",
        description: "Solo se pueden generar constancias de solicitudes aprobadas",
        variant: "destructive",
      });
      return;
    }

    try {
      const empleadoNombre = vacation.employee 
        ? `${vacation.employee.nombres} ${vacation.employee.apellidos}` 
        : "Empleado";
      const dni = vacation.employee?.dni || "";
      const inicio = vacation.fecha_inicio ? formatDateLocal(vacation.fecha_inicio) : "";
      const fin = vacation.fecha_fin ? formatDateLocal(vacation.fecha_fin) : "";
      const emitido = new Date().toLocaleDateString("es-AR");
      const dias = vacation.dias_solicitados || 0;
      const periodo = vacation.periodo || new Date().getFullYear().toString();

      const safeName = empleadoNombre.replace(/\s+/g, "_");
      const fileName = `Notificacion_Vacaciones_${safeName}_${periodo}.pdf`;

      const container = document.createElement("div");
      container.style.width = "210mm";
      container.style.minHeight = "297mm";
      container.style.padding = "15mm 20mm";
      container.style.fontFamily = "Arial, sans-serif";
      container.style.color = "#000";
      container.style.backgroundColor = "#fff";
      container.style.boxSizing = "border-box";
      container.style.fontSize = "11px";
      
      container.innerHTML = `
        <div style="text-align:center; margin-bottom:12px;">
          <h2 style="margin:0 0 4px 0; font-size:16px; font-weight:bold;">${clientConfig.nombre.toUpperCase()}</h2>
        </div>
        
        <h1 style="text-align:center; font-size:18px; font-weight:bold; margin:12px 0;">NOTIFICACIÓN DE VACACIONES</h1>
        
        <div style="margin-bottom:10px;">
          <p style="margin:4px 0;"><strong>Nombre y Apellido:</strong> ${empleadoNombre.toUpperCase()}</p>
          <p style="margin:4px 0;"><strong>DNI:</strong> ${dni}</p>
        </div>
        
        <p style="line-height:1.5; text-align:justify; margin:12px 0;">
          En cumplimiento de la Legislación vigente Art. 154 de la Ley de Contrato de trabajo, se le notifica que el período de descanso anual ${periodo} es de <strong>${dias} días</strong>, comenzando desde el <strong>${inicio}</strong> hasta el <strong>${fin}</strong> inclusive.
        </p>
        
        <p style="margin:16px 0 20px 0;">Sin otro particular saludo muy atte.</p>
        
        <div style="margin-bottom:12px;">
          <p style="margin:2px 0;"><strong>Empleador:</strong> FOLCO MARCOS DENIS.</p>
          <p style="margin:2px 0;"><strong>Domicilio:</strong> Avda. José Hernández N°90, Rio Primero (5127) Córdoba.</p>
          <p style="margin:2px 0;"><strong>Cuit:</strong> 20-24088189-7</p>
        </div>
        
        <p style="margin:12px 0;"><strong>Fecha:</strong> ${emitido}</p>
        
        <div style="text-align:center; margin:20px 0 12px 0;">
          <p style="font-style:italic; margin-bottom:4px;">${clientConfig.nombreCorto}</p>
        </div>
        
        <p style="margin:16px 0 8px 0;">Me notifico de la comunicación que antecede, tomando debida nota.</p>
        
        <p style="margin:8px 0;"><strong>Fecha:</strong> ________________</p>
        
        <div style="margin:24px 0; text-align:center;">
          <div style="border-top:1px solid #000; width:220px; margin:0 auto 6px;"></div>
          <p style="margin:0; font-size:10px;">FIRMA DEL EMPLEADO</p>
        </div>
        
        <div style="border-top:2px solid #000; margin:24px 0 16px 0;"></div>
        
        <p style="margin:12px 0 8px 0;">Certifico haber gozado del período de vacaciones arriba mencionado, reintegrandome en la fecha de conformidad a mis ocupaciones</p>
        
        <p style="margin:8px 0;"><strong>Fecha:</strong> ________________</p>
        
        <div style="margin:24px 0; text-align:center;">
          <div style="border-top:1px solid #000; width:220px; margin:0 auto 6px;"></div>
          <p style="margin:0; font-size:10px;">FIRMA DEL EMPLEADO</p>
        </div>
      `;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      } as const;

      // Force download via Blob + anchor to work inside iframes
      const worker = (html2pdf as any)().from(container).set(opt).toPdf();
      const pdf = await worker.get('pdf');
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);

      toast({
        title: "Descarga iniciada",
        description: "La notificación de vacaciones se está descargando.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error al generar la notificación PDF",
        variant: "destructive",
      });
    }
  };

  const filteredVacations = vacationRequests.filter((vacation) => {
    const name = vacation.employee 
      ? `${vacation.employee.nombres} ${vacation.employee.apellidos}`.toLowerCase()
      : "";
    const status = (vacation.estado || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "todos" || status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleNewVacation = () => {
    setSelectedVacation(null);
    setView("form");
  };

  const handleViewVacation = (vacation: any) => {
    setSelectedVacation(vacation);
    setView("detail");
  };

  const handleBackToList = () => {
    setView("list");
    setSelectedVacation(null);
  };

  const generateReport = async () => {
    try {
      const fecha = new Date().toLocaleDateString("es-AR");
      const container = document.createElement("div");
      container.style.padding = "24px";
      container.style.fontFamily = "Inter, Arial, sans-serif";
      container.style.color = "#0f1115";

      const resumen = {
        pendientes: vacationRequests.filter(v => v.estado === "pendiente").length,
        aprobadas: vacationRequests.filter(v => v.estado === "aprobado").length,
        rechazadas: vacationRequests.filter(v => v.estado === "rechazado").length,
      };

      const filas = vacationRequests.map(v => `
        <tr>
          <td style="padding:6px 8px; border:1px solid #ddd;">${v.employee ? `${v.employee.nombres} ${v.employee.apellidos}` : ''}</td>
          <td style="padding:6px 8px; border:1px solid #ddd;">${v.periodo}</td>
          <td style="padding:6px 8px; border:1px solid #ddd;">${formatDateLocal(v.fecha_inicio)} - ${formatDateLocal(v.fecha_fin)}</td>
          <td style="padding:6px 8px; border:1px solid #ddd; text-align:center;">${v.dias_solicitados}</td>
          <td style="padding:6px 8px; border:1px solid #ddd; text-transform:capitalize;">${v.estado}</td>
        </tr>
      `).join("");

      container.innerHTML = `
        <div style="text-align:center; margin-bottom:16px;">
          <h1 style="margin:0; font-size:20px;">Reporte de Solicitudes de Vacaciones</h1>
          <p style="margin:4px 0; font-size:12px;">Emitido el ${fecha}</p>
        </div>
        <div style="font-size:13px; margin-bottom:12px;">
          <strong>Resumen:</strong>
          <span style="margin-left:8px;">Pendientes: ${resumen.pendientes}</span>
          <span style="margin-left:8px;">Aprobadas: ${resumen.aprobadas}</span>
          <span style="margin-left:8px;">Rechazadas: ${resumen.rechazadas}</span>
        </div>
        <table style="border-collapse:collapse; width:100%; font-size:12px;">
          <thead>
            <tr>
              <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Empleado</th>
              <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Período</th>
              <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Fechas</th>
              <th style="padding:6px 8px; border:1px solid #ddd;">Días</th>
              <th style="padding:6px 8px; border:1px solid #ddd; text-align:left;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${filas || `<tr><td colspan=\"5\" style=\"padding:10px; border:1px solid #ddd; text-align:center;\">Sin solicitudes</td></tr>`}
          </tbody>
        </table>
      `;

      const opt = {
        margin: 10,
        filename: `Reporte_Vacaciones_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      } as const;

      await (html2pdf as any)().from(container).set(opt).save();

      toast({
        title: "Descarga iniciada",
        description: "El reporte se está descargando.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte.",
        variant: "destructive",
      });
    }
  };

  if (view === "form" || view === "edit") {
    return (
      <VacationForm 
        onBack={handleBackToList} 
        vacation={view === "edit" ? selectedVacation : null}
        employees={getActiveEmployees()} 
        onSave={async (requestData) => {
          if (view === "edit" && selectedVacation) {
            await updateVacationRequest(selectedVacation.id, requestData);
          } else {
            await addVacationRequest(requestData);
          }
          await refetch(); // Force refresh after adding/updating request
          handleBackToList();
        }} 
      />
    );
  }

  if (view === "detail" && selectedVacation) {
    return (
      <VacationDetail
        vacation={selectedVacation}
        onBack={handleBackToList}
        onApprove={() => handleApproveVacation(selectedVacation.id)}
        onReject={() => handleRejectVacation(selectedVacation.id)}
        onGeneratePDF={() => generateVacationCertificate(selectedVacation)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Vacaciones</h2>
            <p className="text-foreground/70">Administra las vacaciones del personal y días disponibles</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Reporte de Vacaciones
          </Button>
          <Button onClick={handleNewVacation}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Solicitud
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Solicitudes Pendientes</p>
                <p className="text-3xl font-bold text-foreground">
                  {vacationRequests.filter(v => v.estado === "pendiente").length}
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
                <p className="text-sm font-medium text-foreground/70">Aprobadas Este Mes</p>
                <p className="text-3xl font-bold text-foreground">
                  {vacationRequests.filter(v => v.estado === "aprobado").length}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <Calendar className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/70">Días Promedio</p>
                <p className="text-3xl font-bold text-foreground">
                  {vacationRequests.length > 0 ? (vacationRequests.reduce((acc, v) => acc + v.dias_solicitados, 0) / vacationRequests.length).toFixed(1) : 0}
                </p>
                <p className="text-xs text-foreground/60">días por solicitud</p>
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
                <p className="text-sm font-medium text-foreground/70">Empleados Activos</p>
                <p className="text-3xl font-bold text-foreground">{employeesWithVacations.length}</p>
                <p className="text-xs text-foreground/60">con derecho a vacaciones</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <User className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Vacation Days Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Días de Vacaciones por Empleado</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Puesto</TableHead>
                  <TableHead>Días Totales</TableHead>
                  <TableHead>Días Usados</TableHead>
                  <TableHead>Días Disponibles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeesWithVacations.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      {employee.nombres} {employee.apellidos}
                    </TableCell>
                    <TableCell>{employee.dni}</TableCell>
                    <TableCell>{employee.puesto}</TableCell>
                    <TableCell>{employee.vacationDays}</TableCell>
                    <TableCell>{employee.usedDays}</TableCell>
                    <TableCell className="font-medium">{employee.availableDays}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Vacation Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-foreground">Solicitudes de Vacaciones</CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredVacations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No hay solicitudes de vacaciones
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== "todos" 
                  ? "No se encontraron solicitudes que coincidan con los filtros."
                  : "Comienza creando una nueva solicitud de vacaciones."}
              </p>
              {(!searchTerm && filterStatus === "todos") && (
                <Button onClick={handleNewVacation}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Solicitud
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVacations.map((vacation) => (
                <Card key={vacation.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4" onClick={() => handleViewVacation(vacation)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-foreground">
                              {vacation.employee ? `${vacation.employee.nombres} ${vacation.employee.apellidos}` : 'Empleado'}
                            </h4>
                            <Badge 
                              variant={
                                vacation.estado === "aprobado" ? "default" :
                                vacation.estado === "pendiente" ? "secondary" : "destructive"
                              }
                            >
                              {vacation.estado}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span className="mr-4">
                              📅 {formatDateLocal(vacation.fecha_inicio)} - {formatDateLocal(vacation.fecha_fin)}
                            </span>
                            <span className="mr-4">📊 {vacation.dias_solicitados} días</span>
                            {vacation.motivo && <span>💼 {vacation.motivo}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {vacation.estado === "pendiente" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveVacation(vacation.id);
                              }}
                            >
                              ✓ Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectVacation(vacation.id);
                              }}
                            >
                              ✗ Rechazar
                            </Button>
                          </>
                        )}
                        {vacation.estado === "aprobado" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateVacationCertificate(vacation);
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Constancia
                          </Button>
                        )}
                        {vacation.estado !== "aprobado" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVacation(vacation);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) {
                                  deleteVacationRequest(vacation.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VacationsModule;