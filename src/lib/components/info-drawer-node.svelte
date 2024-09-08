<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { getNodes } from './states/nodes-state.svelte';
    import { selectedNodeId } from "$lib/stores";
    import PropertyDisplay from "./property-display.svelte";
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import type { Node as NodeType } from '$lib/types';

    const drawerStore = getDrawerStore();
    const nodesState = getNodes();
    const node: NodeType = nodesState.getNode($selectedNodeId) as NodeType;

    const settingsInfoDrawer: DrawerSettings = {
        id: "info-drawer-node",
        width: "w-60",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
    };

    drawerStore.open(settingsInfoDrawer);

</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">Node properties</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        {#each Object.keys(node) as key}
            {#if key !== 'id' && key !== 'position'}
                <PropertyDisplay {key} value={node[key]} />
            {/if}
        {/each}
    </main>
    <footer class="flex justify-center">
        <button class="btn variant-ghost-error" disabled>Update node</button>
    </footer>
</div>


<style>
    .toolbox-content {
        padding-left : 20px;
        padding-right: 5px;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    main {
        flex-grow: 1;
        display: grid;
        grid-auto-rows: min-content;
        align-items: start;
    }
    footer {
        padding: 10px;
    }
</style>
