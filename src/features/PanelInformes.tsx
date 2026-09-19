/**
 * Módulo «Informes»: estado de resultados, situación financiera y resumen
 * de impuestos del periodo, con exportación a CSV, JSON e impresión.
 *
 * La ecuación patrimonial solo cuadra si al patrimonio se le suma el
 * resultado del ejercicio, porque mientras no se haga el asiento de cierre
 * la utilidad vive en las cuentas de clase 4, 5 y 6.
 */
import { CheckCircle2, Printer, TriangleAlert } from 'lucide-react';

import { Boton, Dato, Insignia, Llamado, Tabla, Tarjeta, Td, Th, Vacio } from '../brand/ui';
import { CUENTAS } from '../domain/puc';
import { exportarCSV, exportarJSON, imprimir } from '../lib/exportar';
import { pesos, porcentaje } from '../lib/formato';
import { useEstado } from '../store';
import { BarraConfiguracion, useDerivados } from './Configuracion';

export function PanelInformes() {
  const { config, terceros, productos, facturas, pagos } = useEstado();
  const { anio, libro, balance, resultados, situacion, inventario } = useDerivados();

  const saldoDe = (codigo: string) => balance.filas.find((f) => f.codigo === codigo)?.saldo ?? 0;

  // La 2408 es de saldo neto: positivo significa impuesto a favor de la DIAN.
  const ivaNeto = saldoDe(CUENTAS.ivaPorPagar.codigo);
  const reteFuentePorPagar = saldoDe(CUENTAS.reteFuentePorPagar.codigo);
  const reteIVAPorPagar = saldoDe(CUENTAS.reteIVAPorPagar.codigo);
  const reteICAPorPagar = saldoDe(CUENTAS.reteICAPorPagar.codigo);
  const anticipos =
    saldoDe(CUENTAS.anticipoRenta.codigo) +
    saldoDe(CUENTAS.anticipoIVA.codigo) +
    saldoDe(CUENTAS.anticipoICA.codigo);

  const margenBruto = resultados.ingresos > 0 ? resultados.utilidadBruta / resultados.ingresos : 0;
  const margenNeto = resultados.ingresos > 0 ? resultados.utilidadNeta / resultados.ingresos : 0;

  function exportarTodo() {
    exportarJSON(
      {
        empresa: config.razonSocial,
        nit: config.nit,
        anio,
        generado: new Date().toISOString(),
        estadoDeResultados: resultados,
        situacionFinanciera: situacion,
        balanceDePrueba: balance.filas,
        inventario: inventario.filas,
        conteos: {
          terceros: terceros.length,
          productos: productos.length,
          facturas: facturas.length,
          pagos: pagos.length,
          comprobantes: libro.length,
        },
      },
      'informes',
    );
  }

  function exportarResultados() {
    exportarCSV(
      [
        ['Concepto', 'Valor'],
        ['Ingresos operacionales', resultados.ingresos],
        ['Costo de ventas', resultados.costos],
        ['Utilidad bruta', resultados.utilidadBruta],
        ['Gastos operacionales', resultados.gastos],
        ['Utilidad neta', resultados.utilidadNeta],
      ],
      'estado-de-resultados',
    );
  }

  if (libro.length === 0) {
    return (
      <div className="space-y-6">
        <BarraConfiguracion />
        <Vacio titulo="Todavía no hay información que informar">
          Registre documentos en los demás módulos y los informes se construirán solos.
        </Vacio>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">{config.razonSocial}</h2>
          <p className="text-sm text-texto-2">
            Informes del ejercicio {anio} · NIT {config.nit}
          </p>
        </div>
        <div className="no-imprimir flex gap-2">
          <Boton variante="secundario" tamano="sm" onClick={exportarTodo}>
            Exportar JSON
          </Boton>
          <Boton variante="secundario" tamano="sm" onClick={imprimir}>
            <Printer size={14} /> Imprimir
          </Boton>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato rotulo="Ingresos" valor={pesos(resultados.ingresos)} tono="marca" />
        <Dato
          rotulo="Utilidad bruta"
          valor={pesos(resultados.utilidadBruta)}
          detalle={`Margen ${porcentaje(margenBruto)}`}
        />
        <Dato
          rotulo="Utilidad neta"
          valor={pesos(resultados.utilidadNeta)}
          detalle={`Margen ${porcentaje(margenNeto)}`}
          tono={resultados.utilidadNeta >= 0 ? 'ok' : 'riesgo'}
        />
        <Dato rotulo="Valor del inventario" valor={pesos(inventario.total)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta
          titulo="Estado de resultados"
          descripcion={`Del 1 de enero al 31 de diciembre de ${anio}.`}
          acciones={
            <Boton variante="secundario" tamano="sm" onClick={exportarResultados}>
              Exportar CSV
            </Boton>
          }
        >
          <Tabla>
            <tbody>
              <tr>
                <Td>Ingresos operacionales</Td>
                <Td numerico>{pesos(resultados.ingresos)}</Td>
              </tr>
              <tr>
                <Td>Costo de ventas</Td>
                <Td numerico>−{pesos(resultados.costos)}</Td>
              </tr>
              <tr className="bg-superficie-2">
                <Td className="font-display font-semibold">Utilidad bruta</Td>
                <Td numerico className="font-semibold">
                  {pesos(resultados.utilidadBruta)}
                </Td>
              </tr>
              <tr>
                <Td>Gastos operacionales</Td>
                <Td numerico>−{pesos(resultados.gastos)}</Td>
              </tr>
              <tr className="bg-superficie-2">
                <Td className="font-display font-semibold">Utilidad neta del ejercicio</Td>
                <Td numerico className="font-semibold">
                  {pesos(resultados.utilidadNeta)}
                </Td>
              </tr>
            </tbody>
          </Tabla>
        </Tarjeta>

        <Tarjeta
          titulo="Estado de situación financiera"
          descripcion={`Al ${config.fecha}.`}
          acciones={
            <Insignia tono={situacion.cuadra ? 'ok' : 'riesgo'}>
              {situacion.cuadra ? 'Ecuación cuadrada' : 'Descuadrada'}
            </Insignia>
          }
        >
          <Tabla>
            <tbody>
              <tr>
                <Td className="font-display font-semibold">Activo</Td>
                <Td numerico className="font-semibold">
                  {pesos(situacion.activo)}
                </Td>
              </tr>
              <tr>
                <Td>Pasivo</Td>
                <Td numerico>{pesos(situacion.pasivo)}</Td>
              </tr>
              <tr>
                <Td>Patrimonio aportado</Td>
                <Td numerico>{pesos(situacion.patrimonio)}</Td>
              </tr>
              <tr>
                <Td>Resultado del ejercicio</Td>
                <Td numerico>{pesos(resultados.utilidadNeta)}</Td>
              </tr>
              <tr className="bg-superficie-2">
                <Td className="font-display font-semibold">Pasivo + patrimonio</Td>
                <Td numerico className="font-semibold">
                  {pesos(situacion.pasivo + situacion.patrimonioTotal)}
                </Td>
              </tr>
            </tbody>
          </Tabla>

          {situacion.cuadra ? (
            <Llamado tono="ok" icono={<CheckCircle2 size={18} />} className="mt-4">
              El activo es igual al pasivo más el patrimonio, incluido el resultado del periodo.
            </Llamado>
          ) : (
            <Llamado tono="riesgo" icono={<TriangleAlert size={18} />} className="mt-4">
              La ecuación presenta una diferencia de {pesos(situacion.diferencia)}. Revise los
              comprobantes descuadrados en el módulo de contabilidad.
            </Llamado>
          )}
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Resumen de impuestos del periodo"
        descripcion="Saldos que determinan las declaraciones de IVA y de retenciones."
      >
        <Tabla>
          <thead>
            <tr>
              <Th>Concepto</Th>
              <Th>Cuenta</Th>
              <Th numerico>Saldo</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>
                IVA por pagar (generado menos descontable)
                <span className="block text-xs text-texto-3">
                  Saldo neto de la cuenta 2408 del PUC
                </span>
              </Td>
              <Td className="font-mono text-xs">{CUENTAS.ivaPorPagar.codigo}</Td>
              <Td numerico className="font-medium">
                {pesos(ivaNeto)}
              </Td>
            </tr>
            <tr>
              <Td>Retención en la fuente practicada a terceros</Td>
              <Td className="font-mono text-xs">{CUENTAS.reteFuentePorPagar.codigo}</Td>
              <Td numerico>{pesos(reteFuentePorPagar)}</Td>
            </tr>
            <tr>
              <Td>Retención de IVA practicada</Td>
              <Td className="font-mono text-xs">{CUENTAS.reteIVAPorPagar.codigo}</Td>
              <Td numerico>{pesos(reteIVAPorPagar)}</Td>
            </tr>
            <tr>
              <Td>Retención de ICA practicada</Td>
              <Td className="font-mono text-xs">{CUENTAS.reteICAPorPagar.codigo}</Td>
              <Td numerico>{pesos(reteICAPorPagar)}</Td>
            </tr>
            <tr>
              <Td>
                Anticipos a favor
                <span className="block text-xs text-texto-3">
                  Retenciones que otros practicaron a la empresa
                </span>
              </Td>
              <Td className="font-mono text-xs">1355</Td>
              <Td numerico>{pesos(anticipos)}</Td>
            </tr>
          </tbody>
        </Tabla>
      </Tarjeta>
    </div>
  );
}
