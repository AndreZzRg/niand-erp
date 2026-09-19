/**
 * Módulo «Tesorería y cartera»: saldos de efectivo, cuentas por cobrar y por
 * pagar con su edad, y registro de recaudos y pagos. La edad de la cartera
 * se mide contra el plazo pactado, no contra la fecha de la factura.
 */
import { useMemo, useState } from 'react';
import { Banknote, Trash2 } from 'lucide-react';

import {
  Boton,
  Campo,
  Dato,
  Entrada,
  Insignia,
  Seleccion,
  Tabla,
  Tarjeta,
  Td,
  Th,
  Vacio,
  type Tono,
} from '../brand/ui';
import { cartera, type MedioPago, type TipoFactura } from '../domain/comprobantes';
import { CUENTAS } from '../domain/puc';
import { exportarCSV } from '../lib/exportar';
import { fechaCorta, numero, pesos } from '../lib/formato';
import { nuevoId, useEstado } from '../store';
import { BarraConfiguracion, useDerivados } from './Configuracion';

/** Franja de antigüedad de un saldo, en días vencidos. */
function franja(dias: number): { rotulo: string; tono: Tono } {
  if (dias < 0) return { rotulo: 'Al día', tono: 'ok' };
  if (dias <= 30) return { rotulo: '1 a 30 días', tono: 'alerta' };
  if (dias <= 60) return { rotulo: '31 a 60 días', tono: 'alerta' };
  if (dias <= 90) return { rotulo: '61 a 90 días', tono: 'riesgo' };
  return { rotulo: 'Más de 90 días', tono: 'riesgo' };
}

