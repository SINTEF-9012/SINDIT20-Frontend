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
	import ToolboxSidebar from './ToolboxSidebar.svelte';

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

	let isResizing = false;
    let startX: number;
    let pageWidth: number;
    let canvasWidth: number;
    let editorWidth: number;
    let showJSONEditor = true;
    $: content = {
        text: undefined, // can be used to pass a stringified JSON document instead
        json: $backendNodesData,
    }
    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "jse-theme-dark" : "";

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

		// Apply repulsion with type preservation
		const updatedNodes = applyRepulsion(nodes);
		// Preserve the nodeType property when updating
		const typedNodes = updatedNodes.map(node => ({
			...node,
			nodeType: 'AbstractAsset' as const,
		}));

		// nodes = applySping(nodes, links); // Uncomment this line to enable spring force

		$abstractAssetNodes = [...typedNodes]; // trigger reactivity of nodes
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

    function handleMouseDownEditorResize(event: MouseEvent) {
        isResizing = true;
        startX = event.clientX;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;
        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
        const pageEl = document.querySelector('.container') as HTMLElement;

        if (editorEl && canvasEl && pageEl) {
            editorWidth = editorEl.clientWidth;
            canvasWidth = canvasEl.offsetWidth;
            pageWidth = pageEl.clientWidth;
        }
    }

    function handleMouseMoveEditorResize(event: MouseEvent) {
        if (!isResizing) return;
        const dx = event.clientX - startX;
        const canvasNewWidth = canvasWidth + dx;
        const editorNewWidth = pageWidth - canvasNewWidth;

        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;

        if (canvasEl && editorEl) {
            canvasEl.style.width = `${canvasNewWidth}px`;
            editorEl.style.width = `${editorNewWidth}px`;
        }
    }

    function handleMouseUpEditorResize() {
        isResizing = false;
        const editorEl = document.querySelector('.json-editor') as HTMLElement;
        const canvasEl = document.querySelector('.canvas-container') as HTMLElement;

        if (editorEl && canvasEl) {
            editorWidth = editorEl.clientWidth;
            canvasWidth = canvasEl.offsetWidth;
        }
    }

    function toggleJSONEditor() {
        showJSONEditor = !showJSONEditor;
        if (!showJSONEditor) {
            const canvasEl = document.querySelector('.canvas-container') as HTMLElement;
            if (canvasEl) {
                canvasEl.style.width = '100%';
            }
        }
    }

	let showToolbox = true;
	function toggleToolbox() {
		showToolbox = !showToolbox;
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

		// Nodes component - Skip drawing canvas content as it contains DOM elements
		// const canvasContent = canvasRef.querySelector('.canvas-content');
		// if (canvasContent) {
		// 	const nodeRect = canvasContent.getBoundingClientRect();
		// 	context?.drawImage(
		// 		canvasContent,
		// 		centerX - nodeRect.width / 2,
		// 		centerY - nodeRect.height / 2
		// 	);
		// }

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
    <!-- Toolbox Sidebar Toggle Button -->
    <button class="toolbox-toggle-btn absolute top-4 left-4 z-30 bg-primary-600 text-white rounded-full shadow-lg p-2 hover:bg-primary-700 transition-all" on:click={toggleToolbox} aria-label={showToolbox ? 'Hide toolbox' : 'Show toolbox'}>
        {#if showToolbox}
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        {:else}
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 12h16"/></svg>
        {/if}
    </button>
    <div class="canvas-layout h-full w-full flex flex-row min-h-0 max-h-full">
        {#if showToolbox}
            <div class="toolbox-sidebar-container flex-shrink-0 h-full min-h-0 flex flex-col">
                <ToolboxSidebar />
            </div>
        {/if}
        <div class="main-columns flex-1 h-full min-h-0 flex flex-row gap-0 max-h-full">
            <div class="canvas-scroll flex-1 h-full min-h-0 overflow-y-auto max-h-full flex flex-col">
                <div class="canvas-container h-full min-h-0 relative flex-1">
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
            </div>
            {#if showJSONEditor}
                <div class="json-editor-scroll flex-shrink-0 h-full min-h-0 overflow-y-auto max-h-full flex flex-col">
                    <div class="json-editor-container {darkMode} h-full min-h-0 flex flex-col">
                        <div class="json-editor-header">
                            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Data Inspector</h3>
                            <button
                                class="close-btn"
                                on:click={toggleJSONEditor}
                                aria-label="Close editor"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="json-editor {darkMode} flex-1 min-h-0">
                            <JSONEditor bind:content mode={'text'} />
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    </div>
</div>

<style>
    @import 'svelte-jsoneditor/themes/jse-theme-dark.css';

    .canvas-page {
        position: relative;
        display: flex;
        width: 100%;
        height: 100vh;
        min-height: 0;
        gap: 0;
        margin: 0;
        padding: 0;
        max-height: 100vh;
    }
    .canvas-layout {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
    }
    .toolbox-sidebar-container {
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: none;
        z-index: 20;
        max-height: 100%;
        overflow-y: auto;
    }
    .main-columns {
        display: flex;
        flex-direction: row;
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        gap: 0;
    }
    .canvas-scroll {
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .json-editor-scroll {
        width: 380px;
        min-width: 300px;
        max-width: 480px;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
    }
    .json-editor-container {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
    }
    .toolbox-toggle-btn {
        position: absolute;
        left: 1rem;
        top: 1rem;
        z-index: 30;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .container {
        display: flex;
        height: 100%;
        min-height: 0;
        width: 100%;
        gap: 0;
        backdrop-filter: blur(10px);
        background: rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        max-height: 100vh;
    }

    .canvas-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
        border-radius: 1rem 0 0 1rem;
    }

    .resizer-container {
        display: flex;
        align-items: center;
        width: 8px;
        background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.2), rgba(255,255,255,0.1));
    }

    .resizer {
        width: 100%;
        height: 60px;
        cursor: col-resize;
        background: transparent;
        border: none;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .resizer:hover {
        background: rgba(255, 255, 255, 0.2);
    }

    .resizer-handle {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .resizer-dots {
        display: flex;
        flex-direction: column;
        gap: 3px;
        align-items: center;
    }

    .dot {
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transition: all 0.2s ease;
    }

    .resizer:hover .dot {
        background: rgba(255, 255, 255, 0.9);
        transform: scale(1.2);
    }

    .json-editor-container {
        width: 380px;
        min-width: 300px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(20px);
        border-radius: 0 1rem 1rem 0;
        display: flex;
        flex-direction: column;
        border-left: 1px solid rgba(255, 255, 255, 0.3);
    }

    .json-editor-container.jse-theme-dark {
        background: rgba(30, 41, 59, 0.95);
        color: white;
    }

    .json-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
    }

    .close-btn {
        background: none;
        border: none;
        color: #64748b;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        transition: all 0.2s ease;
    }

    .close-btn:hover {
        background: rgba(248, 113, 113, 0.1);
        color: #ef4444;
    }

    .json-editor {
        flex: 1;
        min-height: 0;
        background: transparent;
    }

    .canvas {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 0;
        border-radius: 1rem 0 0 1rem;
    }

    .canvas-content {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 1;
    }

    .toolbox-button-container {
        display: flex;
        align-items: stretch;
        width: 50px;
        z-index: 10;
    }

    .toolbox-button {
        width: 100%;
        height: 100%;
        padding: 0;
        box-sizing: border-box;
        border-radius: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        cursor: pointer;
    }

    .toolbox-icon {
        width: 24px;
        height: 24px;
    }
</style>
