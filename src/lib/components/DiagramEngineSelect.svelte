<script lang="ts">
  import Card from '$/components/Card/Card.svelte';
  import * as ToggleGroup from '$/components/ui/toggle-group';
  import { diagramEngineList, type DiagramID } from '$lib/diagram';
  import { diagramEngineStore, setDiagramEngine } from '$lib/util/state';
  import { logEvent } from '$lib/util/stats';

  const onSelect = (value: string | undefined) => {
    if (!value || value === $diagramEngineStore.id) {
      return;
    }
    setDiagramEngine(value as DiagramID);
    logEvent('diagramEngineSelect', { engine: value });
  };
</script>

<Card title="Diagram Engine" isOpen isStackable>
  <ToggleGroup.Root
    type="single"
    value={$diagramEngineStore.id}
    class="grid grid-cols-1 gap-2 sm:grid-cols-2"
    onValueChange={onSelect}>
    {#each diagramEngineList as engine (engine.id)}
      <ToggleGroup.Item value={engine.id} class="justify-start">
        {engine.label}
      </ToggleGroup.Item>
    {/each}
  </ToggleGroup.Root>
</Card>
