import type { RenderResult } from 'mermaid';

export type DiagramID = 'mermaid' | 'plantuml';

export interface DiagramRenderResult {
  svg?: string;
  bindFunctions?: RenderResult['bindFunctions'];
  diagramType?: string;
}

export interface DiagramAssetUrls {
  png?: string;
  svg?: string;
  mdCode?: string;
  extras?: Record<string, unknown>;
}

export interface DiagramEngine {
  id: DiagramID;
  label: string;
  description: string;
  /** Monaco language id used for the diagram code editor. */
  codeEditorLanguage: string;
  /** Monaco language id used for the configuration editor. */
  configEditorLanguage?: string;
  /** Identifier used by the mobile editor to pick the correct CodeMirror setup. */
  mobileLanguage: 'yaml-frontmatter' | 'markdown' | 'plaintext';
  /** Whether the engine exposes a configurable JSON editor. */
  hasConfig: boolean;
  /** Default diagram code shown when switching to the engine. */
  defaultCode: string;
  /** Default configuration for the engine (if any). */
  defaultConfig?: string;
  /**
   * Collection of sample diagrams shown in the preset picker.
   * Keys are the user visible labels and values are the diagram sources.
   */
  sampleDiagrams: Record<string, string>;
  /** Renders the diagram and returns the generated SVG. */
  render: (params: { code: string; config?: string; id: string }) => Promise<DiagramRenderResult>;
  /** Optionally parses the diagram code to extract metadata such as the diagram type. */
  parse?: (code: string, config?: string) => Promise<{ diagramType?: string }>;
  /**
   * Validates the configuration string. Should throw on invalid configurations.
   * When omitted, no validation is performed beyond basic parsing.
   */
  validateConfig?: (config: string) => void;
  /**
   * Normalises the configuration string after validation. Used for formatting JSON configs.
   */
  formatConfig?: (config: string) => string;
  /** Returns an URL to the documentation page for a given diagram type. */
  getDocumentationUrl?: (diagramType?: string) => string | undefined;
  /**
   * Produces renderer specific asset URLs (png/svg/markdown etc.).
   * Called when generating share/download links.
   */
  getAssetUrls?: (params: { code: string; serialized: string }) => DiagramAssetUrls;
}
