<script lang="ts">
    import { getConnectionsState } from "$lib/components/states/connections.svelte";
    import type { Connection } from "$lib/types";
    import { deleteNode as deleteNodeQuery } from "$apis/sindit-backend/kg";
    import { refreshConnections as refreshConnectionsQuery } from "$apis/sindit-backend/connection";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import { RefreshCwIcon } from "svelte-feather-icons";

    const modalStore = getModalStore();
    const connectionsState = getConnectionsState();

    $: connections = connectionsState.connections;
    let searchQuery = '';
    let filteredConnections: Connection[] = [];

	$: {
		if (searchQuery === '') {
            filteredConnections = $connections.map(conn => conn);
		} else {
            filteredConnections = $connections.filter(conn => conn.connectionName.toLowerCase().includes(searchQuery.toLowerCase()));
        }
	}

    function handleDeleteConnection(event: MouseEvent, connection: Connection) {
        event.preventDefault();
        onDeleteConnection(connection);
    }


    function onRefreshConnections() {
        refreshConnectionsQuery();
        // TODO: reload connections from backend into state
    }

    function onCreateConnection() {
        modalStore.trigger({
            type: 'component',
            component: 'createNewConnection'
        });
    }

    async function onDeleteConnection(connection: Connection): Promise<void> {
        console.log("Deleting connection", connection);
        await deleteNodeQuery(connection.id);
        connectionsState.deleteConnection(connection.id);
        connections = connectionsState.connections;
    }

</script>

<header class="fixed-header w-full">
    <h1 class="text-4xl">Connections</h1>
    <div class="flex grid-flow-row columns-3 gap-2 pt-2 pb-2">
        <input type="text" bind:value={searchQuery} placeholder="Search connections..." />
        <button class="btn variant-ghost-primary"
                title="Create new connection"
                on:click={onCreateConnection}
        >
            Create new
        </button>
        <button class="btn variant-ghost-tertiary"
            on:click={onRefreshConnections}
            title="Refresh Connections"
        >
            <RefreshCwIcon size="24" />
        </button>
    </div>
</header>
<main class="grid-container">
    {#each $connections as connection}
        <div class="card variant-ghost-tertiary">
            <div class="card-content columns-1 gap-1">
                <div class="card-title">
                    <h2>{connection.connectionName}</h2>
                </div>
                <div class="card-field">
                    <p>{connection.description}</p>
                    <p>Host: {connection.host}</p>
                    <p>Port: {connection.port}</p>
                    <p>Type: {connection.connectionType}</p>
                    <p>isConnected: ?</p>
                </div>
            </div>
            <div class="card-footer flex-row">
                <button class="btn btn-sm variant-ghost-error" on:click={(event) => handleDeleteConnection(event, connection)}>Delete</button>
                <button class="btn btn-sm variant-ghost-success" disabled>Update</button>
            </div>
        </div>
    {/each}
</main>


<style>
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 16px; /* Adjust the gap between cards as needed */
    }

    .card {
      width: 250px; /* Fixed width for the cards */
      padding: 16px; /* Example padding */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    .card-content {
        flex-grow: 1;
    }
    .card-footer {
        margin-top: 8px;
        padding: 0;
    }
  </style>
