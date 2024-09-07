<script lang="ts">
    import PropertyDisplay from './property-display.svelte';

    export let key: string;
    export let value: any;
  </script>

  <div class="flex flex-col">
    <div class="text-xl">{key}</div>
    {#if typeof value === 'object' && value !== null}
      <div class="ml-4">
        {#each Object.keys(value) as nestedKey}
          <PropertyDisplay key={nestedKey} value={value[nestedKey]} />
        {/each}
      </div>
    {:else}
      <span>{value}</span>
    {/if}
  </div>
