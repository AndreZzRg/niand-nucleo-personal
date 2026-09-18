/**
 * Núcleo de gestión de personal: vinculación, expediente y vencimientos.
 *
 * Fundamento:
 * · CST art. 39 — el contrato escrito y sus cláusulas mínimas.
 * · CST art. 46 — contrato a término fijo: renovación y preaviso de 30 días.
 * · CST art. 76 a 80 — periodo de prueba, su forma y sus límites.
 * · CST art. 104 y ss. — reglamento interno y su publicidad.
 * · Ley 2466 de 2025 — el contrato a término indefinido como regla general y
 *   refuerzo de las garantías en las demás modalidades.
 * · Resolución 2346 de 2007 — exámenes médicos ocupacionales de ingreso,
 *   periódicos y de retiro, y reserva de la historia clínica.
 * · Ley 1581 de 2012 — el expediente laboral es una base de datos personales.
 *   Los datos de salud son sensibles y no pueden reposar en el legajo ordinario.
 */
import type { FechaISO } from '../lib/fechas';

export type TipoContrato =
  'indefinido' | 'fijoMenorAnio' | 'fijoAnioOMas' | 'obraLabor' | 'aprendizaje' | 'ocasional';

export type EstadoVinculacion = 'activo' | 'suspendido' | 'retirado';

export interface DefinicionContrato {
  readonly id: TipoContrato;
  readonly rotulo: string;
  readonly norma: string;
  /** Meses máximos de periodo de prueba, o `null` si se calcula por proporción. */
  readonly pruebaMaximaMeses: number | null;
  readonly admitePrusuebaProporcional: boolean;
  readonly requiereFechaFin: boolean;
  readonly nota: string;
}

export const CONTRATOS: readonly DefinicionContrato[] = [
  {
    id: 'indefinido',
    rotulo: 'Término indefinido',
    norma: 'CST art. 47 · Ley 2466 de 2025',
    pruebaMaximaMeses: 2,
    admitePrusuebaProporcional: false,
    requiereFechaFin: false,
    nota: 'Es la regla general de vinculación. El periodo de prueba no puede exceder dos meses y debe constar por escrito.',
  },
  {
    id: 'fijoMenorAnio',
    rotulo: 'Término fijo inferior a un año',
    norma: 'CST art. 46',
    pruebaMaximaMeses: null,
    admitePrusuebaProporcional: true,
    requiereFechaFin: true,
    nota: 'Renovable hasta tres veces por periodos iguales o inferiores. En la cuarta renovación el término no puede ser inferior a un año. El periodo de prueba no puede exceder la quinta parte del término pactado ni dos meses.',
  },
  {
    id: 'fijoAnioOMas',
    rotulo: 'Término fijo de uno a tres años',
    norma: 'CST art. 46',
    pruebaMaximaMeses: 2,
    admitePrusuebaProporcional: false,
    requiereFechaFin: true,
    nota: 'Se prorroga de forma indefinida por periodos iguales si no media preaviso de no prórroga con treinta días de antelación.',
  },
  {
    id: 'obraLabor',
    rotulo: 'Obra o labor determinada',
    norma: 'CST art. 45',
    pruebaMaximaMeses: 2,
    admitePrusuebaProporcional: false,
    requiereFechaFin: false,
    nota: 'La obra debe estar descrita con precisión. Un objeto genérico convierte el contrato en indefinido a los ojos de un juez.',
  },
  {
    id: 'aprendizaje',
    rotulo: 'Contrato de aprendizaje',
    norma: 'Ley 789 de 2002, art. 30 · Ley 2466 de 2025',
    pruebaMaximaMeses: null,
    admitePrusuebaProporcional: false,
    requiereFechaFin: true,
    nota: 'La Ley 2466 de 2025 modificó el régimen del aprendizaje. Verifique el apoyo de sostenimiento y la afiliación a seguridad social aplicables a la fecha del contrato.',
  },
  {
    id: 'ocasional',
    rotulo: 'Ocasional, accidental o transitorio',
    norma: 'CST art. 6',
    pruebaMaximaMeses: null,
    admitePrusuebaProporcional: false,
    requiereFechaFin: true,
    nota: 'De corta duración —no mayor de un mes— y sobre labores distintas de las actividades normales del empleador. Usarlo para labores ordinarias lo desnaturaliza.',
  },
] as const;

export function contratoPorId(id: TipoContrato): DefinicionContrato {
  const c = CONTRATOS.find((x) => x.id === id);
  if (!c) throw new RangeError(`Tipo de contrato desconocido: "${id}"`);
  return c;
}

