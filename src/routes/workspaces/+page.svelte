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

<div class="text-center space-y-8 max-w-2xl mx-auto py-16 w-full">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent mb-8">Workspaces</h1>
    <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
      <input type="text" id="workspace-search" name="workspace-search" bind:value={searchQuery} placeholder="Search workspaces..." class="input flex-1 min-w-0" />
      <button class="btn variant-ghost-primary text-primary-800 dark:text-primary-100" on:click={onCreateWorkspace}>Create new</button>
      <button class="btn variant-ghost-error text-primary-800 dark:text-primary-100" disabled>Delete</button>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {#each filteredWorkspaces as workspace}
        <button
          class="btn flex flex-col items-center justify-center h-24 p-4 rounded-xl shadow border transition-all duration-200 text-lg font-semibold
            {workspace.name === _selectedWorkspace ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/60 text-primary-800 dark:text-primary-100' : 'border-slate-200 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100'}"
          on:click={() => selectWorkspace(workspace)}
          id={"workspace-" + workspace.name}
          name={"workspace-" + workspace.name}
          style="word-break: break-all; white-space: normal;"
          title={workspace.uri}
        >
          <span class="w-full text-center break-words whitespace-normal">{workspace.name}</span>
        </button>
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
