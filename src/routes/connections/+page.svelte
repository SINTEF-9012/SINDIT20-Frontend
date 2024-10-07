<script lang="ts">
    import { getNodesState } from '$lib/components/states/nodes-state.svelte';

    const nodeState = getNodesState();

    $: connections = nodeState.getAllConnectionNodes();

</script>

<div class="connections-content">
    <header class="flex justify-center">
        <h2>Connections</h2>
    </header>
    <main class="grid grid-cols-1 gap-4">
        {#each $connections as connection}
            <div class="card card-connection">
                <div class="card-content columns-1 gap-1">
                    <div class="<card-title>">
                        <h3>{connection.connectionName}</h3>
                    </div>
                    <div class="card-description">
                        <p>{connection.description}</p>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-delete border border-danger-500 bg-danger-50">Delete</button>
                    </div>
                </div>
            </div>
        {/each}
    </main>
</div>
