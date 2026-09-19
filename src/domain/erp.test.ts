/**
 * Cada prueba nombra el supuesto normativo o contable que verifica, no el
 * detalle de implementación. Si una norma cambia, la prueba que hay que
 * tocar se encuentra por el nombre.
 */
import { describe, expect, it } from 'vitest';

import {
  ANIO_BASE,
  CONCEPTOS_RETENCION,
  IVA,
  PARAMETROS,
  TARIFA_RETEIVA,
  conceptoRetencion,
  daDerechoADescontable,
  parametrosDe,
  retencionFuente,
  retencionICA,
  retencionIVA,
  uvtAPesos,
} from './parametros';
import {
  CATALOGO,
  CLASES,
  CUENTAS,
  claseDe,
  esDeResultado,
  naturalezaDe,
  nombreCuenta,
  saldoNatural,
} from './puc';
import {
  costoPromedioDe,
  existenciaDe,
  kardexDe,
  valorizacion,
  type Movimiento,
} from './inventario';
import { liquidarFactura, liquidarLinea, type LineaFactura } from './facturacion';
import {
  asientoDeCierre,
  balanceDePrueba,
  debe,
  descuadre,
  estaCuadrado,
  estadoDeResultados,
  haber,
  limpiar,
  situacionFinanciera,
  totalCreditos,
  totalDebitos,
  type Asiento,
} from './contabilidad';
import {
  asientoCapital,
  asientoCompra,
  asientoCostoVenta,
  asientoPago,
  asientoVenta,
  cartera,
  libroDiario,
  type Factura,
  type Pago,
} from './comprobantes';
import { digitoVerificacion, dvCorrecto, nitFormateado, normalizarNIT } from './nit';

const UVT_2026 = 49_799;

/* ════════════════════════════════════════════════════════════════
   Parámetros tributarios
   ════════════════════════════════════════════════════════════════ */

describe('parámetros tributarios', () => {
  it('declara la fuente de cada año y marca 2026 como pendiente de confirmar', () => {
    for (const p of PARAMETROS) {
      expect(p.fuente.length).toBeGreaterThan(0);
    }
    expect(parametrosDe(2025).verificado).toBe(true);
    expect(parametrosDe(2026).verificado).toBe(false);
  });

  it('arrastra el extremo más cercano y lo marca como no verificado fuera de rango', () => {
    const futuro = parametrosDe(2030);
    expect(futuro.anio).toBe(2030);
    expect(futuro.verificado).toBe(false);
    expect(futuro.uvt).toBe(UVT_2026);

    const pasado = parametrosDe(2000);
    expect(pasado.verificado).toBe(false);
    expect(pasado.uvt).toBe(47_065);
  });

  it('convierte UVT a pesos redondeando a la unidad', () => {
    expect(uvtAPesos(27, 2026)).toBe(Math.round(27 * UVT_2026));
    expect(uvtAPesos(0, 2026)).toBe(0);
  });

  it('usa el año base 2026', () => {
    expect(ANIO_BASE).toBe(2026);
  });
});

describe('impuesto sobre las ventas', () => {
  it('aplica las tarifas del Estatuto Tributario, arts. 468 y 468-1', () => {
    expect(IVA.general.tarifa).toBe(0.19);
    expect(IVA.reducida.tarifa).toBe(0.05);
    expect(IVA.exento.tarifa).toBe(0);
    expect(IVA.excluido.tarifa).toBe(0);
  });

  it('solo el excluido pierde el derecho a IVA descontable (art. 477)', () => {
    expect(daDerechoADescontable('exento')).toBe(true);
    expect(daDerechoADescontable('general')).toBe(true);
    expect(daDerechoADescontable('excluido')).toBe(false);
  });
});

