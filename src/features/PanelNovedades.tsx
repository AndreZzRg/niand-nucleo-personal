/**
 * Módulo «Novedades»: bitácora de hechos que afectan la relación laboral.
 */
import { useState } from 'react';
import { Download, Plus, Trash2 } from 'lucide-react';

import {
  AreaTexto,
  Boton,
  Campo,
  Entrada,
  Insignia,
  Llamado,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { exportarCSV } from '../lib/exportar';
import { fechaLarga } from '../lib/formato';
import { useEstado } from '../store';

const TIPOS = [
  [
    'Incapacidad',
    'Certificada por la EPS o la ARL. Suspende la obligación de prestar el servicio.',
  ],
  ['Licencia', 'Maternidad, paternidad, luto o no remunerada. Cada una tiene su norma propia.'],
  ['Vacaciones', 'Quince días hábiles por año de servicio (CST, art. 186).'],
  ['Permiso', 'Ausencia autorizada con o sin remuneración.'],
  ['Cambio de cargo', 'Deja constancia del movimiento y de la funciones nuevas.'],
  ['Cambio de salario', 'Todo aumento debe constar por escrito.'],
  ['Renovación de contrato', 'Registre también el número de renovación en el módulo Personal.'],
  ['Llamado de atención', 'Solo válido si se surtió el debido proceso del art. 115 del CST.'],
  ['Otra', 'Cualquier hecho que convenga dejar documentado.'],
] as const;

export function PanelNovedades() {
  const { personas, novedades, hoy, registrarNovedad, eliminarNovedad } = useEstado();
  const [borrador, setBorrador] = useState({
    personaId: '',
    fecha: hoy,
    tipo: TIPOS[0][0] as string,
    detalle: '',
  });

  const listo = borrador.personaId !== '' && borrador.detalle.trim().length > 5;
  const nombre = (id: string) => personas.find((p) => p.id === id)?.nombre ?? 'Persona eliminada';
  const notaTipo = TIPOS.find(([t]) => t === borrador.tipo)?.[1];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Tarjeta titulo="Registrar novedad">
        {personas.length === 0 ? (
          <Vacio titulo="Primero vincule personal">
            Las novedades se registran sobre una persona concreta.
          </Vacio>
        ) : (
          <div className="space-y-4">
            <Campo etiqueta="Persona" requerido>
              {(id) => (
                <Seleccion
                  id={id}
                  value={borrador.personaId}
                  onChange={(e) => setBorrador({ ...borrador, personaId: e.target.value })}
                >
                  <option value="">Elija una persona…</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </Seleccion>
              )}
            </Campo>

            <Campo etiqueta="Tipo de novedad">
              {(id) => (
                <Seleccion
                  id={id}
                  value={borrador.tipo}
                  onChange={(e) => setBorrador({ ...borrador, tipo: e.target.value })}
                >
                  {TIPOS.map(([t]) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Seleccion>
              )}
            </Campo>

            {notaTipo && <Llamado tono="info">{notaTipo}</Llamado>}

            <Campo etiqueta="Fecha">
              {(id) => (
                <Entrada
                  id={id}
                  type="date"
                  value={borrador.fecha}
                  onChange={(e) => setBorrador({ ...borrador, fecha: e.target.value })}
                />
              )}
            </Campo>

            <Campo etiqueta="Detalle" requerido ayuda="Qué ocurrió y qué soporte lo respalda.">
              {(id) => (
                <AreaTexto
                  id={id}
                  rows={4}
                  value={borrador.detalle}
                  onChange={(e) => setBorrador({ ...borrador, detalle: e.target.value })}
                />
              )}
            </Campo>

            <Boton
              disabled={!listo}
              onClick={() => {
                registrarNovedad(borrador);
                setBorrador({ ...borrador, detalle: '' });
              }}
            >
              <Plus size={15} /> Registrar
            </Boton>
          </div>
        )}
      </Tarjeta>

      <Tarjeta
        titulo="Novedades registradas"
        descripcion={`${novedades.length} en total`}
        acciones={
          novedades.length > 0 && (
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() =>
                exportarCSV(
                  [
                    ['Fecha', 'Persona', 'Tipo', 'Detalle'],
                    ...novedades.map((n) => [n.fecha, nombre(n.personaId), n.tipo, n.detalle]),
                  ],
                  'novedades',
                )
              }
            >
              <Download size={14} /> CSV
            </Boton>
          )
        }
      >
        {novedades.length === 0 ? (
          <Vacio titulo="Sin novedades">
            Incapacidades, licencias, vacaciones y cambios quedan aquí, con fecha y soporte.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Persona</Th>
                <Th>Novedad</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {novedades.map((n) => (
                <tr key={n.id}>
                  <Td className="text-xs whitespace-nowrap">{fechaLarga(n.fecha)}</Td>
                  <Td className="text-sm">{nombre(n.personaId)}</Td>
                  <Td>
                    <Insignia tono="marca">{n.tipo}</Insignia>
                    <span className="mt-1 block text-sm text-texto-2">{n.detalle}</span>
                  </Td>
                  <Td>
                    <Boton variante="fantasma" tamano="sm" onClick={() => eliminarNovedad(n.id)}>
                      <Trash2 size={13} />
                    </Boton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
