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
	let panOffset = { x: 0, y: 0 };

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
    $: darkMode = $modeCurrent === false ? "dark" : "";

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
		// Account for pan offset and zoom level in click position calculation
		const x = ((event.clientX - rect.left - panOffset.x) / zoomLevel);
		const y = ((event.clientY - rect.top - panOffset.y) / zoomLevel);
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
		context?.setTransform(zoomLevel, 0, 0, zoomLevel, 0, 0);

		// Apply the combined transform (pan + zoom) to the nodes container
		canvasContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;
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

		// Update pan offset instead of directly moving nodes
		panOffset.x += deltaX;
		panOffset.y += deltaY;

		// Apply the transform with current pan and zoom
		canvasContent.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`;

		initialMousePosition = { x: event.clientX, y: event.clientY };

		const canvas = canvasRef;
		const context = canvas.getContext('2d');
		context?.clearRect(0, 0, canvas.width, canvas.height);
	}

	function resetCanvasView(): void {
		// Reset zoom level
		zoomLevel = 1;

		// Reset pan offset
		panOffset = { x: 0, y: 0 };

		// Apply the reset transform
		canvasContent.style.transform = `translate(0px, 0px) scale(1)`;

		// Clear canvas
		const canvas = canvasRef;
		const context = canvas.getContext('2d');
		context?.clearRect(0, 0, canvas.width, canvas.height);
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
	let isToolboxCollapsed = false;

	function toggleToolbox() {
		showToolbox = !showToolbox;
	}

	function toggleToolboxCollapsed() {
		isToolboxCollapsed = !isToolboxCollapsed;
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
		canvas.addEventListener('wheel', handleMouseWheel);

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
		canvas.removeEventListener('wheel', handleMouseWheel);
	});
</script>

<div class="canvas-page">
    <div class="canvas-layout h-full w-full flex flex-row min-h-0 max-h-full">
        <!-- Toolbox Sidebar -->
        {#if showToolbox}
            <div class="toolbox-sidebar-container flex-shrink-0 h-full min-h-0 flex flex-col">
                <ToolboxSidebar collapsed={isToolboxCollapsed} />
            </div>
        {/if}

        <!-- Main Content Area -->
        <div class="main-columns flex-1 h-full min-h-0 flex flex-row gap-0 max-h-full">
            <!-- Canvas Area -->
            <div class="canvas-scroll flex-1 h-full min-h-0 overflow-hidden max-h-full flex flex-col">
                <!-- Canvas Controls -->
                <div class="canvas-controls">
                    <div class="controls-left">
                        {#if !showToolbox}
                            <button class="control-btn" on:click={toggleToolbox} title="Show Toolbox">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18M3 12h18M3 18h18"/>
                                </svg>
                            </button>
                        {/if}
                        <button class="control-btn" on:click={toggleToolboxCollapsed} title={isToolboxCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}>
                            {#if isToolboxCollapsed}
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
                                </svg>
                            {:else}
                                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
                                </svg>
                            {/if}
                        </button>
                        <div class="zoom-display">
                            {Math.round(zoomLevel * 100)}%
                        </div>
                        <div class="node-counts">
                            <span class="count-item">Assets: {$abstractAssetNodes.length}</span>
                            <span class="count-item">Links: {$links.length}</span>
                        </div>
                    </div>

                    <div class="controls-right">
                        <button class="control-btn" on:click={resetCanvasView} title="Reset View">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                                <path d="M21 3v5h-5"/>
                                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                                <path d="M3 21v-5h5"/>
                            </svg>
                        </button>
                        <button class="control-btn" on:click={toggleJSONEditor} title={showJSONEditor ? 'Hide Inspector' : 'Show Inspector'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                                <polyline points="10,9 9,9 8,9"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Canvas Container -->
                <div class="canvas-container h-full min-h-0 relative flex-1">
                    <canvas
                        class="canvas"
                        bind:this={canvasRef}
                        on:wheel={handleMouseWheel}
                        on:mousedown={handleMouseDown}
                        on:mousemove={handleMouseMove}
                        on:mouseup={handleMouseUp}
                        on:click={handleCanvasClick}
                        on:dblclick={handleCanvasDoubleClick}
                    ></canvas>
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

                    <!-- Canvas Status -->
                    {#if $abstractAssetNodes.length === 0}
                        <div class="empty-state">
                            <div class="empty-state-content">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                <h3>No nodes yet</h3>
                                <p>Create your first node using the toolbox on the left</p>
                            </div>
                        </div>
                    {/if}
                </div>
            </div>

            <!-- JSON Editor Panel -->
            {#if showJSONEditor}
                <div class="json-editor-scroll flex-shrink-0 h-full min-h-0 overflow-y-auto max-h-full flex flex-col">
                    <div class="json-editor-container {darkMode} h-full min-h-0 flex flex-col">
                        <div class="json-editor-header">
                            <h3 class="text-sm font-semibold">Data Inspector</h3>
                            <button class="close-btn" on:click={toggleJSONEditor} title="Close Inspector">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div class="json-editor {darkMode} flex-1 min-h-0">
                            <JSONEditor bind:content />
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
        background: rgb(248, 250, 252);
    }

    :global(.dark) .canvas-page {
        background: #0f172a;
    }

    .canvas-layout {
        display: flex;
        flex-direction: row;
        width: 100%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        gap: 0;
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
        transition: transform 0.3s ease, opacity 0.3s ease;
    }

    .main-columns {
        display: flex;
        flex-direction: row;
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        gap: 0;
        overflow: hidden;
        background: transparent;
    }

    .canvas-scroll {
        flex: 1 1 0%;
        height: 100%;
        min-height: 0;
        max-height: 100vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    /* Canvas Controls */
    .canvas-controls {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        background: #ffffff;
        border-bottom: 1px solid #e5e7eb;
        min-height: 64px;
        z-index: 10;
    }

    :global(.dark) .canvas-controls {
        background: #334155;
        border-bottom: 1px solid #374151;
    }

    .controls-left,
    .controls-center,
    .controls-right {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: transparent;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .control-btn:hover {
        background: #f9fafb;
        border-color: #d1d5db;
        color: #374151;
    }

    :global(.dark) .control-btn {
        border-color: #475569;
        color: #94a3b8;
    }

    :global(.dark) .control-btn:hover {
        background: #334155;
        border-color: #64748b;
        color: #f1f5f9;
    }

    .zoom-display {
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        padding: 4px 8px;
        background: #f3f4f6;
        border-radius: 4px;
        min-width: 50px;
        text-align: center;
    }

    :global(.dark) .zoom-display {
        color: #94a3b8;
        background: #374151;
    }

    .node-counts {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    }

    .count-item {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        white-space: nowrap;
        color: #6b7280;
    }

    :global(.dark) .count-item {
        background: rgba(0, 0, 0, 0.2);
        color: #94a3b8;
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
        border-left: 1px solid #e5e7eb;
    }

    :global(.dark) .json-editor-scroll {
        border-left: 1px solid #374151;
    }

    .json-editor-container {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: flex;
        flex-direction: column;
        background: white;
    }

    .json-editor-container.jse-theme-dark {
        background: #1e293b;
        color: white;
    }

    .json-editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border-bottom: 1px solid #e5e7eb;
        background: #ffffff;
        min-height: 64px;
    }

    :global(.dark) .json-editor-header {
        border-bottom: 1px solid #374151;
        background: #334155;
    }

    .json-editor-header h3 {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
        margin: 0;
    }

    :global(.dark) .json-editor-header h3 {
        color: #f1f5f9;
    }

    .close-btn {
        background: none;
        border: none;
        color: #6b7280;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-btn:hover {
        background: #f3f4f6;
        color: #374151;
    }

    :global(.dark) .close-btn {
        color: #94a3b8;
    }

    :global(.dark) .close-btn:hover {
        background: #475569;
        color: #f1f5f9;
    }

    .json-editor {
        flex: 1;
        min-height: 0;
        background: transparent;
    }

    .canvas-container {
        position: relative;
        overflow: hidden;
        width: 100%;
        height: 100%;
        background: rgb(250, 250, 250);
        flex: 1;
    }

    :global(.dark) .canvas-container {
        background: #1a1a1a;
    }

    .canvas {
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
        z-index: 0;
        cursor: grab;
    }

    .canvas:active {
        cursor: grabbing;
    }

    .canvas-content {
        position: absolute;
        top: 50%;
        left: 50%;
        z-index: 1;
        transform-origin: 0 0;
    }

    /* Empty State */
    .empty-state {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
    }

    .empty-state-content {
        text-align: center;
        color: #6b7280;
        max-width: 300px;
    }

    :global(.dark) .empty-state-content {
        color: #94a3b8;
    }

    .empty-state-content svg {
        margin: 0 auto 16px;
        opacity: 0.5;
    }

    .empty-state-content h3 {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #374151;
    }

    :global(.dark) .empty-state-content h3 {
        color: #f1f5f9;
    }

    .empty-state-content p {
        font-size: 14px;
        margin: 0;
        opacity: 0.8;
    }
</style>
