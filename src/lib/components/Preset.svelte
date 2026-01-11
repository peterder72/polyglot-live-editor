<script lang="ts">
  import Card from '$/components/Card/Card.svelte';
  import { Button } from '$/components/ui/button';
  import { diagramEngineStore, updateCode } from '$lib/util/state';
  import { logEvent } from '$lib/util/stats';
  import ShapesIcon from '~icons/material-symbols/account-tree-outline-rounded';

  const samples = $derived.by(() => $diagramEngineStore.sampleDiagrams ?? {});

  const loadSampleDiagram = (diagramType: string): void => {
    updateCode(samples[diagramType], {
      resetPanZoom: true,
      updateDiagram: true
    });
    logEvent('loadSampleDiagram', { diagramType });
  };

  const mainDiagrams = [
    'Flowchart',
    'Class',
    'Sequence',
    'Entity Relationship',
    'State',
    'Mindmap'
  ];

  const diagramOrder = $derived.by(() => {
    const sampleKeys = Object.keys(samples);
    const primary = mainDiagrams.filter((key) => sampleKeys.includes(key));
    const secondary = sampleKeys.filter((key) => !primary.includes(key)).sort();
    return [...primary, ...secondary];
  });
</script>

<Card title="Sample Diagrams" isOpen isStackable icon={{ component: ShapesIcon }}>
  <div class="flex h-fit max-h-52 flex-wrap gap-2 overflow-y-auto p-2">
    {#each diagramOrder as sample (sample)}
      <Button
        size="sm"
        class="w-fit min-w-20 flex-grow normal-case"
        onclick={() => loadSampleDiagram(sample)}>
        {sample}
      </Button>
    {/each}
  </div>
</Card>
