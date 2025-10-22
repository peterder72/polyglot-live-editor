<script lang="ts">
  import type { EditorProps } from '$/types';
  import { stateStore } from '$/util/state';
  import { getDiagramEngine } from '$lib/diagram';
  import { json } from '@codemirror/lang-json';
  import { markdown } from '@codemirror/lang-markdown';
  import { yamlFrontmatter } from '@codemirror/lang-yaml';
  import { Compartment, EditorState } from '@codemirror/state';
  import { EditorView } from '@codemirror/view';
  import { vsCodeDark } from '@fsegurai/codemirror-theme-vscode-dark';
  import { vsCodeLight } from '@fsegurai/codemirror-theme-vscode-light';
  import { basicSetup } from 'codemirror';
  import { mode } from 'mode-watcher';
  import { onMount } from 'svelte';

  let editorView: EditorView | undefined;
  let editorContainer: HTMLDivElement;
  let currentText = $state('');

  const { onUpdate }: EditorProps = $props();
  let currentLanguageKey = '';

  const getCodeExtension = (engine: ReturnType<typeof getDiagramEngine>) => {
    switch (engine.mobileLanguage) {
      case 'yaml-frontmatter':
        return yamlFrontmatter({ content: markdown() });
      case 'markdown':
        return markdown();
      default:
        return [];
    }
  };

  const getConfigExtension = (engine: ReturnType<typeof getDiagramEngine>) => {
    if (!engine.hasConfig) {
      return [];
    }
    switch (engine.configEditorLanguage) {
      case 'json':
        return json();
      default:
        return markdown();
    }
  };

  onMount(() => {
    const themeCompartment = new Compartment();
    const languageCompartment = new Compartment();

    editorView = new EditorView({
      state: EditorState.create({
        doc: currentText,
        extensions: [
          basicSetup,
          languageCompartment.of([]),
          themeCompartment.of([]),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newText = update.state.doc.toString();
              if (currentText === newText) {
                return;
              }
              currentText = newText;
              onUpdate(newText);
            }
          }),
          EditorView.theme({
            '&.cm-focused': {
              outline: 'none'
            },
            '&.cm-editor': {
              height: '100%'
            },
            '&.cm-scroller': {
              overflow: 'auto'
            }
          })
        ]
      }),
      parent: editorContainer
    });

    const unsubscribeMode = mode.subscribe((mode) => {
      editorView?.dispatch({
        effects: themeCompartment.reconfigure(mode === 'dark' ? vsCodeDark : vsCodeLight)
      });
    });

    const unsubscribeState = stateStore.subscribe(({ editorMode, code, config, diagram }) => {
      const engine = getDiagramEngine(diagram);
      const isConfigMode = editorMode === 'config' && engine.hasConfig;
      const text = isConfigMode ? config : code;
      if (currentText === text || !editorView) {
        return;
      }
      currentText = text;
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: text
        }
      });
      const nextLanguageKey = `${isConfigMode ? 'config' : 'code'}:${engine.id}`;
      if (nextLanguageKey !== currentLanguageKey) {
        currentLanguageKey = nextLanguageKey;
        const extension = isConfigMode ? getConfigExtension(engine) : getCodeExtension(engine);
        editorView.dispatch({
          effects: languageCompartment.reconfigure(extension)
        });
      }
    });

    return () => {
      unsubscribeMode();
      unsubscribeState();
      editorView?.destroy();
    };
  });
</script>

<div bind:this={editorContainer} class="size-full"></div>
