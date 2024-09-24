<script lang="ts">
	import { getNodes } from './states/nodes-state.svelte';
	import type { Node as NodeType } from '$lib/types';
	import { selectedNodes, selectedNodeId, nodeSize } from '$lib/stores';
	import { InfoIcon } from 'svelte-feather-icons';
	import { getDrawerStore } from '@skeletonlabs/skeleton';

	export let node: NodeType;
	export let zoomLevel = 1;

	const nodesState = getNodes();
	const drawerStore = getDrawerStore();

	let offset = { x: 0, y: 0 };
	let moving = false;
	let threshold = 20;
	let nodeSelected = false;
	let selectedNodesIds: string[] = [];

	const fontSize = nodeSize * 0.15;
	const fontSizeTitle = fontSize * 1.1 + 'px';
	const fontSizeDescription = fontSize * 0.8 + 'px';

	$: nodeSelectedBackground = nodeSelected ? 'variant-ghost-secondary' : 'variant-ghost-primary';
	$: selectedNodesIds = [];

	selectedNodes.subscribe((value) => {
		selectedNodesIds = value;
	});

	$: {
		if (selectedNodesIds.includes(node.id)) {
			nodeSelected = true;
		} else {
			nodeSelected = false;
		}
	}

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
		const thisNode = nodesState.getAbstractAssetNode(node.id);
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

	function onClickInfoButton() {
		console.log("node", node)
		selectedNodeId.set(node.id);
		drawerStore.open({id: 'info-drawer-node'});
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
	class="node border border-primary-500 border-1 {nodeSelectedBackground}"
	style="transform: translate({node.position.x - nodeSize / 2}px, {node.position.y - nodeSize / 2}px); width: {nodeSize}px; height: {nodeSize}px;"
>
	{#if nodeSize >= threshold}
		<div class="grid-cols-1 gap-1">
			<div class="text-center">
				<span class="text-white" style="font-size: {fontSizeTitle}">{node.nodeName}</span>
			</div>
			<div class="text-center">
				<span class="text-gray-400" style="font-size: {fontSizeDescription}"
					>{node.description}</span
				>
			</div>
		</div>
	{/if}
	<button class="node-info top-0 left-0 variant-soft-primary"
			on:click={onClickInfoButton}>
		<InfoIcon />
	</button>
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
	.node-info {
		position: absolute;
		border-radius: 50%;
		z-index: 3
	}
</style>
