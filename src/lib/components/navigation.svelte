<script lang="ts">
	import { AppRail, AppRailTile, AppRailAnchor } from '@skeletonlabs/skeleton';
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import type { DrawerSettings } from '@skeletonlabs/skeleton';
	import { HomeIcon, InfoIcon, CodesandboxIcon } from 'svelte-feather-icons';

	let currentTile = 0;

	const drawerStore = getDrawerStore();

	const settings: DrawerSettings = { id: 'navigation' };

	// Open Drawer
	function openDrawer() {
		console.log('openDrawer');
		drawerStore.open(settings);
	}
	// Close Drawer
	function closeDrawer() {
		console.log('closeDrawer');
		drawerStore.close();
	}

</script>

<AppRail>
	<svelte:fragment slot="lead">
		<AppRailAnchor href="/" on:click={closeDrawer} hover="Home">
			<div class="flex flex-row place-content-center">
				<HomeIcon />
			</div>
		</AppRailAnchor>
		<AppRailAnchor href="/about" on:click={closeDrawer} hover="About">
			<div class="flex flex-row place-content-center">
				<InfoIcon />
			</div>
		</AppRailAnchor>
		<AppRailAnchor href="/canvas" on:click={closeDrawer} hover="Graph canvas">
			<div class="flex flex-row place-content-center">
				<CodesandboxIcon />
			</div>
		</AppRailAnchor>
	</svelte:fragment>
	<!-- --- -->
	<div class="variant-outline-primary">
		<AppRailTile
			bind:group={currentTile}
			on:click={closeDrawer}
			name="tile-1"
			value={1}
			title="tile-1"
		>
			<svelte:fragment slot="lead">
				<div class="flex flex-row place-content-center">
					<InfoIcon />
				</div>
			</svelte:fragment>
			<span>Tile 1</span>
		</AppRailTile>
		<AppRailTile
			bind:group={currentTile}
			on:click={closeDrawer}
			name="tile-2"
			value={2}
			title="tile-2"
		>
			<svelte:fragment slot="lead">
				<div class="flex flex-row place-content-center">
					<InfoIcon />
				</div>
			</svelte:fragment>
			<span>Tile 2</span>
		</AppRailTile>
		<AppRailTile
			bind:group={currentTile}
			on:click={closeDrawer}
			name="tile-3"
			value={3}
			title="tile-3"
		>
			<svelte:fragment slot="lead">
				<div class="flex flex-row place-content-center">
					<InfoIcon />
				</div>
			</svelte:fragment>
			<span>Tile 3</span>
		</AppRailTile>
	</div>
</AppRail>