export function PanelTesoreria() {
  const { config, terceros, facturas, pagos, agregarPago, borrarPago } = useEstado();
  const { balance } = useDerivados();

  const [tipo, setTipo] = useState<TipoFactura>('venta');
  const [facturaId, setFacturaId] = useState('');
  const [valor, setValor] = useState(0);
  const [medio, setMedio] = useState<MedioPago>('bancos');
  const [fecha, setFecha] = useState(config.fecha);

  const porCobrar = useMemo(
    () => cartera(facturas, pagos, 'venta', config.fecha, config.plazoCartera),
    [facturas, pagos, config.fecha, config.plazoCartera],
  );
  const porPagar = useMemo(
    () => cartera(facturas, pagos, 'compra', config.fecha, config.plazoCartera),
    [facturas, pagos, config.fecha, config.plazoCartera],
  );

  const saldoDe = (codigo: string) => balance.filas.find((f) => f.codigo === codigo)?.saldo ?? 0;

  const caja = saldoDe(CUENTAS.caja.codigo);
  const bancos = saldoDe(CUENTAS.bancos.codigo);

  const totalPorCobrar = porCobrar.reduce((s, c) => s + c.saldo, 0);
  const totalPorPagar = porPagar.reduce((s, c) => s + c.saldo, 0);

  const pendientes = (tipo === 'venta' ? porCobrar : porPagar).map((c) => c.factura);

  function registrar() {
    const destino = facturaId || pendientes[0]?.id;
    if (!destino || valor <= 0) return;
    agregarPago({
      id: nuevoId('pag'),
      fecha,
      facturaId: destino,
      valor,
      medio,
      nota: '',
    });
    setValor(0);
  }

  function exportar(filas: typeof porCobrar, sufijo: string) {
    exportarCSV(
      [
        ['Factura', 'Fecha', 'Tercero', 'Total', 'Abonado', 'Saldo', 'Días vencido'],
        ...filas.map((c) => [
          c.factura.numero,
          c.factura.fecha,
          terceros.find((t) => t.id === c.factura.terceroId)?.nombre ?? '',
          c.total,
          c.abonado,
          c.saldo,
          c.diasVencido,
        ]),
      ],
      sufijo,
    );
  }

  function tablaCartera(filas: typeof porCobrar, vacio: string) {
    if (filas.length === 0) return <Vacio titulo={vacio} />;
    return (
      <Tabla>
        <thead>
          <tr>
            <Th>Factura</Th>
            <Th>Tercero</Th>
            <Th numerico>Total</Th>
            <Th numerico>Abonado</Th>
            <Th numerico>Saldo</Th>
            <Th>Antigüedad</Th>
          </tr>
        </thead>
        <tbody>
          {filas.map((c) => {
            const f = franja(c.diasVencido);
            return (
              <tr key={c.factura.id}>
                <Td>
                  <span className="font-mono text-xs">{c.factura.numero}</span>
                  <span className="block text-xs text-texto-3">{fechaCorta(c.factura.fecha)}</span>
                </Td>
                <Td>{terceros.find((t) => t.id === c.factura.terceroId)?.nombre ?? '—'}</Td>
                <Td numerico>{pesos(c.total)}</Td>
                <Td numerico>{pesos(c.abonado)}</Td>
                <Td numerico className="font-medium">
                  {pesos(c.saldo)}
                </Td>
                <Td>
                  <Insignia tono={f.tono}>{f.rotulo}</Insignia>
                  {c.diasVencido > 0 && (
                    <span className="block text-xs text-texto-3">
                      {numero(c.diasVencido, 0)} días
                    </span>
                  )}
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Tabla>
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato rotulo="Caja" valor={pesos(caja)} />
        <Dato rotulo="Bancos" valor={pesos(bancos)} tono="marca" />
        <Dato
          rotulo="Cuentas por cobrar"
          valor={pesos(totalPorCobrar)}
          detalle={`${porCobrar.length} factura(s)`}
          tono="ok"
        />
        <Dato
          rotulo="Cuentas por pagar"
          valor={pesos(totalPorPagar)}
          detalle={`${porPagar.length} factura(s)`}
          tono="riesgo"
        />
      </div>

      <Tarjeta
        titulo="Registrar recaudo o pago"
        descripcion="El abono se aplica a una factura con saldo pendiente."
      >
        {pendientes.length === 0 ? (
          <Vacio titulo="No hay facturas con saldo de este tipo">
            Emita una factura o cambie el tipo de documento.
          </Vacio>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Campo etiqueta="Tipo">
                {(id) => (
                  <Seleccion
                    id={id}
                    value={tipo}
                    onChange={(e) => {
                      setTipo(e.target.value as TipoFactura);
                      setFacturaId('');
                    }}
                  >
                    <option value="venta">Recaudo de cliente</option>
                    <option value="compra">Pago a proveedor</option>
                  </Seleccion>
                )}
              </Campo>

              <Campo etiqueta="Factura">
                {(id) => (
                  <Seleccion
                    id={id}
                    value={facturaId || (pendientes.at(0)?.id ?? '')}
                    onChange={(e) => setFacturaId(e.target.value)}
                  >
                    {pendientes.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.numero}
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
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                  />
                )}
              </Campo>

              <Campo etiqueta="Valor" requerido>
                {(id) => (
                  <Entrada
                    id={id}
                    type="number"
                    min={0}
                    step={1000}
                    value={valor}
                    onChange={(e) => setValor(Number(e.target.value))}
                  />
                )}
              </Campo>

              <Campo etiqueta="Medio">
                {(id) => (
                  <Seleccion
                    id={id}
                    value={medio}
                    onChange={(e) => setMedio(e.target.value as MedioPago)}
                  >
                    <option value="bancos">Bancos</option>
                    <option value="caja">Caja</option>
                  </Seleccion>
                )}
              </Campo>
            </div>

            <Boton className="mt-4" onClick={registrar} disabled={valor <= 0}>
              <Banknote size={16} /> Registrar movimiento
            </Boton>
          </>
        )}
      </Tarjeta>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta
          titulo="Cartera por cobrar"
          descripcion={`Plazo pactado: ${config.plazoCartera} días.`}
          acciones={
            porCobrar.length > 0 && (
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => exportar(porCobrar, 'cartera')}
              >
                Exportar CSV
              </Boton>
            )
          }
        >
          {tablaCartera(porCobrar, 'No hay cartera pendiente')}
        </Tarjeta>

        <Tarjeta
          titulo="Cuentas por pagar"
          descripcion="Obligaciones con proveedores pendientes de pago."
          acciones={
            porPagar.length > 0 && (
              <Boton
                variante="secundario"
                tamano="sm"
                onClick={() => exportar(porPagar, 'cuentas-por-pagar')}
              >
                Exportar CSV
              </Boton>
            )
          }
        >
          {tablaCartera(porPagar, 'No hay obligaciones pendientes')}
        </Tarjeta>
      </div>

      <Tarjeta titulo={`Movimientos de tesorería (${pagos.length})`}>
        {pagos.length === 0 ? (
          <Vacio titulo="Todavía no hay recaudos ni pagos" />
        ) : (
          <Tabla>
            <thead>
              <tr>
                <Th>Fecha</Th>
                <Th>Factura</Th>
                <Th>Medio</Th>
                <Th numerico>Valor</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {[...pagos]
                .sort((a, b) => b.fecha.localeCompare(a.fecha))
                .map((p) => (
                  <tr key={p.id}>
                    <Td>{fechaCorta(p.fecha)}</Td>
                    <Td className="font-mono text-xs">
                      {facturas.find((f) => f.id === p.facturaId)?.numero ?? '—'}
                    </Td>
                    <Td>
                      <Insignia tono="neutro">{p.medio}</Insignia>
                    </Td>
                    <Td numerico className="font-medium">
                      {pesos(p.valor)}
                    </Td>
                    <Td>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        aria-label="Eliminar el movimiento"
                        onClick={() => borrarPago(p.id)}
                      >
                        <Trash2 size={14} />
                      </Boton>
                    </Td>
                  </tr>
                ))}
            </tbody>
          </Tabla>
        )}
      </Tarjeta>
    </div>
  );
}
