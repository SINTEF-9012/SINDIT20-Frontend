<!-- src/routes/index.svelte -->
<script lang="ts">
    import { JSONEditor } from 'svelte-jsoneditor'
    import { modeCurrent } from '@skeletonlabs/skeleton';
    import { backendNodesData } from '$lib/stores'
    import { streamData } from '$apis/sindit-backend/kg';
    import { onMount } from 'svelte';


	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"

    let isResizing = false;
    let startX: number;
    let pageWidth: number;
    let canvasWidth: number;
    let editorWidth: number;
    let showJSONEditor = true;
    let content = {
        text: undefined, // can be used to pass a stringified JSON document instead
        json: $backendNodesData,
    }
    $: console.log(content)

    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "jse-theme-dark" : "";


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

    function handleData(data: any) {
        console.log(data);
    }

    onMount(() => {
        streamData("streamingproperty2tilt", handleData);
    });
</script>



<div class="canvas-page">
	<div class="toolbox-button-container">
		<button class="toolbox-button border border-black variant-glass-primary" on:click={() => console.log("hello world")}>
			<svg class="toolbox-icon" style="transform: rotate(90deg);" viewBox="0 0 24 24">
				<path d="M12 2L2 22h20L12 2zm-2 16h4v-2h-4v2zm0-4h4v-2h-4v2zm0-4h4V8h-4v2z" fill="currentColor"/>
			</svg>
		</button>
	</div>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="container" on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} role="application">
        <div class="canvas-container">
            Canvas Content
        </div>
        {#if showJSONEditor}
            <button class="resizer" on:mousedown={handleMouseDown} aria-label="resizer"></button>
            <div class="json-editor {darkMode}">
                <JSONEditor bind:content mode="text" />
            </div>
        {/if}
    </div>
</div>



<style>
    @import 'svelte-jsoneditor/themes/jse-theme-dark.css';
    .canvas-page {
        position: fixed;
        display: flex;
        width: 100%;
        height: calc(100% - 4rem - 20px);
        margin-top: 10px;
    }
    .container {
        display: flex;
        height: 90vh;
        width: calc(100% - 10px);
        height: 100%;
        min-width: 50%;
        max-width: calc(100% - 10px);
        margin-right: 2.5rem;
    }
    .json-editor {
        border: 1px solid white;
        width: 380px;
        min-width: 380px;
    }
    .canvas-container {
        border: 1px solid white;
        width: calc(100% - 385px);
        min-width: 50%;
        position: relative;
        overflow: hidden;
        z-index: 0;
    }
    .resizer {
        width: 5px;
        cursor: col-resize;
        background-color: gray;
    }
	.toolbox-button-container {
		display: flex;
		align-items: stretch;
		width: 10px;
	}
	.toolbox-button {
		right: 0;
		width: 10px;
		height: 100%;
		padding: 0;
		box-sizing: border-box;
		max-width: 10px;
	}
</style>
