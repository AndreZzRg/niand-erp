/**
 * Plan Único de Cuentas para comerciantes (Decreto 2650 de 1993).
 *
 * Se incluye el subconjunto que mueve un ERP de alcance básico. La estructura
 * del PUC es jerárquica y el dígito inicial determina la clase, y con ella la
 * naturaleza del saldo:
 *
 *   1 Activo · 2 Pasivo · 3 Patrimonio · 4 Ingresos · 5 Gastos
 *   6 Costos de ventas · 7 Costos de producción
 *
 * El activo y los costos y gastos son de naturaleza débito; el pasivo, el
 * patrimonio y los ingresos, de naturaleza crédito.
 */

export type Naturaleza = 'debito' | 'credito';

export type ClasePUC = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Cuenta {
  /** Código PUC a seis dígitos. */
  readonly codigo: string;
  readonly nombre: string;
}

export const CLASES: Record<
  ClasePUC,
  { readonly nombre: string; readonly naturaleza: Naturaleza }
> = {
  1: { nombre: 'Activo', naturaleza: 'debito' },
  2: { nombre: 'Pasivo', naturaleza: 'credito' },
  3: { nombre: 'Patrimonio', naturaleza: 'credito' },
  4: { nombre: 'Ingresos', naturaleza: 'credito' },
  5: { nombre: 'Gastos', naturaleza: 'debito' },
  6: { nombre: 'Costos de ventas', naturaleza: 'debito' },
  7: { nombre: 'Costos de producción', naturaleza: 'debito' },
};

/** Cuentas utilizadas por los asientos automáticos de la aplicación. */
export const CUENTAS = {
  caja: { codigo: '110505', nombre: 'Caja general' },
  bancos: { codigo: '111005', nombre: 'Bancos moneda nacional' },
  clientes: { codigo: '130505', nombre: 'Clientes nacionales' },
  anticipoRenta: { codigo: '135515', nombre: 'Retención en la fuente' },
  anticipoICA: { codigo: '135518', nombre: 'Impuesto de industria y comercio retenido' },
  anticipoIVA: { codigo: '135517', nombre: 'Impuesto a las ventas retenido' },
  inventario: { codigo: '143536', nombre: 'Mercancías no fabricadas por la empresa' },
  proveedores: { codigo: '220505', nombre: 'Proveedores nacionales' },
  ivaPorPagar: { codigo: '240805', nombre: 'Impuesto a las ventas por pagar' },
  reteFuentePorPagar: { codigo: '236540', nombre: 'Retención en la fuente por pagar - compras' },
  reteIVAPorPagar: { codigo: '236705', nombre: 'Retención de IVA por pagar' },
  reteICAPorPagar: { codigo: '236805', nombre: 'Retención de ICA por pagar' },
  capital: { codigo: '310505', nombre: 'Capital suscrito y pagado' },
  resultado: { codigo: '360505', nombre: 'Resultado del ejercicio' },
  ventas: { codigo: '413536', nombre: 'Comercio al por mayor y al por menor' },
  devoluciones: { codigo: '417505', nombre: 'Devoluciones en ventas' },
  costoVentas: { codigo: '613536', nombre: 'Costo de venta - comercio' },
  gastosDiversos: { codigo: '519595', nombre: 'Gastos diversos' },
} as const satisfies Record<string, Cuenta>;

export type ClaveCuenta = keyof typeof CUENTAS;

/** Catálogo plano, ordenado por código, para listados e informes. */
export const CATALOGO: readonly Cuenta[] = Object.values(CUENTAS)
  .slice()
  .sort((a, b) => a.codigo.localeCompare(b.codigo));

export function claseDe(codigo: string): ClasePUC {
  const d = Number(codigo.charAt(0));
  if (d < 1 || d > 7 || !Number.isInteger(d)) {
    throw new RangeError(`Código PUC fuera del rango de clases 1..7: "${codigo}"`);
  }
  return d as ClasePUC;
}

export function naturalezaDe(codigo: string): Naturaleza {
  return CLASES[claseDe(codigo)].naturaleza;
}

export function nombreCuenta(codigo: string): string {
  return CATALOGO.find((c) => c.codigo === codigo)?.nombre ?? 'Cuenta no catalogada';
}

/**
 * Saldo de una cuenta a partir de sus débitos y créditos, expresado en su
 * naturaleza: positivo cuando el saldo corresponde al lado natural.
 */
export function saldoNatural(codigo: string, debitos: number, creditos: number): number {
  return naturalezaDe(codigo) === 'debito' ? debitos - creditos : creditos - debitos;
}

/** Agrupación de la clase para el estado de resultados y el balance. */
export function esDeResultado(codigo: string): boolean {
  const c = claseDe(codigo);
  return c >= 4;
}
