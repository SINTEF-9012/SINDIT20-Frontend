<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { getNodesState } from './states/nodes-state.svelte';
	import { getPropertiesState } from './states/properties.svelte';
	import { selectedNodeId } from '$lib/stores';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { createNewNodeProperty } from '$lib/modals/modal-settings';
	import { onMount } from 'svelte';
	import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon } from 'svelte-feather-icons';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';
	import type { Node as NodeType, Property } from '$lib/types';

	import DisplayAbstractAssetProperty from './display-abstract-asset-property.svelte';
	import DisplayStreamingProperty from './display-streaming-property.svelte';
	import DisplayS3Property from './display-s3-property.svelte';

	const modalStore = getModalStore();
	const drawerStore = getDrawerStore();
	const nodesState = getNodesState();
	const propertiesState = getPropertiesState();
	const node: NodeType = nodesState.getAbstractAssetNode($selectedNodeId) as NodeType;

	let properties: Property[] = [];
	$: properties = properties;

	$: isAbstractAssetPropertiesClosed = true;
	$: isStreamingPropertiesClosed = true;
	$: isS3PropertiesClosed = true;

	const settingsInfoDrawer: DrawerSettings = {
		id: 'info-drawer-node',
		width: 'w-1/3',
		position: 'right',
		border: 'border-gray-50',
		bgDrawer: 'bg-gray-300',
		shadow: 'shadow-lg',
		regionDrawer: 'z-[60]',
		regionBackdrop: 'z-[55]'
	};

	drawerStore.open(settingsInfoDrawer);

	let inputForm = {
		nodeName: node.nodeName,
		description: node.description
	};

	function handleAddPropertyToNode() {
		createNewNodeProperty.meta.nodeId = node.id;
		modalStore.trigger(createNewNodeProperty);
	}

	function toggleAbstracAssetProperties() {
		isAbstractAssetPropertiesClosed = !isAbstractAssetPropertiesClosed;
	}

	function toggleStreamingProperties() {
		isStreamingPropertiesClosed = !isStreamingPropertiesClosed;
	}

	function toggleS3Properties() {
		isS3PropertiesClosed = !isS3PropertiesClosed;
	}

	function createNewAbstractAssetProperty() {
		console.log('createNewAbstractAssetProperty');
	}

	onMount(() => {
		const property_uris = nodesState.getAbstractAssetNode(node.id)?.assetProperties;
		const unsubscribe = propertiesState.properties.subscribe((updatedProperties) => {
			properties = propertiesState.getProperties(property_uris);
		});

		console.log('properties', properties);

		// Cleanup subscription on component destroy
		return () => {
			unsubscribe();
		};
	});
</script>

<div class="toolbox-content flex flex-col text-black">
	<header class="flex justify-center">
		<h1 class="text-xl">Node properties</h1>
	</header>
	<main class="grid grid-cols-1 gap-1">
		<div class="prop">
			<label for="id">ID:</label>
			<input type="input" id="id" value={node.id} readonly class="input text-white" />
		</div>
		<div class="prop">
			<label for="id">NodeName:</label>
			<input
				type="input"
				id="nodeName"
				bind:value={inputForm.nodeName}
				class="input text-white"
			/>
		</div>
		{#if properties.length > 0}
			<div class="properties">
				<div class="properties-box border variant-ghost-primary">
					<div class="properties-header">
						<div>Abstract Asset Properties</div>
						<div class="chevron">
							<button class="btn" on:click={handleAddPropertyToNode}>
								<PlusCircleIcon size="16" />
							</button>
							<button class="btn" on:click={toggleAbstracAssetProperties}>
								{#if isAbstractAssetPropertiesClosed}
									<ChevronUpIcon size="16" />
								{:else}
									<ChevronDownIcon size="16" />
								{/if}
							</button>
						</div>
					</div>
					{#if !isAbstractAssetPropertiesClosed}
						{#each properties as property}
							{#if property.nodeType === 'AbstractAssetProperty'}
								<DisplayAbstractAssetProperty {property} />
							{/if}
						{/each}
					{/if}
				</div>
				<div class="properties-box border variant-ghost-primary">
					<div class="properties-header">
						<div>Streaming Properties</div>
						<div class="chevron">
							<button class="btn" on:click={handleAddPropertyToNode}>
								<PlusCircleIcon size="16" />
							</button>
							<button class="btn" on:click={toggleStreamingProperties}>
								{#if isStreamingPropertiesClosed}
									<ChevronUpIcon size="16" />
								{:else}
									<ChevronDownIcon size="16" />
								{/if}
							</button>
						</div>
					</div>
					{#if !isStreamingPropertiesClosed}
						{#each properties as property}
							{#if property.nodeType === 'StreamingProperty'}
								<DisplayStreamingProperty
									{property}
									streamingValue={property.propertyValue}
									streamingTimestamp={property.propertyValueTimestamp}
								/>
							{/if}
						{/each}
					{/if}
				</div>
				<div class="properties-box border variant-ghost-primary">
					<div class="properties-header">
						<div>S3 Properties</div>
						<div class="chevron">
							<button class="btn" on:click={handleAddPropertyToNode}>
								<PlusCircleIcon size="16" />
							</button>
							<button class="btn" on:click={toggleS3Properties}>
								{#if isS3PropertiesClosed}
									<ChevronUpIcon size="16" />
								{:else}
									<ChevronDownIcon size="16" />
								{/if}
							</button>
						</div>
					</div>
					{#if !isS3PropertiesClosed}
						{#each properties as property}
							{#if property.nodeType === 'S3ObjectProperty'}
								<DisplayS3Property {property} />
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		{/if}
	</main>
	<footer class="flex justify-center">
		<button class="btn variant-ghost-error" disabled>Update node</button>
	</footer>
</div>

<style>
	.toolbox-content {
		padding-left: 20px;
		padding-right: 5px;
		width: 100%;
		height: 100vh;
		display: flex;
		flex-direction: column;
	}
	main {
		flex-grow: 1;
		display: grid;
		grid-auto-rows: min-content;
		align-items: start;
	}
	footer {
		padding: 10px;
	}
	.prop {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 5px;
		margin-top: 10px;
		width: 100%;
	}
	.input {
		padding-left: 10px;
		flex-grow: 1;
	}
	.properties {
		margin-top: 20px;
		border-radius: 50%;
	}
	.properties-box {
		padding: 10px;
	}
	.properties-header {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.chevron {
		display: flex;
		flex-grow: 1;
		justify-content: right;
		padding-right: 10px;
	}
</style>
