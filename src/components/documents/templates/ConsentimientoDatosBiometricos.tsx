import React from "react";
import { clientConfig } from "@/config/client";

interface ConsentimientoDatosBiometricosProps {
  employeeName: string;
  employeeDni: string;
  employeeAddress: string;
  date: string;
}

const ConsentimientoDatosBiometricos = React.forwardRef<
  HTMLDivElement,
  ConsentimientoDatosBiometricosProps
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
        padding: "48px",
        lineHeight: "1.5"
      }}
    >
      {/* Page 1 */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          textAlign: "center",
          fontSize: "20px",
          fontWeight: "bold",
          textTransform: "uppercase",
          marginBottom: "30px"
        }}>
          CONSTANCIA DE CONSENTIMIENTO PARA USO DE CÁMARAS DE VIGILANCIA Y DATOS
          BIOMÉTRICOS
        </h1>

        <p style={{ margin: "0 0 15px 0" }}>
          <strong>Fecha:</strong> {date}
        </p>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0"
        }}>
          En la ciudad de Córdoba Capital, comparece el/la trabajador/a{" "}
          <strong>{employeeName}</strong>, DNI Nº <strong>{employeeDni}</strong>,
          con domicilio en <strong>{employeeAddress}</strong>, quien manifiesta
          prestar su consentimiento expreso en los términos de la Ley de
          Protección de Datos Personales N° 25.326 y normativa laboral aplicable.
        </p>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>1. Cámaras de Vigilancia</h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 15px 0"
        }}>
          El/la trabajador/a declara haber sido informado/a de la existencia de
          cámaras de seguridad instaladas en las instalaciones de la empresa
          {clientConfig.nombre} (en adelante "la Empresa"), cuya finalidad exclusiva
          es la prevención de riesgos, seguridad de las personas, resguardo de
          bienes materiales y control del cumplimiento de normas laborales.
        </p>

        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Las cámaras se encuentran ubicadas en espacios comunes y áreas de
            trabajo, sin invadir espacios privados.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Las imágenes captadas podrán ser utilizadas como medio de prueba en
            caso de ser necesario y se almacenarán por un período limitado
            conforme a la política interna de la Empresa.
          </p>
        </div>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>
          2. Datos Biométricos – Registro de Huella Digital
        </h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 15px 0"
        }}>
          El/la trabajador/a presta consentimiento para la recolección y
          tratamiento de su dato biométrico (huella digital) con la finalidad de:
        </p>

        <div style={{ marginLeft: "20px", marginBottom: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Registrar su asistencia y puntualidad mediante el reloj biométrico
            implementado por la Empresa.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Garantizar la correcta administración de la jornada laboral.
          </p>
        </div>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 20px 0"
        }}>
          Los datos biométricos serán tratados con carácter estrictamente
          confidencial, almacenados en soportes digitales seguros y utilizados
          únicamente para la finalidad descripta. No serán cedidos a terceros,
          salvo obligación legal.
        </p>

        <h2 style={{
          fontSize: "16px",
          fontWeight: "bold",
          margin: "25px 0 15px 0"
        }}>3. Derechos del Trabajador/a</h2>

        <p style={{
          textAlign: "justify",
          lineHeight: "1.6",
          margin: "0 0 8px 0"
        }}>
          El/la trabajador/a reconoce que:
        </p>

        {/* Page Break */}
        <div style={{ pageBreakAfter: "always" }}></div>

        {/* Page 2 */}
        <div style={{ marginLeft: "20px", marginBottom: "30px", marginTop: "20px" }}>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Puede ejercer en cualquier momento sus derechos de acceso,
            rectificación, actualización o supresión de los datos conforme lo
            establece la Ley N° 25.326.
          </p>
          <p style={{ margin: "0 0 8px 0", textAlign: "justify", lineHeight: "1.6" }}>
            • Su consentimiento puede ser revocado mediante notificación fehaciente
            a la Empresa, sin efectos retroactivos sobre el tratamiento ya
            realizado.
          </p>
        </div>

        <div style={{ marginTop: "60px" }}>
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 20px 0" }}>Firma del Trabajador/a</h3>
            <div>
              <p style={{ margin: "0 0 15px 0" }}>Nombre y Apellido: _________________________________</p>
              <p style={{ margin: "0" }}>DNI: _________________________________</p>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 20px 0" }}>Firma de la Empresa</h3>
            <div>
              <p style={{ margin: "0 0 15px 0" }}>Representante: _________________________________</p>
              <p style={{ margin: "0" }}>Cargo: _________________________________</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ConsentimientoDatosBiometricos.displayName = "ConsentimientoDatosBiometricos";

export default ConsentimientoDatosBiometricos;