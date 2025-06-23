<script lang="ts">
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { PlusCircleIcon } from 'svelte-feather-icons';
    import { getToastState } from "$lib/components/states/toast-state.svelte";
    import {
        createNodeMode,
        createLinkMode,
        createConnectionMode,
        modalMetadata
    } from "$lib/stores";


    const drawerStore = getDrawerStore();
    const toastState = getToastState();

    const tools = ["node", "link", "connection"];

    const settingsToolbox: DrawerSettings = {
        id: "toolbox",
        width: "w-60",
        position: 'left',
        border: "border-primary-400 dark:border-primary-600",
        bgDrawer: "bg-primary-100/90 dark:bg-slate-800/95",
        shadow: "shadow-lg",
        regionDrawer: 'z-[60]',
        regionBackdrop: 'z-[55]',
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

    function enterConnectionCreationMode() {
        modalMetadata.set({toolName: tools[2], operationMode: 'create'});
        createConnectionMode.set(true);
        drawerStore.close();
    }

</script>


<div class="toolbox-content flex flex-col text-primary-900 dark:text-primary-100">
    <header class="flex justify-center">
        <h2 class="text-primary-700 dark:text-primary-200 font-semibold">Toolbox</h2>
    </header>
    <main class="grid grid-cols-1 gap-4">
        <button class="btn btn-create border border-primary-400 bg-primary-200/70 hover:bg-primary-300/80 text-primary-800 hover:border-primary-500 transition-colors" on:click={enterNodeCreationMode}>
            <div class="card-content columns-1 gap-1">
                <div>
                    Create new node
                </div>
                <div>
                    <PlusCircleIcon />
                </div>
            </div>
        </button>
        <button class="btn btn-create border border-secondary-400 bg-secondary-200/70 hover:bg-secondary-300/80 text-secondary-800 hover:border-secondary-500 transition-colors" on:click={enterLinkCreationMode}>
            <div class="card-content columns-1 gap-1">
                <div>
                    Create new link
                </div>
                <div>
                    <PlusCircleIcon />
                </div>
            </div>
        </button>
        <button class="btn btn-create border border-tertiary-400 bg-tertiary-200/70 hover:bg-tertiary-300/80 text-tertiary-800 hover:border-tertiary-500 transition-colors" on:click={enterConnectionCreationMode}>
            <div class="card-content columns-1 gap-1">
                <div>
                    Create new connection
                </div>
                <div>
                    <PlusCircleIcon />
                </div>
            </div>
        </button>
    </main>
    <footer class="flex justify-center">
        <div class="search-bar w-full px-2">
            <input type="text" placeholder="Search..." class="input bg-primary-50 border-primary-300 text-primary-800 placeholder-primary-500 focus:border-primary-500 focus:ring-primary-500" />
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
