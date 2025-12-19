import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CalendarDays, 
  ClipboardList, 
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  AlertCircle,
  UserCheck
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAttendance } from "@/hooks/useAttendance";
import { useTraining } from "@/hooks/useTraining";
import { useAbsences } from "@/hooks/useAbsences";
import { useSanctionStats } from "@/hooks/useSanctionStats";
import { formatDateLocal } from "@/utils/dateUtils";
import { formatDateLocal } from "@/utils/dateUtils";

const DashboardOverview = () => {
  const { employees, getActiveEmployees } = useEmployees();
  const { stats: attendanceStats } = useAttendance();
  const { stats: trainingStats } = useTraining();
  const { absences } = useAbsences();
  const { stats: sanctionStats } = useSanctionStats();
  const activeEmployees = getActiveEmployees();
  
  // Calculate upcoming birthdays for this month
  const getUpcomingBirthdays = () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      
      return activeEmployees.filter(employee => {
        if (!employee.fechaNacimiento) return false;
        try {
          const birthDateString = formatDateLocal(employee.fechaNacimiento);
          const dateParts = birthDateString.split('/');
          if (dateParts.length !== 3) return false;
          const month = parseInt(dateParts[1]);
          return month === currentMonth;
        } catch (error) {
          return false;
        }
      }).map(employee => {
        try {
          const birthDateString = formatDateLocal(employee.fechaNacimiento!);
          const [day, month, year] = birthDateString.split('/');
          
          return {
            id: employee.id,
            name: `${employee.nombres} ${employee.apellidos}`,
            date: parseInt(day) || 0,
            fullDate: birthDateString,
            originalDate: employee.fechaNacimiento
          };
        } catch (error) {
          return {
            id: employee.id,
            name: `${employee.nombres} ${employee.apellidos}`,
            date: 0,
            fullDate: 'Fecha inválida',
            originalDate: employee.fechaNacimiento
          };
        }
      }).sort((a, b) => a.date - b.date);
    } catch (error) {
      return [];
    }
  };
  
  const quickStats = [
    {
      title: "Total empleados activos",
      value: (activeEmployees?.length || 0).toString(),
      change: `${employees?.length || 0} empleados en total`,
      icon: UserCheck,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Llegadas tarde este mes",
      value: (attendanceStats?.lateArrivals || 0).toString(),
      change: `${attendanceStats?.totalRecords || 0} registros`,
      icon: Clock,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      title: "Capacitaciones completadas",
      value: (trainingStats?.completedTrainings || 0).toString(),
      change: `${trainingStats?.completionRate || 0}% completado`,
      icon: ClipboardList,
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      title: "Suspensiones y apercibimientos",
      value: (sanctionStats?.totalSanctions || 0).toString(),
      change: `${sanctionStats?.thisMonthSanctions || 0} este mes`,
      icon: AlertCircle,
      color: "text-warning",
      bgColor: "bg-warning/10"
    }
  ];

  // Actividades recientes basadas en datos reales
  const recentActivities = [
    ...(absences || []).slice(0, 2).map(absence => ({
      id: `absence-${absence.id}`,
      message: `${absence.empleadoNombre} solicitó ausencia por ${absence.tipo}`,
      time: formatDateLocal(absence.created_at),
      status: absence.estado === 'aprobado' ? 'success' : 'warning'
    })),
    ...(trainingStats?.completedTrainings || 0) > 0 ? [{
      id: 'training-completed',
      message: `${trainingStats?.completedTrainings || 0} capacitaciones completadas`,
      time: new Date().toLocaleDateString(),
      status: 'success'
    }] : [],
    ...(sanctionStats?.thisMonthSanctions || 0) > 0 ? [{
      id: 'sanctions-this-month',
      message: `${sanctionStats?.thisMonthSanctions || 0} sanciones este mes`,
      time: new Date().toLocaleDateString(),
      status: 'warning'
    }] : []
  ].slice(0, 5);


  // Helper for status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case "info":
        return <Clock className="h-4 w-4 text-primary" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-card-foreground mt-2">
                      {stat.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No hay actividad reciente</div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">
                        {activity.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Ver todas las actividades
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Cumpleaños de este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const upcomingBirthdays = getUpcomingBirthdays();
              
              if (upcomingBirthdays.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay cumpleaños este mes
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {upcomingBirthdays.map((birthday) => (
                    <div key={birthday.id} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-card-foreground text-sm">
                            🎂 {birthday.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {birthday.date} de {new Date().toLocaleDateString('es-AR', { month: 'long' })}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            ({birthday.fullDate})
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary">
                          Cumpleaños
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
            {getUpcomingBirthdays().length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  🎉 ¡No olvides felicitar a tus compañeros!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default DashboardOverview;