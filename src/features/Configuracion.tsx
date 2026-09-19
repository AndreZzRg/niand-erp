/**
 * Barra de configuración común a todos los módulos y derivaciones
 * compartidas. Los parámetros que aquí se fijan determinan el resultado de
 * cada cálculo, así que están siempre a la vista en lugar de escondidos en
 * un menú.
 */
import { useMemo } from 'react';
import { CircleAlert, Database, RotateCcw } from 'lucide-react';

import { Boton, Campo, Entrada, Llamado, Tarjeta } from '../brand/ui';
import { parametrosDe } from '../domain/parametros';
import { libroDiario } from '../domain/comprobantes';
import { balanceDePrueba, estadoDeResultados, situacionFinanciera } from '../domain/contabilidad';
import { valorizacion } from '../domain/inventario';
import { pesos } from '../lib/formato';
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

export function BarraConfiguracion() {
  const { config, setConfig, reiniciar, cargarEjemplo } = useEstado();
  const { anio, base } = useParametrosEfectivos();

  return (
    <div className="space-y-4">
      {!base.verificado && (
        <Llamado
          tono="alerta"
          titulo={`Los parámetros tributarios de ${anio} no están confirmados`}
          icono={<CircleAlert size={18} />}
        >
          <p>
            {base.fuente} Mientras tanto se usa una UVT de <strong>{pesos(base.uvt)}</strong>, que
            determina las cuantías mínimas de retención. Verifique la resolución antes de usar el
            resultado en una decisión real.
          </p>
        </Llamado>
      )}

      <Tarjeta
        titulo="Datos de la empresa"
        descripcion="La fecha fija el año de los parámetros tributarios; la tarifa de ICA depende del municipio."
        acciones={
          <>
            <Boton variante="secundario" tamano="sm" onClick={cargarEjemplo}>
              <Database size={14} /> Cargar ejemplo
            </Boton>
            <Boton variante="fantasma" tamano="sm" onClick={reiniciar}>
              <RotateCcw size={14} /> Reiniciar
            </Boton>
          </>
        }
      >
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
      </Tarjeta>
    </div>
  );
}
