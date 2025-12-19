import React from 'react';
import { clientConfig } from '@/config/client';

interface DespidoPeriodoPruebaTemplateProps {
  employeeData: {
    nombres: string;
    apellidos: string;
    dni: string;
    cuil?: string;
  };
  fecha: string;
}

export const DespidoPeriodoPruebaTemplate = React.forwardRef<
  HTMLDivElement,
  DespidoPeriodoPruebaTemplateProps
>(({ employeeData, fecha }, ref) => {
  return (
    <div
      ref={ref}
      style={{ 
        width: "210mm",
        minHeight: "297mm",
        margin: "0 auto",
        fontFamily: 'Arial, sans-serif', 
        backgroundColor: "white",
        color: "black",
        padding: '40px',
        lineHeight: '1.6',
        fontSize: '12px'
      }}>
      {/* Encabezado */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          {clientConfig.nombre}
        </h1>
        {clientConfig.cuit && <p style={{ margin: '0 0 7px 0', fontSize: '10px' }}>{clientConfig.cuit}</p>}
        {clientConfig.direccion && <p style={{ margin: '0 0 20px 0', fontSize: '10px' }}>
          {clientConfig.direccion}
        </p>}
      </div>

      {/* Lugar y Fecha */}
      <div style={{ textAlign: 'right', marginBottom: '20px', fontSize: '12px' }}>
        Río Primero, Córdoba – {fecha}
      </div>

      {/* Destinatario */}
      <div style={{ marginBottom: '20px', fontSize: '12px' }}>
        <p style={{ margin: '0 0 10px 0' }}>
          Al Sr. {employeeData.apellidos} {employeeData.nombres}
        </p>
        <p style={{ margin: '0 0 20px 0' }}>DNI: {employeeData.dni}</p>
      </div>

      {/* Referencia */}
      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
          Ref.: Comunicación de finalización de la relación laboral durante el período de prueba.
        </h2>
      </div>

      {/* Cuerpo */}
      <div style={{ marginBottom: '20px', textAlign: 'justify', fontSize: '11px' }}>
        <p style={{ margin: '0 0 8px 0' }}>
          Por medio de la presente, le informamos que hemos decidido dar por finalizada la relación 
          laboral que lo vincula con esta empresa a partir del día {fecha}, conforme lo dispuesto por 
          el Artículo 92 bis de la Ley de Contrato de Trabajo N.º 20.744, encontrándose usted dentro 
          del período de prueba legalmente establecido.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          La extinción de la relación laboral no obedece a causa disciplinaria alguna y, por tratarse 
          de una desvinculación dentro del período de prueba, no corresponde el pago de indemnización 
          por despido, conforme a lo establecido en la legislación vigente.
        </p>
        <p style={{ margin: '0 0 8px 0' }}>
          En los próximos días podrá retirar su liquidación final, recibo correspondiente y demás 
          documentación laboral, incluyendo su certificado de trabajo conforme al Art. 80 de la LCT.
        </p>
        <p style={{ margin: '0 0 30px 0' }}>
          Sin otro particular, saludamos a usted atentamente.
        </p>
      </div>

      {/* Firmas */}
      <div style={{ marginTop: '40px' }}>
        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '11px', fontWeight: 'normal', margin: '0 0 15px 0' }}>
            Firma del empleador:
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
            Nombre: ____________________________
          </p>
          <p style={{ margin: '0 0 25px 0', fontSize: '11px' }}>
            Cargo: ____________________________
          </p>
        </div>

        <div>
          <p style={{ fontSize: '11px', fontWeight: 'normal', margin: '0 0 15px 0' }}>
            Firma del trabajador:
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
            Nombre: ____________________________
          </p>
          <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
            DNI: ____________________________
          </p>
          <p style={{ margin: '0', fontSize: '11px' }}>
            Fecha de recepción: __________________
          </p>
        </div>
      </div>
    </div>
  );
});

DespidoPeriodoPruebaTemplate.displayName = "DespidoPeriodoPruebaTemplate";
