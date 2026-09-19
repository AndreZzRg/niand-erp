/**
 * Inventario valorado por costo promedio ponderado.
 *
 * El costo promedio ponderado es uno de los métodos admitidos por la NIC 2
 * (Sección 13 de la NIIF para Pymes), incorporada al derecho colombiano por
 * el Decreto 2420 de 2015. El promedio se recalcula en cada entrada; las
 * salidas se valoran al promedio vigente y no lo modifican.
 *
 * Todo el módulo es determinista y sin efectos: recibe los movimientos y
 * devuelve el estado resultante.
 */

import type { FechaISO } from '../lib/fechas';

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface Movimiento {
  readonly id: string;
  readonly fecha: FechaISO;
  readonly productoId: string;
  readonly tipo: TipoMovimiento;
  readonly cantidad: number;
  /** Costo unitario de la entrada. Se ignora en salidas. */
  readonly costoUnitario: number;
  readonly nota: string;
}

export interface CapaKardex {
  readonly movimiento: Movimiento;
  /** Cantidad después de aplicar el movimiento. */
  readonly saldoCantidad: number;
  /** Costo promedio ponderado después de aplicar el movimiento. */
  readonly costoPromedio: number;
  /** Valor total del inventario después de aplicar el movimiento. */
  readonly saldoValor: number;
  /** Valor con el que se afectó el resultado o el inventario. */
  readonly valorMovimiento: number;
}

export interface EstadoInventario {
  readonly cantidad: number;
  readonly costoPromedio: number;
  readonly valor: number;
  readonly kardex: readonly CapaKardex[];
  /** Salidas que excedieron la existencia disponible. */
  readonly avisos: readonly string[];
}

const VACIO: EstadoInventario = {
  cantidad: 0,
  costoPromedio: 0,
  valor: 0,
  kardex: [],
  avisos: [],
};

function redondear(v: number): number {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/**
 * Recorre los movimientos de un producto en orden cronológico y arma el
 * kardex. Los movimientos se ordenan por fecha y, a igual fecha, por el
 * orden en que fueron registrados.
 */
export function kardexDe(movimientos: readonly Movimiento[], productoId: string): EstadoInventario {
  const propios = movimientos
    .map((m, orden) => ({ m, orden }))
    .filter(({ m }) => m.productoId === productoId)
    .sort((a, b) =>
      a.m.fecha === b.m.fecha ? a.orden - b.orden : a.m.fecha.localeCompare(b.m.fecha),
    );

  if (propios.length === 0) return VACIO;

  let cantidad = 0;
  let valor = 0;
  const kardex: CapaKardex[] = [];
  const avisos: string[] = [];

  for (const { m } of propios) {
    const unidades = Math.abs(m.cantidad);
    let valorMovimiento = 0;

    if (m.tipo === 'entrada') {
      valorMovimiento = redondear(unidades * m.costoUnitario);
      cantidad += unidades;
      valor = redondear(valor + valorMovimiento);
    } else if (m.tipo === 'salida') {
      const promedio = cantidad > 0 ? valor / cantidad : 0;
      if (unidades > cantidad) {
        avisos.push(
          `La salida del ${m.fecha} pide ${unidades} unidades y solo hay ${cantidad}. ` +
            'El saldo queda en negativo: revise el movimiento antes de cerrar el periodo.',
        );
      }
      valorMovimiento = redondear(unidades * promedio);
      cantidad -= unidades;
      valor = redondear(valor - valorMovimiento);
    } else {
      // Ajuste: fija la existencia contada y conserva el costo promedio.
      const promedio = cantidad > 0 ? valor / cantidad : m.costoUnitario;
      const diferencia = m.cantidad - cantidad;
      valorMovimiento = redondear(diferencia * promedio);
      cantidad = m.cantidad;
      valor = redondear(cantidad * promedio);
    }

    const promedioFinal = cantidad > 0 ? redondear(valor / cantidad) : 0;
    kardex.push({
      movimiento: m,
      saldoCantidad: cantidad,
      costoPromedio: promedioFinal,
      saldoValor: valor,
      valorMovimiento,
    });
  }

  return {
    cantidad,
    costoPromedio: cantidad > 0 ? redondear(valor / cantidad) : 0,
    valor: redondear(valor),
    kardex,
    avisos,
  };
}

/** Costo promedio vigente de un producto, para valorar una salida. */
export function costoPromedioDe(movimientos: readonly Movimiento[], productoId: string): number {
  return kardexDe(movimientos, productoId).costoPromedio;
}

/** Existencia disponible de un producto. */
export function existenciaDe(movimientos: readonly Movimiento[], productoId: string): number {
  return kardexDe(movimientos, productoId).cantidad;
}

export interface ResumenProducto {
  readonly productoId: string;
  readonly cantidad: number;
  readonly costoPromedio: number;
  readonly valor: number;
}

/** Valorización del inventario completo, producto por producto. */
export function valorizacion(
  movimientos: readonly Movimiento[],
  productoIds: readonly string[],
): { readonly filas: readonly ResumenProducto[]; readonly total: number } {
  const filas = productoIds.map((productoId) => {
    const e = kardexDe(movimientos, productoId);
    return {
      productoId,
      cantidad: e.cantidad,
      costoPromedio: e.costoPromedio,
      valor: e.valor,
    };
  });
  return { filas, total: redondear(filas.reduce((s, f) => s + f.valor, 0)) };
}
