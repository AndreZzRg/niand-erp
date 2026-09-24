/**
 * Barra de contexto común a todos los módulos y derivaciones compartidas.
 *
 * El resumen —razón social, año fiscal y tarifa de ICA— queda siempre a la
 * vista porque determina cada cifra que se muestra; el formulario que lo
 * edita se pliega, porque se toca una vez y después solo ocupa la primera
 * pantalla de cada módulo.
 */
import { useMemo, useState } from 'react';
import { Building2, ChevronDown, CircleAlert, Database, RotateCcw, Settings2 } from 'lucide-react';

import { Boton, Campo, Entrada, Insignia, Llamado, cx } from '../brand/ui';
import { parametrosDe } from '../domain/parametros';
import { libroDiario } from '../domain/comprobantes';
import { balanceDePrueba, estadoDeResultados, situacionFinanciera } from '../domain/contabilidad';
import { valorizacion } from '../domain/inventario';
import { numero, pesos } from '../lib/formato';
import { anioDe, useEstado } from '../store';

/** Año fiscal y parámetros vigentes según la fecha de trabajo. */
export function useParametrosEfectivos() {
  const fecha = useEstado((s) => s.config.fecha);
  const anio = anioDe(fecha);
  return { anio, base: parametrosDe(anio) };
}

/**
 * Todo lo que se deriva de los documentos: libro diario, balance, estados
 * financieros y valorización del inventario. Se calcula en un único lugar
 * para que los módulos no puedan mostrar cifras que se contradigan.
 */
export function useDerivados() {
  const { config, facturas, pagos, movimientos, productos } = useEstado();
  const { anio } = useParametrosEfectivos();

  return useMemo(() => {
    const libro = libroDiario({
      facturas,
      pagos,
      movimientos,
      capitalInicial: config.capitalInicial,
      fechaCapital: `${anio}-01-01`,
      anio,
    });

    return {
      anio,
      libro,
      balance: balanceDePrueba(libro),
      resultados: estadoDeResultados(libro),
      situacion: situacionFinanciera(libro),
      inventario: valorizacion(
        movimientos,
        productos.map((p) => p.id),
      ),
    };
  }, [facturas, pagos, movimientos, productos, config.capitalInicial, anio]);
}

/**
 * Barra de contexto. Va plegada por omisión: estos parámetros se fijan una
 * vez y luego estorban, pero el resumen debe quedar siempre visible porque
 * determina cada cifra que el módulo muestra.
 */
export function BarraConfiguracion() {
  const { config, setConfig, reiniciar, cargarEjemplo } = useEstado();
  const { anio, base } = useParametrosEfectivos();
  const [abierta, setAbierta] = useState(false);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-borde bg-superficie shadow-ni-1">
        {/* Resumen siempre visible */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-marca-tenue text-marca">
            <Building2 size={16} />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{config.razonSocial}</p>
            <p className="truncate text-xs text-texto-3">
              NIT {config.nit} · Año fiscal {anio} · ICA {numero(config.tarifaICAPorMil, 2)} por mil
            </p>
          </div>

          {!base.verificado && (
            <Insignia tono="alerta">
              <CircleAlert size={11} /> UVT {anio} sin confirmar
            </Insignia>
          )}

          <div className="flex shrink-0 items-center gap-2">
            <Boton variante="secundario" tamano="sm" onClick={cargarEjemplo}>
              <Database size={14} /> Cargar ejemplo
            </Boton>
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setAbierta((v) => !v)}
              aria-expanded={abierta}
            >
              <Settings2 size={14} /> Parámetros
              <ChevronDown
                size={14}
                className={cx('transition-transform', abierta && 'rotate-180')}
              />
            </Boton>
          </div>
        </div>

        {/* Detalle plegable */}
        {abierta && (
          <div className="border-t border-borde bg-superficie-3 px-4 py-4">
            {!base.verificado && (
              <Llamado
                tono="alerta"
                titulo={`Los parámetros tributarios de ${anio} no están confirmados`}
                icono={<CircleAlert size={18} />}
                className="mb-4"
              >
                <p>
                  {base.fuente} Mientras tanto se usa una UVT de <strong>{pesos(base.uvt)}</strong>,
                  que determina las cuantías mínimas de retención. Verifique la resolución antes de
                  usar el resultado en una decisión real.
                </p>
              </Llamado>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Campo etiqueta="Razón social">
                {(id) => (
                  <Entrada
                    id={id}
                    value={config.razonSocial}
                    onChange={(e) => setConfig({ razonSocial: e.target.value })}
                  />
                )}
              </Campo>

              <Campo etiqueta="Fecha de trabajo" ayuda={`Año fiscal ${anio}.`}>
                {(id) => (
                  <Entrada
                    id={id}
                    type="date"
                    value={config.fecha}
                    onChange={(e) => setConfig({ fecha: e.target.value })}
                  />
                )}
              </Campo>

              <Campo etiqueta="Tarifa de ICA (por mil)" ayuda="La fija el acuerdo municipal.">
                {(id) => (
                  <Entrada
                    id={id}
                    type="number"
                    min={0}
                    step={0.01}
                    value={config.tarifaICAPorMil}
                    onChange={(e) => setConfig({ tarifaICAPorMil: Number(e.target.value) })}
                  />
                )}
              </Campo>

              <Campo etiqueta="Capital inicial" ayuda="Aporte con el que arranca el libro.">
                {(id) => (
                  <Entrada
                    id={id}
                    type="number"
                    min={0}
                    step={100_000}
                    value={config.capitalInicial}
                    onChange={(e) => setConfig({ capitalInicial: Number(e.target.value) })}
                  />
                )}
              </Campo>
            </div>

            <div className="mt-4 flex justify-end">
              <Boton variante="fantasma" tamano="sm" onClick={reiniciar}>
                <RotateCcw size={14} /> Reiniciar todo
              </Boton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
