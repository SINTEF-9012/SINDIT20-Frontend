<script lang="ts">
	import { onMount } from 'svelte';
	import Node from '$lib/components/node.svelte';
	import type { Node as NodeType } from '$lib/types';
	import type { Link as LinkType } from '$lib/types';
	import { getNodes } from '$lib/components/nodes-state.svelte';
	import { getLinks } from '$lib/components/links-state.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import Link from '$lib/components/nodes-link.svelte';
	import { createNodeMode, createLinkMode, modalMetadata } from '$lib/stores';
	import type { ModalSettings } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';

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

	let nodesState = getNodes();
	$: nodes = nodesState.nodes;

	let linksState = getLinks();
	$: links = linksState.links;

	let isCreateNodeMode: boolean;
	let isCreateLinkMode: boolean;
	let createNodeModeMetadata: {toolName: string, operationMode: string};
	let selectedCanvasPosition = { x: 0, y: 0 };
	createNodeMode.subscribe((value) => isCreateNodeMode = value);
	createLinkMode.subscribe((value) => isCreateLinkMode = value);
	modalMetadata.subscribe((value) => createNodeModeMetadata = value);

    const modal: ModalSettings = {
        type: 'component',
        component: 'createNew',
        title: "<mode> new <name>",
        body: "<mode> a new <name> in the knowledge graph.",
        meta: {name: 'card', mode: 'create'},
        response: (data: {name: string, description: string}) => console.log('response:', data)
    };

    export function openModal() {
        modal.meta = {
			name: createNodeModeMetadata.toolName,
			mode: createNodeModeMetadata.operationMode,
			position: selectedCanvasPosition
		};
        modalStore.trigger(modal);
    }

	function openToolbox() {
		drawerStore.open({ id: 'toolbox' });
	}

    function handleCanvasClick(event: MouseEvent) {
		// Handle canvas click event

		const canvas = canvasContent;
		const rect = canvas.getBoundingClientRect();
		const x = (event.clientX - rect.left) / zoomLevel;
		const y = (event.clientY - rect.top) / zoomLevel;
		console.log('clicked position:', { x, y });

        if (isCreateNodeMode) {

			// Set the clicked canvas position in the store
			selectedCanvasPosition = ({ x, y });

			// Exit node creation mode
			createNodeMode.set(false);

			// Open the modal to create a new node
			openModal();
		} else if (isCreateLinkMode) {

		} else {return;}
    }

	function handleMouseWheel(event: WheelEvent) {
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

	function applyZoom(originX: number, originY: number, scaleFactor: number) {
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

	function calculateDistance(nodeA: NodeType, nodeB: NodeType) {
		const dx = nodeA.position.x - nodeB.position.x;
		const dy = nodeA.position.y - nodeB.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function applyRepulsion(nodes: NodeType[]) {
		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const distance = calculateDistance(nodes[i], $nodes[j]);
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

	function applySping(nodes: NodeType[], links: LinkType[]) {
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

	function updateNodePositions() {

		let nodes = $nodes.map((node) => ({ ...node }));
		const links = $links.map((link) => ({ ...link }));
		nodes = applyRepulsion(nodes);
		// nodes = applySping(nodes, links); // Uncomment this line to enable spring force

		$nodes = [...nodes]; // trigger reactivity of nodes
		$links = [...links]; // trigger reactivity of links
	}

	function handleMouseDown(event: MouseEvent) {
		// Save the initial mouse position - start dragging state
		initialMousePosition = { x: event.clientX, y: event.clientY };
		isMouseDragging = true;
	}

	function handleMouseUp() {
		// end dragging state
		isMouseDragging = false;
	}

	function handleMouseMove(event: MouseEvent) {
		// Handle dragging the canvas
		if (!isMouseDragging) return;

		const deltaX = event.clientX - initialMousePosition.x;
		const deltaY = event.clientY - initialMousePosition.y;

		canvasContent.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${zoomLevel})`;
		initialMousePosition = { x: event.clientX, y: event.clientY };

		const canvas = canvasRef;
		const context = canvas.getContext('2d');
		context?.clearRect(0, 0, canvas.width, canvas.height);
		$nodes.forEach((node) => {
			node.position.x += deltaX / zoomLevel;
			node.position.y += deltaY / zoomLevel;
		});
	}

	onMount(() => {

		async function createLinks() {
			try {
				await linksState.createLink('link 1', 1, 'left', $nodes[0].id, $nodes[1].id);
				await linksState.createLink('link 2', 2, 'none', $nodes[0].id, $nodes[2].id);
			} catch (error) {
				console.error('Error creating links:', error);
			}
    	}

	    createLinks();

		const canvas = canvasRef;
		const context = canvas.getContext('2d');

		// Set the canvas size to match the parent container
		const parent = canvas.parentElement;
		const { width, height } = parent.getBoundingClientRect();
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
		canvasRef.addEventListener('click', handleCanvasClick);

		const interval = setInterval(updateNodePositions, updateNodePositionsInterval);
		return () => {
			clearInterval(interval);
			canvas.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
			canvasRef.addEventListener('click', handleCanvasClick);
		};
	});
</script>

<div class="flex columns-2 h-5/6">
	<div class="canvas-container flex-1 border border-white h-full w-full">
		<canvas bind:this={canvasRef} style="width: 100%; height: 100%;" on:wheel={handleMouseWheel}
		></canvas>
		<div class="canvas-content" bind:this={canvasContent} style="position: absolute; top: 50%; left: 50%">
				{#each $nodes as node (node.id)}
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
	<div class="toolbox-button-container flex-none">
		<button class="toolbox-button border border-gray-500 bg-gray-300" on:click={openToolbox}>
			<svg class="toolbox-icon" style="transform: rotate(-90deg);" viewBox="0 0 24 24">
				<path d="M12 2L2 22h20L12 2zm-2 16h4v-2h-4v2zm0-4h4v-2h-4v2zm0-4h4V8h-4v2z" fill="currentColor"/>
			</svg>
		</button>
	</div>
</div>

<style>
	.canvas-container {
		position: relative;
		overflow: hidden;
		z-index: 0;
	}
	.toolbox-button-container {
		display: flex;
		align-items: stretch;
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
