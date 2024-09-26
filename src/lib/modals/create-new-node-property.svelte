<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { LogLevel, NodeType, ConnectionType } from '$lib/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodes } from '$lib/components/states/nodes-state.svelte';
	import Node from '$lib/components/node.svelte';

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodes = getNodes();

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
    if (!metadata.nodeId) throw new Error('Metadata nodeId missing from modal settings.');

    const node = nodes.getAbstractAssetNode(metadata.nodeId);
	const connectionTypes: ConnectionType[] = ['MQTT', 'InfluxDB', 'SensApp'];
    let propertyDataTypes = ["Integer", "Float", "String"]
    let propertyUnits = ["Celsius degrees", "Fahrenheit degrees", "Kelvin degrees", "Percentage", "Hectopascal", "Meter per second", "Millimeter"]

	$: isFormValid = false;
	$: console.log("isFormValid", isFormValid);

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


	// Create a new node in the knowledge graph
	function createNewConnectionNode(): void {
		let position = {x: Math.random()*300, y: Math.random()*300};
		if (metadata.position) {
			position = metadata.position;
		}
        // nodes.createConnectionNode();
	}

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		// if ($modalStore[0].response) $modalStore[0].response(formData);
		// TODO: Create new item in the knowledge graph // this should be handled in separate func
		toastState.add('Success', `New Node Property created`, 'info');
		modalStore.close();
	}

	function onClose(): void {
		const title = 'Canceled';
		const message = `Add new Node Property canceled`;
		const logLevel: LogLevel = 'warning';
		toastState.add(title, message, logLevel);
		modalStore.close();
	}

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
                <div>Property Name</div>
				<input class="input" type="text" bind:value={abstractAssetProperty.propertyName} placeholder="Temperature..." />
			</label>
			<label class="label">
				<input class="input" type="text" bind:value={abstractAssetProperty.propertyDescription} placeholder="Temperature at floor 2..." />
			</label>
			<label class="label">
				<select class="input" bind:value={abstractAssetProperty.propertyUnit}>
					<option value="">Select a unit of measure for the property...</option>
					{#each propertyUnits as unit}
						<option value={unit}>{unit}</option>
					{/each}
				</select>
			</label>
			<label class="label">
                <select class="input" bind:value={abstractAssetProperty.propertyDataType}>
                    <option value="">Select a data type for the property...</option>
                    {#each propertyDataTypes as dataType}
                        <option value={dataType}>{dataType}</option>
                    {/each}
                </select>
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
</style>
