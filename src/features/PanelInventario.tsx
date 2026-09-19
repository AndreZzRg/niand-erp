/**
 * Módulo «Productos e inventario»: catálogo, movimientos y kardex valorado
 * al costo promedio ponderado. El kardex se recalcula siempre desde los
 * movimientos: no hay saldos guardados que puedan quedar desfasados.
 */
import { useMemo, useState } from 'react';
import { PackagePlus, Trash2, TriangleAlert } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Llamado,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
} from '../brand/ui';
import { IVA, type TarifaIVA } from '../domain/parametros';
import { kardexDe, type TipoMovimiento } from '../domain/inventario';
import { exportarCSV } from '../lib/exportar';
import { fechaCorta, numero, pesos } from '../lib/formato';
import { nuevoId, useEstado, type Producto } from '../store';
import { BarraConfiguracion, useDerivados } from './Configuracion';

const TIPOS_MOV: ReadonlyArray<{ id: TipoMovimiento; rotulo: string }> = [
  { id: 'entrada', rotulo: 'Entrada (compra)' },
  { id: 'salida', rotulo: 'Salida (venta o baja)' },
  { id: 'ajuste', rotulo: 'Ajuste por conteo físico' },
];

export function PanelInventario() {
  const { config, productos, movimientos, agregarProducto, borrarProducto, agregarMovimiento } =
    useEstado();
  const { inventario } = useDerivados();

  const [prod, setProd] = useState({
    codigo: '',
    nombre: '',
    unidad: 'unidad',
    precioVenta: 0,
    tarifaIVA: 'general' as TarifaIVA,
    stockMinimo: 0,
  });

  const [mov, setMov] = useState({
    productoId: '',
    tipo: 'entrada' as TipoMovimiento,
    cantidad: 0,
    costoUnitario: 0,
    fecha: config.fecha,
    nota: '',
  });

  const [verKardexDe, setVerKardexDe] = useState<string>('');

  const productoSeleccionado = verKardexDe || productos[0]?.id || '';
  const kardex = useMemo(
    () => (productoSeleccionado ? kardexDe(movimientos, productoSeleccionado) : null),
    [movimientos, productoSeleccionado],
  );

  const bajoMinimo = inventario.filas.filter((f) => {
    const p = productos.find((x) => x.id === f.productoId);
    return p && p.stockMinimo > 0 && f.cantidad < p.stockMinimo;
  });

  function guardarProducto() {
    if (!prod.codigo.trim() || !prod.nombre.trim()) return;
    const p: Producto = {
      id: nuevoId('pro'),
      codigo: prod.codigo.trim(),
      nombre: prod.nombre.trim(),
      unidad: prod.unidad.trim() || 'unidad',
      precioVenta: prod.precioVenta,
      tarifaIVA: prod.tarifaIVA,
      stockMinimo: prod.stockMinimo,
    };
    agregarProducto(p);
    setProd({ ...prod, codigo: '', nombre: '', precioVenta: 0, stockMinimo: 0 });
  }

  function guardarMovimiento() {
    const productoId = mov.productoId || productos[0]?.id;
    if (!productoId || mov.cantidad === 0) return;
    agregarMovimiento({
      id: nuevoId('mov'),
      fecha: mov.fecha,
      productoId,
      tipo: mov.tipo,
      cantidad: Math.abs(mov.cantidad),
      costoUnitario: mov.tipo === 'entrada' ? mov.costoUnitario : 0,
      nota: mov.nota.trim(),
    });
    setMov({ ...mov, cantidad: 0, costoUnitario: 0, nota: '' });
  }

  function exportar() {
    exportarCSV(
      [
        ['Código', 'Producto', 'Unidad', 'Existencia', 'Costo promedio', 'Valor'],
        ...inventario.filas.map((f) => {
          const p = productos.find((x) => x.id === f.productoId);
          return [
            p?.codigo ?? '',
            p?.nombre ?? '',
            p?.unidad ?? '',
            f.cantidad,
            f.costoPromedio,
            f.valor,
          ];
        }),
      ],
      'inventario',
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-3">
        <Dato rotulo="Productos en catálogo" valor={numero(productos.length, 0)} />
        <Dato
          rotulo="Valor del inventario"
          valor={pesos(inventario.total)}
          detalle="Al costo promedio ponderado"
          tono="marca"
        />
        <Dato
          rotulo="Productos bajo mínimo"
          valor={numero(bajoMinimo.length, 0)}
          tono={bajoMinimo.length > 0 ? 'alerta' : 'ok'}
        />
      </div>

      {bajoMinimo.length > 0 && (
        <Llamado
          tono="alerta"
          titulo="Existencias por debajo del mínimo"
          icono={<TriangleAlert size={18} />}
        >
          <p>
            {bajoMinimo
              .map((f) => productos.find((p) => p.id === f.productoId)?.nombre ?? f.productoId)
              .join(', ')}
            . Reponga antes de comprometer nuevas ventas.
          </p>
        </Llamado>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta titulo="Nuevo producto" descripcion="El precio de venta alimenta la facturación.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Código" requerido>
              {(id) => (
                <Entrada
                  id={id}
                  value={prod.codigo}
                  onChange={(e) => setProd({ ...prod, codigo: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Nombre" requerido>
              {(id) => (
                <Entrada
                  id={id}
                  value={prod.nombre}
                  onChange={(e) => setProd({ ...prod, nombre: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Unidad de medida">
              {(id) => (
                <Entrada
                  id={id}
                  value={prod.unidad}
                  onChange={(e) => setProd({ ...prod, unidad: e.target.value })}
                />
              )}
            </Campo>
            <Campo etiqueta="Precio de venta">
              {(id) => (
                <Entrada
                  id={id}
                  type="number"
                  min={0}
                  step={100}
                  value={prod.precioVenta}
                  onChange={(e) => setProd({ ...prod, precioVenta: Number(e.target.value) })}
                />
              )}
            </Campo>
            <Campo etiqueta="Tarifa de IVA">
              {(id) => (
                <Seleccion
                  id={id}
                  value={prod.tarifaIVA}
                  onChange={(e) => setProd({ ...prod, tarifaIVA: e.target.value as TarifaIVA })}
                >
                  {(Object.keys(IVA) as TarifaIVA[]).map((t) => (
                    <option key={t} value={t}>
                      {IVA[t].rotulo}
                    </option>
                  ))}
                </Seleccion>
              )}
            </Campo>
            <Campo etiqueta="Existencia mínima" ayuda="Cero desactiva la alerta.">
              {(id) => (
                <Entrada
                  id={id}
                  type="number"
                  min={0}
                  value={prod.stockMinimo}
                  onChange={(e) => setProd({ ...prod, stockMinimo: Number(e.target.value) })}
                />
              )}
            </Campo>
          </div>
          <Boton
            className="mt-4"
            onClick={guardarProducto}
            disabled={!prod.codigo.trim() || !prod.nombre.trim()}
          >
            <PackagePlus size={16} /> Agregar producto
          </Boton>
        </Tarjeta>

        <Tarjeta
          titulo="Registrar movimiento"
          descripcion="Solo las entradas llevan costo: las salidas se valoran al promedio vigente."
        >
          {productos.length === 0 ? (
            <Vacio titulo="Primero registre un producto">
              Los movimientos siempre se asocian a un producto del catálogo.
            </Vacio>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Producto">
                  {(id) => (
                    <Seleccion
                      id={id}
                      value={mov.productoId || (productos.at(0)?.id ?? '')}
                      onChange={(e) => setMov({ ...mov, productoId: e.target.value })}
                    >
                      {productos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} · {p.nombre}
                        </option>
                      ))}
                    </Seleccion>
                  )}
                </Campo>
                <Campo etiqueta="Tipo">
                  {(id) => (
                    <Seleccion
                      id={id}
                      value={mov.tipo}
                      onChange={(e) => setMov({ ...mov, tipo: e.target.value as TipoMovimiento })}
                    >
                      {TIPOS_MOV.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.rotulo}
                        </option>
                      ))}
                    </Seleccion>
                  )}
                </Campo>
                <Campo etiqueta="Fecha">
                  {(id) => (
                    <Entrada
                      id={id}
                      type="date"
                      value={mov.fecha}
                      onChange={(e) => setMov({ ...mov, fecha: e.target.value })}
                    />
                  )}
                </Campo>
                <Campo
                  etiqueta={mov.tipo === 'ajuste' ? 'Existencia contada' : 'Cantidad'}
                  requerido
                >
                  {(id) => (
                    <Entrada
                      id={id}
                      type="number"
                      min={0}
                      value={mov.cantidad}
                      onChange={(e) => setMov({ ...mov, cantidad: Number(e.target.value) })}
                    />
                  )}
                </Campo>
                {mov.tipo === 'entrada' && (
                  <Campo etiqueta="Costo unitario" requerido>
                    {(id) => (
                      <Entrada
                        id={id}
                        type="number"
                        min={0}
                        step={100}
                        value={mov.costoUnitario}
                        onChange={(e) => setMov({ ...mov, costoUnitario: Number(e.target.value) })}
                      />
                    )}
                  </Campo>
                )}
                <Campo etiqueta="Nota">
                  {(id) => (
                    <Entrada
                      id={id}
                      value={mov.nota}
                      onChange={(e) => setMov({ ...mov, nota: e.target.value })}
                    />
                  )}
                </Campo>
              </div>
              <Boton className="mt-4" onClick={guardarMovimiento} disabled={mov.cantidad === 0}>
                Registrar movimiento
              </Boton>
            </>
          )}
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Valorización del inventario"
        descripcion="Existencia y costo de cada producto del catálogo."
        acciones={
          productos.length > 0 && (
            <Boton variante="secundario" tamano="sm" onClick={exportar}>
              Exportar CSV
            </Boton>
          )
        }
      >
        {productos.length === 0 ? (
          <Vacio titulo="El catálogo está vacío">
            Registre productos para llevar inventario y poder facturar.
          </Vacio>
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Código</Th>
                <Th>Producto</Th>
                <Th numerico>Existencia</Th>
                <Th numerico>Costo promedio</Th>
                <Th numerico>Valor</Th>
                <Th numerico>Precio de venta</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {inventario.filas.map((f) => {
                const p = productos.find((x) => x.id === f.productoId);
                if (!p) return null;
                const bajo = p.stockMinimo > 0 && f.cantidad < p.stockMinimo;
                return (
                  <tr key={f.productoId}>
                    <Td className="font-mono text-xs">{p.codigo}</Td>
                    <Td>
                      <span className="font-medium">{p.nombre}</span>
                      <span className="block text-xs text-texto-3">
                        {IVA[p.tarifaIVA].rotulo} · {p.unidad}
                      </span>
                    </Td>
                    <Td numerico>
                      <span className={bajo ? 'font-semibold text-alerta' : ''}>
                        {numero(f.cantidad, 2)}
                      </span>
                      {bajo && (
                        <Insignia tono="alerta" className="ml-2">
                          Bajo mínimo
                        </Insignia>
                      )}
                    </Td>
                    <Td numerico>{pesos(f.costoPromedio)}</Td>
                    <Td numerico className="font-medium">
                      {pesos(f.valor)}
                    </Td>
                    <Td numerico>{pesos(p.precioVenta)}</Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Boton variante="fantasma" tamano="sm" onClick={() => setVerKardexDe(p.id)}>
                          Kardex
                        </Boton>
                        <Boton
                          variante="fantasma"
                          tamano="sm"
                          aria-label={`Eliminar ${p.nombre}`}
                          onClick={() => borrarProducto(p.id)}
                        >
                          <Trash2 size={14} />
                        </Boton>
                      </div>
                    </Td>
                  </tr>
                );
              })}
              <tr className="bg-superficie-2">
                <Td className="font-display font-semibold" />
                <Td className="font-display font-semibold">Total</Td>
                <Td />
                <Td />
                <Td numerico className="font-semibold">
                  {pesos(inventario.total)}
                </Td>
                <Td />
                <Td />
              </tr>
            </tbody>
          </Tabla>
        )}
      </Tarjeta>

      {kardex && kardex.kardex.length > 0 && (
        <Tarjeta
          titulo={`Kardex · ${productos.find((p) => p.id === productoSeleccionado)?.nombre ?? ''}`}
          descripcion="Cada fila muestra el saldo después de aplicar el movimiento."
        >
          {kardex.avisos.map((a) => (
            <Llamado key={a} tono="alerta" icono={<TriangleAlert size={18} />} className="mb-4">
              {a}
            </Llamado>
          ))}
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Movimiento</Th>
                <Th numerico>Cantidad</Th>
                <Th numerico>Valor del movimiento</Th>
                <Th numerico>Saldo</Th>
                <Th numerico>Costo promedio</Th>
                <Th numerico>Valor del saldo</Th>
              </tr>
            </thead>
            <tbody>
              {kardex.kardex.map((c) => (
                <tr key={c.movimiento.id}>
                  <Td className="font-mono text-xs">{fechaCorta(c.movimiento.fecha)}</Td>
                  <Td>
                    <Insignia
                      tono={
                        c.movimiento.tipo === 'entrada'
                          ? 'ok'
                          : c.movimiento.tipo === 'salida'
                            ? 'info'
                            : 'alerta'
                      }
                    >
                      {c.movimiento.tipo}
                    </Insignia>
                    {c.movimiento.nota && (
                      <span className="block text-xs text-texto-3">{c.movimiento.nota}</span>
                    )}
                  </Td>
                  <Td numerico>{numero(c.movimiento.cantidad, 2)}</Td>
                  <Td numerico>{pesos(c.valorMovimiento)}</Td>
                  <Td numerico>{numero(c.saldoCantidad, 2)}</Td>
                  <Td numerico>{pesos(c.costoPromedio)}</Td>
                  <Td numerico className="font-medium">
                    {pesos(c.saldoValor)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Tabla>
        </Tarjeta>
      )}
    </div>
  );
}
