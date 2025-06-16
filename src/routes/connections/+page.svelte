<script lang="ts">
    import { getConnectionsState } from "$lib/components/states/connections.svelte";
    import type { Connection } from "$lib/types";
    import { deleteNode as deleteNodeQuery } from "$apis/sindit-backend/kg";
    import { refreshConnections as refreshConnectionsQuery } from "$apis/sindit-backend/connection";
    import { getModalStore } from "@skeletonlabs/skeleton";
    import { RefreshCwIcon, CheckCircleIcon, XCircleIcon } from "svelte-feather-icons";
    import { getToastState } from "$lib/components/states/toast-state.svelte";

    const modalStore = getModalStore();
    const connectionsState = getConnectionsState();
    const toastState = getToastState();

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


    async function onRefreshConnections() {
        try {
            await refreshConnectionsQuery();
            // Reload connections from backend into state
            connectionsState.updateConnectionsFromBackend();
            connections = connectionsState.connections;
            toastState.add('Connections Refreshed', 'Connections list has been refreshed.', 'success');
        } catch (err) {
            if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
                toastState.add('Authentication Required', 'You must sign in to refresh connections.', 'error');
            } else {
                toastState.add('Error', 'Failed to refresh connections.', 'error');
            }
            console.error('Error refreshing connections:', err);
        }
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

<div class="text-center space-y-8 max-w-2xl mx-auto py-16 w-full">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent mb-8">Connections</h1>
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
      <input type="text" id="connection-search" name="connection-search" bind:value={searchQuery} placeholder="Search connections..." class="input flex-1 min-w-0" />
      <button class="btn variant-ghost-primary text-primary-800 dark:text-primary-100" title="Create new connection" on:click={onCreateConnection}>Create new</button>
      <button class="btn variant-ghost-tertiary text-primary-800 dark:text-primary-100" on:click={onRefreshConnections} title="Refresh Connections">
        <RefreshCwIcon size="24" />
      </button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each filteredConnections as connection}
        <div class="card flex flex-col h-full p-4 rounded-xl shadow border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100">
          <div class="card-content flex-1">
            <div class="card-title mb-2">
              <h2 class="text-lg font-semibold truncate">{connection.connectionName}</h2>
            </div>
            <div class="card-field text-sm">
              <p>{connection.description}</p>
              <p>Host: {connection.host}</p>
              <p>Port: {connection.port}</p>
              <p>Type: {connection.connectionType}</p>
              <div class="flex flex-row items-center justify-between mt-2">
                <span>isConnected:</span>
                {#if connection.isConnected}
                  <CheckCircleIcon size="16" class="text-green-500"/>
                {:else}
                  <XCircleIcon size="16" class="text-red-500"/>
                {/if}
              </div>
            </div>
          </div>
          <div class="card-footer flex flex-row gap-2 mt-4">
            <button class="btn btn-sm variant-ghost-error" on:click={(event) => handleDeleteConnection(event, connection)}>Delete</button>
            <button class="btn btn-sm variant-ghost-success" disabled>Update</button>
          </div>
        </div>
      {/each}
    </div>
</div>

<style>
.input {
  border-radius: 0.5rem;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
}
</style>
