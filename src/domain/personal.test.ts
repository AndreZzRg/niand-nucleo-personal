import { describe, expect, it } from 'vitest';

import { diasCalendario, sumarDias, sumarMeses } from '../lib/fechas';
import {
  CONTRATOS,
  DIAS_PREAVISO,
  DOCUMENTOS,
  alertasDe,
  alertasDeTodos,
  completitud,
  contratoPorId,
  documentosDe,
  maximoPeriodoPrueba,
  type Persona,
} from './personal';

const HOY = '2026-09-17';
const F = { sumarDias, sumarMeses, diasCalendario };

const TODOS = DOCUMENTOS.map((d) => d.id);

const persona = (p: Partial<Persona> = {}): Persona => ({
  id: 'p1',
  nombre: 'Persona de prueba',
  documento: 'CC 1.000.000',
  cargo: 'Analista',
  area: 'Operaciones',
  tipoContrato: 'indefinido',
  ingreso: '2024-01-15',
  fin: null,
  salario: 2_500_000,
  estado: 'activo',
  renovaciones: 0,
  ultimoExamen: '2026-06-01',
  documentos: TODOS,
  ...p,
});

describe('catálogo de contratos', () => {
  it('declara norma y nota en cada modalidad', () => {
    for (const c of CONTRATOS) {
      expect(c.norma, c.id).toMatch(/CST|Ley/);
      expect(c.nota.length, c.id).toBeGreaterThan(40);
    }
  });

  it('exige fecha de terminación solo donde corresponde', () => {
    expect(contratoPorId('indefinido').requiereFechaFin).toBe(false);
    expect(contratoPorId('fijoMenorAnio').requiereFechaFin).toBe(true);
    expect(contratoPorId('fijoAnioOMas').requiereFechaFin).toBe(true);
    expect(contratoPorId('obraLabor').requiereFechaFin).toBe(false);
  });

  it('rechaza una modalidad inexistente', () => {
    // @ts-expect-error se comprueba la defensa en tiempo de ejecución
    expect(() => contratoPorId('inventado')).toThrow(RangeError);
  });
});

describe('periodo de prueba (CST arts. 76 a 80)', () => {
  it('lo limita a dos meses en el contrato indefinido', () => {
    expect(maximoPeriodoPrueba('indefinido', null).dias).toBe(60);
  });

  it('lo calcula como la quinta parte del término fijo inferior a un año', () => {
    // 150 días de contrato ÷ 5 = 30 días de prueba.
    const r = maximoPeriodoPrueba('fijoMenorAnio', 150);
    expect(r.dias).toBe(30);
    expect(r.regla).toMatch(/Quinta parte/);
  });

  it('nunca excede dos meses aunque la quinta parte sea mayor', () => {
    // 360 días ÷ 5 = 72 días, pero el tope legal son 60.
    const r = maximoPeriodoPrueba('fijoMenorAnio', 360);
    expect(r.dias).toBe(60);
    expect(r.regla).toMatch(/tope de 60 días/);
  });

  it('lo excluye en las modalidades que no lo admiten', () => {
    expect(maximoPeriodoPrueba('aprendizaje', 180).dias).toBe(0);
    expect(maximoPeriodoPrueba('ocasional', 25).dias).toBe(0);
  });
});

describe('documentos del expediente', () => {
  it('cita norma y razón en cada documento', () => {
    for (const d of DOCUMENTOS) {
      expect(d.norma, d.id).toMatch(/CST|Ley|Decreto|Resolución/);
      expect(d.porQue.length, d.id).toBeGreaterThan(30);
    }
  });

  it('marca como sensible el examen médico', () => {
    const examen = DOCUMENTOS.find((d) => d.id === 'examen-ingreso')!;
    expect(examen.sensible).toBe(true);
    expect(examen.porQue).toMatch(/historia clínica no/);
  });

  it('exige el registro ante el SENA solo en el aprendizaje', () => {
    expect(documentosDe('aprendizaje').some((d) => d.id === 'cuota-aprendizaje')).toBe(true);
    expect(documentosDe('indefinido').some((d) => d.id === 'cuota-aprendizaje')).toBe(false);
  });

  it('exige la descripción de la obra solo en obra o labor', () => {
    expect(documentosDe('obraLabor').some((d) => d.id === 'descripcion-obra')).toBe(true);
    expect(documentosDe('fijoMenorAnio').some((d) => d.id === 'descripcion-obra')).toBe(false);
  });
});

describe('completitud del expediente', () => {
  it('es total cuando están todos los exigibles', () => {
    expect(completitud(persona())).toBe(1);
  });

  it('es cero cuando no hay ninguno', () => {
    expect(completitud(persona({ documentos: [] }))).toBe(0);
  });

  it('no penaliza documentos de otras modalidades', () => {
    const soloIndefinido = documentosDe('indefinido').map((d) => d.id);
    expect(completitud(persona({ documentos: soloIndefinido }))).toBe(1);
  });
});

