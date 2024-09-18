<script lang="ts">
    import type { ModalSettings } from "@skeletonlabs/skeleton";
    import { getModalStore } from '@skeletonlabs/skeleton';
	import { selectedWorkspace } from '$lib/stores';
    import { getNodes } from '$lib/components/states/nodes-state.svelte';
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { getToastState } from '$lib/components/states/toast-state.svelte';
    import {
        getNode as getNodeBackend,
        getNodes as getNodesBackend,
        createAbstractNodeForWorkspace as createWorkspaceBackend
    } from '$apis/sindit-backend/api';


    const KG_BASE_URI = import.meta.env.VITE_SINDIT_KG_BASE_URI

    // TODO: Implement workspaces in the form of a list of KGs to select from.
	// const workspaces: string[] = ['kg1', 'w1', 'workspace-3', 'yolo', 'Han solo', 'Chewbacca'];
    let nodesData;
    let workspaces: string[] = [];
	let searchQuery = '';
	let _selectedWorkspace = '';
    let _selectedWorkspaceNodes: string[] = [];
	let filteredWorkspaces: string[] = [];
    const toastState = getToastState();
    const nodesState = getNodes();
	$: {
		if (searchQuery === '') {
            filteredWorkspaces = workspaces;
		} else {
            filteredWorkspaces = workspaces.filter(workspace => workspace.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        }
	}

    const modalStore = getModalStore();
    const modalCreateNewDashboard: ModalSettings = {
        type: 'component',
        component: 'createNew',
        meta: {name: 'workspace'},
        response: (data: {name: string}) => {
            createWorkspaceNode(data.name);
        }
    };

    function extractWorkspaceName(uri: string): string {
        const workspace = uri.replace(KG_BASE_URI, '').split('/')[0];
        return workspace;
    }

    function getNodesInSelectedWorkspace(workspace: string): string[] {
        const uri = `${KG_BASE_URI}${workspace}/`;
        console.log("uri:", uri);
        console.log("nodesData", nodesData);
        const selectedWorkspaceNodes = nodesData.filter(node =>
            node.uri.startsWith(uri));
        return selectedWorkspaceNodes;
    }

    function addNodesToNodesState(nodes: any[]) {
        nodes.forEach(node => {
            const nodeName = node.label;
            const nodeDescription = node.assetDescription;
            const position = {x: Math.random()*100, y: Math.random()*100};
            nodesState.addAbstractAssetNode(nodeName, nodeDescription, position);
        });
    }

	function selectWorkspace(workspace: string) {
        // Set the selected workspace
		_selectedWorkspace = workspace;
        selectedWorkspace.set(_selectedWorkspace);
        // Delete all nodes in the current workspace
        nodesState.deleteAllNodes();
        // Get all nodes in the selected workspace
        _selectedWorkspaceNodes = getNodesInSelectedWorkspace(workspace);
        // Add the nodes to the nodes state
        addNodesToNodesState(_selectedWorkspaceNodes);
        setTimeout(() => {
            console.log("selected workspace:", _selectedWorkspace);
            console.log("selected nodes:", _selectedWorkspaceNodes);
            goto(`/canvas`);
        }, 500);
	}

    function onCreateWorkspace() {
        modalStore.trigger(modalCreateNewDashboard);
    }

    function createWorkspaceNode(workspaceName: string) {
        createWorkspaceBackend(workspaceName);
        refreshWorkspaces();
    }

    async function refreshWorkspaces(): Promise<void> {
        try {
            nodesData = await getNodesBackend();
            const workspaceNames = nodesData.map(node => extractWorkspaceName(node.uri));
            for (const workspace of workspaceNames) {
                if (!workspaces.includes(workspace) && workspace !== '') {
                    workspaces = [...workspaces, workspace];
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    onMount(async () => {
        nodesState.deleteAllNodes();
        await refreshWorkspaces();
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
            {#if workspace === _selectedWorkspace}
                <button class="btn logo-item variant-ghost-primary"
                        on:click={() => selectWorkspace(workspace)}
                        class:selected={_selectedWorkspace === workspace}
                >
                    <span>{workspace}</span>
                </button>
            {:else}
                <button class="btn logo-item variant-ghost-tertiary"
                        on:click={() => selectWorkspace(workspace)}
                        class:selected={_selectedWorkspace === workspace}
                >
                    <span>{workspace}</span>
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
