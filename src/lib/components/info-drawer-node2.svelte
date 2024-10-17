<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { getNodesState } from './states/nodes-state.svelte';
    import { getPropertiesState } from './states/properties.svelte';
    import { selectedNodeId } from "$lib/stores";
    import { onMount } from 'svelte';
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import type {
        Node as NodeType,
        Property,
     } from '$lib/types';

    import DisplayAbstractAssetProperty from "./display-abstract-asset-property.svelte";
    import DisplayStreamingProperty from "./display-streaming-property.svelte";

    const drawerStore = getDrawerStore();
    const nodesState = getNodesState();
    const propertiesState = getPropertiesState();
    const node: NodeType = nodesState.getAbstractAssetNode($selectedNodeId) as NodeType;
	let properties: Property[] = [];
	$: properties = properties;

    $: isAbstractAssetPropertiesClosed = true;
    $: abstractPropertiesOpen = isAbstractAssetPropertiesClosed ? "Open" : "Close";
    $: isStreamingPropertiesClosed = true;
    $: streamingPropertiesOpen = isStreamingPropertiesClosed ? "Open" : "Close";

    const settingsInfoDrawer: DrawerSettings = {
        id: "info-drawer-node",
        width: "w-1/3",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
    };

    drawerStore.open(settingsInfoDrawer);

    let inputForms = {
        nodeName: node.nodeName,
    }

    function toggleAbstracAssetProperties() {
        isAbstractAssetPropertiesClosed = !isAbstractAssetPropertiesClosed;
    }

    function toggleStreamingProperties() {
        isStreamingPropertiesClosed = !isStreamingPropertiesClosed;
    }

    onMount(() => {
		const property_uris = nodesState.getAbstractAssetNode(node.id)?.assetProperties;
		const unsubscribe = propertiesState.properties.subscribe((updatedProperties) => {
            properties = propertiesState.getProperties(property_uris);
        });

        console.log("properties", properties);

        // Cleanup subscription on component destroy
        return () => {
            unsubscribe();
        };
    });
</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">Node properties</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        <div class="row">
            <label for="id">ID:</label>
            <input type="text" id="id" value={node.id} readonly class="flex-grow">
        </div>
        <div class="row">
            <label for="id">Node Name:</label>
            <input type="text" id="nodeName" value={node.nodeName} class="flex-grow">
        </div>
        {#if properties.length > 0}
            <div class="properties">
                <div class="properties-box border variant-ghost-primary">
                    <div class="properties-header">
                        <div>Abstract Asset Properties</div>
                        <div class="button-group">
                            <button class="btn btn-sm variant-ghost-primary" on:click={toggleAbstracAssetProperties}>{abstractPropertiesOpen}</button>
                            <button class="btn btn-sm variant-ghost-warning" disabled>Update properties</button>
                        </div>
                    </div>
                    {#if !isAbstractAssetPropertiesClosed}
                        {#each properties as property}
                            {#if property.nodeType === 'AbstractAssetProperty'}
                                <DisplayAbstractAssetProperty {property} />
                            {/if}
                        {/each}
                    {/if}
                </div>
                <div class="properties-box border variant-ghost-primary">
                    <div class="properties-header">
                        <div>Streaming Properties</div>
                        <div class="button-group">
                            <button class="btn btn-sm variant-ghost-primary" on:click={toggleStreamingProperties}>{streamingPropertiesOpen}</button>
                            <button class="btn btn-sm variant-ghost-warning" disabled>Update properties</button>
                        </div>
                    </div>
                    {#if !isStreamingPropertiesClosed}
                        {#each properties as property}
                            {#if property.nodeType === 'StreamingProperty'}
                                <DisplayStreamingProperty {property} streamingValue={property.propertyValue} streamingTimestamp={property.propertyValueTimestamp}/>
                            {/if}
                        {/each}
                    {/if}
                </div>
            </div>
        {/if}
    </main>
    <footer class="flex justify-center">
        <button class="btn variant-ghost-error" disabled>Update node</button>
    </footer>
</div>


<style>
    .toolbox-content {
        padding-left : 20px;
        padding-right: 5px;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    main {
        flex-grow: 1;
        display: grid;
        grid-auto-rows: min-content;
        align-items: start;
    }
    footer {
        padding: 10px;
    }
    .row {
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: center;
        gap: 5px;
        width: 100%;
    }
    .flex-grow {
        flex-grow: 1;
    }
    .properties {
        margin-top: 20px;
        border-radius: 50%;
        padding: 10px;
    }
    .properties-box {
        margin-left: 20px;
        padding: 10px;
    }
    .properties-header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    .button-group {
        display: flex;
        gap: 10px; /* Adjust the gap between buttons as needed */
    }
</style>
