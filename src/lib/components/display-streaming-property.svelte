<script lang="ts">
    import type { StreamingProperty } from '$lib/types';

    export let property: StreamingProperty;
    export let streamingValue: string;
    export let streamingTimestamp: string;

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
        <input type="text" id="value" value={streamingValue} class="flex-grow" disabled>
    </div>
    <div class="prop">
        <label for="name">Value:</label>
        <input type="text" id="value" value={streamingTimestamp} class="flex-grow" disabled>
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
