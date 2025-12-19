import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import { usePayroll } from "@/hooks/usePayroll";
import { Search } from "lucide-react";
import { formatDateLocal } from "@/utils/dateUtils";

const PayrollList = () => {
  const { employees } = useEmployees();
  const { payrollRecords, isLoading } = usePayroll();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    return employee ? `${employee.nombres} ${employee.apellidos}` : "Empleado desconocido";
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      salary: "Sueldo",
      advance: "Adelanto", 
      bonus: "Bonificación",
      deduction: "Descuento"
    };
    return labels[type as keyof typeof labels];
  };

  const getTypeVariant = (type: string) => {
    const variants = {
      salary: "default",
      advance: "secondary",
      bonus: "outline",
      deduction: "destructive"
    };
    return variants[type as keyof typeof variants];
  };

  const getStatusLabel = (status: string | undefined) => {
    return status === "paid" ? "Pagado" : "Pendiente";
  };

  const getStatusVariant = (status: string | undefined) => {
    return status === "paid" ? "default" : "secondary";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };


  const formatPeriod = (period: string) => {
    const [year, month] = period.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const filteredData = payrollRecords.filter(record => {
    const employeeName = getEmployeeName(record.employee_id);
    const matchesSearch = employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || record.type === filterType;
    const matchesPeriod = filterPeriod === "all" || record.period === filterPeriod;
    
    return matchesSearch && matchesType && matchesPeriod;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            Consulta todos los registros de pagos, adelantos, bonificaciones y descuentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por empleado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="salary">Sueldos</SelectItem>
                <SelectItem value="advance">Adelantos</SelectItem>
                <SelectItem value="bonus">Bonificaciones</SelectItem>
                <SelectItem value="deduction">Descuentos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los períodos</SelectItem>
                <SelectItem value="2024-01">Enero 2024</SelectItem>
                <SelectItem value="2023-12">Diciembre 2023</SelectItem>
                <SelectItem value="2023-11">Noviembre 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Cargando registros...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No se encontraron registros de pagos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(record.employee_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(record.type) as any}>
                          {getTypeLabel(record.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(record.amount)}
                      </TableCell>
                      <TableCell>
                        {formatPeriod(record.period)}
                      </TableCell>
                      <TableCell>
                        {formatDateLocal(record.payment_date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(record.status) as any}>
                          {getStatusLabel(record.status)}
                        </Badge>
                        {record.reversal_of_id && (
                          <Badge variant="outline" className="ml-2">
                            Anulación
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollList;
