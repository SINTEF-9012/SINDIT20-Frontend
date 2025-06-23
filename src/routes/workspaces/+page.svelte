<script lang="ts">
    import { env } from '$env/dynamic/public';
    import type { Workspace } from '$lib/types';
    import type { ModalSettings } from "@skeletonlabs/skeleton";
    import { getModalStore } from '@skeletonlabs/skeleton';
    import { getNodesState } from '$lib/components/states/nodes-state.svelte';
    import { getConnectionsState } from '$lib/components/states/connections.svelte';
    import { getPropertiesState } from '$lib/components/states/properties.svelte';
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import {
	    isWorkspaceSelected,
        selectedWorkspace,
    } from '$lib/stores';
    import {
        getNodes as getNodesBackendQuery,
    } from '$apis/sindit-backend/kg';
    import {
        switchWorkspace,
        listWorkspaces,
    } from '$apis/sindit-backend/workspace';
    import {
	    addNodesToStates,
        getCurrentWorkspace,
        getWorkspaceDictFromUri,
    } from '$lib/utils';
    import { getToastState } from '$lib/components/states/toast-state.svelte';

    const toastState = getToastState();
    const API_BASE_URI = env.PUBLIC_SINDIT_BACKEND_API_BASE_URI


    let workspace: Workspace;
    let workspaces: Workspace[] = [];
	let searchQuery = '';
	let _selectedWorkspace = '';
	let filteredWorkspaces: Workspace[] = [];
    const nodesState = getNodesState();
    const connectionsState = getConnectionsState();
    const propertiesState = getPropertiesState();
	$: {
		if (searchQuery === '') {
            filteredWorkspaces = workspaces.map(workspace => workspace);
		} else {
            filteredWorkspaces = workspaces.filter(workspace => workspace.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
	}

    const modalStore = getModalStore();
    const modalCreateNewDashboard: ModalSettings = {
        type: 'component',
        component: 'createNew',
        meta: {name: 'workspace'},
        response: (data: {name: string}) => {
            createWorkspace(data.name);
        }
    };

	async function selectWorkspace(workspace: Workspace) {
        try {
            // Set the selected workspace
            console.log("selected workspace:", workspace);
            await switchWorkspace(workspace.uri);
            _selectedWorkspace = workspace.name;
            selectedWorkspace.set(_selectedWorkspace);
            // Delete all nodes in the current workspace
            nodesState.deleteAllNodes();
            connectionsState.deleteAllConnections();
            propertiesState.deleteAllProperties();
            // Get all nodes in the selected workspace and add them to the nodes state
            setTimeout(async () => {
                try {
                    const nodes = await getNodesBackendQuery();
                    addNodesToStates(nodes, nodesState, propertiesState, connectionsState);
                    console.log("selected workspace:", _selectedWorkspace);
                    goto(`/canvas`);
                } catch (err) {
                    if (err) console.error('Error loading workspace nodes:', err);
                    toastState.add('Error', 'Failed to load workspace nodes.', 'error');
                }
            }, 500);
        } catch (err) {
            if (err) console.error('Error switching workspace:', err);
            if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
                toastState.add('Authentication Required', 'You must sign in to switch workspaces.', 'error');
            } else {
                toastState.add('Error', 'Failed to switch workspace.', 'error');
            }
        }
	}

    function onCreateWorkspace() {
        modalStore.trigger(modalCreateNewDashboard);
    }

    function createWorkspace(workspaceName: string) {
        try {
            switchWorkspace(workspaceName);
            const workspace = getWorkspaceDictFromUri(workspaceName);
            workspaces = [...workspaces, workspace];
        } catch (err) {
            if (err) console.error('Error creating workspace:', err);
            if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
                toastState.add('Authentication Required', 'You must sign in to create a workspace.', 'error');
            } else {
                toastState.add('Error', 'Failed to create workspace.', 'error');
            }
        }
    }

    async function getWorkspaces(): Promise<void> {
        try {
            const workspace_uris = await listWorkspaces();
            for (const uri of workspace_uris) {
                const workspace = getWorkspaceDictFromUri(uri);
                workspaces.push(workspace);
            }
        } catch (err) {
            if (err) console.error('Error listing workspaces:', err);
            if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
                toastState.add('Authentication Required', 'You must sign in to view workspaces.', 'error');
            } else {
                toastState.add('Error', 'Failed to load workspaces.', 'error');
            }
            return;
        }
        // trigger reactivity
        workspaces = [...workspaces];
    }


    onMount(async () => {
        await getWorkspaces();
        try {
            workspace = await getCurrentWorkspace();
            if (isWorkspaceSelected) {
                _selectedWorkspace = workspace.name;
            }
        } catch (err) {
            if (err) console.error('Error getting current workspace:', err);
            if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
                toastState.add('Authentication Required', 'You must sign in to view the current workspace.', 'error');
            } else {
                toastState.add('Error', 'Failed to get current workspace.', 'error');
            }
        }
    });

    $: console.log('workspaces', workspaces);

</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
  <div class="container mx-auto px-6 py-12">
    <!-- Header Section -->
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
        Workspaces
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
              id="workspace-search" 
              name="workspace-search" 
              bind:value={searchQuery} 
              placeholder="Search workspaces..." 
              class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <!-- Action Buttons -->
          <div class="flex gap-3 w-full sm:w-auto">
            <button 
              class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex-1 sm:flex-none justify-center"
              on:click={onCreateWorkspace}
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Create New
            </button>
            <button 
              class="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 font-medium rounded-xl transition-all duration-200 cursor-not-allowed flex-1 sm:flex-none justify-center"
              disabled
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Workspaces Grid -->
    <div class="max-w-6xl mx-auto">
      {#if filteredWorkspaces.length === 0}
        <div class="text-center py-16">
          <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 max-w-md mx-auto">
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {searchQuery ? 'No matching workspaces' : 'No workspaces yet'}
            </h3>
            <p class="text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery ? 'Try adjusting your search terms.' : 'Create your first workspace to get started.'}
            </p>
            {#if !searchQuery}
              <button 
                class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                on:click={onCreateWorkspace}
              >
                Create Your First Workspace
              </button>
            {/if}
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each filteredWorkspaces as workspace}
            <div class="group relative">
              <button
                class="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform
                  {workspace.name === _selectedWorkspace ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'hover:border-blue-300 dark:hover:border-blue-600'}"
                on:click={() => selectWorkspace(workspace)}
                id={"workspace-" + workspace.name}
                name={"workspace-" + workspace.name}
                title={workspace.uri}
              >
                <!-- Workspace Name -->
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 text-center break-words">
                  {workspace.name}
                </h3>

                <!-- Status Badge -->
                {#if workspace.name === _selectedWorkspace}
                  <div class="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium rounded-full">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </div>
                {:else}
                  <div class="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium rounded-full">
                    <div class="w-2 h-2 bg-slate-400 rounded-full"></div>
                    Available
                  </div>
                {/if}

                <!-- Hover Indicator -->
                <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                </div>
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>


