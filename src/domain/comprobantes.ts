/**
 * Traducción de documentos a comprobantes contables.
 *
 * Cada documento del ERP —factura de venta, factura de compra, recaudo, pago
 * y aporte de capital— produce un asiento de partida doble. La cuenta 2408
 * del PUC es de saldo neto: el IVA generado la acredita y el descontable la
 * debita, de modo que su saldo muestra directamente lo que se le debe a la
 * DIAN en el periodo.
 */

import type { FechaISO } from '../lib/fechas';
import { CUENTAS } from './puc';
import { debe, haber, limpiar, type Asiento } from './contabilidad';
import { liquidarFactura, type CondicionesRetencion, type LineaFactura } from './facturacion';
import { costoPromedioDe, type Movimiento } from './inventario';

export type TipoFactura = 'venta' | 'compra';

export interface Factura {
  readonly id: string;
  readonly numero: string;
  readonly fecha: FechaISO;
  readonly tipo: TipoFactura;
  readonly terceroId: string;
  readonly lineas: readonly LineaFactura[];
  readonly condiciones: CondicionesRetencion;
  readonly nota: string;
}

export type MedioPago = 'caja' | 'bancos';

export interface Pago {
  readonly id: string;
  readonly fecha: FechaISO;
  readonly facturaId: string;
  readonly valor: number;
  readonly medio: MedioPago;
  readonly nota: string;
}

/* ── Asiento de una factura ───────────────────────────────────────── */

/**
 * Comprobante de una factura de venta: reconoce el ingreso, el IVA generado,
 * las retenciones que practica el cliente como anticipo de impuestos y la
 * cuenta por cobrar por el neto.
 */
export function asientoVenta(f: Factura, anio: number): Asiento {
  const l = liquidarFactura(f.lineas, f.condiciones, anio);
  const base = l.baseGravable + l.baseExcluida;

  return {
    id: `fv-${f.id}`,
    fecha: f.fecha,
    documento: f.numero,
    concepto: 'Factura de venta',
    renglones: limpiar([
      debe(CUENTAS.clientes.codigo, l.netoAPagar, 'Cuenta por cobrar'),
      debe(CUENTAS.anticipoRenta.codigo, l.reteFuente, 'Retención en la fuente practicada'),
      debe(CUENTAS.anticipoIVA.codigo, l.reteIVA, 'Retención de IVA practicada'),
      debe(CUENTAS.anticipoICA.codigo, l.reteICA, 'Retención de ICA practicada'),
      haber(CUENTAS.ventas.codigo, base, 'Ingreso operacional'),
      haber(CUENTAS.ivaPorPagar.codigo, l.iva, 'IVA generado'),
    ]),
  };
}

/**
 * Comprobante del costo de la mercancía vendida. Se valora al costo promedio
 * ponderado vigente al momento de la salida.
 */
export function asientoCostoVenta(f: Factura, movimientos: readonly Movimiento[]): Asiento | null {
  const costo = f.lineas.reduce((s, linea) => {
    const promedio = costoPromedioDe(movimientos, linea.productoId);
    return s + Math.round(promedio * linea.cantidad);
  }, 0);

  if (costo === 0) return null;

  return {
    id: `cv-${f.id}`,
    fecha: f.fecha,
    documento: f.numero,
    concepto: 'Costo de la mercancía vendida',
    renglones: limpiar([
      debe(CUENTAS.costoVentas.codigo, costo, 'Costo promedio ponderado'),
      haber(CUENTAS.inventario.codigo, costo, 'Salida de inventario'),
    ]),
  };
}

/**
 * Comprobante de una factura de compra: lleva la mercancía al inventario,
 * reconoce el IVA descontable y las retenciones que la empresa practica en
 * calidad de agente retenedor.
 */
export function asientoCompra(f: Factura, anio: number): Asiento {
  const l = liquidarFactura(f.lineas, f.condiciones, anio);
  const base = l.baseGravable + l.baseExcluida;

  return {
    id: `fc-${f.id}`,
    fecha: f.fecha,
    documento: f.numero,
    concepto: 'Factura de compra',
    renglones: limpiar([
      debe(CUENTAS.inventario.codigo, base, 'Entrada de mercancía'),
      debe(CUENTAS.ivaPorPagar.codigo, l.iva, 'IVA descontable'),
      haber(CUENTAS.proveedores.codigo, l.netoAPagar, 'Cuenta por pagar'),
      haber(CUENTAS.reteFuentePorPagar.codigo, l.reteFuente, 'Retención en la fuente practicada'),
      haber(CUENTAS.reteIVAPorPagar.codigo, l.reteIVA, 'Retención de IVA practicada'),
      haber(CUENTAS.reteICAPorPagar.codigo, l.reteICA, 'Retención de ICA practicada'),
    ]),
  };
}

