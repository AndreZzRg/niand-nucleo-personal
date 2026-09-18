/**
 * Módulo «Contratos»: reglas de cada modalidad y periodo de prueba aplicable.
 */
import { Scale } from 'lucide-react';

import { Dato, Insignia, Llamado, Tabla, Tarjeta, Td, Th, Vacio } from '../brand/ui';
import { CONTRATOS, contratoPorId, maximoPeriodoPrueba } from '../domain/personal';
import { diasCalendario, sumarDias } from '../lib/fechas';
import { fechaLarga, plural } from '../lib/formato';
import { useEstado, usePersona } from '../store';

export function PanelContratos() {
  const { personas } = useEstado();
  const actual = usePersona();

  const porModalidad = CONTRATOS.map((c) => ({
    definicion: c,
    total: personas.filter((p) => p.tipoContrato === c.id && p.estado !== 'retirado').length,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Modalidades en uso" valor={porModalidad.filter((m) => m.total > 0).length} />
        <Dato
          rotulo="A término indefinido"
          valor={porModalidad.find((m) => m.definicion.id === 'indefinido')!.total}
          tono="ok"
          detalle="Regla general de vinculación"
        />
        <Dato
          rotulo="A término fijo"
          valor={
            porModalidad.find((m) => m.definicion.id === 'fijoMenorAnio')!.total +
            porModalidad.find((m) => m.definicion.id === 'fijoAnioOMas')!.total
          }
          tono="alerta"
          detalle="Exigen preaviso de no prórroga"
        />
      </div>

      {actual ? (
        <Tarjeta
          titulo={`Contrato de ${actual.nombre}`}
          descripcion={contratoPorId(actual.tipoContrato).rotulo}
        >
          {(() => {
            const duracion = actual.fin ? diasCalendario(actual.ingreso, actual.fin) : null;
            const prueba = maximoPeriodoPrueba(actual.tipoContrato, duracion);
            const finPrueba = prueba.dias > 0 ? sumarDias(actual.ingreso, prueba.dias) : null;
            return (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Dato rotulo="Ingreso" valor={fechaLarga(actual.ingreso)} />
                  <Dato
                    rotulo="Terminación pactada"
                    valor={actual.fin ? fechaLarga(actual.fin) : 'Sin término'}
                    tono={actual.fin ? 'alerta' : 'ok'}
                  />
                  <Dato
                    rotulo="Duración pactada"
                    valor={duracion !== null ? plural(duracion, 'día', 'días') : 'Indefinida'}
                  />
                </div>

                <Llamado
                  tono="marca"
                  titulo="Periodo de prueba aplicable"
                  icono={<Scale size={18} />}
                >
                  {prueba.dias > 0 ? (
                    <p>
                      Máximo <strong>{plural(prueba.dias, 'día', 'días')}</strong>, hasta el{' '}
                      <strong>{fechaLarga(finPrueba!)}</strong>. {prueba.regla} Debe constar por
                      escrito: un periodo de prueba no pactado en el contrato no existe.
                    </p>
                  ) : (
                    <p>{prueba.regla}</p>
                  )}
                </Llamado>

                <Llamado tono="info">
                  {contratoPorId(actual.tipoContrato).nota}
                  <span className="eyebrow mt-1 block">
                    {contratoPorId(actual.tipoContrato).norma}
                  </span>
                </Llamado>
              </div>
            );
          })()}
        </Tarjeta>
      ) : (
        <Vacio titulo="Seleccione una persona">
          Elija a alguien en el módulo <strong>Personal</strong> para ver las reglas de su contrato.
        </Vacio>
      )}

      <Tarjeta
        titulo="Modalidades de vinculación"
        descripcion="Cada modalidad tiene límites propios; usarla fuera de su supuesto la desnaturaliza."
      >
        <Tabla>
          <thead>
            <tr>
              <Th>Modalidad</Th>
              <Th numerico>En uso</Th>
              <Th>Periodo de prueba</Th>
              <Th>Norma</Th>
            </tr>
          </thead>
          <tbody>
            {porModalidad.map(({ definicion, total }) => (
              <tr key={definicion.id}>
                <Td>
                  <span className="font-medium">{definicion.rotulo}</span>
                  <span className="block text-xs text-texto-2">{definicion.nota}</span>
                </Td>
                <Td numerico>
                  {total > 0 ? (
                    <Insignia tono="marca">{total}</Insignia>
                  ) : (
                    <span className="text-texto-3">—</span>
                  )}
                </Td>
                <Td className="text-xs">
                  {definicion.admitePrusuebaProporcional
                    ? 'Quinta parte del término, tope de 2 meses'
                    : definicion.pruebaMaximaMeses === null
                      ? 'No admite'
                      : `${definicion.pruebaMaximaMeses} meses`}
                </Td>
                <Td className="text-xs text-texto-2">{definicion.norma}</Td>
              </tr>
            ))}
          </tbody>
        </Tabla>
      </Tarjeta>
    </div>
  );
}
