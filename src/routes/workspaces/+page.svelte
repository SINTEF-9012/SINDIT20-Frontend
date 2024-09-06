<script lang="ts">
    import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
	import { selectedWorkspace } from '$lib/stores';

    	// TODO: Implement workspaces in the form of a list of KGs to select from.
	const workspaces: string[] = ['workspace-1', 'workspace-2', 'workspace-3'];
	let searchQuery = '';
	let _selectedWorkspace = '';
	let filteredWorkspaces: string[] = [];
	$: filteredWorkspaces = workspaces.filter(workspace => workspace.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
	$: {
		if (_selectedWorkspace) {
			selectedWorkspace.set(_selectedWorkspace);
		}
	}
</script>

<div>
    <h1>Workspaces</h1>
    <div class="workspaces flex flex-col columns-1 variant-primary">
		<input type="text" bind:value={searchQuery} placeholder="Search workspaces" />
		<ListBox class="workspace-list">
			{#each filteredWorkspaces as workspace}
				<ListBoxItem
					bind:group={_selectedWorkspace}
					name={workspace} value={workspace}>{workspace}
				</ListBoxItem>
			{/each}
		</ListBox>
	</div>
</div>

<style>
    .workspaces {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    input {
        color: black;
    }
</style>
