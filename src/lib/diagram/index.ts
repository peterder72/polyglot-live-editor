import mermaidEngine, { standardizeDiagramType } from './mermaid';
import plantumlEngine from './plantuml';
import type { DiagramEngine, DiagramID, DiagramRenderResult } from './types';

export { standardizeDiagramType };
export type { DiagramEngine, DiagramID, DiagramRenderResult } from './types';

const engines: Record<DiagramID, DiagramEngine> = {
  mermaid: mermaidEngine,
  plantuml: plantumlEngine
};

export const defaultDiagramId: DiagramID = 'mermaid';

export const diagramEngines = engines;

export const diagramEngineList: DiagramEngine[] = Object.values(engines);

export const getDiagramEngine = (id: DiagramID = defaultDiagramId): DiagramEngine => {
  return engines[id] ?? engines[defaultDiagramId];
};

export const renderDiagram = async (
  id: DiagramID,
  params: { code: string; config?: string; viewId: string }
): Promise<DiagramRenderResult> => {
  const engine = getDiagramEngine(id);
  return await engine.render({ code: params.code, config: params.config, id: params.viewId });
};
