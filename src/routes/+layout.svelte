<script lang="ts">
	import '../app.postcss';
	import { MenuIcon } from 'svelte-feather-icons';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { initializeStores, Drawer, getDrawerStore, Modal } from '@skeletonlabs/skeleton';
	import Toaster from '$lib/components/toaster.svelte';
	import { setToastState } from '$lib/components/states/toast-state.svelte';
	import { setNodesState } from '$lib/components/states/nodes-state.svelte';
	import { setLinksState } from '$lib/components/states/links-state.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import Toolbox from '$lib/components/toolbox.svelte';
	import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerLink from '$lib/components/info-drawer-link.svelte';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { selectedWorkspace } from '$lib/stores';

	// Initialize Stores
	initializeStores();

	// Initialize Toast State
	setToastState();

	// Initialize Nodes State
	setNodesState();

	// Initialize Links State
	setLinksState();

	// Get Drawer Store
	const drawerStore = getDrawerStore();

	// Open Drawer
	function openNavDrawer() {
		console.log('openNavDrawer');
		drawerStore.open({id: 'navigation'});
	}

	// Modals
	import CreateNewNode from '$lib/modals/create-new-node.svelte';
	import CreateNewNodeProperty from '$lib/modals/create-new-node-property.svelte';
	import CreateNewConnection from '$lib/modals/create-new-connection.svelte';
	import CreateNewLink from '$lib/modals/create-new-link.svelte';
	import CreateNew from '$lib/modals/create-new.svelte';

	const modalRegistry: Record<string, ModalComponent> = {
		createNewNode: { ref: CreateNewNode },
		createNewNodeProperty: { ref: CreateNewNodeProperty },
		createNewConnection: { ref: CreateNewConnection },
		createNewLink: { ref: CreateNewLink },
		createNew: { ref: CreateNew },
	};

</script>

<!-- Toaster for messages-->
<Toaster />

<!-- Drawers -->
<Drawer>
	{#if $drawerStore.id === "navigation"}
		<Navigation />
	{:else if $drawerStore.id === "toolbox"}
		<Toolbox />
	{:else if $drawerStore.id === "info-drawer-node"}
		<InfoDrawerNode />
	{:else if $drawerStore.id === "info-drawer-link"}
		<InfoDrawerLink />
	{/if}
</Drawer>

<!-- Modals -->
<Modal components={modalRegistry}/>

<!-- For best results, preview this in either the full-width or full-screen preview modes. -->

<div class="grid grid-rows-[auto_1fr_auto]">
	<!-- Header -->
	<header class="variant-ghost">
		<AppBar
			gridColumns="grid-cols-3"
			slotDefault="place-self-center"
			slotTrail="place-content-end"
		>
			<svelte:fragment slot="lead">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<button class="btn" on:click={openNavDrawer}>
							<MenuIcon class="w-6 h-6" />
						</button>
					</div>
					<div class="flex-grow">
						<strong class="text-lg uppercase bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone"
						>{$selectedWorkspace}
						</strong>
					</div>
				</div>
			</svelte:fragment>
			<svelte:fragment slot="trail">
				<div class="flex items-center space-x-4">
					<LightSwitch />
					<Avatar initials="GS" background="variant-ghost-primary" width="w-10"></Avatar>
				</div>
			</svelte:fragment>
		</AppBar>
	</header>
	<!-- Page -->
	<div class="flex mx-10 h-screen">
		<!-- Main Content -->
		<main class="flex-1">
			<slot />
		</main>
	</div>
</div>
