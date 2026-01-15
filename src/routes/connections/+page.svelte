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
            // First, trigger backend to refresh connections
            await refreshConnectionsQuery();
            toastState.add('Refresh Triggered', 'Refreshing connections from sources...', 'info');

            // Wait a bit for backend to complete refresh
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Then reload connections from backend into state
            await connectionsState.updateConnectionsFromBackend();
            connections = connectionsState.connections;
            toastState.add('Connections Refreshed', 'Connections list has been updated.', 'success');
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

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
  <div class="container mx-auto px-6 py-12">
    <!-- Header Section -->
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
        Connections
      </h1>
    </div>

    <!-- Search and Actions Bar -->
    <div class="max-w-4xl mx-auto mb-8">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
        <div class="flex flex-col sm:flex-row gap-4 items-center">
          <!-- Search Input -->
          <div class="relative flex-1 w-full">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              type="text"
              id="connection-search"
              name="connection-search"
              bind:value={searchQuery}
              placeholder="Search connections..."
              class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-3 w-full sm:w-auto">
            <button
              class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex-1 sm:flex-none justify-center"
              on:click={onCreateConnection}
              title="Create new connection"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create New
            </button>
            <button
              class="flex items-center gap-2 px-6 py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex-1 sm:flex-none justify-center"
              on:click={onRefreshConnections}
              title="Refresh Connections"
            >
              <RefreshCwIcon size="20" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Connections Grid -->
    <div class="max-w-6xl mx-auto">
      {#if filteredConnections.length === 0}
        <div class="text-center py-16">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? 'No matching connections' : 'No connections yet'}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? 'Try adjusting your search terms.' : 'Create your first data connection to get started.'}
            </p>
            {#if !searchQuery}
              <button
                class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                on:click={onCreateConnection}
              >
                Create Your First Connection
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredConnections as connection}
            <div class="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform">
              <!-- Connection Header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-xl flex items-center justify-center">
                    <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {connection.connectionName}
                    </h3>
                    <p class="text-sm text-slate-500 dark:text-slate-400">
                      {connection.connectionType}
                    </p>
                  </div>
                </div>

                <!-- Status Indicator -->
                <div class="flex items-center gap-2">
                  {#if connection.isConnected}
                    <div class="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                      <CheckCircleIcon size="12" />
                      Connected
                    </div>
                  {:else}
                    <div class="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                      <XCircleIcon size="12" />
                      Disconnected
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Connection Details -->
              <div class="space-y-3 mb-6">
                <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {connection.description || 'No description provided'}
                  </p>
                  <div class="grid grid-cols-2 gap-2 text-xs">
                    <div class="flex flex-col">
                      <span class="text-slate-500 dark:text-slate-400">Host</span>
                      <span class="font-medium text-slate-700 dark:text-slate-300 truncate">
                        {connection.host}
                      </span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-slate-500 dark:text-slate-400">Port</span>
                      <span class="font-medium text-slate-700 dark:text-slate-300">
                        {connection.port}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <button
                  class="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium rounded-lg transition-all duration-200 text-sm"
                  on:click={(event) => handleDeleteConnection(event, connection)}
                >
                  Delete
                </button>
                <button
                  class="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-medium rounded-lg cursor-not-allowed text-sm"
                  disabled
                >
                  Update
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
