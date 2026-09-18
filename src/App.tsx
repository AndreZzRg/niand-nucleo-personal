import { useState, type JSX } from 'react';

import { Shell, type ModuloId } from './brand/Shell';
import { PanelAlertas } from './features/PanelAlertas';
import { PanelContratos } from './features/PanelContratos';
import { PanelExpediente } from './features/PanelExpediente';
import { PanelNovedades } from './features/PanelNovedades';
import { PanelPersonal } from './features/PanelPersonal';

const PANELES: Record<ModuloId, () => JSX.Element> = {
  personal: PanelPersonal,
  contratos: PanelContratos,
  'expediente-digital': PanelExpediente,
  novedades: PanelNovedades,
  'alertas-de-vencimiento': PanelAlertas,
};

export default function App() {
  const [modulo, setModulo] = useState<ModuloId>('personal');
  const Panel = PANELES[modulo];

  return (
    <Shell moduloActivo={modulo} onModulo={setModulo}>
      <Panel />
    </Shell>
  );
}