describe('retención en la fuente', () => {
  it('no retiene por debajo de la cuantía mínima del concepto', () => {
    const minima = uvtAPesos(27, 2026);
    expect(retencionFuente(minima - 1, 'compras', 2026)).toBe(0);
    expect(retencionFuente(minima, 'compras', 2026)).toBe(Math.round(minima * 0.025));
  });

  it('aplica 2,5 % en compras de declarante y 3,5 % si no lo es', () => {
    const base = 10_000_000;
    expect(retencionFuente(base, 'compras', 2026)).toBe(250_000);
    expect(retencionFuente(base, 'compras-no-declarante', 2026)).toBe(350_000);
  });

  it('aplica 11 % a honorarios de persona jurídica sin cuantía mínima', () => {
    expect(retencionFuente(100_000, 'honorarios', 2026)).toBe(11_000);
  });

  it('devuelve cero cuando el concepto no está sometido', () => {
    expect(retencionFuente(50_000_000, 'ninguno', 2026)).toBe(0);
  });

  it('resuelve un concepto desconocido al concepto neutro', () => {
    expect(conceptoRetencion('inexistente').id).toBe('ninguno');
    expect(CONCEPTOS_RETENCION.length).toBeGreaterThan(3);
  });
});

describe('retención de IVA e ICA', () => {
  it('retiene el 15 % del impuesto facturado (ET, art. 437-1)', () => {
    expect(TARIFA_RETEIVA).toBe(0.15);
    expect(retencionIVA(1_000_000, true)).toBe(150_000);
  });

  it('no retiene IVA si el comprador no es agente retenedor', () => {
    expect(retencionIVA(1_000_000, false)).toBe(0);
  });

  it('calcula el ICA sobre la tarifa municipal expresada en por mil', () => {
    expect(retencionICA(10_000_000, 11.04)).toBe(110_400);
    expect(retencionICA(10_000_000, 0)).toBe(0);
    expect(retencionICA(10_000_000, Number.NaN)).toBe(0);
  });
});

/* ════════════════════════════════════════════════════════════════
   Plan Único de Cuentas
   ════════════════════════════════════════════════════════════════ */

describe('plan único de cuentas (Decreto 2650 de 1993)', () => {
  it('deriva la clase del primer dígito del código', () => {
    expect(claseDe('110505')).toBe(1);
    expect(claseDe('240805')).toBe(2);
    expect(claseDe('413536')).toBe(4);
    expect(claseDe('613536')).toBe(6);
  });

  it('rechaza un código fuera del rango de clases', () => {
    expect(() => claseDe('905000')).toThrow(RangeError);
    expect(() => claseDe('X10000')).toThrow(RangeError);
  });

  it('asigna naturaleza débito al activo, costos y gastos', () => {
    expect(naturalezaDe(CUENTAS.caja.codigo)).toBe('debito');
    expect(naturalezaDe(CUENTAS.costoVentas.codigo)).toBe('debito');
    expect(naturalezaDe(CUENTAS.gastosDiversos.codigo)).toBe('debito');
  });

  it('asigna naturaleza crédito al pasivo, patrimonio e ingresos', () => {
    expect(naturalezaDe(CUENTAS.proveedores.codigo)).toBe('credito');
    expect(naturalezaDe(CUENTAS.capital.codigo)).toBe('credito');
    expect(naturalezaDe(CUENTAS.ventas.codigo)).toBe('credito');
  });

  it('expresa el saldo en la naturaleza de la cuenta', () => {
    // Un activo con más débitos que créditos tiene saldo positivo.
    expect(saldoNatural(CUENTAS.caja.codigo, 1000, 400)).toBe(600);
    // Un ingreso con más créditos que débitos también.
    expect(saldoNatural(CUENTAS.ventas.codigo, 400, 1000)).toBe(600);
  });

  it('identifica las cuentas de resultado a partir de la clase 4', () => {
    expect(esDeResultado(CUENTAS.ventas.codigo)).toBe(true);
    expect(esDeResultado(CUENTAS.costoVentas.codigo)).toBe(true);
    expect(esDeResultado(CUENTAS.caja.codigo)).toBe(false);
  });

  it('nombra las cuentas del catálogo y avisa de las no catalogadas', () => {
    expect(nombreCuenta(CUENTAS.bancos.codigo)).toBe('Bancos moneda nacional');
    expect(nombreCuenta('999999')).toBe('Cuenta no catalogada');
    expect(CATALOGO.length).toBeGreaterThan(10);
  });

  it('describe las siete clases del plan', () => {
    expect(Object.keys(CLASES)).toHaveLength(7);
    expect(CLASES[3].nombre).toBe('Patrimonio');
  });
});

