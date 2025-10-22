import { diagramData } from '@mermaid-js/examples';
import zenuml from '@mermaid-js/mermaid-zenuml';
import type { MermaidConfig } from 'mermaid';
import mermaid from 'mermaid';
import { env } from '$lib/util/env';
import type { DiagramAssetUrls, DiagramEngine } from './types';

let initPromise: Promise<void> | undefined;

const ensureMermaidReady = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const [elkModule, tidyModule] = await Promise.all([
          import('@mermaid-js/layout-elk'),
          import('@mermaid-js/layout-tidy-tree')
        ]);
        const elkLayouts = ((elkModule as { default?: unknown }).default ?? elkModule) as unknown[];
        const tidyTreeLayouts = ((tidyModule as { default?: unknown }).default ??
          tidyModule) as unknown[];
        mermaid.registerLayoutLoaders([...elkLayouts, ...tidyTreeLayouts]);
      } catch (error) {
        console.warn('Failed to register optional Mermaid layouts', error);
      }
      await mermaid.registerExternalDiagrams([zenuml]);
    })();
  }
  await initPromise;
};

const formatJSON = (data: unknown): string => JSON.stringify(data, undefined, 2);

const getSampleDiagrams = () => {
  type DiagramDefinition = (typeof diagramData)[number];

  const isValidDiagram = (diagram: DiagramDefinition): diagram is Required<DiagramDefinition> => {
    return Boolean(diagram.name && diagram.examples && diagram.examples.length > 0);
  };

  const diagrams = diagramData
    .filter((diagram) => isValidDiagram(diagram))
    .map(({ examples, ...rest }) => ({
      ...rest,
      example: examples?.filter(({ isDefault }) => isDefault)[0]
    }));

  const examples: Record<string, string> = {};
  for (const diagram of diagrams) {
    examples[diagram.name.replace(/ (Diagram|Chart|Graph)/, '')] = diagram.example.code;
  }
  return examples;
};

export const standardizeDiagramType = (diagramType: string) => {
  switch (diagramType) {
    case 'class':
    case 'classDiagram': {
      return 'classDiagram';
    }
    case 'graph':
    case 'flowchart':
    case 'flowchart-elk':
    case 'flowchart-v2': {
      return 'flowchart';
    }
    default: {
      return diagramType;
    }
  }
};

const mermaidEngine: DiagramEngine = {
  codeEditorLanguage: 'mermaid',
  configEditorLanguage: 'json',
  defaultCode: `flowchart TD\n    A[Christmas] -->|Get money| B(Go shopping)\n    B --> C{Let me think}\n    C -->|One| D[Laptop]\n    C -->|Two| E[iPhone]\n    C -->|Three| F[fa:fa-car Car]\n  `,
  defaultConfig: formatJSON({
    theme: 'default'
  }),
  description: 'Client-side rendering using the Mermaid library.',
  formatConfig: formatJSON,
  getAssetUrls: ({ serialized }: { code: string; serialized: string }) => {
    const { rendererUrl } = env;
    const png = rendererUrl ? `${rendererUrl}/img/${serialized}?type=png` : undefined;
    const svg = rendererUrl ? `${rendererUrl}/svg/${serialized}` : undefined;
    const assetUrls: DiagramAssetUrls = {
      png,
      svg
    };
    return assetUrls;
  },
  getDocumentationUrl: (diagramType) => {
    if (!diagramType) {
      return 'https://mermaid.js.org/intro/';
    }
    const standardized = standardizeDiagramType(diagramType);
    return `https://mermaid.js.org/syntax/${standardized}.html`;
  },
  hasConfig: true,
  id: 'mermaid',
  label: 'Mermaid',
  mobileLanguage: 'yaml-frontmatter',
  parse: async (code) => {
    return await mermaid.parse(code);
  },
  render: async ({ config, code, id }) => {
    await ensureMermaidReady();
    const parsedConfig = (config ? JSON.parse(config) : {}) as MermaidConfig;
    mermaid.initialize(parsedConfig);
    return await mermaid.render(id, code);
  },
  sampleDiagrams: getSampleDiagrams(),
  validateConfig: (config) => {
    JSON.parse(config) as MermaidConfig;
  }
};

export default mermaidEngine;
