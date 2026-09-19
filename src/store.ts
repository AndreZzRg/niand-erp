/**
 * Estado de la aplicación. Persiste en `localStorage` bajo el prefijo del
 * repositorio; nada viaja a un servidor.
 *
 * El estado guarda **documentos**, nunca resultados: los saldos, el kardex y
 * los comprobantes se derivan del dominio en cada render. Así, cuando cambia
 * una tarifa, no quedan cifras viejas guardadas que contradigan al motor.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { almacenZustand } from './lib/almacen';
import type { Movimiento } from './domain/inventario';
import type { Factura, Pago } from './domain/comprobantes';
import type { TarifaIVA } from './domain/parametros';

export type TipoTercero = 'cliente' | 'proveedor' | 'ambos';

export interface Tercero {
  readonly id: string;
  nit: string;
  /** Dígito de verificación, calculado y almacenado para mostrarlo. */
  dv: string;
  nombre: string;
  tipo: TipoTercero;
  municipio: string;
  correo: string;
  telefono: string;
  /** Declarante de renta: determina la tarifa de retención aplicable. */
  declarante: boolean;
  /** Responsable de IVA (antes «régimen común»). */
  responsableIVA: boolean;
}

export interface Producto {
  readonly id: string;
  codigo: string;
  nombre: string;
  unidad: string;
  precioVenta: number;
  tarifaIVA: TarifaIVA;
  stockMinimo: number;
}

export interface Configuracion {
  /** Fecha de trabajo; determina el año fiscal de los parámetros. */
  fecha: string;
  razonSocial: string;
  nit: string;
  municipio: string;
  /** Tarifa municipal de ICA en por mil, aplicada por defecto. */
  tarifaICAPorMil: number;
  capitalInicial: number;
  /** Plazo por defecto de la cartera, en días. */
  plazoCartera: number;
}

export interface Estado {
  config: Configuracion;
  terceros: Tercero[];
  productos: Producto[];
  movimientos: Movimiento[];
  facturas: Factura[];
  pagos: Pago[];

  setConfig: (p: Partial<Configuracion>) => void;

  agregarTercero: (t: Tercero) => void;
  editarTercero: (id: string, p: Partial<Tercero>) => void;
  borrarTercero: (id: string) => void;

  agregarProducto: (p: Producto) => void;
  editarProducto: (id: string, p: Partial<Producto>) => void;
  borrarProducto: (id: string) => void;

  agregarMovimiento: (m: Movimiento) => void;
  borrarMovimiento: (id: string) => void;

  agregarFactura: (f: Factura) => void;
  borrarFactura: (id: string) => void;

  agregarPago: (p: Pago) => void;
  borrarPago: (id: string) => void;

  reiniciar: () => void;
  cargarEjemplo: () => void;
}

