<script lang="ts">
	import { getNodes } from './nodes-state.svelte';
	import type { Node as NodeType } from '$lib/types';
	import { selectedNodes } from '$lib/stores';

	export let node: NodeType;
	export let zoomLevel = 1;

	const nodesState = getNodes();

	let offset = { x: 0, y: 0 };
	let moving = false;
	let threshold = 20;
	let nodeSelected = false;
	let selectedNodesIds: string[] = []; // selectedNodesIds;

	selectedNodes.subscribe((value) => {
		selectedNodesIds = value;
	});

	$: fontSize = node.size * 0.15;
	$: fontSizeTitle = fontSize * 1.1 + 'px';
	$: fontSizeDescription = fontSize * 0.8 + 'px';
	$: borderThickness = nodeSelected ? 'border-4' : 'border-1';

	function startMoving(event: MouseEvent) {
		moving = true;
		offset.x = event.clientX - node.position.x * zoomLevel;
		offset.y = event.clientY - node.position.y * zoomLevel;
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			stopMoving();
		}
	}

	function stopMoving() {
		moving = false;
	}

	function move(event: MouseEvent) {
		if (moving) {
			node.position.x = (event.clientX - offset.x) / zoomLevel;
			node.position.y = (event.clientY - offset.y) / zoomLevel;
			node = {...node};
		}
	}


	function dblclick() {
		const thisNode = nodesState.getNode(node.id);
		console.log('node dblclick:', thisNode);
		selectedNodes.update((value) => {
			if (value.includes(node.id)) {
				return value.filter((id) => id !== node.id);
			} else {
				return [...value, node.id];
			}
		});
		nodeSelected = !nodeSelected;
		console.log('selectedNodesIds:', selectedNodesIds);
	}

</script>

<svelte:window on:mouseup={stopMoving} />

<div
	on:mousedown={startMoving}
	on:keydown={onKeyDown}
	on:mousemove={move}
	on:dblclick={() => dblclick()}
	tabindex="0"
	role="button"
	class="node border border-primary-500 {borderThickness} bg-surface-500 bg-transparent"
	style="transform: translate({node.position.x - node.size / 2}px, {node.position.y - node.size / 2}px); width: {node.size}px; height: {node.size}px;"
>
	{#if node.size >= threshold}
		<div class="grid-cols-1 gap-1">
			<div class="text-center">
				<span class="text-white" style="font-size: {fontSizeTitle}">{node.nodeName}</span>
			</div>
			<div class="text-center">
				<span class="text-gray-400" style="font-size: {fontSizeDescription}"
					>{node.nodeDescription}</span
				>
			</div>
		</div>
	{/if}
</div>

<style>
	.node {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: absolute;
		cursor: move;
		user-select: none;
		padding: 10px;
		min-width: 10px;
		max-width: 500px;
		overflow-x: visible;
		text-wrap: nowrap;
		border-radius: 50%; /* make it a circle */
		z-index: 2;
	}
</style>