/* ════════════════════════════════════════════════════════════════
   Inventario al costo promedio ponderado
   ════════════════════════════════════════════════════════════════ */

const mov = (
  p: Partial<Movimiento> & Pick<Movimiento, 'id' | 'tipo' | 'cantidad'>,
): Movimiento => ({
  fecha: '2026-01-01',
  productoId: 'p1',
  costoUnitario: 0,
  nota: '',
  ...p,
});

describe('inventario al costo promedio ponderado (NIC 2)', () => {
  it('recalcula el promedio en cada entrada', () => {
    const e = kardexDe(
      [
        mov({
          id: 'a',
          tipo: 'entrada',
          cantidad: 40,
          costoUnitario: 110_000,
          fecha: '2026-01-15',
        }),
        mov({
          id: 'b',
          tipo: 'entrada',
          cantidad: 20,
          costoUnitario: 125_000,
          fecha: '2026-02-10',
        }),
      ],
      'p1',
    );
    expect(e.cantidad).toBe(60);
    expect(e.valor).toBe(6_900_000);
    expect(e.costoPromedio).toBe(115_000);
  });

  it('valora la salida al promedio vigente sin alterarlo', () => {
    const e = kardexDe(
      [
        mov({
          id: 'a',
          tipo: 'entrada',
          cantidad: 40,
          costoUnitario: 110_000,
          fecha: '2026-01-15',
        }),
        mov({
          id: 'b',
          tipo: 'entrada',
          cantidad: 20,
          costoUnitario: 125_000,
          fecha: '2026-02-10',
        }),
        mov({ id: 'c', tipo: 'salida', cantidad: 10, fecha: '2026-03-05' }),
      ],
      'p1',
    );
    expect(e.cantidad).toBe(50);
    expect(e.costoPromedio).toBe(115_000);
    expect(e.valor).toBe(5_750_000);
    expect(e.kardex.at(-1)?.valorMovimiento).toBe(1_150_000);
  });

  it('avisa cuando la salida excede la existencia', () => {
    const e = kardexDe(
      [
        mov({ id: 'a', tipo: 'entrada', cantidad: 5, costoUnitario: 1_000 }),
        mov({ id: 'b', tipo: 'salida', cantidad: 8, fecha: '2026-02-01' }),
      ],
      'p1',
    );
    expect(e.avisos).toHaveLength(1);
    expect(e.cantidad).toBe(-3);
  });

  it('el ajuste fija la existencia contada y conserva el promedio', () => {
    const e = kardexDe(
      [
        mov({ id: 'a', tipo: 'entrada', cantidad: 10, costoUnitario: 2_000 }),
        mov({ id: 'b', tipo: 'ajuste', cantidad: 8, fecha: '2026-02-01' }),
      ],
      'p1',
    );
    expect(e.cantidad).toBe(8);
    expect(e.costoPromedio).toBe(2_000);
    expect(e.valor).toBe(16_000);
  });

  it('ordena los movimientos por fecha y respeta el orden de registro a igual fecha', () => {
    const e = kardexDe(
      [
        mov({ id: 'b', tipo: 'salida', cantidad: 5, fecha: '2026-03-01' }),
        mov({ id: 'a', tipo: 'entrada', cantidad: 10, costoUnitario: 1_000, fecha: '2026-01-01' }),
      ],
      'p1',
    );
    expect(e.cantidad).toBe(5);
    expect(e.avisos).toHaveLength(0);
  });

  it('devuelve el estado vacío para un producto sin movimientos', () => {
    const e = kardexDe([], 'inexistente');
    expect(e.cantidad).toBe(0);
    expect(e.kardex).toHaveLength(0);
    expect(costoPromedioDe([], 'inexistente')).toBe(0);
    expect(existenciaDe([], 'inexistente')).toBe(0);
  });

  it('no mezcla los movimientos de productos distintos', () => {
    const ms = [
      mov({ id: 'a', tipo: 'entrada', cantidad: 10, costoUnitario: 1_000, productoId: 'p1' }),
      mov({ id: 'b', tipo: 'entrada', cantidad: 5, costoUnitario: 4_000, productoId: 'p2' }),
    ];
    expect(existenciaDe(ms, 'p1')).toBe(10);
    expect(existenciaDe(ms, 'p2')).toBe(5);

    const v = valorizacion(ms, ['p1', 'p2']);
    expect(v.total).toBe(30_000);
    expect(v.filas).toHaveLength(2);
  });
});

