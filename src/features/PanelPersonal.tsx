/**
 * Módulo «Personal»: registro y edición de la planta.
 */
import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Llamado,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
  cx,
} from '../brand/ui';
import { CONTRATOS, completitud, contratoPorId } from '../domain/personal';
import type { EstadoVinculacion, TipoContrato } from '../domain/personal';
import { fechaLarga, pesos, porcentaje } from '../lib/formato';
import { useEstado, usePersona } from '../store';

const ESTADOS: ReadonlyArray<[EstadoVinculacion, string]> = [
  ['activo', 'Activo'],
  ['suspendido', 'Suspendido'],
  ['retirado', 'Retirado'],
];

export function PanelPersonal() {
  const { personas, hoy, crear, actualizar, eliminar, seleccionar, setHoy } = useEstado();
  const actual = usePersona();
  const [nueva, setNueva] = useState({
    nombre: '',
    documento: '',
    cargo: '',
    area: '',
    tipoContrato: 'indefinido' as TipoContrato,
    ingreso: hoy,
    fin: '' as string,
    salario: 1_423_500,
    estado: 'activo' as EstadoVinculacion,
    ultimoExamen: '' as string,
  });

  const def = contratoPorId(nueva.tipoContrato);
  const puedeCrear = nueva.nombre.trim().length > 2 && (!def.requiereFechaFin || nueva.fin !== '');

  const activos = personas.filter((p) => p.estado === 'activo');
  const nomina = activos.reduce((s, p) => s + p.salario, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-4">
        <Dato rotulo="Personas registradas" valor={personas.length} />
        <Dato rotulo="Activas" valor={activos.length} tono="ok" />
        <Dato rotulo="Nómina básica mensual" valor={pesos(nomina)} tono="marca" />
        <Dato
          rotulo="Expedientes completos"
          valor={personas.filter((p) => completitud(p) === 1).length}
          detalle={`de ${personas.length}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Tarjeta titulo="Vincular persona">
          <div className="space-y-4">
            <Campo etiqueta="Nombre completo" requerido>
              {(id) => (
                <Entrada
                  id={id}
                  value={nueva.nombre}
                  onChange={(e) => setNueva({ ...nueva, nombre: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Documento de identidad">
              {(id) => (
                <Entrada
                  id={id}
                  value={nueva.documento}
                  placeholder="CC 1.000.000"
                  onChange={(e) => setNueva({ ...nueva, documento: e.target.value })}
                />
              )}
            </Campo>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Cargo">
                {(id) => (
                  <Entrada
                    id={id}
                    value={nueva.cargo}
                    onChange={(e) => setNueva({ ...nueva, cargo: e.target.value })}
                  />
                )}
              </Campo>
              <Campo etiqueta="Área">
                {(id) => (
                  <Entrada
                    id={id}
                    value={nueva.area}
                    onChange={(e) => setNueva({ ...nueva, area: e.target.value })}
                  />
                )}
              </Campo>
            </div>
            <Campo etiqueta="Modalidad de contrato">
              {(id) => (
                <Seleccion
                  id={id}
                  value={nueva.tipoContrato}
                  onChange={(e) =>
                    setNueva({ ...nueva, tipoContrato: e.target.value as TipoContrato })
                  }
                >
                  {CONTRATOS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.rotulo}
                    </option>
                  ))}
                </Seleccion>
              )}
            </Campo>

            <Llamado tono="info">
              {def.nota} <span className="eyebrow mt-1 block">{def.norma}</span>
            </Llamado>

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Fecha de ingreso" requerido>
                {(id) => (
                  <Entrada
                    id={id}
                    type="date"
                    value={nueva.ingreso}
                    onChange={(e) => setNueva({ ...nueva, ingreso: e.target.value })}
                  />
                )}
              </Campo>
              {def.requiereFechaFin && (
                <Campo etiqueta="Fecha de terminación" requerido>
                  {(id) => (
                    <Entrada
                      id={id}
                      type="date"
                      value={nueva.fin}
                      onChange={(e) => setNueva({ ...nueva, fin: e.target.value })}
                    />
                  )}
                </Campo>
              )}
              <Campo etiqueta="Salario básico mensual">
                {(id) => (
                  <Entrada
                    id={id}
                    type="number"
                    min={0}
                    step={1000}
                    value={nueva.salario}
                    onChange={(e) => setNueva({ ...nueva, salario: Number(e.target.value) })}
                  />
                )}
              </Campo>
              <Campo etiqueta="Último examen médico" ayuda="Dejar vacío si no se ha practicado.">
                {(id) => (
                  <Entrada
                    id={id}
                    type="date"
                    value={nueva.ultimoExamen}
                    onChange={(e) => setNueva({ ...nueva, ultimoExamen: e.target.value })}
                  />
                )}
              </Campo>
            </div>

            <Boton
              disabled={!puedeCrear}
              onClick={() => {
                crear({
                  nombre: nueva.nombre,
                  documento: nueva.documento,
                  cargo: nueva.cargo,
                  area: nueva.area,
                  tipoContrato: nueva.tipoContrato,
                  ingreso: nueva.ingreso,
                  fin: nueva.fin || null,
                  salario: nueva.salario,
                  estado: nueva.estado,
                  ultimoExamen: nueva.ultimoExamen || null,
                });
                setNueva({ ...nueva, nombre: '', documento: '', cargo: '', fin: '' });
              }}
            >
              <UserPlus size={15} /> Vincular
            </Boton>
          </div>

          <div className="mt-6 border-t border-borde pt-4">
            <Campo etiqueta="Fecha de trabajo" ayuda="Se usa para calcular alertas y vencimientos.">
              {(id) => (
                <Entrada id={id} type="date" value={hoy} onChange={(e) => setHoy(e.target.value)} />
              )}
            </Campo>
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta titulo="Planta de personal">
            {personas.length === 0 ? (
              <Vacio titulo="Aún no hay personas registradas">
                Vincule la primera con el formulario de la izquierda.
              </Vacio>
            ) : (
              <Tabla>
                <thead>
                  <tr>
                    <Th>Persona</Th>
                    <Th>Contrato</Th>
                    <Th numerico>Expediente</Th>
                    <Th>Estado</Th>
                  </tr>
                </thead>
                <tbody>
                  {personas.map((p) => (
                    <tr key={p.id} className={cx(p.id === actual?.id && 'bg-indigo/6')}>
                      <Td>
                        <button
                          type="button"
                          onClick={() => seleccionar(p.id === actual?.id ? null : p.id)}
                          className="text-left font-medium text-marca hover:underline"
                        >
                          {p.nombre}
                        </button>
                        <span className="block text-xs text-texto-3">
                          {p.cargo || 'Sin cargo'} · {p.area || 'Sin área'}
                        </span>
                      </Td>
                      <Td className="text-xs">
                        {contratoPorId(p.tipoContrato).rotulo}
                        <span className="block text-texto-3">desde {fechaLarga(p.ingreso)}</span>
                      </Td>
                      <Td numerico>
                        <Insignia
                          tono={
                            completitud(p) === 1
                              ? 'ok'
                              : completitud(p) >= 0.6
                                ? 'alerta'
                                : 'riesgo'
                          }
                        >
                          {porcentaje(completitud(p), 0)}
                        </Insignia>
                      </Td>
                      <Td>
                        <Insignia
                          tono={
                            p.estado === 'activo'
                              ? 'ok'
                              : p.estado === 'suspendido'
                                ? 'alerta'
                                : 'neutro'
                          }
                        >
                          {p.estado}
                        </Insignia>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Tabla>
            )}
          </Tarjeta>

          {actual && (
            <Tarjeta
              titulo={actual.nombre}
              descripcion={`${actual.documento || 'Sin documento'} · ${contratoPorId(actual.tipoContrato).rotulo}`}
              acciones={
                <Boton variante="fantasma" tamano="sm" onClick={() => eliminar(actual.id)}>
                  <Trash2 size={14} />
                </Boton>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Estado">
                  {(id) => (
                    <Seleccion
                      id={id}
                      value={actual.estado}
                      onChange={(e) =>
                        actualizar(actual.id, { estado: e.target.value as EstadoVinculacion })
                      }
                    >
                      {ESTADOS.map(([v, r]) => (
                        <option key={v} value={v}>
                          {r}
                        </option>
                      ))}
                    </Seleccion>
                  )}
                </Campo>
                <Campo etiqueta="Salario básico">
                  {(id) => (
                    <Entrada
                      id={id}
                      type="number"
                      min={0}
                      step={1000}
                      value={actual.salario}
                      onChange={(e) => actualizar(actual.id, { salario: Number(e.target.value) })}
                    />
                  )}
                </Campo>
                <Campo etiqueta="Último examen médico">
                  {(id) => (
                    <Entrada
                      id={id}
                      type="date"
                      value={actual.ultimoExamen ?? ''}
                      onChange={(e) =>
                        actualizar(actual.id, { ultimoExamen: e.target.value || null })
                      }
                    />
                  )}
                </Campo>
                <Campo etiqueta="Renovaciones surtidas" ayuda="Solo aplica al término fijo.">
                  {(id) => (
                    <Entrada
                      id={id}
                      type="number"
                      min={0}
                      value={actual.renovaciones}
                      onChange={(e) =>
                        actualizar(actual.id, { renovaciones: Number(e.target.value) })
                      }
                    />
                  )}
                </Campo>
              </div>
            </Tarjeta>
          )}
        </div>
      </div>
    </div>
  );
}
