<script lang="ts">
	import type { LogLevel, ReturnedDataTypeSearchUnits, ReturnedDataTypeAllDataTypes, PropertyNodeType, StreamingProperty } from '$lib/types';
	import { onMount, type SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getPropertiesState } from '$lib/components/states/properties.svelte';
	import { getConnectionsState } from '$lib/components/states/connections.svelte';
	import { propertyNodeTypes } from '$lib/stores';
	import {
		getAllDataTypes as getAllDataTypesQuery,
		searchUnits as searchUnitsQuery
	} from '$apis/sindit-backend/metamodel'

	// Props /** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodesState = getNodesState();
	const propertiesState = getPropertiesState();
	const connectionsState = getConnectionsState();

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
    if (!metadata.nodeId) throw new Error('Metadata nodeId missing from modal settings.');

    const node = nodesState.getAbstractAssetNode(metadata.nodeId);
	if (!node) throw new Error('Node not found in nodes state.');

	const connections = connectionsState.getAllConnectionNodes();


	$: isFormValid = false;
	$: isBaseFormValid = false;
	$: isStreamingFormValid = false;

	let isFirstSubmit = true;
	let buttonTextSubmit = 'Submit';
	let propertyNodeUri: string;

	$: searchQueryPropertyUnits = ''
	let propertyUnits: ReturnedDataTypeSearchUnits[] = [];
	$: propertyUnits;
	let propertyDataTypes: ReturnedDataTypeAllDataTypes[];
	$: propertyDataTypes;

	// Form Data - to be submitted
	$: propertyData = {
		propertyName: '',
		propertyDescription: '',
		propertyDataTypeUri: '',
		propertyUnitUri: '',
        connectionNodeUri: '',
		nodeType: propertyNodeTypes[0],
		streamingTopic: '',
		streamingPath: '',
		propertyValue: ''
	};

	$: {
        isBaseFormValid = (
            (propertyData.propertyName != '') && (propertyData.propertyDataTypeUri != '') &&
            (propertyData.propertyUnitUri != '') && (isValidPropertyNodeType(propertyData.nodeType))
        );
		if (propertyData.nodeType === 'AbstractAssetProperty') {
			isFormValid = isBaseFormValid && (propertyData.propertyValue != '');
		} else if (propertyData.nodeType === 'StreamingProperty') {
			isStreamingFormValid = (
				(propertyData.streamingTopic != '') && (propertyData.streamingPath != '') &&
				(propertyData.connectionNodeUri != '')
			);
			isFormValid = isBaseFormValid && isStreamingFormValid;
		} else {
			isFormValid = false;
		}
	}

	function isValidPropertyNodeType(nodeType: string): boolean {
		return propertyNodeTypes.includes(nodeType as PropertyNodeType);
	}

	// We've created a custom submit function to pass the response and close the modal.
	async function onFormSubmit(): Promise<void> {
		const assetNodeId = node?.id as string;
		const propertyNodeType = propertyData.nodeType as PropertyNodeType;
		const propertyNode: any = {
			propertyName: propertyData.propertyName,
			description: propertyData.propertyDescription,
			propertyDataType: {
				uri: propertyData.propertyDataTypeUri
			},
			propertyUnit: {
				uri: propertyData.propertyUnitUri
			},
			propertyConnection: {
				uri: propertyData.connectionNodeUri
			},
			streamingTopic: propertyData.streamingTopic,
			streamingPath: propertyData.streamingPath,
			propertyValue: propertyData.propertyValue
		}
		if (isFirstSubmit) {
			await createNewProperty(propertyNodeType, assetNodeId, propertyNode);
			isFirstSubmit = false;
		} else {
			await updateProperty(propertyNodeType, assetNodeId, propertyNode);
		}
	}

	async function createNewProperty(propertyNodeType: PropertyNodeType, assetNodeId: string, propertyNode: any) {
		// Only invoke on first form submit
		console.log("onFormSubmit createNewProperty", propertyNode);
		const property_uri = await propertiesState.createProperty(propertyNodeType, assetNodeId, propertyNode);

		if (!property_uri) {
			const title = 'Error';
			const message = `Failed to create new Node Property`;
			const logLevel: LogLevel = 'error';
			toastState.add(title, message, logLevel);
			return;
		} else {
			const title = 'Success';
			const message = `New Node Property created`;
			const logLevel: LogLevel = 'info';
			toastState.add(title, message, logLevel);
			propertyNodeUri = property_uri;
			nodesState.addPropertyToAbstractAssetNode(assetNodeId, propertyNodeUri);
			buttonTextSubmit = 'Update';
		}
	}

	async function updateProperty(propertyNodeType: PropertyNodeType, assetNodeId: string, propertyNode: any) {
		const property = propertiesState.getProperty(propertyNodeUri);
		let new_property = Object.assign({}, property);

		if (property) {
			try {
				new_property.propertyName = propertyNode.propertyName;
				new_property.description = propertyNode.description;
				if (propertyNode.propertyDataType.uri != '') {
					if (!new_property.propertyDataType) {
						new_property.propertyDataType = {uri: propertyNode.propertyDataType.uri};
					} else {
						new_property.propertyDataType.uri = propertyNode.propertyDataType.uri;
					}
				}
				if (propertyNode.propertyUnit.uri != '') {
					if (!new_property.propertyUnit) {
						new_property.propertyUnit = {uri: propertyNode.propertyUnit.uri};
					} else {
						new_property.propertyUnit.uri = propertyNode.propertyUnit.uri;
					}
				}
				if (propertyNode.propertyConnection.uri != '') {
					if (!new_property.propertyConnection) {
						new_property.propertyConnection = {uri: propertyNode.propertyConnection.uri};
					} else {
						new_property.propertyConnection.uri = propertyNode.propertyConnection.uri;
					}
				}
				if (propertyNodeType === 'StreamingProperty') {
					const streamingProperty = property as StreamingProperty;
					streamingProperty.streamingTopic = propertyNode.streamingTopic;
					streamingProperty.streamingPath = propertyNode.streamingPath;
					new_property = streamingProperty;
				}
				propertiesState.updateProperty(new_property);
			} catch (error) {
				const title = 'Error';
				const message = `Failed to update Node Property ${error}`;
				const logLevel: LogLevel = 'error';
				toastState.add(title, message, logLevel);
				return;
			}
		}
	}

	function onFormFinish(): void {
		modalStore.close();
	}

	function handleCancel(): void {
		const title = 'Canceled';
		const message = `Add new Node Property canceled`;
		const logLevel: LogLevel = 'warning';
		toastState.add(title, message, logLevel);
		modalStore.close();
	}

	function onClose(): void {
		if (isFirstSubmit) {
			handleCancel();
		} else {
			onFormFinish();
		}
	}


	async function handleSearchPropertyUnits() {
		propertyUnits = await searchUnitsQuery(searchQueryPropertyUnits)
		propertyData.propertyUnitUri = propertyUnits[0]?.uri
	}

	onMount(async () => {
		propertyDataTypes = await getAllDataTypesQuery();
		propertyData.propertyDataTypeUri = propertyDataTypes[0]?.uri;
	});

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
	<div class="modal-example-form {cBase}">
		<header class={cHeader}>Add new Node Property</header>
		<article>Specify new Node properties for Node: {node?.nodeName}</article>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<div class="double-column">
                	<div>Property name</div>
					<div>Property value data type</div>
				</div>
				<div class="double-column">
					<input class="input" type="text" bind:value={propertyData.propertyName} placeholder="Temperature..."/>
					<div>
						<label class="label">
							<select class="input" bind:value={propertyData.propertyDataTypeUri}>
								{#if propertyDataTypes}
									{#each propertyDataTypes as dataType}
										<option value={dataType.uri}>{dataType.label}</option>
									{/each}
								{/if}
							</select>
						</label>
					</div>
				</div>
			</label>
			<label class="label">
				<div>Property description</div>
				<input class="input" type="text" bind:value={propertyData.propertyDescription} placeholder="Temperature at floor 2..." />
			</label>
			<label class="label">
				<div>Property units</div>
				<div class="search-then-dropdown">
					<div class="input-container w-1/3">
						<input class="input" type="text" bind:value={searchQueryPropertyUnits} placeholder="Search units..." on:input={handleSearchPropertyUnits}>
					</div>
					<div class="dropdown-container w-2/3">
						<select class="input" bind:value={propertyData.propertyUnitUri}>
							{#if propertyUnits.length > 0}
								{#each propertyUnits as unit}
									<option value={unit.uri}>{unit.prefName}</option>
								{/each}
							{/if}
						</select>
					</div>
				</div>
			</label>
			<label class="label">
				<div>Property node type</div>
				<select class="input" bind:value={propertyData.nodeType}>
					{#each propertyNodeTypes as nodeType}
						<option value={nodeType}>{nodeType}</option>
					{/each}
				</select>
			</label>
			{#if (propertyData.nodeType === 'AbstractAssetProperty')}
				<div class="property-type-container">
					<label class="label">
						<div>Property value</div>
						<input class="input" type="text" bind:value={propertyData.propertyValue} placeholder="Enter some property value..."/>
					</label>
				</div>
			{:else if (propertyNodeTypes.includes(propertyData.nodeType) && propertyData.nodeType !== propertyNodeTypes[0])}
				<div class="property-type-container">
					{#if (propertyData.nodeType === 'StreamingProperty')}
						<label class="label">
							<div>Streaming topic</div>
							<input class="input" type="text" bind:value={propertyData.streamingTopic} placeholder="#"/>
						</label>
						<label class="label">
							<div>Streaming path</div>
							<input class="input" type="text" bind:value={propertyData.streamingPath} placeholder="json/path/to/key"/>
						</label>
					{/if}
				</div>
				<div class="connection-container">
					<div>Connection</div>
					<select class="input" bind:value={propertyData.connectionNodeUri}>
						{#each connections as connection}
							<option value={connection.id}>{connection.connectionName}</option>
						{/each}
				</div>
			{/if}
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<div class="button-container">
				<div class="button-row">
					<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
					<button class="btn {parent.buttonPositive}" on:click={onFormSubmit} disabled={!isFormValid}>{buttonTextSubmit}</button>
				</div>
				{#if !isFirstSubmit}
					<div class="button-row col-span-2 place-self-end">
						<button class="btn variant-ghost-success" on:click={onFormFinish} disabled={!isFormValid}>Finish</button>
					</div>
				{/if}
			</div>
		</footer>
	</div>
{/if}


<style>
	.input-container {
	  display: flex;
	  align-items: center;
	}
	.error-symbol {
	  margin-left: 8px;
	  color: red;
	  position: absolute;
	  pointer-events: none;
	  z-index: 1;
	}
	.search-then-dropdown {
	  display: flex;
	  flex-direction: row;
	  justify-content: start;
	  width: 100%;
	  gap: 5px;
	}
	.double-column {
	  display: flex;
	  flex-direction: row;
	  justify-content: space-between;
	  gap: 5px;
	}
	.property-type-container {
		margin-left: 50px;
	}
	.connection-container {
		margin-top: 20px;
	}
	.button-container {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.button-row {
	  display: flex;
	  gap: 5px;
	}
</style>