/* ════════════════════════════════════════════════════════════════
   Liquidación de facturas
   ════════════════════════════════════════════════════════════════ */

const linea = (p: Partial<LineaFactura> & Pick<LineaFactura, 'id'>): LineaFactura => ({
  productoId: 'p1',
  descripcion: 'Artículo',
  cantidad: 1,
  precioUnitario: 100_000,
  descuento: 0,
  tarifaIVA: 'general',
  ...p,
});

describe('liquidación de una línea', () => {
  it('aplica el descuento antes del IVA (ET, art. 454)', () => {
    const l = liquidarLinea(
      linea({ id: 'l', cantidad: 10, precioUnitario: 185_000, descuento: 0.05 }),
    );
    expect(l.bruto).toBe(1_850_000);
    expect(l.descuento).toBe(92_500);
    expect(l.base).toBe(1_757_500);
    expect(l.iva).toBe(333_925);
    expect(l.total).toBe(2_091_425);
  });

  it('no genera IVA en operaciones excluidas', () => {
    const l = liquidarLinea(
      linea({ id: 'l', cantidad: 100, precioUnitario: 7_500, tarifaIVA: 'excluido' }),
    );
    expect(l.base).toBe(750_000);
    expect(l.iva).toBe(0);
  });

  it('acota el descuento al rango de cero a uno', () => {
    expect(liquidarLinea(linea({ id: 'l', descuento: 2 })).base).toBe(0);
    expect(liquidarLinea(linea({ id: 'l', descuento: -1 })).descuento).toBe(0);
  });

  it('tolera cantidades y precios no finitos', () => {
    const l = liquidarLinea(linea({ id: 'l', cantidad: Number.NaN, precioUnitario: Number.NaN }));
    expect(l.bruto).toBe(0);
    expect(l.total).toBe(0);
  });
});

