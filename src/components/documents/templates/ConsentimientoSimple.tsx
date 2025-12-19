import React from "react";
import { clientConfig } from "@/config/client";

interface ConsentimientoProps {
  employeeName: string;
  employeeDni: string;
  employeeAddress: string;
  date: string;
}

const ConsentimientoSimple = React.forwardRef<
  HTMLDivElement,
  ConsentimientoProps
>(({ employeeName, employeeDni, employeeAddress, date }, ref) => {
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
          fontSize: "18px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "30px",
          margin: "0 0 30px 0"
        }}>
          CONSTANCIA DE CONSENTIMIENTO PARA USO DE CÁMARAS DE VIGILANCIA Y DATOS BIOMÉTRICOS
        </h1>

        <p style={{ margin: "0 0 15px 0" }}>
          <strong>Fecha:</strong> {date}
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0"
        }}>
          En la ciudad de Córdoba Capital, comparece el/la trabajador/a <strong>{employeeName}</strong>, DNI Nº <strong>{employeeDni}</strong>, con domicilio en <strong>{employeeAddress}</strong>, quien manifiesta prestar su consentimiento expreso en los términos de la Ley de Protección de Datos Personales N° 25.326 y normativa laboral aplicable.
        </p>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>
          1. CÁMARAS DE VIGILANCIA
        </h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 12px 0"
        }}>
          El/la trabajador/a declara haber sido informado/a de la existencia de cámaras de seguridad instaladas en las instalaciones de la empresa {clientConfig.nombre} (en adelante "la Empresa"), cuya finalidad exclusiva es la prevención de riesgos, seguridad de las personas, resguardo de bienes y control de acceso a las instalaciones.
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0",
          fontWeight: "bold"
        }}>
          PRESTA SU CONSENTIMIENTO para ser filmado/a durante el desarrollo de sus tareas laborales, entendiendo que las imágenes captadas serán utilizadas únicamente para los fines mencionados y bajo estricta confidencialidad, conforme a la legislación vigente.
        </p>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>
          2. DATOS BIOMÉTRICOS
        </h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 12px 0"
        }}>
          El/la trabajador/a ha sido informado/a que la Empresa utiliza sistemas de control de acceso y horario mediante tecnología biométrica (huella dactilar), con el fin de garantizar la seguridad de las instalaciones y el correcto registro de la jornada laboral.
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0",
          fontWeight: "bold"
        }}>
          PRESTA SU CONSENTIMIENTO para el tratamiento de sus datos biométricos (huella dactilar) exclusivamente para los fines mencionados, entendiendo que dichos datos serán almacenados de forma segura y no serán compartidos con terceros ajenos a la empresa.
        </p>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>
          3. DERECHOS DEL TITULAR
        </h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 12px 0"
        }}>
          El/la trabajador/a conoce sus derechos de acceso, rectificación, actualización y supresión de sus datos personales, los cuales podrá ejercer dirigiéndose a la empresa en cualquier momento, conforme a la Ley 25.326.
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 40px 0"
        }}>
          Este consentimiento es revocable en cualquier momento, sin que ello afecte la licitud del tratamiento basado en el consentimiento previo a su retirada.
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
            DNI: {employeeDni}
          </p>
          <p style={{ margin: "0 0 8px 0" }}>
            Fecha: {date}
          </p>
        </div>
      </div>
    </div>
  );
});

ConsentimientoSimple.displayName = "ConsentimientoSimple";

export default ConsentimientoSimple;
