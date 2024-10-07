<!-- src/routes/index.svelte -->
<script lang="ts">
    import { getNodes, createAbstractNode } from '$apis/sindit-backend/kg';
    import { onMount } from 'svelte';
    import { JSONEditor } from 'svelte-jsoneditor'

	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"

    let isResizing = false;
    let startX: number;
    let pageWidth: number;
    let canvasWidth: number;
    let editorWidth: number;
    let showJSONEditor = true;
    let data: any;
    let error: string;
    let content = {
        text: undefined, // can be used to pass a stringified JSON document instead
        json: [
            {a: 1},
            {a: 2},
            {a: 3},
        ]
    }
    $: console.log(content)


    async function handleSubmit() {
        try {
            const result = await createAbstractNode(nodeId, nodeName, nodeDescription);
            console.log(result);
        } catch (err) {
            error = err.message;
        }
    }

    function handleMouseDown(event: MouseEvent) {
        isResizing = true;
        startX = event.clientX;
        editorWidth = document.querySelector('.json-editor').clientWidth;
        canvasWidth = document.querySelector('.canvas-container').offsetWidth;
        pageWidth = document.querySelector('.container').clientWidth;
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing) return;
        const dx = event.clientX - startX;
        const canvasNewWidth = canvasWidth + dx;
        const editorNewWidth = pageWidth - canvasNewWidth;
        document.querySelector('.canvas-container').style.width = `${canvasNewWidth}px`;
        document.querySelector('.json-editor').style.width = `${editorNewWidth}px`;

    }

    function handleMouseUp() {
        isResizing = false;
        editorWidth = document.querySelector('.json-editor').clientWidth;
        canvasWidth = document.querySelector('.canvas-container').offsetWidth;
    }

    function toggleJSONEditor() {
        showJSONEditor = !showJSONEditor;
        if (!showJSONEditor) {
            document.querySelector('.canvas-container').style.width = '100%';
        }
    }

    onMount(async () => {
        try {
            data = await getNodes();
        } catch (err) {
            error = err.message;
        }
    });
</script>

{#if error}
    <p>Error: {error}</p>
{:else if data}
    <p>Data: {JSON.stringify(data)}</p>
{/if}

<div class="mt-2">
    <button class="btn variant-outline-success" on:click={handleSubmit}>Submit</button>
    <button class="btn variant-outline-warning" on:click={toggleJSONEditor}>Toggle Editor</button>
</div>

<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<div class="container mt-2" on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} role="application">
    <div class="canvas-container">
        Canvas Content
    </div>
    {#if showJSONEditor}
        <button class="resizer" on:mousedown={handleMouseDown} aria-label="resizer"></button>
        <div class="json-editor jse-theme-dark">
            <JSONEditor bind:content mode="text" />
        </div>
    {/if}
</div>



<style>
    @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
    .container {
        display: flex;
        width: 100%;
        height: 90vh;
    }
    .json-editor {
        border: 1px solid white;
        width: 20%;
        min-width: 380px;
    }
    .canvas-container {
        border: 1px solid white;
        width: 80%;
        min-width:50%;
    }
    .resizer {
        width: 5px;
        cursor: col-resize;
        background-color: gray;
    }
</style>
