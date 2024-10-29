<script lang="ts">
	import type {
		Node as NodeType,
		Property,
	} from '$lib/types';
	import { getNodesState } from './states/nodes-state.svelte';
	import { getPropertiesState } from './states/properties.svelte';
	import { selectedNodes, selectedNodeId, nodeSize } from '$lib/stores';
	import { InfoIcon, SettingsIcon, PlusCircleIcon } from 'svelte-feather-icons';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { createNewNodeProperty } from '$lib/modals/modal-settings';
	import NodeProperties from './node-properties.svelte';

	export let node: NodeType;
	export let zoomLevel = 1;

	const nodesState = getNodesState();
	const propertiesState = getPropertiesState();
	const drawerStore = getDrawerStore();
	const modalStore = getModalStore();

	let offset = { x: 0, y: 0 };
	let moving = false;
	let threshold = 20;
	let nodeSelected = false;
	let selectedNodesIds: string[] = [];
	let showProperties = false;
	let showShortProperties = true;

	let properties: Property[] = [];
	$: properties = properties;

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
		window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stopMoving);
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			stopMoving();
		}
	}

	function stopMoving() {
		moving = false;
		window.removeEventListener('mousemove', move);
		window.removeEventListener('mouseup', stopMoving);
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
		console.log('node properties:', properties);
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

	function toggleProperties() {
		showProperties = !showProperties;
	}

	function shortPropertyName(name: string) {
		return name[0] + '.';
	}

	function handleAddPropertyToNode() {
		createNewNodeProperty.meta.nodeId = node.id;
		modalStore.trigger(createNewNodeProperty);
	}

    onMount(() => {
		const property_uris = nodesState.getAbstractAssetNode(node.id)?.assetProperties;
		const unsubscribe = propertiesState.properties.subscribe((updatedProperties) => {
            properties = propertiesState.getProperties(property_uris);
            // console.log('Properties updated:', properties);
        });

        // Cleanup subscription on component destroy
        return () => {
            unsubscribe();
        };
    });
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
	<button class="node-info variant-soft-primary"
			on:click={onClickInfoButton}>
		<InfoIcon />
	</button>
	<div>
		<button class="node-properties-settings variant-soft-primary"
				on:click={toggleProperties}>
			<SettingsIcon />
		</button>
	</div>
	{#if showProperties}
		<div class="node-properties-box">
			{#each properties as property}
				<NodeProperties {property} propertyValue={property.propertyValue} />
			{/each}
			<div>
				<button class="add-node-property variant-soft-primary" on:click={handleAddPropertyToNode}>
					<PlusCircleIcon /> <span>New property</span>
				</button>
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
	.node-info {
		position: absolute;
		border-radius: 50%;
		top: -16px;
		right: 18px;
		z-index: 3;
	}
	.node-properties-settings {
		position: absolute;
		border-radius: 50%;
		top: 0;
		right: -5px;
		z-index: 3;
	}
	.node-properties-box {
		position: absolute;
		top: -20px;
		left: 100%;
		z-index: 3;
		max-height: 200px;
		overflow-y: scroll;
	}
	.add-node-property {
		display: flex;
		flex-direction: row;
		justify-content: left;
        align-items: center;
		border-radius: 5px;
		padding: 5px;
		margin: 5px;
		gap: 5px;
	}
</style>
