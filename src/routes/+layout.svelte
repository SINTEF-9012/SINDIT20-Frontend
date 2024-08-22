<script lang="ts">
	import '../app.postcss';
	import { MenuIcon } from 'svelte-feather-icons';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { initializeStores, Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import Navigation from '$lib/components/navigation.svelte';
	import Toaster from '$lib/components/toaster.svelte';
	import { setToastState } from '$lib/components/toast-state.svelte';
	import { setNodes } from '$lib/components/nodes-state.svelte';

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	// Initialize Stores
	initializeStores();

	// Initialize Toast State
	setToastState();

	// Initialize Nodes
	setNodes();

	// Get Drawer Store
	const drawerStore = getDrawerStore();

	// Open Drawer
	function openDrawer() {
		console.log('openDrawer');
		drawerStore.open();
	}
	// Close Drawer
	function closeDrawer() {
		console.log('closeDrawer');
		drawerStore.close();
	}
</script>

<!-- Toaster for messages-->
<Toaster />

<!-- Drawer for navbar -->
<Drawer>
	<Navigation />
</Drawer>

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
						<button class="btn" on:click={openDrawer}>
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
	<div class="flex flex-col mx-10 h-screen">
		<!-- Main Content -->
		<main class="flex-1 p-4 overflow-y-auto">
			<slot />
		</main>
		<!-- Sidebar (Right) -->
		<!-- <aside class="sticky top-0 col-span-1 h-full w-20 bg-yellow-500">(sidebar)</aside> -->
	</div>
	<!-- Footer -->
	<!-- <footer class="sticky bottom-0 variant-filled-tertiary p-4">(footer)</footer> -->
</div>
