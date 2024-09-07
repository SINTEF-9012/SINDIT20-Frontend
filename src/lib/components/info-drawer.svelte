<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import type { Node as NodeType } from '$lib/types';

    const drawerStore = getDrawerStore();

    const settingsInfoDrawer: DrawerSettings = {
        id: "info-drawer",
        width: "w-60",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
        meta: {node: {id: "1", title: "Node 1", description: "This is a node"}},
    };

    drawerStore.open(settingsInfoDrawer);

    let node: NodeType = $drawerStore.meta.node;
    console.log("info node", node);
</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">Details</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        <div class="flex flex-col">
            <div class="text-xl">Title</div>
            <span>{node.nodeName}</span>
        </div>
        <div class="flex flex-col">
            <div class="text-xl">Description</div>
            <span>{node.nodeDescription}</span>
        </div>
    </main>
    <footer class="flex justify-center">
        Hello world
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
        height: 100px;
    }
</style>