/* ── Asiento de un pago ───────────────────────────────────────────── */

export function asientoPago(p: Pago, factura: Factura): Asiento {
  const cuentaEfectivo = p.medio === 'caja' ? CUENTAS.caja.codigo : CUENTAS.bancos.codigo;

  if (factura.tipo === 'venta') {
    return {
      id: `rc-${p.id}`,
      fecha: p.fecha,
      documento: `RC-${factura.numero}`,
      concepto: 'Recaudo de cartera',
      renglones: limpiar([
        debe(cuentaEfectivo, p.valor, 'Ingreso de efectivo'),
        haber(CUENTAS.clientes.codigo, p.valor, 'Abono del cliente'),
      ]),
    };
  }

  return {
    id: `ce-${p.id}`,
    fecha: p.fecha,
    documento: `CE-${factura.numero}`,
    concepto: 'Pago a proveedor',
    renglones: limpiar([
      debe(CUENTAS.proveedores.codigo, p.valor, 'Abono al proveedor'),
      haber(cuentaEfectivo, p.valor, 'Salida de efectivo'),
    ]),
  };
}

/* ── Aporte de capital ────────────────────────────────────────────── */

export function asientoCapital(valor: number, fecha: FechaISO): Asiento | null {
  if (valor <= 0) return null;
  return {
    id: 'capital',
    fecha,
    documento: 'AP-001',
    concepto: 'Aporte inicial de capital',
    renglones: limpiar([
      debe(CUENTAS.bancos.codigo, valor, 'Consignación del aporte'),
      haber(CUENTAS.capital.codigo, valor, 'Capital suscrito y pagado'),
    ]),
  };
}

/* ── Libro completo ───────────────────────────────────────────────── */

export interface FuentesLibro {
  readonly facturas: readonly Factura[];
  readonly pagos: readonly Pago[];
  readonly movimientos: readonly Movimiento[];
  readonly capitalInicial: number;
  readonly fechaCapital: FechaISO;
  readonly anio: number;
}

/**
 * Arma el libro diario completo a partir de los documentos, en orden
 * cronológico. Es la única función que la interfaz necesita para contabilizar.
 */
export function libroDiario(f: FuentesLibro): readonly Asiento[] {
  const asientos: Asiento[] = [];

  const capital = asientoCapital(f.capitalInicial, f.fechaCapital);
  if (capital) asientos.push(capital);

  for (const factura of f.facturas) {
    if (factura.tipo === 'venta') {
      asientos.push(asientoVenta(factura, f.anio));
      const costo = asientoCostoVenta(factura, f.movimientos);
      if (costo) asientos.push(costo);
    } else {
      asientos.push(asientoCompra(factura, f.anio));
    }
  }

  for (const pago of f.pagos) {
    const factura = f.facturas.find((x) => x.id === pago.facturaId);
    if (factura) asientos.push(asientoPago(pago, factura));
  }

  return asientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/* ── Cartera ──────────────────────────────────────────────────────── */

export interface SaldoCartera {
  readonly factura: Factura;
  readonly total: number;
  readonly abonado: number;
  readonly saldo: number;
  readonly diasVencido: number;
}

/**
 * Saldo pendiente de cada factura y su edad. Un saldo con `diasVencido`
 * positivo ya superó el plazo de treinta días que se usa por defecto.
 */
export function cartera(
  facturas: readonly Factura[],
  pagos: readonly Pago[],
  tipo: TipoFactura,
  hoy: FechaISO,
  plazoDias = 30,
): readonly SaldoCartera[] {
  const MS_DIA = 86_400_000;
  return facturas
    .filter((f) => f.tipo === tipo)
    .map((factura) => {
      const abonado = pagos
        .filter((p) => p.facturaId === factura.id)
        .reduce((s, p) => s + p.valor, 0);
      return { factura, abonado };
    })
    .map(({ factura, abonado }) => {
      const total = liquidarFactura(
        factura.lineas,
        factura.condiciones,
        Number(hoy.slice(0, 4)),
      ).netoAPagar;
      const vence = new Date(new Date(factura.fecha).getTime() + plazoDias * MS_DIA);
      const diasVencido = Math.round((new Date(hoy).getTime() - vence.getTime()) / MS_DIA);
      return { factura, total, abonado, saldo: total - abonado, diasVencido };
    })
    .filter((c) => c.saldo !== 0)
    .sort((a, b) => b.diasVencido - a.diasVencido);
}
