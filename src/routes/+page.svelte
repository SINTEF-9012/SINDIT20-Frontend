<!-- src/routes/index.svelte -->
<script lang="ts">
    import { modeCurrent } from '@skeletonlabs/skeleton';
    import { backendNodesData } from '$lib/stores'
    import { onMount } from 'svelte';


	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"

    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "jse-theme-dark" : "";


    function handleData(data: any) {
        console.log(data);
    }

    onMount(() => {
        // streamData("streamingproperty2tilt", handleData);
    });
</script>

<div class="flex flex-col items-center justify-center h-full w-full">
    <span class="text-2xl text-cyan-700 font-bold opacity-60">Welcome! Select a workspace or open the canvas.</span>
</div>

<style>
    @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
    .canvas-page {
        /* Remove fixed, use flex for layout */
        min-height: 70vh;
        width: 100%;
        margin-top: 0;
        background: none;
    }
    .container {
        /* No longer used */
        display: none;
    }
</style>
