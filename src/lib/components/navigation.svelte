<script lang="ts">
	import { goto } from '$app/navigation';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';
	import { HomeIcon, InfoIcon, BoxIcon, CodesandboxIcon, CodeIcon, LinkIcon } from 'svelte-feather-icons';

	const drawerStore = getDrawerStore();

	let width = 'w-50';

	const settingsNavigation: DrawerSettings = {
		id: 'navigation',
		width: width,
		position: 'left',
		regionDrawer: 'z-[60]',
		regionBackdrop: 'z-[55]',
	};

	drawerStore.open(settingsNavigation);

	function onclick(destination: string) {
		drawerStore.close();
		goto(destination);
	}

</script>

<div class="app-rail p-4 {width} flex flex-col columns-1">
	<button class="btn app-rail-anchor variant-glass-primary"
			on:click={() => onclick('/')} >
		<HomeIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">Home</span>
	</button>
	<button class="btn app-rail-anchor variant-glass-primary"
		on:click={() => onclick('/about')} >
		<InfoIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">About</span>
	</button>
	<button class="btn app-rail-anchor variant-glass-primary"
		on:click={() => onclick('/3d')} >
		<BoxIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">3D Model</span>
	</button>
	<button class="btn app-rail-anchor variant-glass-primary"
		on:click={() => onclick('/canvas')} >
		<CodesandboxIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">Canvas</span>
	</button>
	<button class="btn app-rail-anchor variant-glass-primary"
		on:click={() => onclick('/workspaces')} >
		<CodeIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">Workspaces</span>
	</button>
	<button class="btn app-rail-anchor variant-glass-primary"
		on:click={() => onclick('/connections')} >
		<LinkIcon size=24/>
		<span class="icon-text text-primary-800 dark:text-primary-100">Connections</span>
	</button>
</div>

<style>
	.app-rail {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		display: flex;
		flex-direction: column;
	}
	.app-rail-anchor {
		display: flex;
		flex-direction: row;
		justify-content: left;
		align-items: center;
		gap: 5px;
		border-radius: 0%;
	}
	.icon-text {
		font-size: 16px;
	}
</style>
