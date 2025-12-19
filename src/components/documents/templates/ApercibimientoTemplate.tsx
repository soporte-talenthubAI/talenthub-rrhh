import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clientConfig } from '@/config/client';

interface ApercibimientoTemplateProps {
  employeeData: {
    employee: any;
    sanction: any;
  };
  generatedDate: string;
}

export const ApercibimientoTemplate = ({ employeeData, generatedDate }: ApercibimientoTemplateProps) => {
  const { employee, sanction } = employeeData;
  const fechaDocumento = format(new Date(sanction.fecha_documento), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const fechaHecho = sanction.fecha_hecho 
    ? format(new Date(sanction.fecha_hecho), "dd 'de' MMMM 'de' yyyy", { locale: es })
    : '';

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      padding: '40px', 
      maxWidth: '800px',
      margin: '0 auto',
      lineHeight: '1.6'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold' }}>
          {clientConfig.nombre.toUpperCase()}
        </h2>
      </div>

      <p style={{ marginBottom: '20px' }}>
        Córdoba, {fechaDocumento}
      </p>

      <p style={{ marginBottom: '10px' }}>
        <strong>Sr/a:</strong> {employee.apellidos}, {employee.nombres}
      </p>
      <p style={{ marginBottom: '20px' }}>
        <strong>DNI:</strong> {employee.dni}
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
        Por medio de la presente, procedemos a notificarle de manera fehaciente que se ha 
        resuelto aplicar un <strong>Apercibimiento</strong>.
      </p>

      <p style={{ marginBottom: '20px', textAlign: 'justify' }}>
        Atento a {sanction.motivo.toLowerCase()}, ocurrido el día {fechaHecho}
        {sanction.lugar_hecho ? ` en ${sanction.lugar_hecho}` : ''}.
      </p>

      <p style={{ marginBottom: '30px', textAlign: 'justify' }}>
        Por ello, se le aplica un apercibimiento y se lo exhorta a que, en lo sucesivo, 
        adecúe su conducta a las pautas de cumplimiento normativo del Art. 16 del CCT 422/05 
        y al reglamento interno de la empresa, bajo apercibimiento de aplicar sanciones de 
        mayor gravedad.
      </p>

      <p style={{ marginBottom: '40px', textAlign: 'justify' }}>
        <em>//Seguidamente, notifico de la comunicación que me antecede.</em>
      </p>

      <p style={{ marginBottom: '40px' }}>
        Córdoba, {fechaDocumento}.
      </p>

      <p style={{ marginBottom: '60px', textAlign: 'center', fontWeight: 'bold' }}>
        {clientConfig.nombre.toUpperCase()}
      </p>

      <div style={{ marginTop: '80px' }}>
        <p style={{ marginBottom: '5px' }}>
          <strong>Firma del trabajador:</strong> _______________________________
        </p>
        <p style={{ marginBottom: '5px' }}>
          <strong>Aclaración:</strong> _______________________________
        </p>
        <p>
          <strong>DNI:</strong> _______________________________
        </p>
      </div>

      {sanction.observaciones && (
        <div style={{ 
          marginTop: '40px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5',
          borderLeft: '3px solid #666'
        }}>
          <p style={{ margin: '0', fontSize: '12px' }}>
            <strong>Observaciones:</strong> {sanction.observaciones}
          </p>
        </div>
      )}
    </div>
  );
};
