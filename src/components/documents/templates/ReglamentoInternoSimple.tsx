import React from "react";
import { clientConfig } from "@/config/client";

interface ReglamentoInternoProps {
  employeeName: string;
  date: string;
}

const ReglamentoInternoSimple = React.forwardRef<
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
        padding: "40px",
        lineHeight: "1.5",
        fontSize: "12px"
      }}
    >
      <div>
        <h1 style={{
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "8px",
          margin: "0 0 8px 0"
        }}>
          REGLAMENTO INTERNO
        </h1>
        <h2 style={{
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "30px",
          margin: "0 0 30px 0"
        }}>
          {clientConfig.nombre.toUpperCase()}
        </h2>

        <p style={{ margin: "0 0 8px 0" }}>
          <strong>Fecha:</strong> {date}
        </p>
        <p style={{ margin: "0 0 20px 0" }}>
          <strong>Nombre del empleado:</strong> {employeeName}
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0"
        }}>
          Este reglamento tiene por objetivo establecer normas claras de convivencia, obligaciones, derechos y procedimientos que garanticen un ambiente de trabajo ordenado, seguro y respetuoso para todos.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          1. OBLIGACIONES Y DEBERES DE LOS EMPLEADOS
        </h3>
        
        <p style={{ margin: "0 0 8px 0" }}>
          • Cumplir con las obligaciones propias del puesto de trabajo, conforme a las reglas de la buena fe y diligencia.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • Observar las órdenes e instrucciones que se le impartan sobre el modo de ejecución del trabajo.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • No ejecutar negociaciones por cuenta propia o de terceros, que pudieran afectar los intereses del empleador.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • Guardar secreto de las informaciones que tenga carácter reservado y cuya divulgación pueda ocasionar perjuicios al empleador.
        </p>
        <p style={{ margin: "0 0 20px 0" }}>
          • Conservar los instrumentos de trabajo y no utilizarlos para otros fines que los de su trabajo.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          2. HORARIOS DE TRABAJO
        </h3>
        
        <p style={{ margin: "0 0 8px 0" }}>
          • Respetar estrictamente los horarios de entrada y salida establecidos.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • Registrar correctamente el ingreso y egreso en el sistema de control horario.
        </p>
        <p style={{ margin: "0 0 20px 0" }}>
          • Solicitar autorización previa para cualquier modificación de horario.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          3. NORMAS DE SEGURIDAD E HIGIENE
        </h3>
        
        <p style={{ margin: "0 0 8px 0" }}>
          • Utilizar obligatoriamente los elementos de protección personal proporcionados.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • Mantener el lugar de trabajo limpio y ordenado.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • Reportar inmediatamente cualquier accidente o situación de riesgo.
        </p>
        <p style={{ margin: "0 0 20px 0" }}>
          • Cumplir con las normas de higiene personal y alimentaria.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          4. PROHIBICIONES
        </h3>
        
        <p style={{ margin: "0 0 8px 0" }}>
          • Está prohibido el consumo de alcohol y drogas en el lugar de trabajo.
        </p>
        <p style={{ margin: "0 0 8px 0" }}>
          • No se permite fumar en las instalaciones de la empresa.
        </p>
        <p style={{ margin: "0 0 20px 0" }}>
          • Queda prohibido el uso de teléfonos celulares durante el horario de trabajo.
        </p>

        <h3 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "20px 0 12px 0"
        }}>
          5. SANCIONES
        </h3>
        
        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 40px 0"
        }}>
          El incumplimiento de este reglamento será sancionado según la gravedad de la falta, pudiendo aplicarse desde llamados de atención hasta la suspensión o despido.
        </p>

        <div style={{ marginTop: "60px" }}>
          <p style={{ margin: "0 0 30px 0", fontWeight: "bold" }}>
            FIRMA DEL EMPLEADO:
          </p>
          <div style={{
            borderBottom: "1px solid black",
            width: "300px",
            height: "40px",
            marginBottom: "15px"
          }}></div>
          <p style={{ margin: "0 0 8px 0" }}>
            Aclaración: {employeeName}
          </p>
          <p style={{ margin: "0 0 8px 0" }}>
            Fecha: {date}
          </p>
        </div>
      </div>
    </div>
  );
});

ReglamentoInternoSimple.displayName = "ReglamentoInternoSimple";

export default ReglamentoInternoSimple;
