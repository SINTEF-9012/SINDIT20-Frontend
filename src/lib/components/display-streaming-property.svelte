<script lang="ts">
    import type { StreamingProperty } from '$lib/types';

    export let property: StreamingProperty;
    export let streamingValue: string;
    export let streamingTimestamp: string;

    const inputForm = {
        propertyName: property.propertyName,
        description: property.description,
    };

    // Use a unique suffix for IDs
    const idSuffix = property.id ?? property.propertyName ?? Math.random().toString(36).slice(2, 10);
</script>


<div class="abstract-properties border variant-ghost-tertiary">
    <div class="prop">
        <label for={"name-" + idSuffix}>PropetyName:</label>
        <input type="input" id={"name-" + idSuffix} bind:value={inputForm.propertyName} class="input text-white">
    </div>
    <div class="prop">
        <label for={"description-" + idSuffix}>Description:</label>
        <input type="input" id={"description-" + idSuffix} bind:value={inputForm.description} class="input text-white">
    </div>
    <div class="prop">
        <label for={"value-" + idSuffix}>Value:</label>
        <input type="input" id={"value-" + idSuffix} value={streamingValue} class="input text-white" disabled>
    </div>
    <div class="prop">
        <label for={"time-" + idSuffix}>Time:</label>
        <input type="input" id={"time-" + idSuffix} value={streamingTimestamp} class="input text-white" disabled>
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
        width: 100%;
    }
    .input {
        flex-grow: 1;
        padding-left: 10px;
    }
</style>
