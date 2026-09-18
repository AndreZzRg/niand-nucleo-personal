/**
 * Módulo «Expediente digital»: control de los documentos obligatorios.
 */
import { FileWarning, ShieldAlert } from 'lucide-react';

import { Dato, Insignia, Llamado, Tarjeta, Vacio, cx } from '../brand/ui';
import { completitud, contratoPorId, documentosDe } from '../domain/personal';
import { porcentaje } from '../lib/formato';
import { useEstado, usePersona } from '../store';

export function PanelExpediente() {
  const { alternarDocumento } = useEstado();
  const p = usePersona();

  if (!p) {
    return (
      <Vacio titulo="Seleccione una persona">
        El expediente pertenece a una persona concreta. Elíjala en el módulo{' '}
        <strong>Personal</strong>.
      </Vacio>
    );
  }

  const exigibles = documentosDe(p.tipoContrato);
  const faltantes = exigibles.filter((d) => !p.documentos.includes(d.id));
  const avance = completitud(p);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Dato
          rotulo="Completitud del expediente"
          valor={porcentaje(avance, 0)}
          tono={avance === 1 ? 'ok' : avance >= 0.6 ? 'alerta' : 'riesgo'}
        />
        <Dato rotulo="Documentos exigibles" valor={exigibles.length} />
        <Dato
          rotulo="Faltantes"
          valor={faltantes.length}
          tono={faltantes.length > 0 ? 'riesgo' : 'ok'}
        />
      </div>

      <Llamado
        tono="riesgo"
        titulo="Dato sensible en el expediente"
        icono={<ShieldAlert size={18} />}
      >
        El certificado de <strong>aptitud</strong> médica va al expediente; la{' '}
        <strong>historia clínica no</strong>. Conservarla en el legajo laboral es una infracción
        autónoma de la Ley 1581 de 2012 y de la Resolución 2346 de 2007: la historia clínica es
        reservada y su custodia corresponde al prestador de salud ocupacional.
      </Llamado>

      <Tarjeta
        titulo={`Expediente de ${p.nombre}`}
        descripcion={contratoPorId(p.tipoContrato).rotulo}
      >
        <div className="mb-5">
          <div className="h-2 overflow-hidden rounded-full bg-superficie-2">
            <div
              className={cx(
                'h-full rounded-full transition-[width] duration-500',
                avance === 1 ? 'bg-senal' : 'bg-marca',
              )}
              style={{ width: `${avance * 100}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {exigibles.map((d) => {
            const presente = p.documentos.includes(d.id);
            return (
              <label
                key={d.id}
                className={cx(
                  'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                  presente
                    ? 'border-senal/35 bg-senal/6'
                    : 'border-borde bg-superficie-3 hover:border-borde-fuerte',
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 shrink-0 accent-[var(--marca)]"
                  checked={presente}
                  onChange={() => alternarDocumento(p.id, d.id)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{d.rotulo}</span>
                    {d.sensible && <Insignia tono="riesgo">dato sensible</Insignia>}
                  </span>
                  <span className="mt-1 block text-sm text-texto-2">{d.porQue}</span>
                  <span className="eyebrow mt-1 block">{d.norma}</span>
                </span>
              </label>
            );
          })}
        </div>
      </Tarjeta>

      {faltantes.length > 0 && (
        <Llamado tono="alerta" titulo="Lo que falta" icono={<FileWarning size={18} />}>
          <ul className="mt-1 space-y-1">
            {faltantes.map((d) => (
              <li key={d.id}>
                <strong>{d.rotulo}</strong> — {d.norma}
              </li>
            ))}
          </ul>
        </Llamado>
      )}

      <Llamado tono="info">
        Esta aplicación <strong>no almacena archivos</strong>. Marca qué documentos existen y dónde
        falta uno; el documento en sí debe reposar en el archivo físico o documental de la empresa,
        con las medidas de seguridad que exige la Ley 1581 de 2012.
      </Llamado>
    </div>
  );
}