describe('liquidación de la factura completa', () => {
  const lineas = [
    linea({ id: 'l1', cantidad: 10, precioUnitario: 185_000, descuento: 0.05 }),
    linea({ id: 'l2', cantidad: 100, precioUnitario: 7_500, tarifaIVA: 'excluido' }),
  ];
  const condiciones = { conceptoRenta: 'compras', retieneIVA: false, tarifaICAPorMil: 11.04 };

  it('separa la base gravada de la excluida', () => {
    const f = liquidarFactura(lineas, condiciones, 2026);
    expect(f.baseGravable).toBe(1_757_500);
    expect(f.baseExcluida).toBe(750_000);
    expect(f.iva).toBe(333_925);
  });

  it('descuenta las retenciones del recaudo pero no del ingreso', () => {
    const f = liquidarFactura(lineas, condiciones, 2026);
    expect(f.reteFuente).toBe(62_688);
    expect(f.reteICA).toBe(27_683);
    expect(f.totalFactura).toBe(2_841_425);
    expect(f.netoAPagar).toBe(2_841_425 - 62_688 - 27_683);
  });

  it('retiene IVA cuando el comprador es agente retenedor', () => {
    const f = liquidarFactura(lineas, { ...condiciones, retieneIVA: true }, 2026);
    expect(f.reteIVA).toBe(Math.round(333_925 * 0.15));
  });

  it('avisa si se marca retención de IVA sin impuesto que retener', () => {
    const f = liquidarFactura(
      [linea({ id: 'l', tarifaIVA: 'excluido' })],
      { ...condiciones, retieneIVA: true },
      2026,
    );
    expect(f.reteIVA).toBe(0);
    expect(f.avisos.join(' ')).toContain('no genera impuesto');
  });

  it('avisa cuando la factura no tiene líneas', () => {
    const f = liquidarFactura([], condiciones, 2026);
    expect(f.totalFactura).toBe(0);
    expect(f.avisos.join(' ')).toContain('no tiene líneas');
  });

  it('avisa cuando las retenciones superan el valor de la factura', () => {
    const f = liquidarFactura(
      [linea({ id: 'l', cantidad: 1, precioUnitario: 2_000_000, tarifaIVA: 'excluido' })],
      { conceptoRenta: 'honorarios', retieneIVA: false, tarifaICAPorMil: 990 },
      2026,
    );
    expect(f.netoAPagar).toBeLessThan(0);
    expect(f.avisos.join(' ')).toContain('superan el valor');
  });

  it('avisa cuando mezcla operaciones gravadas y excluidas', () => {
    const f = liquidarFactura(lineas, condiciones, 2026);
    expect(f.avisos.join(' ')).toContain('gravadas y excluidas');
  });
});

/* ════════════════════════════════════════════════════════════════
   Partida doble
   ════════════════════════════════════════════════════════════════ */

const asiento = (renglones: Asiento['renglones']): Asiento => ({
  id: 'a1',
  fecha: '2026-03-05',
  documento: 'DOC-1',
  concepto: 'Prueba',
  renglones,
});

describe('partida doble', () => {
  it('reconoce un asiento cuadrado', () => {
    const a = asiento([debe(CUENTAS.caja.codigo, 1000), haber(CUENTAS.ventas.codigo, 1000)]);
    expect(totalDebitos(a)).toBe(1000);
    expect(totalCreditos(a)).toBe(1000);
    expect(descuadre(a)).toBe(0);
    expect(estaCuadrado(a)).toBe(true);
  });

  it('detecta el descuadre en vez de ajustarlo en silencio', () => {
    const a = asiento([debe(CUENTAS.caja.codigo, 1000), haber(CUENTAS.ventas.codigo, 900)]);
    expect(estaCuadrado(a)).toBe(false);
    expect(descuadre(a)).toBe(100);
  });

  it('descarta los renglones en cero', () => {
    const r = limpiar([debe(CUENTAS.caja.codigo, 0), haber(CUENTAS.ventas.codigo, 500)]);
    expect(r).toHaveLength(1);
  });

  it('redondea los renglones a la unidad de peso', () => {
    expect(debe(CUENTAS.caja.codigo, 1000.4).debito).toBe(1000);
    expect(haber(CUENTAS.ventas.codigo, 1000.6).credito).toBe(1001);
  });
});

