<!-- src/routes/index.svelte -->
<script lang="ts">
    import { getNodes, createAbstractNode } from '$apis/sindit-backend/api';
    import { onMount } from 'svelte';

    let data;
    let error;

	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"

    onMount(async () => {
        try {
            data = await getNodes();
        } catch (err) {
            error = err.message;
        }
    });

    async function handleSubmit() {
        try {
            const result = await createAbstractNode(nodeId, nodeName, nodeDescription);
            console.log(result);
        } catch (err) {
            error = err.message;
        }
    }
</script>

{#if error}
    <p>Error: {error}</p>
{:else if data}
    <p>Data: {JSON.stringify(data)}</p>
{/if}

<button class="btn variant-outline-success" on:click={handleSubmit}>Submit</button>
