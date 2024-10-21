<script lang="ts">
    import type { Property } from '$lib/types';

    export let property: Property;
    export let propertyValue: any;


    function handleAddPropertyToNode() {
        console.log('handleAddPropertyToNode');
    }

    function formatPropertyValue(propertyValue: any): string {
        if (typeof propertyValue === 'object') {
            return JSON.stringify(propertyValue);
        }
        if (typeof propertyValue === 'string') {
            return propertyValue;
        }
        if (typeof propertyValue === 'number') {
            if (Number.isInteger(propertyValue)) {
                return propertyValue.toString(); // Handle integers
            } else if (propertyValue > 1e6 || propertyValue < 1e-6) {
                console.log(propertyValue);
                return propertyValue.toExponential(4); // Handle very large or very small numbers
            } else {
                console.log(propertyValue);
                return propertyValue.toFixed(4); // Handle floats
            }
        }
        return propertyValue;
    }
</script>


<div class="node-property variant-soft-primary gap-2">
    <div>{property.propertyName}</div>
    <div class="node-prop-value gap-1">
        <div>{formatPropertyValue(propertyValue)}</div>
    </div>
</div>


<style>
    .node-property {
		display:flex;
		flex-direction: row;
		justify-content: space-between;
		border-radius: 5px;
		padding: 5px;
		margin: 5px;
		overflow-x: hidden;
	}
	.node-prop-value {
		display: flex;
		flex-direction: row;
		justify-content: right;
	}
</style>
