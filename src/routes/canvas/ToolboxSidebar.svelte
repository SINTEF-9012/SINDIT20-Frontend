<script lang="ts">
import { PlusCircleIcon } from 'svelte-feather-icons';
import { getToastState } from "$lib/components/states/toast-state.svelte";
import {
    createNodeMode,
    createLinkMode,
    createConnectionMode,
    modalMetadata
} from "$lib/stores";

const toastState = getToastState();
const tools = ["node", "link", "connection"];

function enterNodeCreationMode() {
    modalMetadata.set({toolName: tools[0], operationMode: 'create'});
    createNodeMode.set(true);
    toastState.add('Create new node', 'Click on the canvas to create a new node.', 'info');
}

function enterLinkCreationMode() {
    modalMetadata.set({toolName: tools[1], operationMode: 'create'});
    createLinkMode.set(true);
    toastState.add('Create new link', 'Select two nodes to create a new link', 'info');
}

function enterConnectionCreationMode() {
    modalMetadata.set({toolName: tools[2], operationMode: 'create'});
    createConnectionMode.set(true);
}
</script>

<div class="toolbox-sidebar h-full flex flex-col max-h-full m-2">
    <header class="flex justify-center py-2 sticky top-0 bg-primary-100 dark:bg-slate-800 z-10">
        <h2 class="text-primary-700 dark:text-primary-200 font-semibold text-center w-full">Toolbox</h2>
    </header>
    <div class="flex flex-col gap-2 px-2 pt-2 bg-primary-100 dark:bg-slate-800">
        <input type="text" placeholder="Search..." class="input w-full bg-primary-50 dark:bg-slate-700 border-primary-300 dark:border-slate-600 text-primary-800 dark:text-primary-100 placeholder-primary-500 dark:placeholder-slate-400 focus:border-primary-500 focus:ring-primary-500 text-sm h-8 mb-2" />
    </div>
    <main class="flex-1 flex flex-col gap-2 px-2 py-2 overflow-y-auto min-h-0 bg-primary-100 dark:bg-slate-800">
        <button class="btn btn-create border border-primary-400 bg-primary-200/80 hover:bg-primary-300/90 text-primary-800 hover:border-primary-500 transition-colors h-12 text-xs flex items-center justify-center" on:click={enterNodeCreationMode}>
            <PlusCircleIcon size="16" class="mr-1" />
            <span class="text-center">Create new node</span>
        </button>
        <button class="btn btn-create border border-primary-400 bg-primary-200/80 hover:bg-primary-300/90 text-primary-800 hover:border-primary-500 transition-colors h-12 text-xs flex items-center justify-center" on:click={enterLinkCreationMode}>
            <PlusCircleIcon size="16" class="mr-1" />
            <span class="text-center">Create new link</span>
        </button>
        <button class="btn btn-create border border-primary-400 bg-primary-200/80 hover:bg-primary-300/90 text-primary-800 hover:border-primary-500 transition-colors h-12 text-xs flex items-center justify-center" on:click={enterConnectionCreationMode}>
            <PlusCircleIcon size="16" class="mr-1" />
            <span class="text-center">Create new connection</span>
        </button>
    </main>
</div>

<style>
.toolbox-sidebar {
    width: 180px;
    min-width: 140px;
    max-width: 200px;
    background: transparent;
    border-right: 1px solid rgba(100,116,139,0.15);
    box-shadow: 2px 0 12px 0 rgba(30,41,59,0.05);
    z-index: 20;
    max-height: 100vh;
    height: 100%;
    min-height: 0;
}
.dark .toolbox-sidebar {
    background: transparent;
    border-right: 1px solid rgba(148,163,184,0.15);
    color: #e0e7ef;
}
</style>
