import { defaultDiagramId, getDiagramEngine } from '$lib/diagram';
import type { DiagramID } from '$lib/diagram';
import { C } from '$/constants';
import type { ErrorHash, MarkerData, State, ValidatedState } from '$/types';
import { debounce } from 'lodash-es';
import type { MermaidConfig } from 'mermaid';
import { derived, get, writable, type Readable } from 'svelte/store';
import { env } from './env';
import {
  extractErrorLineText,
  findMostRelevantLineNumber,
  replaceLineNumberInErrorMessage
} from './errorHandling';
import { localStorage, persist } from './persist';
import { deserializeState, pakoSerde, serializeState } from './serde';
import { errorDebug, formatJSON, MCBaseURL } from './util';

const defaultEngine = getDiagramEngine(defaultDiagramId);

export const defaultState: State = {
  code: defaultEngine.defaultCode,
  config: defaultEngine.defaultConfig ?? '',
  diagram: defaultEngine.id,
  grid: true,
  panZoom: true,
  rough: false,
  updateDiagram: true
};

const normalizeState = (state: State): State => {
  const diagram = state.diagram ?? defaultDiagramId;
  const engine = getDiagramEngine(diagram);
  let config = state.config;
  if (!config) {
    config = state.mermaid ?? engine.defaultConfig ?? '';
  }
  if (!engine.hasConfig) {
    config = engine.defaultConfig ?? '';
  }
  const editorMode = engine.hasConfig ? (state.editorMode ?? 'code') : 'code';
  return {
    ...state,
    config,
    diagram,
    editorMode
  };
};

const urlParseFailedState = `flowchart TD
    A[Loading URL failed. We can try to figure out why.] -->|Decode JSON| B(Please check the console to see the JSON and error details.)
    B --> C{Is the JSON correct?}
    C -->|Yes| D(Please Click here to Raise an issue in github.<br/>Including the broken link in the issue <br/> will speed up the fix.)
    C -->|No| E{Did someone <br/>send you this link?}
    E -->|Yes| F[Ask them to send <br/>you the complete link]
    E -->|No| G{Did you copy <br/> the complete URL?}
    G --> |Yes| D
    G --> |"No :("| H(Try using the Timeline tab in History <br/>from same browser you used to create the diagram.)
    click D href "https://github.com/mermaid-js/mermaid-live-editor/issues/new?assignees=&labels=bug&template=bug_report.md&title=Broken%20link" "Raise issue"`;

// inputStateStore handles all updates and is shared externally when exporting via URL, History, etc.
export const inputStateStore = persist(writable(defaultState), localStorage(), 'codeStore');

export const currentState: ValidatedState = (() => {
  const state = normalizeState(get(inputStateStore));
  return {
    ...state,
    error: undefined,
    errorMarkers: [],
    serialized: serializeState(state)
  };
})();

let lastDiagramType = '';

const processState = async (state: State) => {
  const normalized = normalizeState(state);
  const processed: ValidatedState = {
    ...normalized,
    error: undefined,
    errorMarkers: [],
    serialized: ''
  };
  try {
    const engine = getDiagramEngine(normalized.diagram);
    processed.serialized = serializeState(normalized);
    if (engine.parse) {
      const { diagramType } = await engine.parse(normalized.code, normalized.config);
      processed.diagramType = diagramType;
      if (engine.id === 'mermaid') {
        if (lastDiagramType === 'zenuml' && diagramType && diagramType !== lastDiagramType) {
          // Temp Hack to refresh page after displaying ZenUML.
          setTimeout(() => window.location.reload(), 500);
        }
        lastDiagramType = diagramType ?? '';
      }
    }
    engine.validateConfig?.(normalized.config);
  } catch (error) {
    processed.error = error as Error;
    errorDebug();
    console.error(error);
    if ('hash' in error) {
      try {
        let errorString = processed.error.toString();
        const errorLineText = extractErrorLineText(errorString);
        const realLineNumber = findMostRelevantLineNumber(errorLineText, normalized.code);

        let first_line: number, last_line: number, first_column: number, last_column: number;
        try {
          ({ first_line, last_line, first_column, last_column } = (error.hash as ErrorHash).loc);
        } catch {
          const lineNo = findMostRelevantLineNumber(errorString, normalized.code);
          first_line = lineNo;
          last_line = lineNo + 1;
          first_column = 0;
          last_column = 0;
        }

        if (realLineNumber !== -1) {
          errorString = replaceLineNumberInErrorMessage(errorString, realLineNumber);
        }

        processed.error = new Error(errorString);
        const marker: MarkerData = {
          endColumn: last_column + (first_column === last_column ? 0 : 5),
          endLineNumber: last_line + (realLineNumber - first_line),
          message: errorString || 'Syntax error',
          severity: 8, // Error
          startColumn: first_column,
          startLineNumber: realLineNumber
        };
        processed.errorMarkers = [marker];
      } catch (error) {
        console.error('Error without line helper', error);
      }
    }
  }
  return processed;
};

// All internal reads should be done via stateStore, but it should not be persisted/shared externally.
export const stateStore: Readable<ValidatedState> = derived(
  [inputStateStore],
  ([state], set) => {
    void processState(state).then(set);
  },
  currentState
);

export const diagramEngineStore = derived(stateStore, ($state) => getDiagramEngine($state.diagram));

