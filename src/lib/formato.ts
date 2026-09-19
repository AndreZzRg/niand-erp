/**
 * Formato de cifras y fechas en configuración regional colombiana.
 * Un solo lugar: si cambia la forma de presentar dinero, cambia aquí.
 */

const LOCALE = 'es-CO';

const COP = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const COP_EXACTO = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMERO = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

/** Pesos colombianos sin decimales: la forma habitual en nómina. */
export function pesos(valor: number): string {
  return COP.format(Number.isFinite(valor) ? valor : 0);
}

/** Pesos con dos decimales, para valores intermedios de un cálculo. */
export function pesosExactos(valor: number): string {
  return COP_EXACTO.format(Number.isFinite(valor) ? valor : 0);
}

export function numero(valor: number, decimales = 2): string {
  if (!Number.isFinite(valor)) return '—';
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimales }).format(valor);
}

export function porcentaje(fraccion: number, decimales = 1): string {
  if (!Number.isFinite(fraccion)) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimales,
  }).format(fraccion);
}

export function horas(valor: number): string {
  return `${NUMERO.format(valor)} h`;
}

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as const;

/** «17 de septiembre de 2026». */
export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

/** «jueves, 17 de septiembre de 2026». */
export function fechaConDia(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  if (!a || !m || !d) return iso;
  const dia = DIAS[new Date(a, m - 1, d).getDay()];
  return `${dia}, ${d} de ${MESES[m - 1]} de ${a}`;
}

/** «17/09/2026». */
export function fechaCorta(iso: string): string {
  const [a, m, d] = iso.split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

/** Redondeo a la unidad de peso, que es como se liquida la nómina. */
export function aPesos(valor: number): number {
  return Math.round(valor);
}

/** Redondeo a dos decimales sin arrastrar el error binario del punto flotante. */
export function dosDecimales(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/** Plural sencillo: `plural(1,'día','días')` → «1 día». */
export function plural(n: number, singular: string, pluralForma: string): string {
  return `${NUMERO.format(n)} ${n === 1 ? singular : pluralForma}`;
}
