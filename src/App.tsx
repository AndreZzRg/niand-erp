import { useState, type JSX } from 'react';

import { Shell, type ModuloId } from './brand/Shell';
import { PanelContabilidad } from './features/PanelContabilidad';
import { PanelFacturacion } from './features/PanelFacturacion';
import { PanelInformes } from './features/PanelInformes';
import { PanelInventario } from './features/PanelInventario';
import { PanelTerceros } from './features/PanelTerceros';
import { PanelTesoreria } from './features/PanelTesoreria';

const PANELES: Record<ModuloId, () => JSX.Element> = {
  terceros: PanelTerceros,
  'productos-e-inventario': PanelInventario,
  facturacion: PanelFacturacion,
  'tesoreria-y-cartera': PanelTesoreria,
  contabilidad: PanelContabilidad,
  informes: PanelInformes,
};

export default function App() {
  const [modulo, setModulo] = useState<ModuloId>('terceros');
  const Panel = PANELES[modulo];

  return (
    <Shell moduloActivo={modulo} onModulo={setModulo}>
      <Panel />
    </Shell>
  );
}
