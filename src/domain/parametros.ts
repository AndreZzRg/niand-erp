/**
 * Parámetros tributarios anuales y tarifas del régimen colombiano.
 *
 * Cada valor declara su fuente y si está contrastado contra el acto que lo
 * fija. Un parámetro sin confirmar se marca y la interfaz lo advierte: es
 * preferible una cifra señalada como pendiente que una cifra inventada que
 * el usuario no puede distinguir de un dato oficial.
 */

export interface ParametrosAnio {
  readonly anio: number;
  /** Unidad de Valor Tributario, en pesos. */
  readonly uvt: number;
  /** Acto administrativo que fija el valor. */
  readonly fuente: string;
  /** `false` cuando el valor aún no se ha contrastado contra la resolución. */
  readonly verificado: boolean;
}

export const PARAMETROS: readonly ParametrosAnio[] = [
  {
    anio: 2024,
    uvt: 47_065,
    fuente: 'Resolución DIAN 000187 de 2023',
    verificado: true,
  },
  {
    anio: 2025,
    uvt: 49_799,
    fuente: 'Resolución DIAN 000193 de 2024',
    verificado: true,
  },
  {
    anio: 2026,
    uvt: 49_799,
    fuente:
      'PENDIENTE. Arrastra el valor de 2025. Confirme contra la resolución de UVT para 2026 antes de usar el resultado.',
    verificado: false,
  },
] as const;

export const ANIO_BASE = 2026;

export function parametrosDe(anio: number): ParametrosAnio {
  const exacto = PARAMETROS.find((p) => p.anio === anio);
  if (exacto) return exacto;

  // Fuera de rango se usa el extremo más cercano, siempre marcado como no verificado.
  const ordenados = [...PARAMETROS].sort((a, b) => a.anio - b.anio);
  const primero = ordenados.at(0);
  const ultimo = ordenados.at(-1);
  if (!primero || !ultimo) {
    throw new Error('No hay parámetros tributarios configurados.');
  }

  const base = anio < primero.anio ? primero : ultimo;
  return {
    ...base,
    anio,
    fuente: `PENDIENTE. Arrastra los valores de ${base.anio}; no hay parámetros publicados para ${anio}.`,
    verificado: false,
  };
}

/** Convierte un valor en UVT a pesos, redondeado a la unidad. */
export function uvtAPesos(cantidadUVT: number, anio: number): number {
  return Math.round(cantidadUVT * parametrosDe(anio).uvt);
}

/* ── Impuesto sobre las ventas ────────────────────────────────────── */

/**
 * Tarifas de IVA vigentes (Estatuto Tributario, arts. 468, 468-1 y 468-3).
 * «excluido» no genera impuesto y no da derecho a descontable; «exento» es
 * gravado a tarifa cero y sí da derecho a descontable (art. 477).
 */
export type TarifaIVA = 'excluido' | 'exento' | 'reducida' | 'general';

export const IVA: Record<TarifaIVA, { readonly tarifa: number; readonly rotulo: string }> = {
  excluido: { tarifa: 0, rotulo: 'Excluido' },
  exento: { tarifa: 0, rotulo: 'Exento (0 %)' },
  reducida: { tarifa: 0.05, rotulo: '5 %' },
  general: { tarifa: 0.19, rotulo: '19 %' },
};

/** `true` si la tarifa da derecho a IVA descontable (exento y gravadas). */
export function daDerechoADescontable(t: TarifaIVA): boolean {
  return t !== 'excluido';
}

/* ── Retención en la fuente a título de renta ─────────────────────── */

export interface ConceptoRetencion {
  readonly id: string;
  readonly rotulo: string;
  /** Tarifa aplicada sobre la base, sin IVA. */
  readonly tarifa: number;
  /** Cuantía mínima en UVT a partir de la cual se practica la retención. */
  readonly baseUVT: number;
  readonly norma: string;
}

/**
 * Conceptos más frecuentes en una pyme comercial. Las cuantías mínimas
 * provienen del art. 868 del Estatuto Tributario y del Decreto 1625 de 2016
 * (Decreto Único Reglamentario en materia tributaria), art. 1.2.4.x.
 */
/** Concepto neutro: la operación no está sometida a retención. */
const SIN_RETENCION: ConceptoRetencion = {
  id: 'ninguno',
  rotulo: 'No sujeto a retención',
  tarifa: 0,
  baseUVT: 0,
  norma: 'Operación no sometida o cuantía inferior a la mínima.',
};

export const CONCEPTOS_RETENCION: readonly ConceptoRetencion[] = [
  SIN_RETENCION,
  {
    id: 'compras',
    rotulo: 'Compras generales (declarante)',
    tarifa: 0.025,
    baseUVT: 27,
    norma: 'Decreto 1625 de 2016, art. 1.2.4.9.1',
  },
  {
    id: 'compras-no-declarante',
    rotulo: 'Compras generales (no declarante)',
    tarifa: 0.035,
    baseUVT: 27,
    norma: 'Decreto 1625 de 2016, art. 1.2.4.9.1',
  },
  {
    id: 'servicios',
    rotulo: 'Servicios generales (declarante)',
    tarifa: 0.04,
    baseUVT: 4,
    norma: 'Decreto 1625 de 2016, art. 1.2.4.4.1',
  },
  {
    id: 'servicios-no-declarante',
    rotulo: 'Servicios generales (no declarante)',
    tarifa: 0.06,
    baseUVT: 4,
    norma: 'Decreto 1625 de 2016, art. 1.2.4.4.1',
  },
  {
    id: 'honorarios',
    rotulo: 'Honorarios y comisiones (persona jurídica)',
    tarifa: 0.11,
    baseUVT: 0,
    norma: 'Estatuto Tributario, art. 392',
  },
  {
    id: 'arrendamiento-inmueble',
    rotulo: 'Arrendamiento de bien inmueble',
    tarifa: 0.035,
    baseUVT: 27,
    norma: 'Decreto 1625 de 2016, art. 1.2.4.9.1',
  },
] as const;

export function conceptoRetencion(id: string): ConceptoRetencion {
  return CONCEPTOS_RETENCION.find((c) => c.id === id) ?? SIN_RETENCION;
}

/**
 * Retención en la fuente sobre una base gravable. Devuelve cero cuando la
 * base no alcanza la cuantía mínima del concepto.
 */
export function retencionFuente(base: number, idConcepto: string, anio: number): number {
  const c = conceptoRetencion(idConcepto);
  if (c.tarifa === 0) return 0;
  const minima = uvtAPesos(c.baseUVT, anio);
  if (base < minima) return 0;
  return Math.round(base * c.tarifa);
}

/* ── Retención de IVA e ICA ───────────────────────────────────────── */

/**
 * Retención de IVA: 15 % del impuesto facturado como regla general
 * (Estatuto Tributario, art. 437-1, modificado por la Ley 1819 de 2016).
 */
export const TARIFA_RETEIVA = 0.15;

export function retencionIVA(iva: number, aplica: boolean): number {
  return aplica ? Math.round(iva * TARIFA_RETEIVA) : 0;
}

/**
 * Retención de industria y comercio. La tarifa la fija cada municipio por
 * acuerdo; se expresa en por mil y por eso se captura como parámetro.
 */
export function retencionICA(base: number, tarifaPorMil: number): number {
  if (!Number.isFinite(tarifaPorMil) || tarifaPorMil <= 0) return 0;
  return Math.round((base * tarifaPorMil) / 1000);
}