/** Identificador estable sin depender de `crypto.randomUUID`, ausente en jsdom antiguo. */
export function nuevoId(prefijo = 'id'): string {
  return `${prefijo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const INICIAL = {
  config: {
    fecha: '2026-09-17',
    razonSocial: 'Comercializadora de Laboratorio S.A.S.',
    nit: '901234567',
    municipio: 'Bogotá D.C.',
    tarifaICAPorMil: 11.04,
    capitalInicial: 50_000_000,
    plazoCartera: 30,
  } satisfies Configuracion,
  terceros: [] as Tercero[],
  productos: [] as Producto[],
  movimientos: [] as Movimiento[],
  facturas: [] as Factura[],
  pagos: [] as Pago[],
};

/* ── Datos de ejemplo ─────────────────────────────────────────────── */

function ejemplo(): Pick<Estado, 'terceros' | 'productos' | 'movimientos' | 'facturas' | 'pagos'> {
  const cliente: Tercero = {
    id: 'ter-cliente',
    nit: '830001338',
    dv: '1',
    nombre: 'Distribuciones del Norte S.A.S.',
    tipo: 'cliente',
    municipio: 'Bogotá D.C.',
    correo: 'cartera@distribucionesdelnorte.co',
    telefono: '6015550101',
    declarante: true,
    responsableIVA: true,
  };
  const proveedor: Tercero = {
    id: 'ter-proveedor',
    nit: '890903938',
    dv: '8',
    nombre: 'Importadora Andina Ltda.',
    tipo: 'proveedor',
    municipio: 'Medellín',
    correo: 'facturacion@importadoraandina.co',
    telefono: '6045550202',
    declarante: true,
    responsableIVA: true,
  };

  const teclado: Producto = {
    id: 'pro-teclado',
    codigo: 'TEC-001',
    nombre: 'Teclado mecánico retroiluminado',
    unidad: 'unidad',
    precioVenta: 185_000,
    tarifaIVA: 'general',
    stockMinimo: 10,
  };
  const cuaderno: Producto = {
    id: 'pro-cuaderno',
    codigo: 'CUA-050',
    nombre: 'Cuaderno cosido 100 hojas',
    unidad: 'unidad',
    precioVenta: 7_500,
    tarifaIVA: 'excluido',
    stockMinimo: 100,
  };

  const movimientos: Movimiento[] = [
    {
      id: 'mov-1',
      fecha: '2026-01-15',
      productoId: teclado.id,
      tipo: 'entrada',
      cantidad: 40,
      costoUnitario: 110_000,
      nota: 'Compra inicial',
    },
    {
      id: 'mov-2',
      fecha: '2026-02-10',
      productoId: teclado.id,
      tipo: 'entrada',
      cantidad: 20,
      costoUnitario: 125_000,
      nota: 'Reposición con alza de precio',
    },
    {
      id: 'mov-3',
      fecha: '2026-01-15',
      productoId: cuaderno.id,
      tipo: 'entrada',
      cantidad: 500,
      costoUnitario: 4_200,
      nota: 'Compra inicial',
    },
  ];

  const facturaVenta: Factura = {
    id: 'fac-1',
    numero: 'FV-0001',
    fecha: '2026-03-05',
    tipo: 'venta',
    terceroId: cliente.id,
    lineas: [
      {
        id: 'lin-1',
        productoId: teclado.id,
        descripcion: teclado.nombre,
        cantidad: 10,
        precioUnitario: teclado.precioVenta,
        descuento: 0.05,
        tarifaIVA: 'general',
      },
      {
        id: 'lin-2',
        productoId: cuaderno.id,
        descripcion: cuaderno.nombre,
        cantidad: 100,
        precioUnitario: cuaderno.precioVenta,
        descuento: 0,
        tarifaIVA: 'excluido',
      },
    ],
    condiciones: { conceptoRenta: 'compras', retieneIVA: false, tarifaICAPorMil: 11.04 },
    nota: 'Pedido mensual del cliente.',
  };

  const salidas: Movimiento[] = [
    {
      id: 'mov-4',
      fecha: '2026-03-05',
      productoId: teclado.id,
      tipo: 'salida',
      cantidad: 10,
      costoUnitario: 0,
      nota: 'Salida por FV-0001',
    },
    {
      id: 'mov-5',
      fecha: '2026-03-05',
      productoId: cuaderno.id,
      tipo: 'salida',
      cantidad: 100,
      costoUnitario: 0,
      nota: 'Salida por FV-0001',
    },
  ];

  const pagos: Pago[] = [
    {
      id: 'pag-1',
      fecha: '2026-03-20',
      facturaId: facturaVenta.id,
      valor: 1_000_000,
      medio: 'bancos',
      nota: 'Abono parcial',
    },
  ];

  return {
    terceros: [cliente, proveedor],
    productos: [teclado, cuaderno],
    movimientos: [...movimientos, ...salidas],
    facturas: [facturaVenta],
    pagos,
  };
}

export const useEstado = create<Estado>()(
  persist(
    (set) => ({
      ...structuredClone(INICIAL),

      setConfig: (p) => set((s) => ({ config: { ...s.config, ...p } })),

      agregarTercero: (t) => set((s) => ({ terceros: [...s.terceros, t] })),
      editarTercero: (id, p) =>
        set((s) => ({ terceros: s.terceros.map((t) => (t.id === id ? { ...t, ...p } : t)) })),
      borrarTercero: (id) => set((s) => ({ terceros: s.terceros.filter((t) => t.id !== id) })),

      agregarProducto: (p) => set((s) => ({ productos: [...s.productos, p] })),
      editarProducto: (id, p) =>
        set((s) => ({ productos: s.productos.map((x) => (x.id === id ? { ...x, ...p } : x)) })),
      borrarProducto: (id) => set((s) => ({ productos: s.productos.filter((p) => p.id !== id) })),

      agregarMovimiento: (m) => set((s) => ({ movimientos: [...s.movimientos, m] })),
      borrarMovimiento: (id) =>
        set((s) => ({ movimientos: s.movimientos.filter((m) => m.id !== id) })),

      agregarFactura: (f) => set((s) => ({ facturas: [...s.facturas, f] })),
      borrarFactura: (id) =>
        set((s) => ({
          facturas: s.facturas.filter((f) => f.id !== id),
          pagos: s.pagos.filter((p) => p.facturaId !== id),
        })),

      agregarPago: (p) => set((s) => ({ pagos: [...s.pagos, p] })),
      borrarPago: (id) => set((s) => ({ pagos: s.pagos.filter((p) => p.id !== id) })),

      reiniciar: () => set(structuredClone(INICIAL)),
      cargarEjemplo: () => set({ ...structuredClone(INICIAL), ...ejemplo() }),
    }),
    {
      name: 'estado',
      version: 1,
      storage: createJSONStorage(() => almacenZustand),
      partialize: (s) => ({
        config: s.config,
        terceros: s.terceros,
        productos: s.productos,
        movimientos: s.movimientos,
        facturas: s.facturas,
        pagos: s.pagos,
      }),
    },
  ),
);

/** Año fiscal derivado de la fecha de trabajo. */
export function anioDe(fecha: string): number {
  const a = Number(fecha.slice(0, 4));
  return Number.isFinite(a) && a > 1900 ? a : new Date().getFullYear();
}
