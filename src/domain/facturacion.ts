/**
 * Liquidación de una factura de venta.
 *
 * Orden de cálculo, que es el que exige la técnica tributaria:
 *   1. Subtotal por línea = cantidad × precio, menos el descuento comercial.
 *   2. IVA por línea, sobre el subtotal ya descontado (ET, art. 447 y 454).
 *   3. Retenciones sobre la base gravable, nunca sobre el IVA
 *      (salvo la retención de IVA, que sí recae sobre el impuesto).
 *   4. Total a pagar = subtotal + IVA − retenciones.
 *
 * Las retenciones no son un menor ingreso: son un anticipo del impuesto del
 * vendedor que el comprador consigna a su nombre. Por eso disminuyen el
 * recaudo de la factura pero no la base del ingreso ni la del IVA.
 */

import { IVA, retencionFuente, retencionICA, retencionIVA, type TarifaIVA } from './parametros';

export interface LineaFactura {
  readonly id: string;
  readonly productoId: string;
  readonly descripcion: string;
  readonly cantidad: number;
  readonly precioUnitario: number;
  /** Descuento comercial de la línea, en fracción (0,10 = 10 %). */
  readonly descuento: number;
  readonly tarifaIVA: TarifaIVA;
}

export interface LineaLiquidada {
  readonly linea: LineaFactura;
  readonly bruto: number;
  readonly descuento: number;
  readonly base: number;
  readonly tarifa: number;
  readonly iva: number;
  readonly total: number;
}

export interface CondicionesRetencion {
  /** Concepto de retención en la fuente a título de renta. */
  readonly conceptoRenta: string;
  /** `true` si el comprador es agente de retención de IVA. */
  readonly retieneIVA: boolean;
  /** Tarifa municipal de ICA, en por mil. Cero si no aplica. */
  readonly tarifaICAPorMil: number;
}

export interface FacturaLiquidada {
  readonly lineas: readonly LineaLiquidada[];
  readonly subtotalBruto: number;
  readonly descuentos: number;
  readonly baseGravable: number;
  /** Base de operaciones excluidas, que no genera IVA. */
  readonly baseExcluida: number;
  readonly iva: number;
  readonly reteFuente: number;
  readonly reteIVA: number;
  readonly reteICA: number;
  readonly totalRetenciones: number;
  /** Lo que factura el vendedor antes de retenciones. */
  readonly totalFactura: number;
  /** Lo que efectivamente recauda tras las retenciones. */
  readonly netoAPagar: number;
  readonly avisos: readonly string[];
}

function redondear(v: number): number {
  return Math.round(v);
}

export function liquidarLinea(l: LineaFactura): LineaLiquidada {
  const cantidad = Number.isFinite(l.cantidad) ? l.cantidad : 0;
  const precio = Number.isFinite(l.precioUnitario) ? l.precioUnitario : 0;
  const bruto = redondear(cantidad * precio);

  const fraccion = Math.min(Math.max(l.descuento, 0), 1);
  const descuento = redondear(bruto * fraccion);
  const base = bruto - descuento;

  const tarifa = IVA[l.tarifaIVA].tarifa;
  const iva = redondear(base * tarifa);

  return { linea: l, bruto, descuento, base, tarifa, iva, total: base + iva };
}

export function liquidarFactura(
  lineas: readonly LineaFactura[],
  condiciones: CondicionesRetencion,
  anio: number,
): FacturaLiquidada {
  const liquidadas = lineas.map(liquidarLinea);
  const avisos: string[] = [];

  const subtotalBruto = liquidadas.reduce((s, l) => s + l.bruto, 0);
  const descuentos = liquidadas.reduce((s, l) => s + l.descuento, 0);

  // La base gravable de la retención en la fuente excluye lo que no está
  // sometido a IVA por tratarse de bienes excluidos.
  const baseExcluida = liquidadas
    .filter((l) => l.linea.tarifaIVA === 'excluido')
    .reduce((s, l) => s + l.base, 0);
  const baseTotal = liquidadas.reduce((s, l) => s + l.base, 0);
  const baseGravable = baseTotal - baseExcluida;

  const iva = liquidadas.reduce((s, l) => s + l.iva, 0);

  const reteFuente = retencionFuente(baseTotal, condiciones.conceptoRenta, anio);
  const reteIVA = retencionIVA(iva, condiciones.retieneIVA);
  const reteICA = retencionICA(baseTotal, condiciones.tarifaICAPorMil);
  const totalRetenciones = reteFuente + reteIVA + reteICA;

  const totalFactura = baseTotal + iva;
  const netoAPagar = totalFactura - totalRetenciones;

  if (lineas.length === 0) {
    avisos.push('La factura no tiene líneas: agregue al menos un producto o servicio.');
  }
  if (condiciones.retieneIVA && iva === 0) {
    avisos.push(
      'Se marcó retención de IVA pero la factura no genera impuesto; no hay base sobre la cual retener.',
    );
  }
  if (netoAPagar < 0) {
    avisos.push(
      'Las retenciones superan el valor de la factura. Verifique los conceptos y las tarifas aplicadas.',
    );
  }
  if (baseExcluida > 0 && iva > 0) {
    avisos.push(
      'La factura mezcla operaciones gravadas y excluidas; discrimine los conceptos en la representación gráfica.',
    );
  }

  return {
    lineas: liquidadas,
    subtotalBruto,
    descuentos,
    baseGravable,
    baseExcluida,
    iva,
    reteFuente,
    reteIVA,
    reteICA,
    totalRetenciones,
    totalFactura,
    netoAPagar,
    avisos,
  };
}
