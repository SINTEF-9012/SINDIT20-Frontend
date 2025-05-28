<script lang="ts">
	import '../app.postcss';
	import { MenuIcon } from 'svelte-feather-icons';
	import { AppBar, Avatar } from '@skeletonlabs/skeleton';
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AlertTriangleIcon } from 'svelte-feather-icons';
	import { initializeStores, Drawer, getDrawerStore, Modal } from '@skeletonlabs/skeleton';
	import Toaster from '$lib/components/toaster.svelte';
	import { setToastState, getToastState } from '$lib/components/states/toast-state.svelte';
	import { setNodesState, getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { setConnectionsState, getConnectionsState } from '$lib/components/states/connections.svelte';
	import { setPropertiesState, getPropertiesState } from '$lib/components/states/properties.svelte';
	import { setLinksState, getLinksState } from '$lib/components/states/links-state.svelte';
	import Navigation from '$lib/components/navigation.svelte';
	import Toolbox from '$lib/components/toolbox.svelte';
	//import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerLink from '$lib/components/info-drawer-link.svelte';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { isBackendRunning, selectedWorkspace, isWorkspaceSelected } from '$lib/stores';
	import { getNodes as getNodesBackendQuery } from '$apis/sindit-backend/kg';
	import { addNodesToStates, getCurrentWorkspace, checkBackendRunningStatus } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Check if backend is running
	checkBackendRunningStatus();

	// Initialize Stores
	initializeStores();

	// Initialize Toast State
	setToastState();
	const toastState = getToastState();

	// Initialize Nodes State
	setNodesState();
	const nodesState = getNodesState();

	// Initialize Connections State
	setConnectionsState();
	const connectionsState = getConnectionsState();

	// Initialize Properties State
	setPropertiesState();
	const propertiesState = getPropertiesState();

	// Initialize Links State
	setLinksState();
	const linksState = getLinksState();

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

	async function loadWorkspaceData() {
		const nodes = await getNodesBackendQuery();
		addNodesToStates(nodes, nodesState, propertiesState, connectionsState);
	}

	onMount(() => {
		// React to backend running
		const unsubBackend = isBackendRunning.subscribe((backendRunning) => {
			if (backendRunning) {
				getCurrentWorkspace();
			}
		});
		// React to workspace selection and backend running
		let lastWorkspaceSelected = false;
		const unsubWorkspace = isWorkspaceSelected.subscribe((workspaceSelected) => {
			if (workspaceSelected && $isBackendRunning) {
				loadWorkspaceData();
			}
			lastWorkspaceSelected = workspaceSelected;
		});
		// Also react to backend running for workspace data
		const unsubBackendForWorkspace = isBackendRunning.subscribe((backendRunning) => {
			if (backendRunning && $isWorkspaceSelected) {
				loadWorkspaceData();
			}
		});
		return () => {
			unsubBackend();
			unsubWorkspace();
			unsubBackendForWorkspace();
		};
	});

	onDestroy(() => {
		toastState.destroy();
		nodesState.destroy();
		connectionsState.destroy();
		propertiesState.destroy();
		linksState.destroy();
	});
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
	<header class="variant-ghost h-16">
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
				<div>
				<div class="flex flex-row items-center">
					<button on:click={() => goto('/canvas')}>
						<strong class="text-lg uppercase bg-gradient-to-br from-blue-500 to-cyan-300 bg-clip-text text-transparent box-decoration-clone mr-5"
							>{$selectedWorkspace}
						</strong>
					</button>
					{#if $isBackendRunning}
						<span class="text-sm text-green-500">Backend is healthy</span>
					{:else}
						<div class="flex items-center space-x-2">
							<AlertTriangleIcon class="w-6 h-6 text-red-500" />
							<span class="text-sm text-red-500">Backend Not Running</span>
						</div>
					{/if}
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
