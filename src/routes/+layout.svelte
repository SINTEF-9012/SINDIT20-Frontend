<script lang="ts">
	import '../app.postcss';
	import { MenuIcon } from 'svelte-feather-icons';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { initializeStores, Drawer, getDrawerStore, Modal } from '@skeletonlabs/skeleton';
	import Toaster from '$lib/components/toaster.svelte';
	import { setToastState } from '$lib/components/toast-state.svelte';
	import { setNodes } from '$lib/components/nodes-state.svelte';
	import { setLinks } from '$lib/components/links-state.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import Toolbox from '$lib/components/toolbox.svelte';
	import type { ModalComponent } from '@skeletonlabs/skeleton';

	// Initialize Stores
	initializeStores();

	// Initialize Toast State
	setToastState();

	// Initialize Nodes
	setNodes();

	// Initialize Links
	setLinks();

	// Get Drawer Store
	const drawerStore = getDrawerStore();

	// Open Drawer
	function openNavDrawer() {
		console.log('openNavDrawer');
		drawerStore.open({id: 'navigation'});
	}

	// Modals
	import CreateNew from '$lib/modals/create-new.svelte';
	import CreateNewLink from '$lib/modals/create-new-link.svelte';

	const modalRegistry: Record<string, ModalComponent> = {
		createNew: { ref: CreateNew },
		createNewLink: { ref: CreateNewLink },
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
						<strong class="text-lg uppercase">App Title</strong>
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
		<main class="flex-1 p-4 overflow-y-auto">
			<slot />
		</main>
	</div>
</div>