describe('alertas de vencimiento', () => {
  it('no genera alertas para una persona retirada', () => {
    expect(alertasDe(persona({ estado: 'retirado', documentos: [] }), HOY, F)).toHaveLength(0);
  });

  it('avisa del periodo de prueba en curso', () => {
    const a = alertasDe(persona({ ingreso: '2026-09-01' }), HOY, F);
    expect(a.some((x) => x.tipo === 'periodoPrueba')).toBe(true);
  });

  it('deja de avisar cuando el periodo de prueba ya pasó', () => {
    const a = alertasDe(persona({ ingreso: '2024-01-15' }), HOY, F);
    expect(a.some((x) => x.tipo === 'periodoPrueba')).toBe(false);
  });

  it('marca como crítico el contrato a término fijo sin fecha de fin', () => {
    const a = alertasDe(persona({ tipoContrato: 'fijoMenorAnio', fin: null }), HOY, F);
    const alerta = a.find((x) => x.tipo === 'contratoSinFin')!;
    expect(alerta.gravedad).toBe('alta');
    expect(alerta.detalle).toMatch(/término indefinido/);
  });

  it('abre la ventana crítica del preaviso a 30 días del vencimiento', () => {
    const fin = sumarDias(HOY, DIAS_PREAVISO - 1);
    const a = alertasDe(persona({ tipoContrato: 'fijoAnioOMas', fin }), HOY, F);
    const alerta = a.find((x) => x.tipo === 'preavisoNoProrroga')!;
    expect(alerta.gravedad).toBe('critica');
    expect(alerta.norma).toContain('art. 46');
  });

  it('avisa del vencimiento próximo antes de que se agote el preaviso', () => {
    const fin = sumarDias(HOY, 45);
    const a = alertasDe(persona({ tipoContrato: 'fijoAnioOMas', fin }), HOY, F);
    expect(a.some((x) => x.tipo === 'vencimientoContrato')).toBe(true);
    expect(a.some((x) => x.tipo === 'preavisoNoProrroga')).toBe(false);
  });

  it('no avisa de vencimientos lejanos', () => {
    const fin = sumarDias(HOY, 200);
    const a = alertasDe(persona({ tipoContrato: 'fijoAnioOMas', fin }), HOY, F);
    expect(a.some((x) => x.tipo === 'vencimientoContrato')).toBe(false);
  });

  it('advierte que la cuarta renovación no puede bajar de un año', () => {
    const a = alertasDe(
      persona({ tipoContrato: 'fijoMenorAnio', fin: '2026-12-31', renovaciones: 3 }),
      HOY,
      F,
    );
    const alerta = a.find((x) => x.tipo === 'cuartaRenovacion')!;
    expect(alerta.detalle).toMatch(/mínimo de un año/);
  });

  it('no la lanza antes de la tercera renovación', () => {
    const a = alertasDe(
      persona({ tipoContrato: 'fijoMenorAnio', fin: '2026-12-31', renovaciones: 2 }),
      HOY,
      F,
    );
    expect(a.some((x) => x.tipo === 'cuartaRenovacion')).toBe(false);
  });

  it('avisa del examen periódico vencido', () => {
    const a = alertasDe(persona({ ultimoExamen: '2025-01-10' }), HOY, F);
    const alerta = a.find((x) => x.tipo === 'examenPeriodico')!;
    expect(alerta.titulo).toMatch(/vencido/);
    expect(alerta.gravedad).toBe('alta');
  });

  it('avisa cuando no hay examen registrado', () => {
    const a = alertasDe(persona({ ultimoExamen: null }), HOY, F);
    expect(a.some((x) => x.titulo.includes('Sin examen médico'))).toBe(true);
  });

  it('no avisa del examen cuando aún falta más de un mes', () => {
    const a = alertasDe(persona({ ultimoExamen: '2026-06-01' }), HOY, F);
    expect(a.some((x) => x.tipo === 'examenPeriodico')).toBe(false);
  });

  it('eleva a crítica la falta del contrato o de la afiliación', () => {
    const sinContrato = TODOS.filter((d) => d !== 'contrato');
    const a = alertasDe(persona({ documentos: sinContrato }), HOY, F);
    expect(a.find((x) => x.tipo === 'expedienteIncompleto')!.gravedad).toBe('critica');
  });

  it('deja en media la falta de un documento accesorio', () => {
    const sinHojaVida = TODOS.filter((d) => d !== 'hoja-vida');
    const a = alertasDe(persona({ documentos: sinHojaVida }), HOY, F);
    expect(a.find((x) => x.tipo === 'expedienteIncompleto')!.gravedad).toBe('media');
  });

  it('no genera alerta de expediente cuando está completo', () => {
    const a = alertasDe(persona(), HOY, F);
    expect(a.some((x) => x.tipo === 'expedienteIncompleto')).toBe(false);
  });
});

describe('consolidado de alertas', () => {
  it('ordena de lo crítico a lo medio', () => {
    const equipo = [
      persona({ id: 'a', nombre: 'A', documentos: TODOS.filter((d) => d !== 'hoja-vida') }),
      persona({
        id: 'b',
        nombre: 'B',
        tipoContrato: 'fijoAnioOMas',
        fin: sumarDias(HOY, 10),
      }),
    ];
    const alertas = alertasDeTodos(equipo, HOY, F);
    expect(alertas[0]!.gravedad).toBe('critica');
    expect(alertas.at(-1)!.gravedad).toBe('media');
  });

  it('no mezcla alertas entre personas', () => {
    const equipo = [persona({ id: 'a', nombre: 'A' }), persona({ id: 'b', nombre: 'B' })];
    for (const al of alertasDeTodos(equipo, HOY, F)) {
      expect(['a', 'b']).toContain(al.personaId);
    }
  });

  it('devuelve una lista vacía sin personal', () => {
    expect(alertasDeTodos([], HOY, F)).toHaveLength(0);
  });
});
