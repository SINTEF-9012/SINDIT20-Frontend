<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';
	import type { LogLevel, ConnectionType, ReturnedDataTypeSearchUnits, ReturnedDataTypeAllDataTypes } from '$lib/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodes } from '$lib/components/states/nodes-state.svelte';
	import {
		getAllDataTypes as getAllDataTypesQuery,
		getAllUnits as getAllUnitsQuery,
		searchUnits as searchUnitsQuery
	} from '$apis/sindit-backend/metamodel'

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodeState = getNodes();

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
    if (!metadata.nodeId) throw new Error('Metadata nodeId missing from modal settings.');

    const node = nodeState.getAbstractAssetNode(metadata.nodeId);
	const connectionTypes: ConnectionType[] = ['MQTT', 'InfluxDB', 'SensApp'];

	$: isFormValid = false;
	$: searchQuery = ''
	let propertyUnits: ReturnedDataTypeSearchUnits[] = [];
	$: propertyUnits;
	let propertyDataTypes: ReturnedDataTypeAllDataTypes[];
	$: propertyDataTypes;


	// Form Data - to be submitted
	$: abstractAssetProperty = {
		propertyName: '',
		propertyDescription: '',
		propertyDataType: '',
		propertyUnit: '',
        connectionNodeId: '',
	};

	$: {
        isFormValid = (
            (abstractAssetProperty.propertyName != '') && (abstractAssetProperty.propertyDataType != '') &&
            (abstractAssetProperty.propertyUnit != '')
        );
	}

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		const description = abstractAssetProperty.propertyDescription
		toastState.add('Failed', `Not implemented! New Node Property NOT created`, 'warning');
		modalStore.close();
	}

	function onClose(): void {
		const title = 'Canceled';
		const message = `Add new Node Property canceled`;
		const logLevel: LogLevel = 'warning';
		toastState.add(title, message, logLevel);
		modalStore.close();
	}


	async function handleSearch() {
		propertyUnits = await searchUnitsQuery(searchQuery)
		abstractAssetProperty.propertyUnit = propertyUnits[0]?.uri
	}

	onMount(async () => {
		propertyDataTypes = await getAllDataTypesQuery();
		abstractAssetProperty.propertyDataType = propertyDataTypes[0]?.uri;
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
					<input class="input" type="text" bind:value={abstractAssetProperty.propertyName} placeholder="Temperature..."/>
					<div>
						<label class="label">
							<select class="input" bind:value={abstractAssetProperty.propertyDataType}>
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
				<input class="input" type="text" bind:value={abstractAssetProperty.propertyDescription} placeholder="Temperature at floor 2..." />
			</label>
			<label class="label">
				<div>Property units</div>
				<div class="search-then-dropdown">
					<div class="input-container w-1/3">
						<input class="input" type="text" bind:value={searchQuery} placeholder="Search units..." on:input={handleSearch}>
					</div>
					<div class="dropdown-container w-2/3">
						<select class="input" bind:value={abstractAssetProperty.propertyUnit}>
							{#if propertyUnits.length > 0}
								{#each propertyUnits as unit}
									<option value={unit.uri}>{unit.prefName}</option>
								{/each}
							{/if}
						</select>
					</div>
				</div>
			</label>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit} disabled={!isFormValid}>{parent.buttonTextSubmit}</button>
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
</style>