/**
 * Máximo legal del periodo de prueba, en días.
 *
 * En el contrato a término fijo inferior a un año el periodo de prueba no
 * puede exceder la quinta parte del término pactado, y en ningún caso dos
 * meses (CST, art. 78).
 */
export function maximoPeriodoPrueba(
  tipo: TipoContrato,
  duracionDias: number | null,
): { dias: number; regla: string } {
  const def = contratoPorId(tipo);

  if (def.admitePrusuebaProporcional && duracionDias !== null) {
    const quintaParte = Math.floor(duracionDias / 5);
    const dias = Math.min(quintaParte, 60);
    return {
      dias,
      regla:
        dias === 60
          ? 'La quinta parte del término supera dos meses: se aplica el tope de 60 días (CST, art. 78).'
          : `Quinta parte del término pactado (${duracionDias} días ÷ 5), tope de 60 días (CST, art. 78).`,
    };
  }

  if (def.pruebaMaximaMeses === null) {
    return { dias: 0, regla: `Esta modalidad no admite periodo de prueba (${def.norma}).` };
  }

  return {
    dias: def.pruebaMaximaMeses * 30,
    regla: `Máximo de ${def.pruebaMaximaMeses} meses (CST, art. 78).`,
  };
}

/* ══ Documentos del expediente ═══════════════════════════════════ */

export interface DocumentoExigible {
  readonly id: string;
  readonly rotulo: string;
  readonly norma: string;
  /** `true` cuando el documento contiene datos sensibles. */
  readonly sensible: boolean;
  /** Tipos de contrato a los que aplica. Vacío significa «a todos». */
  readonly soloPara: readonly TipoContrato[];
  readonly porQue: string;
}

export const DOCUMENTOS: readonly DocumentoExigible[] = [
  {
    id: 'contrato',
    rotulo: 'Contrato de trabajo firmado',
    norma: 'CST art. 39',
    sensible: false,
    soloPara: [],
    porQue: 'Sin contrato escrito, el término fijo y el periodo de prueba no son oponibles.',
  },
  {
    id: 'hoja-vida',
    rotulo: 'Hoja de vida y soportes de estudios',
    norma: 'Ley 1581 de 2012',
    sensible: false,
    soloPara: [],
    porQue: 'Sustenta la idoneidad para el cargo y el manual de funciones.',
  },
  {
    id: 'autorizacion-datos',
    rotulo: 'Autorización de tratamiento de datos personales',
    norma: 'Ley 1581 de 2012, arts. 9 y 12',
    sensible: false,
    soloPara: [],
    porQue:
      'La carga de probar la autorización es del empleador. Debe ser previa, expresa e informada, y cubrir cada finalidad, incluidas analítica y perfilamiento si los hay.',
  },
  {
    id: 'afiliacion-ss',
    rotulo: 'Afiliación a salud, pensión, ARL y caja',
    norma: 'Ley 100 de 1993 · Decreto 1072 de 2015',
    sensible: false,
    soloPara: [],
    porQue: 'La afiliación a la ARL debe ser previa al inicio de labores, sin excepción.',
  },
  {
    id: 'examen-ingreso',
    rotulo: 'Examen médico de ingreso',
    norma: 'Resolución 2346 de 2007',
    sensible: true,
    soloPara: [],
    porQue:
      'El certificado de aptitud va al expediente; la historia clínica no. Conservarla en el legajo laboral es una infracción autónoma.',
  },
  {
    id: 'induccion-sst',
    rotulo: 'Constancia de inducción en seguridad y salud',
    norma: 'Decreto 1072 de 2015, art. 2.2.4.6.11',
    sensible: false,
    soloPara: [],
    porQue: 'La inducción debe darse antes de iniciar labores y dejar constancia firmada.',
  },
  {
    id: 'acuse-rit',
    rotulo: 'Acuse de recibo del Reglamento Interno de Trabajo',
    norma: 'CST art. 120 · Ley 2466 de 2025',
    sensible: false,
    soloPara: [],
    porQue:
      'Un reglamento que no se puede probar que el trabajador conoció no sirve para fundar una sanción disciplinaria.',
  },
  {
    id: 'acuse-protocolos',
    rotulo: 'Acuse de los protocolos de acoso laboral y sexual',
    norma: 'Ley 1010 de 2006 · Ley 2365 de 2024',
    sensible: false,
    soloPara: [],
    porQue: 'La socialización de la ruta de atención es parte de la obligación de prevención.',
  },
  {
    id: 'cuota-aprendizaje',
    rotulo: 'Registro del contrato ante el SENA',
    norma: 'Ley 789 de 2002',
    sensible: false,
    soloPara: ['aprendizaje'],
    porQue: 'El contrato de aprendizaje debe registrarse y avalarse ante el SENA.',
  },
  {
    id: 'descripcion-obra',
    rotulo: 'Descripción precisa de la obra o labor',
    norma: 'CST art. 45',
    sensible: false,
    soloPara: ['obraLabor'],
    porQue:
      'Es el elemento que sostiene la modalidad. Sin descripción precisa, el contrato se entiende a término indefinido.',
  },
] as const;

