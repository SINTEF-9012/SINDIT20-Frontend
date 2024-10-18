<script lang="ts">
    import type { StreamingProperty } from '$lib/types';

    export let property: StreamingProperty;
    export let streamingValue: string;
    export let streamingTimestamp: string;

    const inputForm = {
        propertyName: property.propertyName,
        description: property.description,
    };
</script>


<div class="abstract-properties border variant-ghost-tertiary">
    <div class="prop">
        <label for="name">PropetyName:</label>
        <input type="input" id="name" bind:value={inputForm.propertyName} class="input text-white">
    </div>
    <div class="prop">
        <label for="name">Description:</label>
        <input type="input" id="description" bind:value={inputForm.description} class="input text-white">
    </div>
    <div class="prop">
        <label for="name">Value:</label>
        <input type="input" id="value" value={streamingValue} class="input text-white" disabled>
    </div>
    <div class="prop">
        <label for="name">Time:</label>
        <input type="input" id="value" value={streamingTimestamp} class="input text-white" disabled>
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
