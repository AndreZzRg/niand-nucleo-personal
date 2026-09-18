/**
 * Módulo «Alertas de vencimiento»: lo que exige acción, ordenado por urgencia.
 */
import { BellRing, Download } from 'lucide-react';

import { Boton, Dato, Insignia, Llamado, Tarjeta, Vacio, cx, type Tono } from '../brand/ui';
import { alertasDeTodos } from '../domain/personal';
import { diasCalendario, sumarDias, sumarMeses } from '../lib/fechas';
import { exportarCSV } from '../lib/exportar';
import { fechaLarga } from '../lib/formato';
import { useEstado } from '../store';

const TONO: Record<'critica' | 'alta' | 'media', Tono> = {
  critica: 'riesgo',
  alta: 'alerta',
  media: 'info',
};

export function PanelAlertas() {
  const { personas, hoy, seleccionar } = useEstado();
  const alertas = alertasDeTodos(personas, hoy, { sumarDias, sumarMeses, diasCalendario });

  const porGravedad = (g: 'critica' | 'alta' | 'media') =>
    alertas.filter((a) => a.gravedad === g).length;

  if (personas.length === 0) {
    return (
      <Vacio titulo="No hay personal registrado">
        Las alertas se calculan sobre la planta. Empiece por el módulo <strong>Personal</strong>.
      </Vacio>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Dato
          rotulo="Alertas abiertas"
          valor={alertas.length}
          tono={alertas.length ? 'marca' : 'ok'}
        />
        <Dato rotulo="Críticas" valor={porGravedad('critica')} tono="riesgo" />
        <Dato rotulo="Altas" valor={porGravedad('alta')} tono="alerta" />
        <Dato rotulo="Medias" valor={porGravedad('media')} tono="info" />
      </div>

      <Llamado
        tono="marca"
        titulo="Por qué el preaviso encabeza la lista"
        icono={<BellRing size={18} />}
      >
        En el contrato a término fijo, dejar pasar la ventana de <strong>treinta días</strong> antes
        del vencimiento prorroga el contrato de forma automática por un periodo igual (CST, art.
        46). No es un descuido subsanable: la prórroga ya operó.
      </Llamado>

      {alertas.length === 0 ? (
        <Vacio titulo="Nada vencido ni por vencer">
          Los expedientes están completos y no hay plazos próximos. Vuelva a revisar cada mes.
        </Vacio>
      ) : (
        <Tarjeta
          titulo="Alertas"
          descripcion={`Calculadas al ${fechaLarga(hoy)}`}
          acciones={
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() =>
                exportarCSV(
                  [
                    ['Gravedad', 'Persona', 'Alerta', 'Detalle', 'Vence', 'Norma'],
                    ...alertas.map((a) => [
                      a.gravedad,
                      a.persona,
                      a.titulo,
                      a.detalle,
                      a.vence ?? '',
                      a.norma,
                    ]),
                  ],
                  'alertas',
                )
              }
            >
              <Download size={14} /> CSV
            </Boton>
          }
        >
          <ul className="space-y-3">
            {alertas.map((a, i) => (
              <li
                key={`${a.personaId}-${a.tipo}-${i}`}
                className={cx(
                  'rounded-xl border p-4',
                  a.gravedad === 'critica'
                    ? 'border-alerta/35 bg-alerta/6'
                    : a.gravedad === 'alta'
                      ? 'border-ambar-suave/40 bg-ambar-suave/8'
                      : 'border-borde bg-superficie-3',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Insignia tono={TONO[a.gravedad]}>{a.gravedad}</Insignia>
                  <button
                    type="button"
                    onClick={() => seleccionar(a.personaId)}
                    className="text-sm font-semibold text-marca hover:underline"
                  >
                    {a.persona}
                  </button>
                  {a.vence && (
                    <span className="text-xs text-texto-3">vence el {fechaLarga(a.vence)}</span>
                  )}
                </div>
                <p className="mt-1.5 font-medium">{a.titulo}</p>
                <p className="mt-1 text-sm text-texto-2">{a.detalle}</p>
                <p className="eyebrow mt-1.5">{a.norma}</p>
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}
    </div>
  );
}