export function documentosDe(tipo: TipoContrato): readonly DocumentoExigible[] {
  return DOCUMENTOS.filter((d) => d.soloPara.length === 0 || d.soloPara.includes(tipo));
}

/* ══ Persona ═════════════════════════════════════════════════════ */

export interface Persona {
  readonly id: string;
  readonly nombre: string;
  readonly documento: string;
  readonly cargo: string;
  readonly area: string;
  readonly tipoContrato: TipoContrato;
  readonly ingreso: FechaISO;
  /** Fecha de terminación pactada, en las modalidades que la exigen. */
  readonly fin: FechaISO | null;
  readonly salario: number;
  readonly estado: EstadoVinculacion;
  /** Renovaciones ya surtidas del contrato a término fijo. */
  readonly renovaciones: number;
  /** Fecha del último examen médico periódico. */
  readonly ultimoExamen: FechaISO | null;
  /** Identificadores de `DOCUMENTOS` que ya reposan en el expediente. */
  readonly documentos: readonly string[];
}

export interface Novedad {
  readonly id: string;
  readonly personaId: string;
  readonly fecha: FechaISO;
  readonly tipo: string;
  readonly detalle: string;
}

/* ══ Alertas ═════════════════════════════════════════════════════ */

export type TipoAlerta =
  | 'periodoPrueba'
  | 'preavisoNoProrroga'
  | 'vencimientoContrato'
  | 'examenPeriodico'
  | 'cuartaRenovacion'
  | 'expedienteIncompleto'
  | 'contratoSinFin';

export interface Alerta {
  readonly tipo: TipoAlerta;
  readonly personaId: string;
  readonly persona: string;
  readonly titulo: string;
  readonly detalle: string;
  readonly norma: string;
  readonly gravedad: 'critica' | 'alta' | 'media';
  /** Fecha en la que la alerta deja de poder atenderse, si la hay. */
  readonly vence: FechaISO | null;
}

/** Preaviso de no prórroga del contrato a término fijo: 30 días calendario. */
export const DIAS_PREAVISO = 30;

/** Periodicidad de referencia del examen médico periódico, en meses. */
export const MESES_EXAMEN_PERIODICO = 12;

export interface HerramientasFecha {
  readonly sumarDias: (iso: FechaISO, dias: number) => FechaISO;
  readonly sumarMeses: (iso: FechaISO, meses: number) => FechaISO;
  readonly diasCalendario: (desde: FechaISO, hasta: FechaISO) => number;
}

