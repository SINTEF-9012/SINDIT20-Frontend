<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { PlusCircleIcon } from 'svelte-feather-icons';
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import { createNodeMode, createLinkMode, modalMetadata } from "$lib/stores";
    import { getToastState } from "$lib/components/toast-state.svelte";

    const drawerStore = getDrawerStore();
    const toastState = getToastState();

    const tools = ["node", "link"];

    const settingsToolbox: DrawerSettings = {
        id: "toolbox",
        width: "w-60",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
    };

    drawerStore.open(settingsToolbox);

    function enterNodeCreationMode() {
        modalMetadata.set({toolName: tools[0], operationMode: 'create'});
        createNodeMode.set(true);
        toastState.add('Create new node', 'Click on the canvas to create a new node.', 'info');
        drawerStore.close();
    }

    function enterLinkCreationMode() {
        modalMetadata.set({toolName: tools[1], operationMode: 'create'});
        createLinkMode.set(true);
        toastState.add('Create new link', 'Select two nodes to create a new link', 'info');
        drawerStore.close();
    }

</script>


<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h2>Toolbox</h2>
    </header>
    <main class="grid grid-cols-1 gap-4">
        <button class="btn btn-create border border-tertiary-500 bg-tertiary-50" on:click={enterNodeCreationMode}>
            <div class="card-content columns-1 gap-1">
                <div>
                    Create new node
                </div>
                <div>
                    <PlusCircleIcon />
                </div>
            </div>
        </button>
        <button class="btn btn-create border border-tertiary-500 bg-tertiary-50" on:click={enterLinkCreationMode}>
            <div class="card-content columns-1 gap-1">
                <div>
                    Create new link
                </div>
                <div>
                    <PlusCircleIcon />
                </div>
            </div>
        </button>
    </main>
    <footer class="flex justify-center">
        <div class="search-bar">
            <input type="text" placeholder="Search..." class="input" />
        </div>
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
    .btn-create {
        height: 100px;
    }
    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

</style>