describe('balance de prueba', () => {
  const asientos = [
    asiento([debe(CUENTAS.bancos.codigo, 50_000), haber(CUENTAS.capital.codigo, 50_000)]),
    asiento([debe(CUENTAS.clientes.codigo, 10_000), haber(CUENTAS.ventas.codigo, 10_000)]),
  ];

  it('suma débitos y créditos por cuenta y cuadra', () => {
    const b = balanceDePrueba(asientos);
    expect(b.totalDebitos).toBe(60_000);
    expect(b.totalCreditos).toBe(60_000);
    expect(b.cuadra).toBe(true);
    expect(b.filas).toHaveLength(4);
  });

  it('ordena las filas por código', () => {
    const b = balanceDePrueba(asientos);
    const codigos = b.filas.map((f) => f.codigo);
    expect(codigos).toEqual([...codigos].sort());
  });

  it('está vacío si no hay asientos', () => {
    expect(balanceDePrueba([]).filas).toHaveLength(0);
    expect(balanceDePrueba([]).cuadra).toBe(true);
  });
});

describe('estados financieros', () => {
  const asientos = [
    asiento([debe(CUENTAS.bancos.codigo, 50_000), haber(CUENTAS.capital.codigo, 50_000)]),
    asiento([debe(CUENTAS.clientes.codigo, 10_000), haber(CUENTAS.ventas.codigo, 10_000)]),
    asiento([debe(CUENTAS.costoVentas.codigo, 6_000), haber(CUENTAS.inventario.codigo, 6_000)]),
    asiento([debe(CUENTAS.gastosDiversos.codigo, 1_000), haber(CUENTAS.bancos.codigo, 1_000)]),
  ];

  it('calcula utilidad bruta y neta', () => {
    const r = estadoDeResultados(asientos);
    expect(r.ingresos).toBe(10_000);
    expect(r.costos).toBe(6_000);
    expect(r.gastos).toBe(1_000);
    expect(r.utilidadBruta).toBe(4_000);
    expect(r.utilidadNeta).toBe(3_000);
  });

  it('cuadra la ecuación patrimonial sumando el resultado del periodo', () => {
    const s = situacionFinanciera(asientos);
    expect(s.activo).toBe(50_000 + 10_000 - 6_000 - 1_000);
    expect(s.patrimonioTotal).toBe(50_000 + 3_000);
    expect(s.cuadra).toBe(true);
    expect(s.diferencia).toBe(0);
  });

  it('el asiento de cierre cancela las cuentas de resultado', () => {
    const cierre = asientoDeCierre(asientos, '2026-12-31');
    expect(cierre).not.toBeNull();
    expect(estaCuadrado(cierre as Asiento)).toBe(true);

    // Tras el cierre, ninguna cuenta de resultado conserva saldo.
    const b = balanceDePrueba([...asientos, cierre as Asiento]);
    const resultado = b.filas.filter((f) => esDeResultado(f.codigo) && f.codigo !== '360505');
    for (const f of resultado) expect(f.saldo).toBe(0);
  });

  it('no produce asiento de cierre sin cuentas de resultado', () => {
    const solo = [asiento([debe(CUENTAS.bancos.codigo, 10), haber(CUENTAS.capital.codigo, 10)])];
    expect(asientoDeCierre(solo, '2026-12-31')).toBeNull();
  });

  it('registra la pérdida como débito del resultado', () => {
    const perdida = [
      asiento([debe(CUENTAS.gastosDiversos.codigo, 5_000), haber(CUENTAS.bancos.codigo, 5_000)]),
    ];
    const cierre = asientoDeCierre(perdida, '2026-12-31') as Asiento;
    const r = cierre.renglones.find((x) => x.codigo === CUENTAS.resultado.codigo);
    expect(r?.debito).toBe(5_000);
  });
});

/* ════════════════════════════════════════════════════════════════
   Comprobantes derivados de los documentos
   ════════════════════════════════════════════════════════════════ */

const facturaVenta: Factura = {
  id: 'f1',
  numero: 'FV-0001',
  fecha: '2026-03-05',
  tipo: 'venta',
  terceroId: 't1',
  lineas: [linea({ id: 'l1', cantidad: 10, precioUnitario: 185_000, descuento: 0.05 })],
  condiciones: { conceptoRenta: 'compras', retieneIVA: false, tarifaICAPorMil: 11.04 },
  nota: '',
};

