<script lang="ts">
	import { selectedWorkspace } from '$lib/stores';
    import { getNodes as getNodesFromBackend} from '$apis/sindit-backend/api';
    import { deleteNodes, getNodes } from '$lib/components/states/nodes-state.svelte';
	import { onMount } from 'svelte';

    const KG_BASE_URI = import.meta.env.VITE_SINDIT_KG_BASE_URI

    // TODO: Implement workspaces in the form of a list of KGs to select from.
	// const workspaces: string[] = ['kg1', 'w1', 'workspace-3', 'yolo', 'Han solo', 'Chewbacca'];
    let nodesData;
    let workspaces: string[] = [];
	let searchQuery = '';
	let _selectedWorkspace = '';
    let _selectedWorkspaceNodes = [];
	let filteredWorkspaces: string[] = [];
    const nodesState = getNodes();
	$: {
		if (searchQuery === '') {
            filteredWorkspaces = workspaces;
		} else {
            filteredWorkspaces = workspaces.filter(workspace => workspace.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        }
	}
	$: {
		if (_selectedWorkspace) {
			selectedWorkspace.set(_selectedWorkspace);
            deleteNodes();
		}
	}

    function extractWorkspaceName(uri: string): string {
        const workspace = uri.replace(KG_BASE_URI, '').split('/')[0];
        return workspace;
    }

    function addNodesToNodesState(nodes: any[]) {
        nodes.forEach(node => {
            const nodeName = node.label;
            const nodeDescription = node.assetDescription;
            const position = {x: Math.random()*100, y: Math.random()*100};
            nodesState.createAbstractAssetNode(nodeName, nodeDescription, position);
        });
    }

	function selectWorkspace(workspace: string) {
		_selectedWorkspace = workspace;
        _selectedWorkspaceNodes = nodesData.filter(node => extractWorkspaceName(node.uri) === workspace);
        addNodesToNodesState(_selectedWorkspaceNodes);
	}

	function onCreateNewWorkspace() {
		console.log('create new workspace');
	}

    onMount(async () => {
        try {
            nodesData = await getNodesFromBackend();
            // console.log(nodesData);
            const workspaceNames = nodesData.map(node => extractWorkspaceName(node.uri));
            for (const workspace of workspaceNames) {
                if (!workspaces.includes(workspace) && workspace !== '') {
                    workspaces = [...workspaces, workspace];
                }
            }
        } catch (err) {
            console.error(err);
        }
    });

    $: console.log('workspaces', workspaces);

</script>

<header class="fixed-header w-full">
    <h1 class="text-4xl">Workspaces</h1>
    <br>
    <div class="flex grid-flow-row columns-3 gap-2">
        <input type="text" bind:value={searchQuery} placeholder="Search workspaces..." />
        <button class="btn variant-ghost-primary"
                on:click={onCreateNewWorkspace}
        >
            Create new
        </button>
		<button class="btn variant-ghost-error move-right"
		on:click={onCreateNewWorkspace}
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
        top: 10%;
        left: 0%;
        padding-top: 5px;
        padding-left: 2rem;
        padding-right: 2rem;
        width: 100%;
        height: 80px;
        z-index: 1;
    }
    .main-content {
        overflow-y: auto;
        margin-top: 120px;
        height: calc(90% - 120px);
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
