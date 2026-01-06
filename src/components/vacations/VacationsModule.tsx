import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, Plus, Search, Clock, User, FileText } from "lucide-react";
import VacationForm from "./VacationForm";
import VacationDetail from "./VacationDetail";
import { useToast } from "@/hooks/use-toast";
import { useEmployees } from "@/hooks/useEmployees";
import { useVacations } from "@/hooks/useVacations";
import html2pdf from "html2pdf.js";
import { formatDateLocal } from "@/utils/dateUtils";
import { calculateVacationDays as calcVacationDays } from "@/utils/vacationUtils";

const VacationsModule = () => {
  const { toast } = useToast();
  const { getActiveEmployees } = useEmployees();
  const activeEmployees = getActiveEmployees();
  const [view, setView] = useState<"list" | "form" | "detail" | "edit">("list");
  const [selectedVacation, setSelectedVacation] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendiente" | "aprobado" | "rechazado">("all");
  
  const handleEditVacation = (vacation: any) => {
    setSelectedVacation(vacation);
    setView("edit");
  };

  // Usar función centralizada de vacationUtils.ts (importada como calcVacationDays)

  // Calculate used vacation days (reset to 0)
  const getUsedVacationDays = (employeeId: number) => {
    // Reset all used vacation days to 0
    return 0;
  };

  const employeesWithVacations = activeEmployees.map(emp => {
    // Usar función centralizada - ya incluye redondeo
    const totalDays = calcVacationDays(emp.fecha_ingreso || emp.fechaIngreso || '');
    const usedDays = getUsedVacationDays(parseInt(emp.id) || 0);
    const remainingDays = totalDays - usedDays;
    
    return {
      ...emp,
      totalVacationDays: totalDays,
      usedVacationDays: usedDays,
      remainingVacationDays: remainingDays
    };
  });

  // Vacation requests state
  const [vacationRequests, setVacationRequests] = useState<any[]>([]);

  // Add new vacation request
  const addVacationRequest = (requestData: any) => {
    const selectedEmployee = activeEmployees.find(emp => emp.id.toString() === requestData.empleadoId);
    const newRequest = {
      id: Date.now(),
      empleadoId: parseInt(requestData.empleadoId),
      empleadoNombre: selectedEmployee ? `${selectedEmployee.nombres} ${selectedEmployee.apellidos}` : '',
      empleadoDni: selectedEmployee ? selectedEmployee.dni : '',
      fechaInicio: requestData.fechaInicio,
      fechaFin: requestData.fechaFin,
      diasSolicitados: calculateRequestDays(requestData.fechaInicio, requestData.fechaFin),
      periodo: requestData.periodo,
      estado: "pendiente",
      motivo: requestData.motivo,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      observaciones: requestData.observaciones || ""
    };
    
    setVacationRequests(prev => [newRequest, ...prev]);
    toast({
      title: "Solicitud creada",
      description: "La solicitud de vacaciones ha sido registrada y está pendiente de aprobación",
    });
  };

  // Calculate days between dates
  const calculateRequestDays = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // Approve vacation request
  const approveVacationRequest = (requestId: number) => {
    setVacationRequests(prev => {
      const updated = prev.map(req =>
        req.id === requestId
          ? { ...req, estado: "aprobado", fechaAprobacion: new Date().toISOString().split('T')[0] }
          : req
      );
      const current = updated.find(r => r.id === requestId);
      setSelectedVacation(prevSel => (prevSel && prevSel.id === requestId ? current : prevSel));
      return updated;
    });
    toast({
      title: "Solicitud aprobada",
      description: "La solicitud de vacaciones ha sido aprobada exitosamente",
    });
  };

  // Reject vacation request
  const rejectVacationRequest = (requestId: number) => {
    setVacationRequests(prev => {
      const updated = prev.map(req =>
        req.id === requestId
          ? { ...req, estado: "rechazado", fechaRechazo: new Date().toISOString().split('T')[0] }
          : req
      );
      const current = updated.find(r => r.id === requestId);
      setSelectedVacation(prevSel => (prevSel && prevSel.id === requestId ? current : prevSel));
      return updated;
    });
    toast({
      title: "Solicitud rechazada",
      description: "La solicitud de vacaciones ha sido rechazada",
    });
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
      const empleadoNombre = vacation.empleadoNombre || "Empleado";
      const dni = vacation.empleadoDni || "";
      const inicio = vacation.fechaInicio ? formatDateLocal(vacation.fechaInicio) : "";
      const fin = vacation.fechaFin ? formatDateLocal(vacation.fechaFin) : "";
      const emitido = new Date().toLocaleDateString("es-AR");
      const motivo = vacation.motivo || "Vacaciones";
      const dias = vacation.diasSolicitados || 0;

      const safeName = empleadoNombre.replace(/\s+/g, "_");
      const fileName = `Constancia_Vacaciones_${safeName}_${vacation.periodo}_${vacation.fechaInicio}_${vacation.fechaFin}.pdf`;

      const container = document.createElement("div");
      container.style.padding = "24px";
      container.style.fontFamily = "Inter, Arial, sans-serif";
      container.style.color = "#0f1115";
      container.innerHTML = `
        <div style="text-align:center; margin-bottom:16px;">
          <h1 style="margin:0; font-size:22px;">Constancia de Vacaciones</h1>
          <p style="margin:4px 0; font-size:12px;">Período ${vacation.periodo || "-"}</p>
        </div>
        <p style="line-height:1.6; font-size:14px;">
          Se deja constancia de que <strong>${empleadoNombre}</strong> ${dni ? "(DNI " + dni + ")" : ""} gozará de su período de vacaciones desde el <strong>${inicio}</strong> hasta el <strong>${fin}</strong>, totalizando <strong>${dias}</strong> días corridos.
        </p>
        ${motivo ? `<p style="font-size:13px;"><strong>Motivo:</strong> ${motivo}</p>` : ""}
        ${vacation.observaciones ? `<p style=\"font-size:13px;\"><strong>Observaciones:</strong> ${vacation.observaciones}</p>` : ""}
        <p style="margin-top:24px; font-size:13px;">Emitido el ${emitido}.</p>
        <div style="display:flex; justify-content:space-between; margin-top:48px;">
          <div style="text-align:center;">
            <div style="border-top:1px solid #777; width:220px; margin:0 auto 6px;"></div>
            <span style="font-size:12px;">Firma del Empleado</span>
          </div>
          <div style="text-align:center;">
            <div style="border-top:1px solid #777; width:220px; margin:0 auto 6px;"></div>
            <span style="font-size:12px;">Firma de la Empresa</span>
          </div>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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
        description: "La constancia se está descargando.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Error al generar la constancia PDF",
        variant: "destructive",
      });
    }
  };

  const filteredVacations = vacationRequests.filter((vacation) => {
    const name = (vacation.empleadoNombre || "").toLowerCase();
    const status = (vacation.estado || "").toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || status === filterStatus;
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
          <td style="padding:6px 8px; border:1px solid #ddd;">${v.empleadoNombre}</td>
          <td style="padding:6px 8px; border:1px solid #ddd;">${v.periodo}</td>
          <td style="padding:6px 8px; border:1px solid #ddd;">${formatDateLocal(v.fechaInicio)} - ${formatDateLocal(v.fechaFin)}</td>
          <td style="padding:6px 8px; border:1px solid #ddd; text-align:center;">${v.diasSolicitados}</td>
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

  if (view === "form") {
    return <VacationForm onBack={handleBackToList} vacation={selectedVacation} employees={activeEmployees} onSave={addVacationRequest} />;
  }

  if (view === "edit" && selectedVacation) {
    return <VacationForm onBack={handleBackToList} vacation={selectedVacation} employees={activeEmployees} onSave={(data) => {
      // Actualizar la solicitud existente
      setVacationRequests(prev => prev.map(req => 
        req.id === selectedVacation.id 
          ? { ...req, ...data }
          : req
      ));
      toast({
        title: "Solicitud actualizada",
        description: "La solicitud de vacaciones ha sido modificada correctamente.",
      });
      handleBackToList();
    }} />;
  }

  if (view === "detail" && selectedVacation) {
    // Buscar el empleado asociado a la solicitud
    const vacEmployee = employees.find((e: any) => 
      e.id === selectedVacation.employee_id || 
      e.id === selectedVacation.empleadoId ||
      `${e.nombres} ${e.apellidos}` === selectedVacation.empleadoNombre
    );
    // Buscar días usados del empleado
    const empWithVac = employeesWithVacations.find(e => e.id === vacEmployee?.id);
    
    return (
      <VacationDetail
        vacation={selectedVacation}
        employee={vacEmployee}
        usedDays={empWithVac?.usedVacationDays || 0}
        onBack={handleBackToList}
        onApprove={() => approveVacationRequest(selectedVacation.id)}
        onReject={() => rejectVacationRequest(selectedVacation.id)}
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
                  {vacationRequests.length > 0 ? (vacationRequests.reduce((acc, v) => acc + v.diasSolicitados, 0) / vacationRequests.length).toFixed(1) : 0}
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
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left">
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">Empleado</th>
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">DNI</th>
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">Días Totales</th>
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">Días Usados</th>
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">Días Disponibles</th>
                  <th className="px-6 py-3 text-sm font-medium text-foreground/70">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employeesWithVacations.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {employee.nombres} {employee.apellidos}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{employee.dni}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">{employee.totalVacationDays}</td>
                    <td className="px-6 py-4 text-foreground">{employee.usedVacationDays}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${employee.remainingVacationDays <= 5 ? 'text-warning' : 'text-foreground'}`}>
                        {employee.remainingVacationDays}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={employee.remainingVacationDays > 0 ? "default" : "secondary"}>
                        {employee.remainingVacationDays > 0 ? "Disponible" : "Sin días disponibles"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Solicitudes de Vacaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/60" />
              <Input
                placeholder="Buscar por empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as "all" | "pendiente" | "aprobado" | "rechazado")}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vacation Requests List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredVacations.map((vacation) => (
              <Card key={vacation.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground">{vacation.empleadoNombre}</CardTitle>
                    <Badge variant={vacation.estado === "aprobado" ? "default" : vacation.estado === "pendiente" ? "secondary" : "destructive"}>
                      {vacation.estado === "aprobado" ? "Aprobado" : vacation.estado === "pendiente" ? "Pendiente" : "Rechazado"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Fecha Inicio</p>
                      <p className="text-foreground">{formatDateLocal(vacation.fechaInicio)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Fecha Fin</p>
                      <p className="text-foreground">{formatDateLocal(vacation.fechaFin)}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Días Solicitados</p>
                      <p className="text-foreground font-semibold">{vacation.diasSolicitados}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground/70">Estado</p>
                      <p className="text-foreground">{vacation.estado}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground/70">Motivo</p>
                    <p className="text-foreground text-sm">{vacation.motivo}</p>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewVacation(vacation)}>
                      Ver Detalle
                    </Button>
                    {vacation.estado === "pendiente" && (
                      <>
                        <Button variant="default" size="sm" onClick={() => approveVacationRequest(vacation.id)}>
                          Aprobar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => rejectVacationRequest(vacation.id)}>
                          Rechazar
                        </Button>
                      </>
                    )}
                    {vacation.estado === "aprobado" && (
                      <Button variant="outline" size="sm" onClick={() => generateVacationCertificate(vacation)}>
                        <FileText className="h-4 w-4 mr-1" />
                        Constancia
                      </Button>
                    )}
                    {/* Botón Editar - siempre visible para poder modificar solicitudes */}
                    <Button variant="outline" size="sm" onClick={() => handleEditVacation(vacation)}>
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVacations.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No se encontraron solicitudes
              </h3>
              <p className="text-foreground/70">
                No hay solicitudes que coincidan con los filtros seleccionados.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VacationsModule;