export function alertasDe(p: Persona, hoy: FechaISO, f: HerramientasFecha): readonly Alerta[] {
  const alertas: Alerta[] = [];
  if (p.estado === 'retirado') return alertas;

  const base = { personaId: p.id, persona: p.nombre };
  const def = contratoPorId(p.tipoContrato);

  // Periodo de prueba en curso.
  const duracion = p.fin ? f.diasCalendario(p.ingreso, p.fin) : null;
  const prueba = maximoPeriodoPrueba(p.tipoContrato, duracion);
  if (prueba.dias > 0) {
    const finPrueba = f.sumarDias(p.ingreso, prueba.dias);
    if (finPrueba >= hoy) {
      alertas.push({
        ...base,
        tipo: 'periodoPrueba',
        titulo: 'Periodo de prueba en curso',
        detalle: `Vence el ${finPrueba}. ${prueba.regla} Terminar dentro del periodo no genera indemnización, pero sí exige que el preaviso y la causa consten por escrito.`,
        norma: 'CST arts. 76 a 80',
        gravedad: 'media',
        vence: finPrueba,
      });
    }
  }

  // Contrato a término fijo sin fecha de terminación.
  if (def.requiereFechaFin && !p.fin) {
    alertas.push({
      ...base,
      tipo: 'contratoSinFin',
      titulo: 'Contrato sin fecha de terminación registrada',
      detalle: `La modalidad «${def.rotulo}» exige término pactado. Sin él, el contrato se entiende a término indefinido.`,
      norma: def.norma,
      gravedad: 'alta',
      vence: null,
    });
  }

  // Preaviso y vencimiento del término fijo.
  if (p.fin) {
    const limitePreaviso = f.sumarDias(p.fin, -DIAS_PREAVISO);
    const diasAlFin = f.diasCalendario(hoy, p.fin);

    if (diasAlFin >= 0 && hoy >= limitePreaviso) {
      alertas.push({
        ...base,
        tipo: 'preavisoNoProrroga',
        titulo: 'Última ventana para el preaviso de no prórroga',
        detalle: `El contrato termina el ${p.fin}. El preaviso debía darse a más tardar el ${limitePreaviso}; pasada esa fecha el contrato se prorroga de forma automática por un periodo igual.`,
        norma: 'CST art. 46',
        gravedad: 'critica',
        vence: limitePreaviso,
      });
    } else if (diasAlFin >= 0 && diasAlFin <= 60) {
      alertas.push({
        ...base,
        tipo: 'vencimientoContrato',
        titulo: 'Vencimiento del contrato próximo',
        detalle: `Termina el ${p.fin}, en ${diasAlFin} días. El preaviso de no prórroga debe darse antes del ${limitePreaviso}.`,
        norma: 'CST art. 46',
        gravedad: 'alta',
        vence: limitePreaviso,
      });
    }
  }

  // Cuarta renovación del término fijo inferior a un año.
  if (p.tipoContrato === 'fijoMenorAnio' && p.renovaciones >= 3) {
    alertas.push({
      ...base,
      tipo: 'cuartaRenovacion',
      titulo: 'La próxima renovación no puede ser inferior a un año',
      detalle: `El contrato lleva ${p.renovaciones} renovaciones. Agotadas las tres primeras por periodos iguales o inferiores, la siguiente debe pactarse por un término mínimo de un año.`,
      norma: 'CST art. 46, parágrafo',
      gravedad: 'alta',
      vence: p.fin,
    });
  }

  // Examen médico periódico.
  if (p.ultimoExamen) {
    const proximo = f.sumarMeses(p.ultimoExamen, MESES_EXAMEN_PERIODICO);
    if (proximo <= f.sumarDias(hoy, 30)) {
      alertas.push({
        ...base,
        tipo: 'examenPeriodico',
        titulo:
          proximo < hoy ? 'Examen médico periódico vencido' : 'Examen médico periódico próximo',
        detalle: `El último examen es del ${p.ultimoExamen}; el siguiente corresponde al ${proximo}. La periodicidad definitiva la fija el profesiograma según el riesgo del cargo.`,
        norma: 'Resolución 2346 de 2007',
        gravedad: proximo < hoy ? 'alta' : 'media',
        vence: proximo,
      });
    }
  } else {
    alertas.push({
      ...base,
      tipo: 'examenPeriodico',
      titulo: 'Sin examen médico registrado',
      detalle:
        'No hay fecha de examen médico ocupacional. El examen de ingreso es previo al inicio de labores.',
      norma: 'Resolución 2346 de 2007',
      gravedad: 'alta',
      vence: null,
    });
  }

  // Expediente incompleto.
  const exigibles = documentosDe(p.tipoContrato);
  const faltantes = exigibles.filter((d) => !p.documentos.includes(d.id));
  if (faltantes.length > 0) {
    alertas.push({
      ...base,
      tipo: 'expedienteIncompleto',
      titulo: `Faltan ${faltantes.length} documentos en el expediente`,
      detalle: faltantes.map((d) => d.rotulo).join(', ') + '.',
      norma: 'CST art. 39 · Ley 1581 de 2012',
      gravedad: faltantes.some((d) => d.id === 'contrato' || d.id === 'afiliacion-ss')
        ? 'critica'
        : 'media',
      vence: null,
    });
  }

  return alertas;
}

const ORDEN_GRAVEDAD = { critica: 0, alta: 1, media: 2 } as const;

export function alertasDeTodos(
  personas: readonly Persona[],
  hoy: FechaISO,
  f: HerramientasFecha,
): readonly Alerta[] {
  return personas
    .flatMap((p) => alertasDe(p, hoy, f))
    .sort((a, b) => ORDEN_GRAVEDAD[a.gravedad] - ORDEN_GRAVEDAD[b.gravedad]);
}

/** Porcentaje de completitud del expediente, de 0 a 1. */
export function completitud(p: Persona): number {
  const exigibles = documentosDe(p.tipoContrato);
  if (exigibles.length === 0) return 1;
  const presentes = exigibles.filter((d) => p.documentos.includes(d.id)).length;
  return presentes / exigibles.length;
}
