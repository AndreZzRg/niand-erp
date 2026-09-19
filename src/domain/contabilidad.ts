/**
 * Motor contable de partida doble.
 *
 * Regla única e innegociable: en todo asiento la suma de los débitos es igual
 * a la suma de los créditos. El motor no permite construir un comprobante
 * descuadrado; si los datos de origen no cuadran, lo dice en vez de forzar
 * un ajuste silencioso.
 *
 * Los asientos se derivan de los documentos (facturas, pagos, movimientos de
 * inventario) y no se guardan: se recalculan en cada render a partir de las
 * entradas. Así, si cambia una tarifa, no quedan comprobantes viejos que
 * contradigan al motor.
 */

import type { FechaISO } from '../lib/fechas';
import { CUENTAS, naturalezaDe, nombreCuenta, saldoNatural, esDeResultado } from './puc';

export interface Renglon {
  readonly codigo: string;
  readonly debito: number;
  readonly credito: number;
  readonly detalle?: string;
}

export interface Asiento {
  readonly id: string;
  readonly fecha: FechaISO;
  readonly documento: string;
  readonly concepto: string;
  readonly renglones: readonly Renglon[];
}

export function totalDebitos(a: Asiento): number {
  return a.renglones.reduce((s, r) => s + r.debito, 0);
}

export function totalCreditos(a: Asiento): number {
  return a.renglones.reduce((s, r) => s + r.credito, 0);
}

export function descuadre(a: Asiento): number {
  return totalDebitos(a) - totalCreditos(a);
}

export function estaCuadrado(a: Asiento): boolean {
  return descuadre(a) === 0;
}

/** Construye un renglón débito. */
export function debe(codigo: string, valor: number, detalle?: string): Renglon {
  return { codigo, debito: Math.round(valor), credito: 0, detalle };
}

/** Construye un renglón crédito. */
export function haber(codigo: string, valor: number, detalle?: string): Renglon {
  return { codigo, debito: 0, credito: Math.round(valor), detalle };
}

/** Descarta los renglones en cero, que solo ensucian el comprobante. */
export function limpiar(renglones: readonly Renglon[]): readonly Renglon[] {
  return renglones.filter((r) => r.debito !== 0 || r.credito !== 0);
}

/* ── Libro mayor y balance de prueba ──────────────────────────────── */

export interface FilaMayor {
  readonly codigo: string;
  readonly nombre: string;
  readonly debitos: number;
  readonly creditos: number;
  /** Saldo expresado en la naturaleza de la cuenta. */
  readonly saldo: number;
  readonly naturaleza: 'debito' | 'credito';
}

export interface BalancePrueba {
  readonly filas: readonly FilaMayor[];
  readonly totalDebitos: number;
  readonly totalCreditos: number;
  readonly cuadra: boolean;
}

export function balanceDePrueba(asientos: readonly Asiento[]): BalancePrueba {
  const acumulado = new Map<string, { debitos: number; creditos: number }>();

  for (const a of asientos) {
    for (const r of a.renglones) {
      const actual = acumulado.get(r.codigo) ?? { debitos: 0, creditos: 0 };
      actual.debitos += r.debito;
      actual.creditos += r.credito;
      acumulado.set(r.codigo, actual);
    }
  }

  const filas = [...acumulado.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([codigo, { debitos, creditos }]) => ({
      codigo,
      nombre: nombreCuenta(codigo),
      debitos,
      creditos,
      saldo: saldoNatural(codigo, debitos, creditos),
      naturaleza: naturalezaDe(codigo),
    }));

  const td = filas.reduce((s, f) => s + f.debitos, 0);
  const tc = filas.reduce((s, f) => s + f.creditos, 0);

  return { filas, totalDebitos: td, totalCreditos: tc, cuadra: td === tc };
}

/* ── Estados financieros ──────────────────────────────────────────── */

export interface EstadoResultados {
  readonly ingresos: number;
  readonly costos: number;
  readonly gastos: number;
  readonly utilidadBruta: number;
  readonly utilidadNeta: number;
}

export function estadoDeResultados(asientos: readonly Asiento[]): EstadoResultados {
  const b = balanceDePrueba(asientos);
  const porClase = (clase: string) =>
    b.filas.filter((f) => f.codigo.startsWith(clase)).reduce((s, f) => s + f.saldo, 0);

  const ingresos = porClase('4');
  const costos = porClase('6');
  const gastos = porClase('5');

  return {
    ingresos,
    costos,
    gastos,
    utilidadBruta: ingresos - costos,
    utilidadNeta: ingresos - costos - gastos,
  };
}

export interface SituacionFinanciera {
  readonly activo: number;
  readonly pasivo: number;
  readonly patrimonio: number;
  /** Patrimonio incluyendo el resultado del periodo. */
  readonly patrimonioTotal: number;
  readonly cuadra: boolean;
  readonly diferencia: number;
}

/**
 * Estado de situación financiera. El resultado del ejercicio se suma al
 * patrimonio: mientras no se haga el asiento de cierre, la ecuación solo
 * cuadra si se reconoce la utilidad acumulada del periodo.
 */
export function situacionFinanciera(asientos: readonly Asiento[]): SituacionFinanciera {
  const b = balanceDePrueba(asientos);
  const porClase = (clase: string) =>
    b.filas.filter((f) => f.codigo.startsWith(clase)).reduce((s, f) => s + f.saldo, 0);

  const activo = porClase('1');
  const pasivo = porClase('2');
  const patrimonio = porClase('3');
  const resultado = estadoDeResultados(asientos).utilidadNeta;
  const patrimonioTotal = patrimonio + resultado;
  const diferencia = activo - (pasivo + patrimonioTotal);

  return {
    activo,
    pasivo,
    patrimonio,
    patrimonioTotal,
    cuadra: diferencia === 0,
    diferencia,
  };
}

/**
 * Asiento de cierre: cancela las cuentas de resultado contra el resultado
 * del ejercicio (Decreto 2650 de 1993, dinámica de la cuenta 3605).
 */
export function asientoDeCierre(asientos: readonly Asiento[], fecha: FechaISO): Asiento | null {
  const b = balanceDePrueba(asientos);
  const deResultado = b.filas.filter((f) => esDeResultado(f.codigo) && f.saldo !== 0);
  if (deResultado.length === 0) return null;

  const renglones: Renglon[] = [];
  let neto = 0;

  for (const f of deResultado) {
    // Se cancela cada cuenta contra su lado contrario.
    if (f.naturaleza === 'credito') {
      renglones.push(debe(f.codigo, f.saldo, 'Cancelación de saldo'));
      neto += f.saldo;
    } else {
      renglones.push(haber(f.codigo, f.saldo, 'Cancelación de saldo'));
      neto -= f.saldo;
    }
  }

  renglones.push(
    neto >= 0
      ? haber(CUENTAS.resultado.codigo, neto, 'Utilidad del ejercicio')
      : debe(CUENTAS.resultado.codigo, -neto, 'Pérdida del ejercicio'),
  );

  return {
    id: 'cierre',
    fecha,
    documento: 'CIERRE',
    concepto: 'Cancelación de cuentas de resultado',
    renglones: limpiar(renglones),
  };
}
