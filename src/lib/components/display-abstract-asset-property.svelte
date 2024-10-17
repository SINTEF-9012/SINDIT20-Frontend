<script lang="ts">
    import type { AbstractAssetProperty } from '$lib/types';

    export let property: AbstractAssetProperty;

</script>


<div class="abstract-properties border variant-ghost-tertiary">
    <div class="prop">
        <label for="name">Propety Name:</label>
        <input type="text" id="name" value={property.propertyName} class="flex-grow">
    </div>
    <div class="prop">
        <label for="name">Description:</label>
        <input type="text" id="description" value={property.description} class="flex-grow">
    </div>
    <div class="prop">
        <label for="name">Value:</label>
        <input type="text" id="value" value={property.propertyValue} class="flex-grow">
    </div>
</div>


<style>
    .abstract-properties {
        padding: 10px;
    }
    .prop {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 5px;
        margin-top: 10px;
    }
</style>
