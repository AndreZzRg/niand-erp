import { useState, type JSX } from 'react';

import { Portada, type MetricaModulo } from './brand/Portada';
import { APP, MODULOS, Shell, type ModuloId, type Vista } from './brand/Shell';
import { PanelContabilidad } from './features/PanelContabilidad';
import { PanelFacturacion } from './features/PanelFacturacion';
import { PanelInformes } from './features/PanelInformes';
import { PanelInventario } from './features/PanelInventario';
import { PanelTerceros } from './features/PanelTerceros';
import { PanelTesoreria } from './features/PanelTesoreria';
import { useDerivados } from './features/Configuracion';
import { cartera } from './domain/comprobantes';
import { pesos } from './lib/formato';
import { useEstado } from './store';

const PANELES: Record<ModuloId, () => JSX.Element> = {
  terceros: PanelTerceros,
  'productos-e-inventario': PanelInventario,
  facturacion: PanelFacturacion,
  'tesoreria-y-cartera': PanelTesoreria,
  contabilidad: PanelContabilidad,
  informes: PanelInformes,
};

/**
 * Cifra que cada módulo expone en la portada. Se deriva del mismo estado
 * que muestra el módulo, de modo que la portada nunca puede contradecirlo.
 */
function useMetricas(): Record<string, MetricaModulo | undefined> {
  const { config, terceros, productos, facturas, pagos } = useEstado();
  const { libro, balance, resultados, inventario } = useDerivados();

  const porCobrar = cartera(facturas, pagos, 'venta', config.fecha, config.plazoCartera);
  const saldoCartera = porCobrar.reduce((s, c) => s + c.saldo, 0);
  const vencidas = porCobrar.filter((c) => c.diasVencido > 0).length;

  const bajoMinimo = inventario.filas.filter((f) => {
    const p = productos.find((x) => x.id === f.productoId);
    return p && p.stockMinimo > 0 && f.cantidad < p.stockMinimo;
  }).length;

  return {
    terceros: {
      valor: terceros.length,
      detalle: terceros.length === 1 ? 'registrado' : 'registrados',
    },
    'productos-e-inventario': {
      valor: pesos(inventario.total),
      detalle: bajoMinimo > 0 ? `${bajoMinimo} bajo mínimo` : `${productos.length} productos`,
      tono: bajoMinimo > 0 ? 'alerta' : 'neutro',
    },
    facturacion: {
      valor: facturas.length,
      detalle: facturas.length === 1 ? 'factura' : 'facturas',
    },
    'tesoreria-y-cartera': {
      valor: pesos(saldoCartera),
      detalle: vencidas > 0 ? `${vencidas} vencida(s)` : 'por cobrar',
      tono: vencidas > 0 ? 'riesgo' : 'neutro',
    },
    contabilidad: {
      valor: libro.length,
      detalle: balance.cuadra ? 'comprobantes · cuadra' : 'comprobantes · descuadrado',
      tono: balance.cuadra ? 'ok' : 'riesgo',
    },
    informes: {
      valor: pesos(resultados.utilidadNeta),
      detalle: 'utilidad del ejercicio',
      tono: resultados.utilidadNeta >= 0 ? 'ok' : 'riesgo',
    },
  };
}

export default function App() {
  const [vista, setVista] = useState<Vista>('portada');
  const metricas = useMetricas();

  const Panel = vista === 'portada' ? null : PANELES[vista];

  return (
    <Shell vista={vista} onVista={setVista}>
      {Panel ? (
        <Panel />
      ) : (
        <Portada
          titulo={APP.nombre}
          descripcion={APP.resumen}
          modulos={MODULOS}
          metricas={metricas}
          onAbrir={(id) => setVista(id as ModuloId)}
        />
      )}
    </Shell>
  );
}
