/**
 * Estado del núcleo de personal.
 *
 * Advertencia que no es decorativa: un expediente laboral es una base de
 * datos personales bajo la Ley 1581 de 2012 y, cuando incluye salud, contiene
 * datos sensibles. Esta aplicación guarda todo en el navegador de quien la
 * usa; la finalidad, la autorización y la custodia siguen siendo
 * responsabilidad del empleador.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenZustand } from './lib/almacen';
import type { Novedad, Persona } from './domain/personal';

interface Estado {
  personas: Persona[];
  novedades: Novedad[];
  seleccionada: string | null;
  hoy: string;
  crear: (p: Omit<Persona, 'id' | 'documentos' | 'renovaciones'>) => void;
  actualizar: (id: string, cambios: Partial<Persona>) => void;
  eliminar: (id: string) => void;
  seleccionar: (id: string | null) => void;
  alternarDocumento: (id: string, documento: string) => void;
  registrarNovedad: (n: Omit<Novedad, 'id'>) => void;
  eliminarNovedad: (id: string) => void;
  setHoy: (f: string) => void;
}

export const useEstado = create<Estado>()(
  persist(
    (set) => ({
      personas: [],
      novedades: [],
      seleccionada: null,
      hoy: '2026-09-17',

      crear: (datos) =>
        set((s) => {
          const nueva: Persona = {
            ...datos,
            id: crypto.randomUUID(),
            renovaciones: 0,
            documentos: [],
          };
          return { personas: [nueva, ...s.personas], seleccionada: nueva.id };
        }),

      actualizar: (id, cambios) =>
        set((s) => ({
          personas: s.personas.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
        })),

      eliminar: (id) =>
        set((s) => ({
          personas: s.personas.filter((p) => p.id !== id),
          novedades: s.novedades.filter((n) => n.personaId !== id),
          seleccionada: s.seleccionada === id ? null : s.seleccionada,
        })),

      seleccionar: (seleccionada) => set({ seleccionada }),

      alternarDocumento: (id, documento) =>
        set((s) => ({
          personas: s.personas.map((p) =>
            p.id === id
              ? {
                  ...p,
                  documentos: p.documentos.includes(documento)
                    ? p.documentos.filter((d) => d !== documento)
                    : [...p.documentos, documento],
                }
              : p,
          ),
        })),

      registrarNovedad: (n) =>
        set((s) => ({ novedades: [{ ...n, id: crypto.randomUUID() }, ...s.novedades] })),

      eliminarNovedad: (id) => set((s) => ({ novedades: s.novedades.filter((n) => n.id !== id) })),

      setHoy: (hoy) => set({ hoy }),
    }),
    {
      name: 'estado',
      version: 1,
      storage: createJSONStorage(() => almacenZustand),
      partialize: (s) => ({
        personas: s.personas,
        novedades: s.novedades,
        seleccionada: s.seleccionada,
        hoy: s.hoy,
      }),
    },
  ),
);

export function usePersona(): Persona | null {
  return useEstado((s) => s.personas.find((p) => p.id === s.seleccionada) ?? null);
}
