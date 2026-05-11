<script lang="ts">
	import type { Property } from '$lib/types';
	import { propertyNodeTypes } from '$lib/stores';
	import { TrashIcon, FileIcon } from 'svelte-feather-icons';

	export let property: Property;
	export let propertyValue: any;

	const propertyType = propertyNodeTypes.find(
		(propertyType) => propertyType === property.nodeType
	);

	function handleAddPropertyToNode() {
		// TODO: Implement this function
		console.log('handleAddPropertyToNode');
	}

	function handleClickProperty(property_id: string) {
		// TODO: Implement this function
		console.log('handleClickProperty', property_id);
	}

	function handleDeletePropertyFromNode(property_id: string) {
		// TODO: Implement this function
		console.log('handleDeletePropertyFromNode', property_id);
	}

	function formatPropertyValue(propertyValue: any): string {
		if (propertyValue == null) return '';
		if (typeof propertyValue === 'object') {
			// Extract value from RDF literal objects
			if ('@value' in propertyValue) return String(propertyValue['@value']);
			if ('value' in propertyValue) return String(propertyValue['value']);
			return JSON.stringify(propertyValue);
		}
		if (typeof propertyValue === 'string') {
			return propertyValue;
		}
		if (typeof propertyValue === 'number') {
			if (Number.isInteger(propertyValue)) {
				return propertyValue.toString();
			} else if (propertyValue > 1e6 || propertyValue < 1e-6) {
				return propertyValue.toExponential(4);
			} else {
				return propertyValue.toFixed(4);
			}
		}
		return String(propertyValue);
	}
</script>

<div class="node-property variant-soft-primary gap-2">
	<button on:click={() => handleClickProperty(property.id)}>
		{property.propertyName}
	</button>
	<div class="node-prop-value gap-1">
		{#if propertyType === 'AbstractAssetProperty'}
			<div>{formatPropertyValue(propertyValue)}</div>
		{:else if propertyType === 'StreamingProperty'}
			<div>{formatPropertyValue(propertyValue)}</div>
		{:else if propertyType === 'DatabaseProperty'}
			<div>{formatPropertyValue(propertyValue)}</div>
		{:else if propertyType === 'S3ObjectProperty'}
			<div><FileIcon size="16" /></div>
		{/if}
	</div>
	<div class="trash-button-container">
		<button
			class="trash-button btn text-red-500"
			on:click={() => handleDeletePropertyFromNode(property.id)}
		>
			<TrashIcon size="16" />
		</button>
	</div>
</div>

<style>
	.node-property {
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		border-radius: 5px;
		padding: 5px;
		margin: 5px;
		position: relative;
	}
	.node-prop-value {
		display: flex;
		flex-direction: row;
		justify-content: right;
		margin-right: 15px;
	}
	.trash-button-container {
		position: absolute;
		right: -25px;
		top: -12px;
	}
</style>
