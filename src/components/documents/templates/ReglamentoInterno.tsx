import React from "react";
import { clientConfig } from "@/config/client";

interface ReglamentoInternoProps {
  employeeName: string;
  date: string;
}

const ReglamentoInterno = React.forwardRef<
  HTMLDivElement,
  ReglamentoInternoProps
>(({ employeeName, date }, ref) => {
  return (
    <div
      ref={ref}
      style={{
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
        backgroundColor: "white",
        color: "black",
        padding: "48px", // p-12 = 48px
        lineHeight: "1.5"
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "8px"
        }}>
          REGLAMENTO INTERNO
        </h1>
        <h2 style={{
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "32px"
        }}>
          {clientConfig.nombre.toUpperCase()}
        </h2>

        <p style={{ marginBottom: "8px" }}>
          <strong>Fecha:</strong> {date}
        </p>
        <p style={{ marginBottom: "24px" }}>
          <strong>Nombre del empleado:</strong> {employeeName}
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          marginBottom: "24px"
        }}>
          Este reglamento tiene por objetivo establecer normas claras de
          convivencia, obligaciones, derechos y procedimientos que garanticen un
          ambiente de trabajo ordenado, seguro y respetuoso para todos.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          1. Obligaciones y deberes de los empleados
        </h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Cumplir con las obligaciones propias del puesto de trabajo, conforme a
            los principios de buena fe, diligencia y responsabilidad.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Mantener el orden y aseo de los lugares de acceso común y convivencia
            con compañeros de trabajo.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Cuidar y conservar en condiciones óptimas las herramientas,
            maquinarias, elementos de limpieza y demás materiales de trabajo.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Cumplir y respetar las medidas de seguridad e higiene establecidas por
            la empresa.
          </p>
        </div>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          2. Derechos de los empleados
        </h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Desempeñarse en un ambiente sano, seguro y libre de riesgos
            innecesarios.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Conocer los riesgos inherentes a su puesto de trabajo.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Percibir una retribución justa acorde a las tareas realizadas.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Recibir los elementos de trabajo y de protección personal necesarios
            según la tarea a realizar.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Acceder al descanso vacacional anual conforme a la normativa vigente.
          </p>
        </div>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          3. Normas de trabajo dentro de la granja
        </h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Queda prohibido fumar en las zonas de trabajo.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • No se podrá utilizar el teléfono celular en horario laboral, salvo
            para fines estrictamente laborales.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Mantener en todo momento un trato de respeto y educación hacia
            compañeros, superiores y público en general.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Presentarse al trabajo con higiene personal adecuada y con el uniforme
            limpio y en buen estado.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Queda prohibido jugar con herramientas de trabajo o darles un uso
            indebido.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Es obligatorio el uso de gafas de seguridad cuando la tarea lo
            requiera.
          </p>
        </div>

        {/* Page Break */}
        <div style={{ pageBreakAfter: "always" }}></div>

        {/* Page 2 */}
        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>4. Prohibiciones</h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Faltar al trabajo sin causa justificada o sin autorización previa.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Sustraer de la empresa herramientas, insumos, materia prima o
            productos elaborados.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Presentarse al trabajo en estado de embriaguez.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Presentarse bajo los efectos de narcóticos o drogas enervantes, salvo
            prescripción médica debidamente acreditada.
          </p>
        </div>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          5. Certificados y ausencias
        </h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • En caso de enfermedad, el trabajador deberá avisar con al menos 2
            horas de anticipación sobre su ausencia, salvo situaciones de urgencia.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • El certificado médico deberá ser cargado en el formulario de ausencias
            dentro de las 24 horas de producida la falta.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Las vacaciones deberán solicitarse en el mes de octubre indicando las
            fechas de preferencia. La empresa, en base a la demanda productiva y
            organización interna, asignará los períodos entre noviembre y abril.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • La falta de presentación del certificado en tiempo y forma dará lugar
            al descuento del día no trabajado. En caso de reincidencia, el
            trabajador podrá recibir un apercibimiento y, si la conducta persiste,
            suspensión.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • El incumplimiento reiterado de este reglamento podrá derivar en
            sanciones disciplinarias según la gravedad del caso.
          </p>
        </div>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>6. Sanciones</h3>
        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Apercibimiento verbal o escrito.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Descuento de haberes en los casos que corresponda.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Suspensión según la gravedad y reiteración de las faltas.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • En casos extremos y de gravedad, la empresa podrá evaluar la extinción
            de la relación laboral conforme a la legislación vigente.
          </p>
        </div>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 30px 0"
        }}>
          Este Reglamento Interno entra en vigencia a partir de su comunicación a
          los empleados y deberá ser conocido, respetado y cumplido por todos los
          integrantes de {clientConfig.nombre}.
        </p>

        <div style={{ marginTop: "40px" }}>
          <p style={{ margin: "0 0 30px 0", fontWeight: "bold" }}>
            Firma Empleado
          </p>
          <p style={{ margin: "0" }}>Aclaración: _________________________________</p>
        </div>
      </div>
    </div>
  );
});

ReglamentoInterno.displayName = "ReglamentoInterno";

export default ReglamentoInterno;