const facturaCompra: Factura = {
  ...facturaVenta,
  id: 'f2',
  numero: 'FC-0001',
  tipo: 'compra',
};

describe('comprobantes', () => {
  it('el asiento de venta cuadra y reconoce el ingreso sin las retenciones', () => {
    const a = asientoVenta(facturaVenta, 2026);
    expect(estaCuadrado(a)).toBe(true);

    const ingreso = a.renglones.find((r) => r.codigo === CUENTAS.ventas.codigo);
    expect(ingreso?.credito).toBe(1_757_500);

    const anticipo = a.renglones.find((r) => r.codigo === CUENTAS.anticipoRenta.codigo);
    expect(anticipo?.debito).toBeGreaterThan(0);
  });

  it('el asiento de compra cuadra y lleva la mercancía al inventario', () => {
    const a = asientoCompra(facturaCompra, 2026);
    expect(estaCuadrado(a)).toBe(true);

    const inv = a.renglones.find((r) => r.codigo === CUENTAS.inventario.codigo);
    expect(inv?.debito).toBe(1_757_500);

    const rete = a.renglones.find((r) => r.codigo === CUENTAS.reteFuentePorPagar.codigo);
    expect(rete?.credito).toBeGreaterThan(0);
  });

  it('el costo de venta se valora al promedio ponderado vigente', () => {
    const movimientos = [
      mov({ id: 'a', tipo: 'entrada', cantidad: 40, costoUnitario: 110_000, fecha: '2026-01-15' }),
      mov({ id: 'b', tipo: 'entrada', cantidad: 20, costoUnitario: 125_000, fecha: '2026-02-10' }),
    ];
    const a = asientoCostoVenta(facturaVenta, movimientos) as Asiento;
    expect(a).not.toBeNull();
    expect(estaCuadrado(a)).toBe(true);
    expect(a.renglones.find((r) => r.codigo === CUENTAS.costoVentas.codigo)?.debito).toBe(
      1_150_000,
    );
  });

  it('no produce costo de venta si el producto no tiene inventario', () => {
    expect(asientoCostoVenta(facturaVenta, [])).toBeNull();
  });

  it('el recaudo debita efectivo y abona la cartera del cliente', () => {
    const pago: Pago = {
      id: 'p1',
      fecha: '2026-03-20',
      facturaId: 'f1',
      valor: 1_000_000,
      medio: 'bancos',
      nota: '',
    };
    const a = asientoPago(pago, facturaVenta);
    expect(estaCuadrado(a)).toBe(true);
    expect(a.renglones.find((r) => r.codigo === CUENTAS.bancos.codigo)?.debito).toBe(1_000_000);
    expect(a.renglones.find((r) => r.codigo === CUENTAS.clientes.codigo)?.credito).toBe(1_000_000);
  });

  it('el pago a proveedor debita la deuda y acredita la caja', () => {
    const pago: Pago = {
      id: 'p2',
      fecha: '2026-03-20',
      facturaId: 'f2',
      valor: 500_000,
      medio: 'caja',
      nota: '',
    };
    const a = asientoPago(pago, facturaCompra);
    expect(estaCuadrado(a)).toBe(true);
    expect(a.renglones.find((r) => r.codigo === CUENTAS.caja.codigo)?.credito).toBe(500_000);
  });

  it('el aporte de capital cuadra y se omite si es cero', () => {
    const a = asientoCapital(50_000_000, '2026-01-01') as Asiento;
    expect(estaCuadrado(a)).toBe(true);
    expect(asientoCapital(0, '2026-01-01')).toBeNull();
  });
});

