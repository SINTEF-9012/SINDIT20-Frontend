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
        <label for={"name-" + idSuffix}>PropertyName:</label>
        <input type="input" id={"name-" + idSuffix} name={"name-" + idSuffix} bind:value={inputForm.propertyName} class="input text-white">
    </div>
    <div class="prop">
        <label for={"description-" + idSuffix}>Description:</label>
        <input type="input" id={"description-" + idSuffix} name={"description-" + idSuffix} bind:value={inputForm.description} class="input text-white">
    </div>
    <div class="prop">
        <label for={"topic-" + idSuffix}>Topic:</label>
        <input type="input" id={"topic-" + idSuffix} name={"topic-" + idSuffix} value={property.streamingTopic} readonly class="input text-white">
    </div>
    <div class="prop">
        <label for={"path-" + idSuffix}>Path:</label>
        <input type="input" id={"path-" + idSuffix} name={"path-" + idSuffix} value={property.streamingPath} readonly class="input text-white">
    </div>
    <div class="prop">
        <label for={"value-" + idSuffix}>Value:</label>
        <input type="input" id={"value-" + idSuffix} name={"value-" + idSuffix} value={streamingValue} class="input text-white" disabled>
    </div>
    <div class="prop">
        <label for={"time-" + idSuffix}>Timestamp:</label>
        <input type="input" id={"time-" + idSuffix} name={"time-" + idSuffix} value={streamingTimestamp} class="input text-white" disabled>
    </div>
    {#if property.propertyDataType}
    <div class="prop">
        <label for={"dataType-" + idSuffix}>Data Type:</label>
        <input type="input" id={"dataType-" + idSuffix} name={"dataType-" + idSuffix} value={property.propertyDataType?.uri || property.propertyDataType} readonly class="input text-white">
    </div>
    {/if}
    {#if property.propertyUnit}
    <div class="prop">
        <label for={"unit-" + idSuffix}>Unit:</label>
        <input type="input" id={"unit-" + idSuffix} name={"unit-" + idSuffix} value={property.propertyUnit?.uri || property.propertyUnit} readonly class="input text-white">
    </div>
    {/if}
    {#if property.propertySemanticID}
    <div class="prop">
        <label for={"semanticID-" + idSuffix}>Semantic ID:</label>
        <input type="input" id={"semanticID-" + idSuffix} name={"semanticID-" + idSuffix} value={typeof property.propertySemanticID === 'object' ? property.propertySemanticID.uri : property.propertySemanticID} readonly class="input text-white">
    </div>
    {/if}
    {#if property.propertyConnection}
    <div class="prop">
        <label for={"connection-" + idSuffix}>Connection:</label>
        <input type="input" id={"connection-" + idSuffix} name={"connection-" + idSuffix} value={property.propertyConnection?.uri || property.propertyConnection} readonly class="input text-white">
    </div>
    {/if}
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
