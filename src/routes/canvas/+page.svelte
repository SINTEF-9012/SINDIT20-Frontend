<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Node from '$lib/components/node.svelte';
	import type { Node as NodeType } from '$lib/types';
	import type { Link as LinkType } from '$lib/types';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getLinksState } from '$lib/components/states/links-state.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import Link from '$lib/components/nodes-link.svelte';
	import { createNodeMode, createLinkMode, createConnectionMode, selectedNodes, modalMetadata } from '$lib/stores';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { JSONEditor } from 'svelte-jsoneditor'
	import { modeCurrent } from '@skeletonlabs/skeleton';
	import { backendNodesData } from '$lib/stores'


	const drawerStore = getDrawerStore();
	const modalStore = getModalStore();

	const zoomSpeed = 0.001;
	const maxZoom = 6;
	const minZoom = 0.01;
	const springConstant = 0.00001; // Attraction force
	const repulsionForce = 50000; // Adjust this value to control the strength of repulsion
	const thresholdDistance = 300; // Minimum distance before repulsion kicks in
	const updateNodePositionsInterval = 1000 / 60; // 60 FPS

	let canvasRef: HTMLCanvasElement;
	let canvasContent: HTMLDivElement;
	let initialMousePosition = { x: 0, y: 0 };
	let isMouseDragging = false;
	let zoomLevel = 1;

	let nodesState = getNodesState();
	$: abstractAssetNodes = nodesState.assets;

	let linksState = getLinksState();
	$: links = linksState.links;

	let isCreateNodeMode: boolean;
	let isCreateLinkMode: boolean;
	let isCreateConnectionMode: boolean;
	let createNodeModeMetadata: {toolName: string, operationMode: string};
	let selectedCanvasPosition = { x: 0, y: 0 };
	let selectedNodesIds: string[] = [];
	createNodeMode.subscribe((value) => isCreateNodeMode = value);
	createLinkMode.subscribe((value) => isCreateLinkMode = value);
	createConnectionMode.subscribe((value) => isCreateConnectionMode = value);
	modalMetadata.subscribe((value) => createNodeModeMetadata = value);
	selectedNodes.subscribe((value) => selectedNodesIds = value);

    const modalCreateNewAssetNode: ModalSettings = {
        type: 'component',
        component: 'createNewNode',
    };

	const modalCreateNewLink: ModalSettings = {
        type: 'component',
        component: 'createNewLink',
    };

	const modalCreateNewConnection: ModalSettings = {
		type: 'component',
		component: 'createNewConnection',
	};

    export function openModalCreateNewAssetNode(): void {
        modalCreateNewAssetNode.meta = {
			name: createNodeModeMetadata.toolName,
			mode: createNodeModeMetadata.operationMode,
			position: selectedCanvasPosition
		};
        modalStore.trigger(modalCreateNewAssetNode);
    }

	function openModalCreateNewLink(): void {
		modalCreateNewLink.meta = {
			name: 'link',
			mode: 'create'
		};
		modalStore.trigger(modalCreateNewLink);
	}

	function openModalCreateNewConnection(): void {
		modalStore.trigger(modalCreateNewConnection);
	}

	function openToolbox(): void {
		drawerStore.open({ id: 'toolbox' });
	}

	function waitForTwoSelectedNodes(): Promise<string[]> {
		return new Promise((resolve) => {
		const checkCondition = () => {
			if (selectedNodesIds.length === 2) {
				resolve(selectedNodesIds);
			} else {
				requestAnimationFrame(checkCondition);
			}
		};
		checkCondition();
		});
	}

    async function handleCanvasClick(event: MouseEvent): Promise<void> {
		// Handle canvas click event

		const canvas = canvasContent;
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) / zoomLevel;
		const y = (event.clientY - rect.top) / zoomLevel;
		console.log('clicked position:', { x, y });

        if (isCreateNodeMode) {
			// Create a new node

			// Set the clicked canvas position in the store
			selectedCanvasPosition = ({ x, y });

			// Exit node creation mode
			createNodeMode.set(false);

			// Open the modal to create a new node
			openModalCreateNewAssetNode();
		} else if (isCreateLinkMode) {
			const nodes = await waitForTwoSelectedNodes();
			// console.log('sourceNodeId:', nodes);
			createLinkMode.set(false);
			openModalCreateNewLink();
		} else if (isCreateConnectionMode) {
			createConnectionMode.set(false);
			openModalCreateNewConnection();
		}
		else {return;}
    }

	function handleCanvasDoubleClick(event: MouseEvent): void {
		console.log('canvas double clicked');
		// Clear the selected nodes
		selectedNodes.set([]);

	}

	function handleMouseWheel(event: WheelEvent): void {
		// Handle zoom in or out
		event.preventDefault();
		const canvas = canvasRef;
		const rect = canvas.getBoundingClientRect();
		const mouseX = event.clientX - rect.left;
		const mouseY = event.clientY - rect.top;
		const mouseOriginX = mouseX / zoomLevel;
		const mouseOriginY = mouseY / zoomLevel;

		const zoomDelta = event.deltaY * zoomSpeed;
		const newZoomLevel = Math.max(minZoom, Math.min(maxZoom, zoomLevel + zoomDelta));
		const scaleFactor = newZoomLevel / zoomLevel;

		// Update zoom level
		zoomLevel = newZoomLevel;

		// Apply the zoom transformation
		applyZoom(mouseOriginX, mouseOriginY, scaleFactor);
	}

	function applyZoom(originX: number, originY: number, scaleFactor: number): void {
		const canvas = canvasRef;
		const context = canvas.getContext('2d');

		// Clear the canvas
		context?.clearRect(0, 0, canvas.width, canvas.height);

		// Apply the zoom transformation to the canvas
		// context?.setTransform(zoomLevel, 0, 0, zoomLevel, -originX * (scaleFactor - 1), -originY * (scaleFactor - 1));
		context?.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);

		// Apply the zoom transformation to the nodes
		// nodeContainer.style.transformOrigin = `${originX}px ${originY}px`;
		canvasContent.style.transform = `scale(${zoomLevel})`;
	}

	function calculateDistance(nodeA: NodeType, nodeB: NodeType): number {
		const dx = nodeA.position.x - nodeB.position.x;
		const dy = nodeA.position.y - nodeB.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function applyRepulsion(nodes: NodeType[]): NodeType[] {
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const distance = calculateDistance(nodes[i], nodes[j]);
				if (distance < thresholdDistance) {
					const force = repulsionForce / (distance * distance);
					const angle = Math.atan2(
						nodes[j].position.y - nodes[i].position.y,
						nodes[j].position.x - nodes[i].position.x
					);
					nodes[i].position.x -= force * Math.cos(angle);
					nodes[i].position.y -= force * Math.sin(angle);
					nodes[j].position.x += force * Math.cos(angle);
					nodes[j].position.y += force * Math.sin(angle);
				}
			}
		}
		return nodes;
	}

	function applySping(nodes: NodeType[], links: LinkType[]): NodeType[] {
		for (let i = 0; i < links.length; i++) {
			const source = nodes.find((node) => node.id === links[i].sourceNodeId);
			const target = nodes.find((node) => node.id === links[i].targetNodeId);
			if (source && target) {
				const distance = calculateDistance(source, target);
				const dx = target.position.x - source.position.x;
				const dy = target.position.y - source.position.y;
				const angle = Math.atan2(dy, dx);
				const force = (distance - links[i].linkWeight) * springConstant;
				source.position.x += force * Math.cos(angle);
				source.position.y += force * Math.sin(angle);
				target.position.x -= force * Math.cos(angle);
				target.position.y -= force * Math.sin(angle);
			}
		}
		return nodes;
	}

	function updateNodePositions(): void {

		let nodes = $abstractAssetNodes.map((node) => ({ ...node }));
		const links = $links.map((link) => ({ ...link }));
		nodes = applyRepulsion(nodes);
		// nodes = applySping(nodes, links); // Uncomment this line to enable spring force

		$abstractAssetNodes = [...nodes]; // trigger reactivity of nodes
		$links = [...links]; // trigger reactivity of links
	}

	function handleMouseDown(event: MouseEvent): void {
		// Save the initial mouse position - start dragging state
		initialMousePosition = { x: event.clientX, y: event.clientY };
		isMouseDragging = true;
	}

	function handleMouseUp(): void {
		// end dragging state
		isMouseDragging = false;
	}

	function handleMouseMove(event: MouseEvent): void {
		// Handle dragging the canvas
		if (!isMouseDragging) return;

		const deltaX = event.clientX - initialMousePosition.x;
		const deltaY = event.clientY - initialMousePosition.y;

		canvasContent.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${zoomLevel})`;
		initialMousePosition = { x: event.clientX, y: event.clientY };

		const canvas = canvasRef;
		const context = canvas.getContext('2d');
		context?.clearRect(0, 0, canvas.width, canvas.height);
		$abstractAssetNodes.forEach((node) => {
			node.position.x += deltaX / zoomLevel;
			node.position.y += deltaY / zoomLevel;
		});
	}

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
    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "jse-theme-dark" : "";


    function handleMouseDownEditorResize(event: MouseEvent) {
        isResizing = true;
        startX = event.clientX;
        editorWidth = document.querySelector('.json-editor').clientWidth;
        canvasWidth = document.querySelector('.canvas-container').offsetWidth;
        pageWidth = document.querySelector('.container').clientWidth;
    }

    function handleMouseMoveEditorResize(event: MouseEvent) {
        if (!isResizing) return;
        const dx = event.clientX - startX;
        const canvasNewWidth = canvasWidth + dx;
        const editorNewWidth = pageWidth - canvasNewWidth;
        document.querySelector('.canvas-container').style.width = `${canvasNewWidth}px`;
        document.querySelector('.json-editor').style.width = `${editorNewWidth}px`;

    }

    function handleMouseUpEditorResize() {
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


	let interval: NodeJS.Timeout;
	onMount(() => {

		const canvas = canvasRef;
		const context = canvas.getContext('2d');

		// Set the canvas size to match the parent container
		const parent = canvas.parentElement;
		const { width, height } = parent ? parent.getBoundingClientRect() : { width: 100, height: 100 };
		canvas.width = width;
		canvas.height = height;

		// Your canvas drawing code goes here
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		// Nodes component
		const canvasContent = canvasRef.querySelector('.canvas-content');
		if (canvasContent) {
			const nodeRect = canvasContent.getBoundingClientRect();
			context?.drawImage(
				canvasContent,
				centerX - nodeRect.width / 2,
				centerY - nodeRect.height / 2
			);
		}

		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('click', handleCanvasClick);
		canvas.addEventListener('dblclick', handleCanvasDoubleClick);

		interval = setInterval(updateNodePositions, updateNodePositionsInterval);
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
		const canvas = canvasRef;
		if (!canvas) return;

		clearInterval(interval);
		canvas.removeEventListener('mousedown', handleMouseDown);
		window.removeEventListener('mousemove', handleMouseMove);
		window.removeEventListener('mouseup', handleMouseUp);
		canvas.removeEventListener('click', handleCanvasClick);
		canvas.removeEventListener('dblclick', handleCanvasDoubleClick);
	});
</script>

<div class="canvas-page">
	<div class="toolbox-button-container flex-none">
		<button class="toolbox-button border border-black variant-glass-primary" on:click={openToolbox}>
			<svg class="toolbox-icon" style="transform: rotate(90deg);" viewBox="0 0 24 24">
				<path d="M12 2L2 22h20L12 2zm-2 16h4v-2h-4v2zm0-4h4v-2h-4v2zm0-4h4V8h-4v2z" fill="currentColor"/>
			</svg>
		</button>
	</div>
    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
    <div class="container" on:mouseup={handleMouseUpEditorResize} on:mousemove={handleMouseMoveEditorResize} role="application">
		<div class="canvas-container">
			<canvas class="canvas" bind:this={canvasRef} on:wheel={handleMouseWheel}></canvas>
			<div class="canvas-content" bind:this={canvasContent}>
				{#each $abstractAssetNodes as node (node.id)}
					<Node
						{node}
						{zoomLevel}
					/>
				{/each}
				{#each $links as link (link.id)}
					<Link
						{link}
						{zoomLevel}
					/>
				{/each}
			</div>
		</div>
		{#if showJSONEditor}
			<button class="resizer" on:mousedown={handleMouseDownEditorResize} aria-label="resizer"></button>
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
	.canvas-container {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
		border: 1px solid white;
	}
    .resizer {
        width: 5px;
        cursor: col-resize;
        background-color: gray;
    }
	.json-editor {
        border: 1px solid white;
        width: 380px;
        min-width: 380px;
    }
	.canvas {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		z-index: 0;
	}
	.canvas-content {
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 0;
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