export const urlsStore = derived([stateStore], ([state]) => {
  const engine = getDiagramEngine(state.diagram);
  const assets = engine.getAssetUrls?.({ code: state.code, serialized: state.serialized }) ?? {};
  const png = assets.png ?? '';
  const svg = assets.svg ?? '';
  const mdCode = png
    ? `[![](${png})](${window.location.protocol}//${window.location.host}${window.location.pathname}#${state.serialized})`
    : '';
  const baseUrls: Record<string, unknown> = {
    mdCode,
    new: `${window.location.protocol}//${window.location.host}${window.location.pathname}#${serializeState(defaultState)}`,
    png,
    svg,
    view: `/view#${state.serialized}`
  };

  if (engine.id === 'mermaid') {
    const { krokiRendererUrl } = env;
    baseUrls.kroki = krokiRendererUrl
      ? `${krokiRendererUrl}/mermaid/svg/${pakoSerde.serialize(state.code)}`
      : '';
    baseUrls.mermaidChart = ({
      medium
    }: {
      medium: 'ai_repair' | 'main_menu' | 'save_diagram' | 'share' | 'toggle';
    }) => {
      const params = new URLSearchParams({
        utm_source: C.utmSource,
        utm_medium: medium
      }).toString();
      return {
        save: `${MCBaseURL}/app/plugin/save?state=${state.serialized}&${params}`,
        playground: `${MCBaseURL}/play?${params}#${state.serialized}`,
        plugins: `${MCBaseURL}/plugins?${params}`,
        home: `${MCBaseURL}/?${params}`
      };
    };
  } else {
    baseUrls.kroki = '';
    baseUrls.mermaidChart = undefined;
  }

  if (assets.extras) {
    Object.assign(baseUrls, assets.extras);
  }

  return baseUrls;
});

export const loadState = (data: string): void => {
  let state: State;
  console.log(`Loading '${data}'`);
  try {
    state = normalizeState(deserializeState(data));
    const engine = getDiagramEngine(state.diagram);
    if (engine.id === 'mermaid' && state.config) {
      const mermaidConfig = JSON.parse(state.config) as MermaidConfig;
      if (
        mermaidConfig.securityLevel &&
        mermaidConfig.securityLevel !== 'strict' &&
        confirm(
          `Removing "securityLevel":"${mermaidConfig.securityLevel}" from the config for safety.\nClick Cancel if you trust the source of this Diagram.`
        )
      ) {
        delete mermaidConfig.securityLevel; // Prevent setting overriding securityLevel when loading state to mitigate possible XSS attack
      }
      state.config = formatJSON(mermaidConfig);
    }
    if (engine.formatConfig) {
      state.config = engine.formatConfig(state.config);
    }
  } catch (error) {
    state = get(inputStateStore);
    if (data) {
      console.error('Init error', error);
      state.code = urlParseFailedState;
      state.config = defaultState.config;
      state.diagram = defaultState.diagram;
    }
  }
  updateCodeStore(state);
};

let renderCount = 0;
export const updateCodeStore = (newState: Partial<State>): void => {
  inputStateStore.update((state) => {
    renderCount++;
    return normalizeState({ ...state, ...newState, renderCount });
  });
};

export const updateCode = (
  code: string,
  {
    updateDiagram = false,
    resetPanZoom = false
  }: { updateDiagram?: boolean; resetPanZoom?: boolean } = {}
): void => {
  errorDebug();

  inputStateStore.update((state) => {
    if (resetPanZoom) {
      state.pan = undefined;
      state.zoom = undefined;
    }
    return { ...state, code, updateDiagram };
  });
};

export const updateConfig = (config: string): void => {
  updateCodeStore({ config });
};

export const setDiagramEngine = (diagram: DiagramID): void => {
  const engine = getDiagramEngine(diagram);
  inputStateStore.update((state) => {
    const nextState = normalizeState({
      ...state,
      code: engine.defaultCode,
      config: engine.defaultConfig ?? '',
      diagram,
      editorMode: engine.hasConfig ? (state.editorMode ?? 'code') : 'code',
      pan: undefined,
      updateDiagram: true,
      zoom: undefined
    });
    return nextState;
  });
};

export const toggleDarkTheme = (dark: boolean): void => {
  inputStateStore.update((state) => {
    const normalized = normalizeState(state);
    const engine = getDiagramEngine(normalized.diagram);
    if (engine.id !== 'mermaid') {
      return normalized;
    }
    try {
      const config = JSON.parse(normalized.config) as MermaidConfig;
      if (!config.theme || ['dark', 'default'].includes(config.theme)) {
        config.theme = dark ? 'dark' : 'default';
      }
      normalized.config = formatJSON(config);
    } catch (error) {
      console.error('Unable to toggle theme for current configuration', error);
    }
    return normalized;
  });
};

export const initURLSubscription = (): void => {
  const updateHash = debounce((hash) => {
    history.replaceState(undefined, '', `#${hash}`);
  }, 250);

  stateStore.subscribe(({ serialized }) => {
    updateHash(serialized);
  });
};

export const getStateString = (): string => {
  return JSON.stringify(get(inputStateStore));
};

export const verifyState = (): void => {
  const state = normalizeState(get(inputStateStore));
  if (!state.panZoom) {
    state.panZoom = true;
  }
  updateCodeStore(state);
};
