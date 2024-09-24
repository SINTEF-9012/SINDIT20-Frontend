<script lang="ts">
    import type { NodeType } from '$lib/types';
    import type { ModalSettings } from "@skeletonlabs/skeleton";
    import { getModalStore } from '@skeletonlabs/skeleton';
	import { selectedWorkspace } from '$lib/stores';
    import { getNodes } from '$lib/components/states/nodes-state.svelte';
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import {
        getNodes as getNodesBackendQuery,
    } from '$apis/sindit-backend/kg';
    import {
        switchWorkspace,
        listWorkspaces,
        getWorkspace,
    } from '$apis/sindit-backend/workspace';


    type Workspace = {
        name: string;
        uri: string;
    };

    let workspaces: Workspace[] = [];
	let searchQuery = '';
	let _selectedWorkspace = '';
	let filteredWorkspaces: Workspace[] = [];
    const nodesState = getNodes();
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

    function addNodesToNodesState(nodes: any[]) {
        nodes.forEach(node => {
            const class_uri = node.class_uri;
            const class_type = class_uri.split('#')[1] as NodeType;
            const position = {x: Math.random()*100, y: Math.random()*100};
            if (class_type === 'AbstractAsset') {
                nodesState.addAbstractAssetNode(node.label, node.assetDescription, position, node.assetProperties);
            } else if (class_type === 'Connection') {
                nodesState.addConnectionNode(node.label, node.connectionDescription, position, node.host, node.port, node.connectionType);
            } else if (class_type === 'AbstractAssetProperty') {
                // nodesState.addAbstractAssetPropertyNode(node.label, node.propertyDescription, position, node.propertyType, );
            } else {
                throw new Error(`Unknown node type ${class_type}`);
            }
        });
    }

	async function selectWorkspace(workspace: Workspace) {
        // Set the selected workspace
        console.log("selected workspace:", workspace);
        await switchWorkspace(workspace.uri);
		_selectedWorkspace = workspace.name;
        selectedWorkspace.set(_selectedWorkspace);
        console.log("selected workspace:", getCurrentWorkspace());
        // Delete all nodes in the current workspace
        nodesState.deleteAllNodes();
        // Get all nodes in the selected workspace and add them to the nodes state
        setTimeout(async () => {
            const nodes = await getNodesBackendQuery();
            addNodesToNodesState(nodes);
            console.log("selected workspace:", _selectedWorkspace);
            console.log("selected nodes:", nodes);
            goto(`/canvas`);
        }, 500);
	}

    function onCreateWorkspace() {
        modalStore.trigger(modalCreateNewDashboard);
    }

    function getWorkspaceDictFromUri(workspaceUri: string): Workspace {
        return {
            name: workspaceUri.split('#')[1] as string,
            uri: workspaceUri,
        };
    }

    function createWorkspace(workspaceName: string) {
        switchWorkspace(workspaceName);
        const workspace = getWorkspaceDictFromUri(workspaceName);
        workspaces = [...workspaces, workspace];
    }

    async function getWorkspaces(): Promise<void> {
        try {
            const workspace_uris = await listWorkspaces();
            for (const uri of workspace_uris) {
                const workspace = getWorkspaceDictFromUri(uri);
                workspaces.push(workspace);
            }
        } catch (err) {
            console.error(err);
        }
        // trigger reactivity
        workspaces = [...workspaces];
    }

    async function getCurrentWorkspace(): Promise<void> {
        const workspace = await getWorkspace();
        console.log("getCurrentWorkspace:", workspace);
        if (!workspace.workspace_uri) {
            _selectedWorkspace = '';
            selectedWorkspace.set(_selectedWorkspace);
        } else {
            const workspaceDict = getWorkspaceDictFromUri(workspace.workspace_uri);
            _selectedWorkspace = workspaceDict.name;
            selectedWorkspace.set(_selectedWorkspace);
        }
    }

    onMount(async () => {
        await getWorkspaces();
        await getCurrentWorkspace();
    });

    $: console.log('workspaces', workspaces);

</script>

<header class="fixed-header w-full">
    <h1 class="text-4xl">Workspaces</h1>
    <div class="flex grid-flow-row columns-3 gap-2 pt-2 pb-2">
        <input type="text" bind:value={searchQuery} placeholder="Search workspaces..." />
        <button class="btn variant-ghost-primary"
                on:click={onCreateWorkspace}
        >
            Create new
        </button>
		<button class="btn variant-ghost-error move-right"
                disabled
		>
			Delete
		</button>
    </div>
</header>
<main class="main-content">
    <div class="logo-cloud grid-cols-3 gap-2 p-4">
        {#each filteredWorkspaces as workspace}
            {#if workspace.name === _selectedWorkspace}
                <button class="btn logo-item variant-ghost-primary"
                        on:click={() => selectWorkspace(workspace)}
                        class:selected={_selectedWorkspace === workspace.name}
                >
                    <span>{workspace.name}</span>
                </button>
            {:else}
                <button class="btn logo-item variant-ghost-tertiary"
                        on:click={() => selectWorkspace(workspace)}
                        class:selected={_selectedWorkspace === workspace.name}
                >
                    <span>{workspace.name}</span>
                </button>
            {/if}
        {/each}
    </div>
</main>

<style>
    .fixed-header {
        position: fixed;
        top: 80px;
        left: 0%;
        padding-top: 5px;
        padding-left: 2rem;
        padding-right: 2rem;
        width: 100%;
        z-index: 1;
    }
    .main-content {
        margin-top: 103px;
        overflow-y: auto;
        height: calc(100% - 183px);
        width: 100%;
        z-index: 0;
    }
    .logo-item {
        border-radius: 0.5rem;
        padding: 1rem;
        height: 100px;
    }
    input {
        border-radius: 0.5rem;
        color: black;
    }
    .move-right {
        margin-left: auto;
    }
</style>
