/**
 * Módulo «Facturación»: arma facturas de venta y de compra, las liquida con
 * IVA y retenciones y muestra el comprobante contable que producen. La
 * liquidación se recalcula en vivo: lo que se ve es lo que se contabiliza.
 */
import { useMemo, useState } from 'react';
import { FilePlus2, Info, Trash2 } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Interruptor,
  Llamado,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { CONCEPTOS_RETENCION, IVA, type TarifaIVA } from '../domain/parametros';
import { liquidarFactura, type LineaFactura } from '../domain/facturacion';
import {
  asientoCompra,
  asientoVenta,
  type Factura,
  type TipoFactura,
} from '../domain/comprobantes';
import { nombreCuenta } from '../domain/puc';
import { estaCuadrado } from '../domain/contabilidad';
import { fechaCorta, numero, pesos } from '../lib/formato';
import { nuevoId, useEstado } from '../store';
import { BarraConfiguracion, useParametrosEfectivos } from './Configuracion';

export function PanelFacturacion() {
  const {
    config,
    terceros,
    productos,
    facturas,
    agregarFactura,
    borrarFactura,
    agregarMovimiento,
  } = useEstado();
  const { anio } = useParametrosEfectivos();

  const [tipo, setTipo] = useState<TipoFactura>('venta');
  const [numeroDoc, setNumeroDoc] = useState('FV-0002');
  const [fecha, setFecha] = useState(config.fecha);
  const [terceroId, setTerceroId] = useState('');
  const [conceptoRenta, setConceptoRenta] = useState('compras');
  const [retieneIVA, setRetieneIVA] = useState(false);
  const [tarifaICA, setTarifaICA] = useState(config.tarifaICAPorMil);
  const [lineas, setLineas] = useState<LineaFactura[]>([]);
  const [mueveInventario, setMueveInventario] = useState(true);

  const condiciones = useMemo(
    () => ({ conceptoRenta, retieneIVA, tarifaICAPorMil: tarifaICA }),
    [conceptoRenta, retieneIVA, tarifaICA],
  );

  const liquidacion = useMemo(
    () => liquidarFactura(lineas, condiciones, anio),
    [lineas, condiciones, anio],
  );

  function agregarLinea() {
    const p = productos[0];
    if (!p) return;
    setLineas([
      ...lineas,
      {
        id: nuevoId('lin'),
        productoId: p.id,
        descripcion: p.nombre,
        cantidad: 1,
        precioUnitario: p.precioVenta,
        descuento: 0,
        tarifaIVA: p.tarifaIVA,
      },
    ]);
  }

  function cambiarLinea(id: string, cambio: Partial<LineaFactura>) {
    setLineas((ls) =>
      ls.map((l) => {
        if (l.id !== id) return l;
        const siguiente = { ...l, ...cambio };
        // Al cambiar de producto se arrastran su precio, descripción y tarifa.
        if (cambio.productoId) {
          const p = productos.find((x) => x.id === cambio.productoId);
          if (p) {
            siguiente.descripcion = p.nombre;
            siguiente.precioUnitario = p.precioVenta;
            siguiente.tarifaIVA = p.tarifaIVA;
          }
        }
        return siguiente;
      }),
    );
  }

  function guardar() {
    if (lineas.length === 0 || !terceroId) return;
    const f: Factura = {
      id: nuevoId('fac'),
      numero: numeroDoc.trim() || `${tipo === 'venta' ? 'FV' : 'FC'}-s/n`,
      fecha,
      tipo,
      terceroId,
      lineas,
      condiciones,
      nota: '',
    };
    agregarFactura(f);

    // La factura mueve el inventario salvo que se indique lo contrario.
    if (mueveInventario) {
      for (const l of lineas) {
        agregarMovimiento({
          id: nuevoId('mov'),
          fecha,
          productoId: l.productoId,
          tipo: tipo === 'venta' ? 'salida' : 'entrada',
          cantidad: Math.abs(l.cantidad),
          costoUnitario: tipo === 'compra' ? l.precioUnitario : 0,
          nota: `${tipo === 'venta' ? 'Salida' : 'Entrada'} por ${f.numero}`,
        });
      }
    }

    setLineas([]);
    setNumeroDoc('');
  }

  const elegibles = terceros.filter(
    (t) => t.tipo === 'ambos' || (tipo === 'venta' ? t.tipo === 'cliente' : t.tipo === 'proveedor'),
  );

  const borrador: Factura = {
    id: 'borrador',
    numero: numeroDoc || 'sin número',
    fecha,
    tipo,
    terceroId,
    lineas,
    condiciones,
    nota: '',
  };
  const comprobante =
    lineas.length > 0
      ? tipo === 'venta'
        ? asientoVenta(borrador, anio)
        : asientoCompra(borrador, anio)
      : null;

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <Tarjeta
        titulo="Nueva factura"
        descripcion="Las retenciones se calculan sobre la base, nunca sobre el IVA, salvo la retención de IVA."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Tipo de documento">
            {(id) => (
              <Seleccion
                id={id}
                value={tipo}
                onChange={(e) => {
                  setTipo(e.target.value as TipoFactura);
                  setTerceroId('');
                }}
              >
                <option value="venta">Factura de venta</option>
                <option value="compra">Factura de compra</option>
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Número" requerido>
            {(id) => (
              <Entrada id={id} value={numeroDoc} onChange={(e) => setNumeroDoc(e.target.value)} />
            )}
          </Campo>

          <Campo etiqueta="Fecha">
            {(id) => (
              <Entrada
                id={id}
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            )}
          </Campo>

          <Campo
            etiqueta={tipo === 'venta' ? 'Cliente' : 'Proveedor'}
            requerido
            error={elegibles.length === 0 ? 'No hay terceros de este tipo registrados.' : null}
          >
            {(id) => (
              <Seleccion
                id={id}
                value={terceroId}
                onChange={(e) => setTerceroId(e.target.value)}
                disabled={elegibles.length === 0}
              >
                <option value="">Seleccione…</option>
                {elegibles.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Concepto de retención en la fuente">
            {(id) => (
              <Seleccion
                id={id}
                value={conceptoRenta}
                onChange={(e) => setConceptoRenta(e.target.value)}
              >
                {CONCEPTOS_RETENCION.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.rotulo}
                  </option>
                ))}
              </Seleccion>
            )}
          </Campo>

          <Campo etiqueta="Tarifa de ICA (por mil)">
            {(id) => (
              <Entrada
                id={id}
                type="number"
                min={0}
                step={0.01}
                value={tarifaICA}
                onChange={(e) => setTarifaICA(Number(e.target.value))}
              />
            )}
          </Campo>

          <div className="flex items-end gap-3">
            <Interruptor
              activo={retieneIVA}
              onChange={setRetieneIVA}
              etiqueta="Practica retención de IVA"
            />
            <span className="pb-2 text-sm">Retiene IVA (15 %)</span>
          </div>

          <div className="flex items-end gap-3">
            <Interruptor
              activo={mueveInventario}
              onChange={setMueveInventario}
              etiqueta="La factura mueve el inventario"
            />
            <span className="pb-2 text-sm">Mueve inventario</span>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta
        titulo="Líneas de la factura"
        acciones={
          <Boton
            variante="secundario"
            tamano="sm"
            onClick={agregarLinea}
            disabled={productos.length === 0}
          >
            <FilePlus2 size={14} /> Agregar línea
          </Boton>
        }
      >
        {productos.length === 0 ? (
          <Vacio titulo="No hay productos en el catálogo">
            Registre productos en el módulo de inventario antes de facturar.
          </Vacio>
        ) : lineas.length === 0 ? (
          <Vacio titulo="La factura no tiene líneas">
            Agregue al menos un producto o servicio para liquidarla.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Producto</Th>
                <Th numerico>Cantidad</Th>
                <Th numerico>Precio</Th>
                <Th numerico>Descuento</Th>
                <Th>IVA</Th>
                <Th numerico>Base</Th>
                <Th numerico>Total</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {liquidacion.lineas.map((ll) => {
                const l = ll.linea;
                return (
                  <tr key={l.id}>
                    <Td className="min-w-48">
                      <Seleccion
                        aria-label="Producto de la línea"
                        value={l.productoId}
                        onChange={(e) => cambiarLinea(l.id, { productoId: e.target.value })}
                      >
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo} · {p.nombre}
                          </option>
                        ))}
                      </Seleccion>
                    </Td>
                    <Td numerico>
                      <Entrada
                        aria-label="Cantidad"
                        className="w-24 text-right"
                        type="number"
                        min={0}
                        value={l.cantidad}
                        onChange={(e) => cambiarLinea(l.id, { cantidad: Number(e.target.value) })}
                      />
                    </Td>
                    <Td numerico>
                      <Entrada
                        aria-label="Precio unitario"
                        className="w-32 text-right"
                        type="number"
                        min={0}
                        step={100}
                        value={l.precioUnitario}
                        onChange={(e) =>
                          cambiarLinea(l.id, { precioUnitario: Number(e.target.value) })
                        }
                      />
                    </Td>
                    <Td numerico>
                      <Entrada
                        aria-label="Descuento en porcentaje"
                        className="w-24 text-right"
                        type="number"
                        min={0}
                        max={100}
                        value={Math.round(l.descuento * 100)}
                        onChange={(e) =>
                          cambiarLinea(l.id, { descuento: Number(e.target.value) / 100 })
                        }
                      />
                    </Td>
                    <Td>
                      <Seleccion
                        aria-label="Tarifa de IVA"
                        value={l.tarifaIVA}
                        onChange={(e) =>
                          cambiarLinea(l.id, { tarifaIVA: e.target.value as TarifaIVA })
                        }
                      >
                        {(Object.keys(IVA) as TarifaIVA[]).map((t) => (
                          <option key={t} value={t}>
                            {IVA[t].rotulo}
                          </option>
                        ))}
                      </Seleccion>
                    </Td>
                    <Td numerico>{pesos(ll.base)}</Td>
                    <Td numerico className="font-medium">
                      {pesos(ll.total)}
                    </Td>
                    <Td>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label="Eliminar la línea"
                        onClick={() => setLineas((ls) => ls.filter((x) => x.id !== l.id))}
                      >
                        <Trash2 size={14} />
                      </Boton>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      {lineas.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Dato rotulo="Base gravable" valor={pesos(liquidacion.baseGravable)} />
            <Dato rotulo="IVA" valor={pesos(liquidacion.iva)} tono="marca" />
            <Dato
              rotulo="Retenciones"
              valor={pesos(liquidacion.totalRetenciones)}
              tono="riesgo"
              detalle="Anticipo de impuestos del vendedor"
            />
            <Dato rotulo="Neto a pagar" valor={pesos(liquidacion.netoAPagar)} tono="ok" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Tarjeta titulo="Liquidación">
              <Tabla>
                <tbody>
                  <tr>
                    <Td>Subtotal bruto</Td>
                    <Td numerico>{pesos(liquidacion.subtotalBruto)}</Td>
                  </tr>
                  <tr>
                    <Td>Descuentos comerciales</Td>
                    <Td numerico>−{pesos(liquidacion.descuentos)}</Td>
                  </tr>
                  <tr>
                    <Td>Base gravada</Td>
                    <Td numerico>{pesos(liquidacion.baseGravable)}</Td>
                  </tr>
                  <tr>
                    <Td>Base excluida</Td>
                    <Td numerico>{pesos(liquidacion.baseExcluida)}</Td>
                  </tr>
                  <tr>
                    <Td>IVA generado</Td>
                    <Td numerico>{pesos(liquidacion.iva)}</Td>
                  </tr>
                  <tr className="bg-superficie-2">
                    <Td className="font-display font-semibold">Total factura</Td>
                    <Td numerico className="font-semibold">
                      {pesos(liquidacion.totalFactura)}
                    </Td>
                  </tr>
                  <tr>
                    <Td>
                      Retención en la fuente
                      <span className="block text-xs text-texto-3">
                        {CONCEPTOS_RETENCION.find((c) => c.id === conceptoRenta)?.norma}
                      </span>
                    </Td>
                    <Td numerico>−{pesos(liquidacion.reteFuente)}</Td>
                  </tr>
                  <tr>
                    <Td>Retención de IVA</Td>
                    <Td numerico>−{pesos(liquidacion.reteIVA)}</Td>
                  </tr>
                  <tr>
                    <Td>
                      Retención de ICA
                      <span className="block text-xs text-texto-3">
                        {numero(tarifaICA, 2)} por mil
                      </span>
                    </Td>
                    <Td numerico>−{pesos(liquidacion.reteICA)}</Td>
                  </tr>
                  <tr className="bg-superficie-2">
                    <Td className="font-display font-semibold">Neto a pagar</Td>
                    <Td numerico className="font-semibold">
                      {pesos(liquidacion.netoAPagar)}
                    </Td>
                  </tr>
                </tbody>
              </Tabla>
            </Tarjeta>

            <div className="space-y-6">
              {comprobante && (
                <Tarjeta
                  titulo="Comprobante contable"
                  descripcion="El asiento que producirá esta factura al guardarla."
                  acciones={
                    <Insignia tono={estaCuadrado(comprobante) ? 'ok' : 'riesgo'}>
                      {estaCuadrado(comprobante) ? 'Cuadra' : 'Descuadrado'}
                    </Insignia>
                  }
                >
                  <Tabla>
                    <thead>
                      <tr>
                        <Th>Cuenta</Th>
                        <Th numerico>Débito</Th>
                        <Th numerico>Crédito</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {comprobante.renglones.map((r, i) => (
                        <tr key={`${r.codigo}-${i}`}>
                          <Td>
                            <span className="font-mono text-xs">{r.codigo}</span>
                            <span className="block text-xs text-texto-3">
                              {nombreCuenta(r.codigo)}
                            </span>
                          </Td>
                          <Td numerico>{r.debito ? pesos(r.debito) : ''}</Td>
                          <Td numerico>{r.credito ? pesos(r.credito) : ''}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </Tabla>
                </Tarjeta>
              )}

              {liquidacion.avisos.map((a) => (
                <Llamado key={a} tono="info" icono={<Info size={18} />}>
                  {a}
                </Llamado>
              ))}

              <Boton
                tamano="lg"
                className="w-full"
                onClick={guardar}
                disabled={!terceroId || lineas.length === 0}
              >
                Guardar factura
              </Boton>
            </div>
          </div>
        </>
      )}

      <Tarjeta
        titulo={`Facturas emitidas y recibidas (${facturas.length})`}
        descripcion="Cada factura alimenta la cartera y la contabilidad."
      >
        {facturas.length === 0 ? (
          <Vacio titulo="Todavía no hay facturas">
            Las facturas que guarde aparecerán aquí y en los módulos de tesorería y contabilidad.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Número</Th>
                <Th>Fecha</Th>
                <Th>Tipo</Th>
                <Th>Tercero</Th>
                <Th numerico>Total</Th>
                <Th numerico>Retenciones</Th>
                <Th numerico>Neto</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {facturas.map((f) => {
                const l = liquidarFactura(f.lineas, f.condiciones, anio);
                const t = terceros.find((x) => x.id === f.terceroId);
                return (
                  <tr key={f.id}>
                    <Td className="font-mono text-xs">{f.numero}</Td>
                    <Td>{fechaCorta(f.fecha)}</Td>
                    <Td>
                      <Insignia tono={f.tipo === 'venta' ? 'marca' : 'info'}>{f.tipo}</Insignia>
                    </Td>
                    <Td>{t?.nombre ?? '—'}</Td>
                    <Td numerico>{pesos(l.totalFactura)}</Td>
                    <Td numerico>{pesos(l.totalRetenciones)}</Td>
                    <Td numerico className="font-medium">
                      {pesos(l.netoAPagar)}
                    </Td>
                    <Td>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label={`Eliminar la factura ${f.numero}`}
                        onClick={() => borrarFactura(f.id)}
                      >
                        <Trash2 size={14} />
                      </Boton>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
