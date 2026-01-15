<script lang="ts">
	import type { VisualizableNode, Property } from '$lib/types';
	import { getNodesState } from './states/nodes-state.svelte';
	import { getPropertiesState } from './states/properties.svelte';
	import { selectedNodes, selectedNodeId, nodeSize } from '$lib/stores';
	import { InfoIcon, SettingsIcon, PlusCircleIcon } from 'svelte-feather-icons';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { onMount } from 'svelte';
	import { createNewNodeProperty } from '$lib/modals/modal-settings';
	import NodeProperties from './node-properties.svelte';

	export let node: VisualizableNode;
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

	function getNodeDisplayName(node: VisualizableNode): string {
		let displayName: string;

		console.log(`[getNodeDisplayName] Type: ${node.nodeType}, ID: ${node.id}`);
		console.log(`[getNodeDisplayName] Full node:`, node);
		console.log(`[getNodeDisplayName] node.propertyName =`, (node as any).propertyName);
		console.log(
			`[getNodeDisplayName] typeof propertyName =`,
			typeof (node as any).propertyName
		);
		console.log(`[getNodeDisplayName] All keys in node:`, Object.keys(node));

		switch (node.nodeType) {
			case 'AbstractAsset':
				displayName = node.nodeName;
				console.log(`  -> AbstractAsset nodeName: ${displayName}`);
				break;
			case 'AbstractAssetProperty':
				displayName = node.propertyName;
				console.log(`  -> AbstractAssetProperty propertyName: ${displayName}`);
				break;
			case 'StreamingProperty':
				displayName = node.propertyName;
				console.log(`  -> StreamingProperty propertyName: ${displayName}`);
				break;
			case 'TimeseriesProperty':
				displayName = node.propertyName;
				console.log(`  -> TimeseriesProperty propertyName: ${displayName}`);
				break;
			case 'SINDITKG':
				displayName = node.label;
				console.log(`  -> SINDITKG label: ${displayName}`);
				break;
			case 'S3ObjectProperty':
				displayName = node.propertyName;
				console.log(`  -> S3ObjectProperty propertyName: ${displayName}`);
				break;
			case 'PropertyCollection':
				displayName = node.propertyName;
				console.log(`  -> PropertyCollection propertyName: ${displayName}`);
				break;
			default:
				displayName = (node as any).id || 'Unknown Node';
				console.log(`  -> Default: ${displayName}`);
		}

		if (!displayName || displayName === 'undefined') {
			console.warn('Node missing display name - returning ID or Unknown:', {
				nodeType: node.nodeType,
				id: node.id,
				node
			});
			return node.id || 'Unknown';
		}

		console.log(`  -> Final display name: ${displayName}`);
		return displayName;
	}

	function getNodeColor(nodeType: string): string {
		switch (nodeType) {
			case 'AbstractAsset':
				return 'node-abstract-asset';
			case 'AbstractAssetProperty':
				return 'node-abstract-asset-property';
			case 'StreamingProperty':
				return 'node-streaming-property';
			case 'TimeseriesProperty':
				return 'node-timeseries-property';
			case 'SINDITKG':
				return 'node-sinditkg';
			case 'S3ObjectProperty':
				return 'node-s3-property';
			case 'PropertyCollection':
				return 'node-property-collection';
			default:
				return 'node-default';
		}
	}

	$: nodeColor = nodeSelected ? 'node-selected' : getNodeColor(node.nodeType);
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
		if (!node.position) return;
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
		if (moving && node.position) {
			node.position.x = (event.clientX - offset.x) / zoomLevel;
			node.position.y = (event.clientY - offset.y) / zoomLevel;
			node = { ...node };
		}
	}

	function dblclick() {
		const thisNode = nodesState.getAbstractAssetNode(node.id);
		selectedNodes.update((value) => {
			if (value.includes(node.id)) {
				return value.filter((id) => id !== node.id);
			} else {
				return [...value, node.id];
			}
		});
		nodeSelected = !nodeSelected;
	}

	function onClickInfoButton() {
		selectedNodeId.set(node.id);
		drawerStore.open({ id: 'info-drawer-node' });
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
		console.log(`[NODE MOUNTED] Type: ${node.nodeType}, ID: ${node.id}`);
		console.log(`[NODE MOUNTED] Has propertyName:`, (node as any).propertyName);
		console.log(`[NODE MOUNTED] Display name will be:`, getNodeDisplayName(node));
		console.log(
			`[NODE MOUNTED] nodeSize=${nodeSize}, threshold=${threshold}, will show text=${nodeSize >= threshold}`
		);
		// Only load properties for AbstractAsset nodes
		if (node.nodeType === 'AbstractAsset') {
			const property_uris = node.assetProperties;
			if (property_uris) {
				const unsubscribe = propertiesState.properties.subscribe((updatedProperties) => {
					properties = propertiesState.getProperties(property_uris);
				});

				// Cleanup subscription on component destroy
				return () => {
					unsubscribe();
				};
			}
		}
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
	class="node {nodeColor}"
	style="transform: translate({node.position?.x || 0 - nodeSize / 2}px, {node.position?.y ||
		0 - nodeSize / 2}px); width: {nodeSize}px; height: {nodeSize}px;"
