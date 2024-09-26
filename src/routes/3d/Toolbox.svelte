<script lang="ts">
	import { createEventDispatcher, onDestroy } from "svelte";
    import { selected3DModel } from "$lib/stores";
    import type { GLTFModel } from "$lib/types";

    export let models: GLTFModel[];

    const dispatcher = createEventDispatcher()

    function closeToolbox() {
        dispatcher('closeToolbox', {message: 'close'})
    }

    function handleSelectModel(model: GLTFModel) {
        selected3DModel.set(model)
    }

    function enableAddNodeMode() {
        dispatcher('addNodeMode', {message: 'addNodeMode'})
        closeToolbox()
    }

    let _selected3DModel: GLTFModel;
    const unsubscribe = selected3DModel.subscribe(value => {
        _selected3DModel = value;
    });

    $: {
        handleSelectModel(_selected3DModel)
    }

    onDestroy(() => {
        unsubscribe()
    })
</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">3D Toolbox</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        <label>
            <select class="input text-white" bind:value={_selected3DModel}>
                {#each models as model}
                    <option value={model}>{model.name}</option>
                {/each}
            </select>
        </label>
        <button class="btn variant-ghost-primary" on:click={enableAddNodeMode}>
            Add new Node
        </button>
    </main>
    <footer class="footer flex justify-center">
        <button class="btn variant-ghost-warning" on:click={closeToolbox}>
            Close 3D Toolbox
        </button>
    </footer>
</div>

<style>
    .toolbox-content {
        display: flex;
        flex-direction: column;
        height: 90vh;
        overflow-y: scroll;
    }

    .footer {
        margin-top: auto;
    }
</style>
