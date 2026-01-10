<script lang="ts">
  import type { State, ValidatedState } from '$/types';
  import { recordRenderTime, shouldRefreshView } from '$/util/autoSync';
  import { renderDiagram } from '$lib/diagram';
  import { PanZoomState } from '$/util/panZoom';
  import { inputStateStore, stateStore, updateCodeStore } from '$/util/state';
  import { logEvent, saveStatistics } from '$/util/stats';
  import FontAwesome, { mayContainFontAwesome } from '$lib/components/FontAwesome.svelte';
  import uniqueID from 'lodash-es/uniqueId';
  import { mode } from 'mode-watcher';
  import { onMount } from 'svelte';
  import { Svg2Roughjs } from 'svg2roughjs';

  let {
    panZoomState = new PanZoomState(),
    shouldShowGrid = true
  }: { panZoomState?: PanZoomState; shouldShowGrid?: boolean } = $props();
  let code = '';
  let config = '';
  let container: HTMLDivElement | undefined = $state();
  let rough: boolean;
  let view: HTMLDivElement | undefined = $state();
  let error = $state(false);
  let panZoom = true;
  let manualUpdate = true;
  let waitForFontAwesomeToLoad: FontAwesome['waitForFontAwesomeToLoad'] | undefined = $state();

  // Set up panZoom state observer to update the store when pan/zoom changes
  const setupPanZoomObserver = () => {
    panZoomState.onPanZoomChange = (pan, zoom) => {
      updateCodeStore({ pan, zoom });
      logEvent('panZoom');
    };
  };

  const handlePanZoom = (state: State, graphDiv: SVGSVGElement) => {
    try {
      panZoomState.updateElement(graphDiv, state);
    } catch (error) {
      console.error('PanZoom error:', error);
    }
  };

  const parseSvgLength = (value?: string | null) => {
    if (!value) {
      return undefined;
    }
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  const normalizePlantumlSvg = (graphDiv: SVGSVGElement) => {
    graphDiv.style.backgroundColor = 'transparent';
    const width = parseSvgLength(graphDiv.getAttribute('width'));
    const height = parseSvgLength(graphDiv.getAttribute('height'));
    if (!graphDiv.getAttribute('viewBox') && width && height) {
      graphDiv.setAttribute('viewBox', `0 0 ${width} ${height}`);
    }
    if (!width || !height) {
      return;
    }
    const backgroundRects = Array.from(graphDiv.querySelectorAll('rect'));
    for (const rect of backgroundRects) {
      const fill = rect.getAttribute('fill')?.toLowerCase();
      const rectWidth = parseSvgLength(rect.getAttribute('width'));
      const rectHeight = parseSvgLength(rect.getAttribute('height'));
      const rectX = parseSvgLength(rect.getAttribute('x')) ?? 0;
      const rectY = parseSvgLength(rect.getAttribute('y')) ?? 0;
      const isWhiteFill = fill && ['#ffffff', '#fff', 'white', 'rgb(255,255,255)'].includes(fill);
      if (
        isWhiteFill &&
        rectWidth &&
        rectHeight &&
        rectWidth >= width &&
        rectHeight >= height &&
        rectX === 0 &&
        rectY === 0
      ) {
        rect.setAttribute('fill', 'transparent');
        rect.setAttribute('stroke', 'none');
      }
    }
  };

  const handleStateChange = async (state: ValidatedState) => {
    const startTime = Date.now();
    if (state.error !== undefined) {
      error = true;
      return;
    }
    error = false;
    let diagramType: string | undefined;
    try {
      if (container) {
        manualUpdate = true;
        // Do not render if there is no change in Code/Config/PanZoom
        if (
          code === state.code &&
          config === state.config &&
          rough === state.rough &&
          panZoom === state.panZoom
        ) {
          return;
        }

        if (!shouldRefreshView()) {
          return;
        }

        code = state.code;
        config = state.config;
        rough = state.rough;
        panZoom = state.panZoom ?? true;

        if (mayContainFontAwesome(code)) {
          await waitForFontAwesomeToLoad?.();
        }

        const scroll = view?.parentElement?.scrollTop;
        delete container.dataset.processed;
        const viewID = uniqueID('graph-');
        const {
          svg,
          bindFunctions,
          diagramType: detectedDiagramType
        } = await renderDiagram(state.diagram, {
          code,
          config: state.config,
          viewId: viewID
        });
        diagramType = detectedDiagramType;
        if (svg.length > 0) {
          // eslint-disable-next-line svelte/no-dom-manipulating
          container.innerHTML = svg;
          let graphDiv =
            container.querySelector<SVGSVGElement>(`#${viewID}`) ??
            container.querySelector<SVGSVGElement>('svg');
          if (!graphDiv) {
            throw new Error('graph-div not found');
          }
          if (!graphDiv.id) {
            graphDiv.id = viewID;
          }
          if (state.rough) {
            const svg2roughjs = new Svg2Roughjs('#container');
            svg2roughjs.svg = graphDiv;
            await svg2roughjs.sketch();
            graphDiv.remove();
            const sketch = document.querySelector<SVGSVGElement>('#container > svg');
            if (!sketch) {
              throw new Error('sketch not found');
            }
            const height = sketch.getAttribute('height');
            const width = sketch.getAttribute('width');
            sketch.setAttribute('id', 'graph-div');
            sketch.setAttribute('height', '100%');
            sketch.setAttribute('width', '100%');
            sketch.setAttribute('viewBox', `0 0 ${width} ${height}`);
            sketch.style.maxWidth = '100%';
            sketch.style.maxHeight = '100%';
            graphDiv = sketch;
          } else {
            graphDiv.setAttribute('height', '100%');
            graphDiv.setAttribute('width', '100%');
            graphDiv.style.maxWidth = '100%';
            graphDiv.style.maxHeight = '100%';
            if (bindFunctions) {
              bindFunctions(graphDiv);
            }
          }
          if (state.diagram === 'plantuml') {
            normalizePlantumlSvg(graphDiv);
          }
          if (state.panZoom) {
            handlePanZoom(state, graphDiv);
          }
        }
        if (view?.parentElement && scroll) {
          view.parentElement.scrollTop = scroll;
        }
        error = false;
      } else if (manualUpdate) {
        manualUpdate = false;
      }
    } catch (error_) {
      console.error('view fail', error_);
      error = true;
    }
    const renderTime = Date.now() - startTime;
    saveStatistics({ code, diagramType, isRough: state.rough, renderTime });
    recordRenderTime(renderTime, () => {
      $inputStateStore.updateDiagram = true;
    });
  };

  onMount(() => {
    setupPanZoomObserver();
    // Queue state changes to avoid race condition
    let pendingStateChange = Promise.resolve();
    stateStore.subscribe((state) => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      pendingStateChange = pendingStateChange.then(() => handleStateChange(state).catch(() => {}));
    });
  });
</script>

<FontAwesome bind:waitForFontAwesomeToLoad />

<div
  id="view"
  bind:this={view}
  class={['h-full w-full', shouldShowGrid && `grid-bg-${$mode}`, error && 'opacity-50']}>
  <div id="container" bind:this={container} class="h-full overflow-auto"></div>
</div>

<style>
  .grid-bg-light {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #e4e4e48c 2px, #0000 2px);
  }

  .grid-bg-dark {
    background-size: 30px 30px;
    background-image: radial-gradient(circle, #46464646 2px, #0000 2px);
  }
</style>
