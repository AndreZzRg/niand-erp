/**
 * Módulo «Contabilidad»: libro diario, libro mayor y balance de prueba.
 *
 * Los comprobantes no se guardan: se derivan de los documentos en cada
 * render. Si un asiento no cuadra, la interfaz lo señala en vez de ajustarlo
 * en silencio, porque un descuadre es un defecto de los datos de origen.
 */
import { useState } from 'react';
import { CheckCircle2, TriangleAlert } from 'lucide-react';

import { Boton, Dato, Insignia, Llamado, Tabla, Tarjeta, Td, Th, Vacio } from '../brand/ui';
import { asientoDeCierre, estaCuadrado, descuadre } from '../domain/contabilidad';
import { CLASES, claseDe, nombreCuenta } from '../domain/puc';
import { exportarCSV } from '../lib/exportar';
import { fechaCorta, pesos } from '../lib/formato';
import { useEstado } from '../store';
import { BarraConfiguracion, useDerivados } from './Configuracion';

export function PanelContabilidad() {
  const fecha = useEstado((s) => s.config.fecha);
  const { libro, balance, resultados } = useDerivados();
  const [verCierre, setVerCierre] = useState(false);

  const cierre = asientoDeCierre(libro, `${fecha.slice(0, 4)}-12-31`);
  const descuadrados = libro.filter((a) => !estaCuadrado(a));

  function exportarBalance() {
    exportarCSV(
      [
        ['Código', 'Cuenta', 'Débitos', 'Créditos', 'Saldo', 'Naturaleza'],
        ...balance.filas.map((f) => [
          f.codigo,
          f.nombre,
          f.debitos,
          f.creditos,
          f.saldo,
          f.naturaleza,
        ]),
        ['', 'TOTALES', balance.totalDebitos, balance.totalCreditos, '', ''],
      ],
      'balance-de-prueba',
    );
  }

  function exportarDiario() {
    exportarCSV(
      [
        ['Fecha', 'Documento', 'Concepto', 'Código', 'Cuenta', 'Débito', 'Crédito'],
        ...libro.flatMap((a) =>
          a.renglones.map((r) => [
            a.fecha,
            a.documento,
            a.concepto,
            r.codigo,
            nombreCuenta(r.codigo),
            r.debito,
            r.credito,
          ]),
        ),
      ],
      'libro-diario',
    );
  }

  if (libro.length === 0) {
    return (
      <div className="space-y-6">
        <BarraConfiguracion />
        <Vacio titulo="No hay nada que contabilizar todavía">
          Registre facturas, pagos o un capital inicial y los comprobantes aparecerán aquí.
        </Vacio>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BarraConfiguracion />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Dato rotulo="Comprobantes" valor={String(libro.length)} />
        <Dato rotulo="Total débitos" valor={pesos(balance.totalDebitos)} />
        <Dato rotulo="Total créditos" valor={pesos(balance.totalCreditos)} />
        <Dato
          rotulo="Utilidad del ejercicio"
          valor={pesos(resultados.utilidadNeta)}
          tono={resultados.utilidadNeta >= 0 ? 'ok' : 'riesgo'}
        />
      </div>

      {balance.cuadra && descuadrados.length === 0 ? (
        <Llamado tono="ok" titulo="La contabilidad cuadra" icono={<CheckCircle2 size={18} />}>
          <p>
            La suma de los débitos es igual a la de los créditos en los {libro.length} comprobantes
            del periodo.
          </p>
        </Llamado>
      ) : (
        <Llamado
          tono="riesgo"
          titulo="Hay comprobantes descuadrados"
          icono={<TriangleAlert size={18} />}
        >
          <p>
            {descuadrados.length} comprobante(s) no cuadran. Revise los documentos de origen: el
            motor no ajusta diferencias por su cuenta.
          </p>
        </Llamado>
      )}

      <Tarjeta
        titulo="Balance de prueba"
        descripcion="Movimientos y saldo de cada cuenta del periodo."
        acciones={
          <Boton variante="secundario" tamano="sm" onClick={exportarBalance}>
            Exportar CSV
          </Boton>
        }
      >
        <Tabla>
          <thead>
            <tr>
              <Th>Código</Th>
              <Th>Cuenta</Th>
              <Th>Clase</Th>
              <Th numerico>Débitos</Th>
              <Th numerico>Créditos</Th>
              <Th numerico>Saldo</Th>
            </tr>
          </thead>
          <tbody>
            {balance.filas.map((f) => (
              <tr key={f.codigo}>
                <Td className="font-mono text-xs">{f.codigo}</Td>
                <Td>{f.nombre}</Td>
                <Td>
                  <Insignia tono="neutro">{CLASES[claseDe(f.codigo)].nombre}</Insignia>
                </Td>
                <Td numerico>{f.debitos ? pesos(f.debitos) : ''}</Td>
                <Td numerico>{f.creditos ? pesos(f.creditos) : ''}</Td>
                <Td numerico className="font-medium">
                  {pesos(f.saldo)}
                </Td>
              </tr>
            ))}
            <tr className="bg-superficie-2">
              <Td />
              <Td className="font-display font-semibold">Totales</Td>
              <Td />
              <Td numerico className="font-semibold">
                {pesos(balance.totalDebitos)}
              </Td>
              <Td numerico className="font-semibold">
                {pesos(balance.totalCreditos)}
              </Td>
              <Td numerico>
                <Insignia tono={balance.cuadra ? 'ok' : 'riesgo'}>
                  {balance.cuadra ? 'Cuadra' : 'Descuadrado'}
                </Insignia>
              </Td>
            </tr>
          </tbody>
        </Tabla>
      </Tarjeta>

      <Tarjeta
        titulo="Libro diario"
        descripcion="Cada comprobante con sus renglones, en orden cronológico."
        acciones={
          <>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => setVerCierre((v) => !v)}
              disabled={!cierre}
            >
              {verCierre ? 'Ocultar cierre' : 'Ver asiento de cierre'}
            </Boton>
            <Boton variante="secundario" tamano="sm" onClick={exportarDiario}>
              Exportar CSV
            </Boton>
          </>
        }
      >
        <div className="space-y-5">
          {[...libro, ...(verCierre && cierre ? [cierre] : [])].map((a) => (
            <div key={a.id} className="rounded-xl border border-borde">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borde bg-superficie-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold">
                    {a.documento} · {a.concepto}
                  </p>
                  <p className="text-xs text-texto-3">{fechaCorta(a.fecha)}</p>
                </div>
                <Insignia tono={estaCuadrado(a) ? 'ok' : 'riesgo'}>
                  {estaCuadrado(a) ? 'Cuadra' : `Descuadre ${pesos(descuadre(a))}`}
                </Insignia>
              </div>
              <div className="px-4 py-1">
                <Tabla>
                  <thead>
                    <tr>
                      <Th>Cuenta</Th>
                      <Th numerico>Débito</Th>
                      <Th numerico>Crédito</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.renglones.map((r, i) => (
                      <tr key={`${r.codigo}-${i}`}>
                        <Td>
                          <span className="font-mono text-xs">{r.codigo}</span>{' '}
                          {nombreCuenta(r.codigo)}
                          {r.detalle && (
                            <span className="block text-xs text-texto-3">{r.detalle}</span>
                          )}
                        </Td>
                        <Td numerico>{r.debito ? pesos(r.debito) : ''}</Td>
                        <Td numerico>{r.credito ? pesos(r.credito) : ''}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Tabla>
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>
    </div>
  );
}