>
	{#if nodeSize >= threshold}
		<div class="grid-cols-1 gap-1">
			<div class="text-center">
				<span class="text-gray-700 font-medium" style="font-size: {fontSizeTitle}"
					>{getNodeDisplayName(node)}</span
				>
			</div>
		</div>
	{/if}
	<button class="node-info variant-soft-primary" on:click={onClickInfoButton}>
		<InfoIcon />
	</button>

	{#if node.nodeType === 'AbstractAsset'}
		<div>
			<button
				class="node-properties-settings variant-soft-primary"
				on:click={toggleProperties}
			>
				<SettingsIcon />
			</button>
		</div>
		{#if showProperties}
			<div class="node-properties-box">
				{#each properties as property}
					<NodeProperties {property} propertyValue={property.propertyValue} />
				{/each}
				<div>
					<button
						class="add-node-property variant-soft-primary"
						on:click={handleAddPropertyToNode}
					>
						<PlusCircleIcon /> <span>New property</span>
					</button>
				</div>
			</div>
		{/if}
	{:else if node.nodeType === 'StreamingProperty'}
		<div class="property-info">
			<div class="text-xs text-gray-600">
				Topic: {node.streamingTopic}
			</div>
			<!-- {#if node.propertyValue}
				<div class="text-xs text-gray-600">
					Value: {node.propertyValue}
				</div>
			{/if} -->
		</div>
	{:else if node.nodeType === 'SINDITKG'}
		<div class="kg-info">
			{#if node.assets}
				<div class="text-xs text-gray-600">
					Assets: {node.assets.length}
				</div>
			{/if}
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
		padding: 12px;
		min-width: 10px;
		max-width: 500px;
		overflow-x: visible;
		text-wrap: nowrap;
		z-index: 2;
		border-radius: 50%;
		box-shadow:
			0 4px 15px rgba(0, 0, 0, 0.15),
			0 2px 6px rgba(0, 0, 0, 0.1),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
		border: 3px solid rgba(255, 255, 255, 0.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		backdrop-filter: blur(8px);
		font-weight: 600;
	}

	.node:hover {
		transform: scale(1.08);
		box-shadow:
			0 8px 25px rgba(0, 0, 0, 0.2),
			0 4px 12px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
		border-color: rgba(255, 255, 255, 0.4);
	}

	/* Node type specific colors with gradients */
	.node-abstract-asset {
		background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-streaming-property {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-timeseries-property {
		background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-sinditkg {
		background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
		box-shadow:
			0 6px 20px rgba(248, 113, 113, 0.3),
			0 4px 10px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.2);
	}

	.node-s3-property {
		background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-property-collection {
		background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-abstract-asset-property {
		background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-default {
		background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
		color: white;
		border-color: rgba(255, 255, 255, 0.3);
	}

	.node-selected {
		background: linear-gradient(135deg, #a8a29e 0%, #92928f 100%) !important;
		color: #1f2937 !important;
		transform: scale(1.15);
		box-shadow:
			0 8px 30px rgba(168, 162, 158, 0.4),
			0 4px 15px rgba(0, 0, 0, 0.2),
			inset 0 2px 0 rgba(255, 255, 255, 0.4);
		border-color: rgba(255, 255, 255, 0.6) !important;
		z-index: 10;
	}

	/* Hover effects for specific node types */
	.node-sinditkg:hover {
		box-shadow:
			0 10px 30px rgba(248, 113, 113, 0.4),
			0 6px 15px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.node-abstract-asset:hover {
		box-shadow:
			0 10px 30px rgba(14, 165, 233, 0.3),
			0 6px 15px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	.node-streaming-property:hover {
		box-shadow:
			0 10px 30px rgba(16, 185, 129, 0.3),
			0 6px 15px rgba(0, 0, 0, 0.2),
			inset 0 1px 0 rgba(255, 255, 255, 0.3);
	}

	/* Legacy support - remove these after testing */
	.node.variant-ghost-secondary {
		background-color: #0ea5e9;
		color: rgb(82, 82, 82);
	}

	.node.variant-ghost-primary {
		background-color: #7dd3fc;
		color: rgb(82, 82, 82);
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
