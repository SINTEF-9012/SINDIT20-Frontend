<!-- src/routes/index.svelte -->
<script lang="ts">
    import { fetchData, postData } from '$apis/sindit-backend/api';
    import { onMount } from 'svelte';

    let data;
    let error;

	const nodeid = "#1234"
	const create_asset_data = {
		uri: `http://sindit.sintef.no/workspace/${nodeid}`,
		label: "Node#1234",
		description:  "This is a node",
	};

    onMount(async () => {
        try {
            data = await fetchData('kg/nodes');
        } catch (err) {
            error = err.message;
        }
    });

    async function handleSubmit() {
        try {
            const result = await postData('kg/asset', create_asset_data);
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

<button on:click={handleSubmit}>Submit</button>
