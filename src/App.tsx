import { useState, type JSX } from 'react';

import { Portada } from './brand/Portada';
import { APP, MODULOS, Shell, type ModuloId, type Vista } from './brand/Shell';
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
  // Se abre en la portada: quien llega ve primero de qué se compone la
  // herramienta, en vez de caer dentro del primer módulo sin contexto.
  const [vista, setVista] = useState<Vista>('portada');
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
          onAbrir={(id) => setVista(id as ModuloId)}
        />
      )}
    </Shell>
  );
}