describe('libro diario', () => {
  const movimientos = [
    mov({ id: 'a', tipo: 'entrada', cantidad: 40, costoUnitario: 110_000, fecha: '2026-01-15' }),
  ];
  const pagos: Pago[] = [
    { id: 'p1', fecha: '2026-03-20', facturaId: 'f1', valor: 1_000_000, medio: 'bancos', nota: '' },
  ];

  const libro = libroDiario({
    facturas: [facturaVenta, facturaCompra],
    pagos,
    movimientos,
    capitalInicial: 50_000_000,
    fechaCapital: '2026-01-01',
    anio: 2026,
  });

  it('produce asientos cuadrados y en orden cronológico', () => {
    expect(libro.length).toBeGreaterThan(3);
    for (const a of libro) expect(estaCuadrado(a)).toBe(true);

    const fechas = libro.map((a) => a.fecha);
    expect(fechas).toEqual([...fechas].sort());
  });

  it('el balance del libro completo cuadra', () => {
    const b = balanceDePrueba(libro);
    expect(b.cuadra).toBe(true);
  });

  it('ignora un pago cuya factura no existe', () => {
    const l = libroDiario({
      facturas: [],
      pagos,
      movimientos: [],
      capitalInicial: 0,
      fechaCapital: '2026-01-01',
      anio: 2026,
    });
    expect(l).toHaveLength(0);
  });
});

describe('cartera', () => {
  const pagos: Pago[] = [
    { id: 'p1', fecha: '2026-03-20', facturaId: 'f1', valor: 1_000_000, medio: 'bancos', nota: '' },
  ];

  it('descuenta los abonos y mide la edad respecto del plazo', () => {
    const c = cartera([facturaVenta], pagos, 'venta', '2026-05-05', 30);
    expect(c).toHaveLength(1);

    const saldo = c[0];
    if (!saldo) throw new Error('Se esperaba un saldo de cartera.');
    expect(saldo.abonado).toBe(1_000_000);
    expect(saldo.saldo).toBe(saldo.total - 1_000_000);
    expect(saldo.diasVencido).toBeGreaterThan(0);
  });

  it('omite las facturas totalmente pagadas', () => {
    const total = liquidarFactura(facturaVenta.lineas, facturaVenta.condiciones, 2026).netoAPagar;
    const c = cartera(
      [facturaVenta],
      [{ id: 'p', fecha: '2026-03-10', facturaId: 'f1', valor: total, medio: 'caja', nota: '' }],
      'venta',
      '2026-05-05',
    );
    expect(c).toHaveLength(0);
  });

  it('separa la cartera por tipo de factura', () => {
    expect(cartera([facturaVenta, facturaCompra], [], 'compra', '2026-05-05')).toHaveLength(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Dígito de verificación del NIT
   ════════════════════════════════════════════════════════════════ */

describe('dígito de verificación del NIT', () => {
  it('reproduce el dígito de NIT conocidos', () => {
    // 890.903.938-8 es un NIT ampliamente publicado; sirve de caso de control.
    expect(digitoVerificacion('890903938')).toBe('8');
    expect(digitoVerificacion('901234567')).toBe('7');
  });

  it('ignora puntos y guiones al normalizar', () => {
    expect(normalizarNIT('890.903.938-8')).toBe('8909039388');
    expect(digitoVerificacion('890.903.938')).toBe('8');
  });

  it('rechaza un número vacío o demasiado largo', () => {
    expect(digitoVerificacion('')).toBeNull();
    expect(digitoVerificacion('1234567890123456')).toBeNull();
  });

  it('valida la correspondencia entre NIT y dígito', () => {
    expect(dvCorrecto('890903938', '8')).toBe(true);
    expect(dvCorrecto('890903938', '3')).toBe(false);
    expect(dvCorrecto('', '1')).toBe(false);
  });

  it('formatea el NIT con separadores de miles y dígito', () => {
    expect(nitFormateado('890903938')).toBe('890.903.938-8');
    expect(nitFormateado('890903938', '8')).toBe('890.903.938-8');
    expect(nitFormateado('')).toBe('');
  });
});
