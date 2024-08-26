<script lang="ts">
	import { onMount } from 'svelte';
	import Node from '$lib/components/node.svelte';
	import type { Node as NodeType } from '$lib/types';
	import { getNodes } from '$lib/components/nodes-state.svelte';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import Link from '$lib/components/nodes-link.svelte';

	const drawerStore = getDrawerStore();

	const zoomSpeed = 0.001;
	const maxZoom = 6;
	const minZoom = 0.1;
	const repulsionForce = 50000; // Adjust this value to control the strength of repulsion
	const thresholdDistance = 200; // Minimum distance before repulsion kicks in
	const updateNodePositionsInterval = 1000 / 60; // 60 FPS

	let canvasRef: HTMLCanvasElement;
	let nodeContainer: HTMLDivElement;
	let initialMousePosition = { x: 0, y: 0 };
	let isMouseDragging = false;
	let zoomLevel = 1;

	let nodesState = getNodes();
	$: nodes = nodesState.nodes;

	function openToolbox() {
		drawerStore.open({ id: 'toolbox' });
	}

	function handleMouseWheel(event: WheelEvent) {
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
		nodeContainer.style.transform = `scale(${zoomLevel})`;
	}

	function calculateDistance(nodeA: NodeType, nodeB: NodeType) {
		const dx = nodeA.position.x - nodeB.position.x;
		const dy = nodeA.position.y - nodeB.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function applyRepulsion() {
		const nodes = $nodes.map((node) => ({ ...node }));
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
		$nodes = [...nodes]; // trigger reactivity
	}

	function updateNodePositions() {
		applyRepulsion();
	}

	function handleMouseDown(event: MouseEvent) {
		initialMousePosition = { x: event.clientX, y: event.clientY };
		isMouseDragging = true;
	}

	function handleMouseUp() {
		isMouseDragging = false;
	}

	function handleMouseMove(event: MouseEvent) {
		if (!isMouseDragging) return;

		const deltaX = event.clientX - initialMousePosition.x;
		const deltaY = event.clientY - initialMousePosition.y;

		nodeContainer.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${zoomLevel})`;
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
		const nodesElement = nodeContainer.querySelector('.nodes');
		if (nodesElement) {
			const nodeRect = nodesElement.getBoundingClientRect();
			context?.drawImage(
				nodesElement,
				centerX - nodeRect.width / 2,
				centerY - nodeRect.height / 2
			);
		}

		canvas.addEventListener('mousedown', handleMouseDown);
		window.addEventListener('mouseup', handleMouseUp);
		window.addEventListener('mousemove', handleMouseMove);

		const interval = setInterval(updateNodePositions, updateNodePositionsInterval);
		return () => {
			clearInterval(interval);
			canvas.removeEventListener('mousedown', handleMouseDown);
			window.removeEventListener('mousemove', handleMouseMove);
			window.removeEventListener('mouseup', handleMouseUp);
		};
	});
</script>

<div class="flex columns-2">
	<div class="canvas-container flex-1 border border-white h-4/5 w-full">
		<canvas bind:this={canvasRef} style="width: 100%; height: 100%;" on:wheel={handleMouseWheel}
		></canvas>
		<div class="nodes" bind:this={nodeContainer} style="position: absolute; top: 50%; left: 50%">
			{#each $nodes as node (node.id)}
				<Node
					nodeName={node.nodeName}
					nodeDescription={node.nodeDescription}
					position={node.position}
					{zoomLevel}
				/>
			{/each}
		</div>
        <div class="links" style="position: absolute; top: 50%; left: 50%">
                <Link
                    source={$nodes[1]}
                    target={$nodes[2]}
					{zoomLevel}
                />
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
