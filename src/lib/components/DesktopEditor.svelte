<script lang="ts">
  import type { EditorProps } from '$/types';
  import { stateStore } from '$/util/state';
  import { getDiagramEngine } from '$lib/diagram';
  import { initEditor } from '$lib/util/monacoExtra';
  import { errorDebug } from '$lib/util/util';
  import { mode } from 'mode-watcher';
  import * as monaco from 'monaco-editor';
  import monacoEditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
  import monacoJsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
  import { onMount } from 'svelte';

  const { onUpdate }: EditorProps = $props();

  let divElement: HTMLDivElement | undefined = $state();
  let editor: monaco.editor.IStandaloneCodeEditor | undefined;
  let editorOptions = {
    minimap: {
      enabled: false
    },
    overviewRulerLanes: 0
  } satisfies monaco.editor.IStandaloneEditorConstructionOptions;
  let currentText = '';

  const models: Record<string, monaco.editor.ITextModel> = {};

  const getModel = (language: string, type: 'code' | 'config') => {
    const key = `${type}:${language}`;
    if (!models[key]) {
      const extension = language === 'json' ? 'json' : 'txt';
      models[key] = monaco.editor.createModel(
        '',
        language,
        monaco.Uri.parse(`internal://${type}-${language}.${extension}`)
      );
    }
    return models[key];
  };

  onMount(() => {
    self.MonacoEnvironment = {
      getWorker(_, label) {
        if (label === 'json') {
          return new monacoJsonWorker();
        }
        return new monacoEditorWorker();
      }
    };

    if (!divElement) {
      throw new Error('divEl is undefined');
    }

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      enableSchemaRequest: true,
      schemas: [
        {
          fileMatch: ['config.json'],
          uri: 'https://mermaid.js.org/schemas/config.schema.json'
        }
      ]
    });

    initEditor(monaco);
    errorDebug();
    editor = monaco.editor.create(divElement, editorOptions);
    editor.onDidChangeModelContent(({ isFlush }) => {
      const newText = editor?.getValue();
      if (!newText || currentText === newText || isFlush) {
        return;
      }
      currentText = newText;
      onUpdate(currentText);
    });

    const unsubscribeState = stateStore.subscribe(
      ({ errorMarkers, editorMode, code, config, diagram }) => {
        if (!editor) {
          return;
        }

        const engine = getDiagramEngine(diagram);
        const codeModel = getModel(engine.codeEditorLanguage, 'code');
        const configLanguage = engine.configEditorLanguage ?? 'json';
        const configModel = getModel(configLanguage, 'config');
        const model = editorMode === 'code' || !engine.hasConfig ? codeModel : configModel;

        if (editor.getModel()?.id !== model.id) {
          editor.setModel(model);
        }

        // Update editor text if it's different
        const newText = editorMode === 'code' || !engine.hasConfig ? code : config;
        if (newText !== currentText) {
          editor.setScrollTop(0);
          editor.setValue(newText);
          currentText = newText;
        }

        // Display/clear errors
        monaco.editor.setModelMarkers(model, engine.id, errorMarkers);
      }
    );

    const unsubscribeMode = mode.subscribe((mode) => {
      if (editor) {
        monaco.editor.setTheme(`mermaid${mode === 'dark' ? '-dark' : ''}`);
      }
    });
    const resizeObserver = new ResizeObserver((entries) => {
      editor?.layout({
        height: entries[0].contentRect.height,
        width: entries[0].contentRect.width
      });
    });

    if (divElement.parentElement) {
      resizeObserver.observe(divElement);
    }

    return () => {
      unsubscribeState();
      unsubscribeMode();
      resizeObserver.disconnect();
      Object.values(models).forEach((model) => model.dispose());
      editor?.dispose();
    };
  });
</script>

<div bind:this={divElement} id="editor" class="h-full flex-grow overflow-hidden"></div>
