<!-- src/routes/index.svelte -->
<script lang="ts">
    import { getNodes, createAbstractNode } from '$apis/sindit-backend/kg';
    import { onMount } from 'svelte';

    let data;
    let error;

	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"


    let isResizing = false;
    let startX: number;
    let startWidth: number;

    function handleMouseDown(event: MouseEvent) {
        isResizing = true;
        startX = event.clientX;
        startWidth = document.querySelector('.json-editor').offsetWidth;
    }

    function handleMouseMove(event: MouseEvent) {
        if (!isResizing) return;
        const dx = event.clientX - startX;
        const newWidth = startWidth + dx;
        const containerWidth = document.querySelector('.container').offsetWidth;
        document.querySelector('.json-editor').style.width = `${newWidth}px`;
        document.querySelector('.canvas-container').style.width = `${containerWidth - newWidth}px`;

    }

    function handleMouseUp() {
        isResizing = false;
    }

    onMount(async () => {
        try {
            data = await getNodes();
        } catch (err) {
            error = err.message;
        }
    });

    async function handleSubmit() {
        try {
            const result = await createAbstractNode(nodeId, nodeName, nodeDescription);
            console.log(result);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if error}
    <p>Error: {error}</p>
{:else if data}
    <p>Data: {JSON.stringify(data)}</p>
{/if}

<button class="btn variant-outline-success" on:click={handleSubmit}>Submit</button>


<div class="container" on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} role="application">
    <div class="canvas-container">
        Canvas Content
    </div>
    <div class="resizer" on:mousedown={handleMouseDown} role="separator"></div>
    <div class="json-editor">
        Hello World
    </div>
</div>



<style>
    .container {
        display: flex;
        width: 100%;
        height: 90vh;
    }
    .json-editor {
        border: 1px solid white;
        width: 50%;
        min-width: 100px;
    }
    .canvas-container {
        border: 1px solid white;
        width: 50%;
        min-width:50%;
    }
    .resizer {
        width: 5px;
        cursor: col-resize;
        background-color: gray;
    }
</style>
