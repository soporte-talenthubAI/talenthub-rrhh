import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, TrendingUp, Award, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateLocal } from "@/utils/dateUtils";

interface PerformanceDetailProps {
  evaluation: any;
  onBack: () => void;
}

const PerformanceDetail = ({ evaluation, onBack }: PerformanceDetailProps) => {
  const { toast } = useToast();

  const generateReport = () => {
    toast({
      title: "Reporte generado",
      description: "El reporte de evaluación se ha generado exitosamente",
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 80) return "text-primary";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-success/10 border-success/20";
    if (score >= 80) return "bg-primary/10 border-primary/20";
    if (score >= 70) return "bg-warning/10 border-warning/20";
    return "bg-destructive/10 border-destructive/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Detalle de Evaluación</h2>
            <p className="text-foreground/70">Información completa de la evaluación de desempeño</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`p-4 rounded-lg border ${getScoreBg(evaluation.puntuacionGeneral)}`}>
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(evaluation.puntuacionGeneral)}`}>
                {evaluation.puntuacionGeneral}
              </div>
              <div className="text-sm text-foreground/70">Puntuación General</div>
            </div>
          </div>
          <Button onClick={generateReport}>
            <Download className="h-4 w-4 mr-2" />
            Descargar Reporte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información del Empleado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Información del Empleado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground/70">Nombre Completo</p>
              <p className="text-foreground font-semibold">{evaluation.empleadoNombre}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Período Evaluado</p>
              <p className="text-foreground">{evaluation.periodo}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Evaluador</p>
              <p className="text-foreground">{evaluation.evaluador}</p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground/70">Fecha de Evaluación</p>
              <p className="text-foreground">{formatDateLocal(evaluation.fechaEvaluacion)}</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground/70">Estado</p>
              <Badge variant={evaluation.estado === "completado" ? "success" : "warning"}>
                {evaluation.estado === "completado" ? "Completado" : "En Progreso"}
              </Badge>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground/70 mb-2">Información Laboral</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Cargo:</span>
                  <span className="text-foreground">Encargado</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Sector:</span>
                  <span className="text-foreground">Incubación</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Antigüedad:</span>
                  <span className="text-foreground">6 años</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluación de Competencias */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Competencias Evaluadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/70">Habilidades Técnicas</span>
                  <span className="font-semibold text-foreground">{evaluation.competencias.tecnicas}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${evaluation.competencias.tecnicas >= 90 ? 'bg-success' : evaluation.competencias.tecnicas >= 80 ? 'bg-primary' : evaluation.competencias.tecnicas >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${evaluation.competencias.tecnicas}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/70">Liderazgo</span>
                  <span className="font-semibold text-foreground">{evaluation.competencias.liderazgo}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${evaluation.competencias.liderazgo >= 90 ? 'bg-success' : evaluation.competencias.liderazgo >= 80 ? 'bg-primary' : evaluation.competencias.liderazgo >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${evaluation.competencias.liderazgo}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/70">Comunicación</span>
                  <span className="font-semibold text-foreground">{evaluation.competencias.comunicacion}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${evaluation.competencias.comunicacion >= 90 ? 'bg-success' : evaluation.competencias.comunicacion >= 80 ? 'bg-primary' : evaluation.competencias.comunicacion >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${evaluation.competencias.comunicacion}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/70">Puntualidad</span>
                  <span className="font-semibold text-foreground">{evaluation.competencias.puntualidad}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${evaluation.competencias.puntualidad >= 90 ? 'bg-success' : evaluation.competencias.puntualidad >= 80 ? 'bg-primary' : evaluation.competencias.puntualidad >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${evaluation.competencias.puntualidad}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground/70">Trabajo en Equipo</span>
                  <span className="font-semibold text-foreground">{evaluation.competencias.trabajoEquipo}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${evaluation.competencias.trabajoEquipo >= 90 ? 'bg-success' : evaluation.competencias.trabajoEquipo >= 80 ? 'bg-primary' : evaluation.competencias.trabajoEquipo >= 70 ? 'bg-warning' : 'bg-destructive'}`}
                    style={{ width: `${evaluation.competencias.trabajoEquipo}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm font-medium text-foreground mb-1">Promedio de Competencias</p>
              <p className="text-2xl font-bold text-primary">
                {Math.round((evaluation.competencias.tecnicas + evaluation.competencias.liderazgo + evaluation.competencias.comunicacion + evaluation.competencias.puntualidad + evaluation.competencias.trabajoEquipo) / 5)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Objetivos y Comentarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Objetivos y Desarrollo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Cumplimiento de Objetivos</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground/70">Cumplimiento</span>
                    <span className="font-semibold text-foreground">{evaluation.objetivos.cumplimiento}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${evaluation.objetivos.cumplimiento}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground/70">Calidad</span>
                    <span className="font-semibold text-foreground">{evaluation.objetivos.calidad}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${evaluation.objetivos.calidad}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-foreground/70">Eficiencia</span>
                    <span className="font-semibold text-foreground">{evaluation.objetivos.eficiencia}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${evaluation.objetivos.eficiencia}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-foreground mb-2">Fortalezas Principales</h4>
                <div className="space-y-1">
                  {evaluation.fortalezas.map((fortaleza: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Award className="h-4 w-4 text-success" />
                      <span className="text-sm text-foreground">{fortaleza}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-foreground mb-2">Áreas de Desarrollo</h4>
                <div className="space-y-1">
                  {evaluation.areasDesarrollo.map((area: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-warning" />
                      <span className="text-sm text-foreground">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {evaluation.observaciones && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-foreground mb-2">Observaciones del Evaluador</h4>
                <p className="text-sm text-foreground">{evaluation.observaciones}</p>
              </div>
            )}

            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <h4 className="font-semibold text-foreground mb-2 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Plan de Desarrollo
              </h4>
              <ul className="text-sm text-foreground/70 space-y-1">
                <li>• Capacitación en liderazgo avanzado</li>
                <li>• Curso de comunicación efectiva</li>
                <li>• Mentoría con supervisor senior</li>
                <li>• Revisión en 3 meses</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDetail;