<script lang="ts">
	import '../app.postcss';
	import { Avatar } from '@skeletonlabs/skeleton';
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
	import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerLink from '$lib/components/info-drawer-link.svelte';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { isBackendRunning, selectedWorkspace, isWorkspaceSelected, backendNodesData } from '$lib/stores';
	import { getAllNodes as getNodesBackendQuery, getAllRelationships } from '$apis/sindit-backend/kg';
	import { addNodesToStates, getCurrentWorkspace, checkBackendRunningStatus } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { setAuthState, getAuthState } from '$lib/components/states/auth.svelte.ts';
	import { BriefcaseIcon, LinkIcon, Share2Icon, InfoIcon } from 'svelte-feather-icons';
	import { page } from '$app/stores';

	// Version from package.json
	const APP_VERSION = '0.0.1';

	// Check if backend is running initially
	checkBackendRunningStatus();

	// Poll backend health every 10 seconds
	let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

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

	// Initialize Auth State
	setAuthState();
	const authState = getAuthState();

	// Svelte store references for reactivity
	import { derived } from 'svelte/store';
	const authUser = authState.user;
	const isAuthenticated = authState.isAuthenticated;
	const authLoading = authState.loading;
	const authError = authState.error;

	// Get Drawer Store
	const drawerStore = getDrawerStore();

	// Open Drawer
	function openNavDrawer() {
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
		try {
			const nodes = await getNodesBackendQuery();
			await addNodesToStates(nodes, nodesState, propertiesState, connectionsState);

			// Fetch relationships after nodes are loaded
			try {
				const relationships = await getAllRelationships();
				// Store relationships in linksState for visualization (even if empty)
				linksState.setRelationships(relationships || []);
			} catch (relError) {
				console.warn('No relationships found or error loading relationships:', relError);
				// Initialize with empty array if there's an error
				linksState.setRelationships([]);
			}
		} catch (error) {
			console.error('Error loading workspace data:', error);
		}
	}

	onMount(() => {
		// Start periodic health check
		healthCheckInterval = setInterval(() => {
			checkBackendRunningStatus();
		}, 10000); // Check every 10 seconds

		// React to backend running
		const unsubBackend = isBackendRunning.subscribe((backendRunning) => {
			if (backendRunning && $isAuthenticated) {
				getCurrentWorkspace();
			}
		});
		// React to workspace selection and backend running
		let lastWorkspaceSelected = false;
		const unsubWorkspace = isWorkspaceSelected.subscribe((workspaceSelected) => {
			if (workspaceSelected && $isBackendRunning && $isAuthenticated) {
				loadWorkspaceData();
			}
			lastWorkspaceSelected = workspaceSelected;
		});
		// Also react to backend running for workspace data
		const unsubBackendForWorkspace = isBackendRunning.subscribe((backendRunning) => {
			if (backendRunning && $isWorkspaceSelected && $isAuthenticated) {
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
		// Clear health check interval
		if (healthCheckInterval) {
			clearInterval(healthCheckInterval);
		}
		toastState.destroy();
		nodesState.destroy();
		connectionsState.destroy();
		propertiesState.destroy();
		linksState.destroy();
	});

	let showSignInModal = false;
	let showLogoutModal = false;
	let signInEmail = '';
	let signInPassword = '';
	let signInError = '';
	let signInLoading = false;

	// Use $authError, $authLoading, $isAuthenticated for reactivity

	function handleSignInSubmit() {
		signInError = '';
		signInLoading = true;

		authState.signIn(signInEmail, signInPassword).then(() => {
			signInLoading = false;
			if ($isAuthenticated) {
				showSignInModal = false;
				goto('/');
			}
		}).catch((err) => {
			signInLoading = false;
			signInError = err?.message || 'Sign-in failed';
		});
	}

	function handleLogout() {
		toastState.toasts.set([]); // Clear all toasts immediately
		authState.signOut();
		nodesState.destroy();
		connectionsState.destroy();
		propertiesState.destroy();
		linksState.destroy();
		selectedWorkspace.set('');
		isWorkspaceSelected.set(false);
		backendNodesData.set([]);
		showLogoutModal = false;
		goto('/');
	}
</script>

<!-- Toaster for messages-->
<Toaster />

<!-- Drawers -->
<Drawer on:backdropClick={() => drawerStore.close()}>
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

<!-- App Layout with Modern Design -->
<div class="h-screen flex flex-col bg-white dark:bg-slate-900 overflow-hidden">

	<!-- Header -->
	<header class="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-0 flex items-center justify-between h-20">
		<!-- Left: Logo -->
		<a href="/" class="flex items-center gap-2 flex-shrink-0 min-w-0 px-8" aria-label="Sindit Home">
			<img src="/logo/sindit_logo_bg_removed.png" alt="Sindit Logo" class="max-h-8 w-auto block" />
		</a>
		<!-- Center: Navigation Tabs -->
		<nav class="flex gap-1 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto hide-scrollbar">
			<a href="/workspaces"
				class="flex items-center gap-2 py-4 px-3 rounded-md transition-all duration-200 focus:outline-none whitespace-nowrap hover:text-black hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800
					{ $page?.url?.pathname?.startsWith('/workspaces') ? 'text-black dark:text-white' : '' }"
			>
				<BriefcaseIcon class="w-4 h-4" />
				Workspaces
			</a>
			<a href="/connections"
				class="flex items-center gap-2 py-4 px-3 rounded-md transition-all duration-200 focus:outline-none whitespace-nowrap hover:text-black hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800
					{ $page?.url?.pathname?.startsWith('/connections') ? 'text-black dark:text-white' : '' }"
			>
				<LinkIcon class="w-4 h-4" />
				Connections
			</a>
			<a href="/canvas"
				class="flex items-center gap-2 py-4 px-3 rounded-md transition-all duration-200 focus:outline-none whitespace-nowrap hover:text-black hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800
					{ $page?.url?.pathname?.startsWith('/canvas') ? 'text-black dark:text-white' : '' }"
			>
				<Share2Icon class="w-4 h-4" />
				Knowledge Graph
			</a>
			<a href="/about"
				class="flex items-center gap-2 py-4 px-3 rounded-md transition-all duration-200 focus:outline-none whitespace-nowrap hover:text-black hover:bg-gray-100 dark:hover:text-white dark:hover:bg-slate-800
					{ $page?.url?.pathname?.startsWith('/about') ? 'text-black dark:text-white' : '' }"
			>
				<InfoIcon class="w-4 h-4" />
				About
			</a>
		</nav>
		<!-- Right: LightSwitch and Avatar -->
		<div class="flex items-center gap-4 flex-shrink-0 px-8">
			<div class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors duration-200">
				<LightSwitch class="text-gray-500 dark:text-gray-400" />
			</div>
			{#if $isAuthenticated}
				<button class="focus:outline-none" aria-label="Account" on:click={() => showLogoutModal = true}>
					<Avatar
						initials={($authUser && $authUser.email ? $authUser.email[0].toUpperCase() : 'U')}
						background="bg-gradient-to-r from-gray-600 to-gray-800 text-white"
						border="border border-gray-200 dark:border-slate-700"
						rounded="rounded-full"
						width="w-8"
						class="hover:ring-2 hover:ring-gray-200 dark:hover:ring-slate-700 transition-all duration-200"
					/>
				</button>
			{:else}
				<button class="focus:outline-none" aria-label="Sign in" on:click={() => showSignInModal = true}>
					<Avatar
						initials="U"
						background="bg-gradient-to-r from-gray-600 to-gray-800 text-white"
						border="border border-gray-200 dark:border-slate-700"
						rounded="rounded-full"
						width="w-8"
						class="hover:ring-2 hover:ring-gray-200 dark:hover:ring-slate-700 transition-all duration-200"
					/>
				</button>
			{/if}
		</div>
	</header>

	<!-- Page Content -->
	<!-- Main Content Area -->
  	<main class="flex-1 min-h-0 flex flex-col overflow-hidden">
  		<slot />

		<!-- Footer with workspace and backend status -->
		<footer class="fixed bottom-0 w-full flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 z-50">
			<div class="flex items-center gap-4">
				{#if $selectedWorkspace}
					<div class="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
						<BriefcaseIcon class="w-4 h-4" />
						<button
							on:click={() => goto('/canvas')}
							class="font-medium hover:underline transition-all duration-200"
						>
							{$selectedWorkspace}
						</button>
					</div>
				{/if}
			</div>
			<div class="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
				<span class="font-medium">v{APP_VERSION}</span>
			</div>
			<div class="flex items-center gap-4">
				{#if $isBackendRunning}
					<div class="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
						<div class="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
						<span class="font-medium">Backend Healthy</span>
					</div>
				{:else}
					<div class="flex items-center gap-3 text-sm px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
						<div class="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
						<span class="font-medium">Backend offline</span>
					</div>
				{/if}
			</div>
		</footer>
	</main>
</div>

<!-- Sign-in Modal -->
{#if showSignInModal && !$isAuthenticated}
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" role="button" tabindex="0" on:click={() => showSignInModal = false} on:keydown={(e) => e.key === 'Escape' && (showSignInModal = false)}>
    <div class="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-8 w-96 max-w-full flex flex-col gap-5 relative" role="dialog" on:click|stopPropagation>
      <button class="absolute top-4 right-4 text-slate-500 hover:text-red-500" on:click={() => showSignInModal = false} aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <h2 class="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">Sign In</h2>
      <form on:submit|preventDefault={handleSignInSubmit} class="flex flex-col gap-4">
        <label for="sign-in-username" class="text-sm font-medium text-blue-900 dark:text-blue-100">Username or Email</label>
        <input id="sign-in-username" name="username" class="input" type="text" placeholder="Username or email" bind:value={signInEmail} required autocomplete="username" />
        <label for="sign-in-password" class="text-sm font-medium text-blue-900 dark:text-blue-100">Password</label>
        <input id="sign-in-password" name="password" class="input" type="password" placeholder="Password" bind:value={signInPassword} required autocomplete="current-password" />
        {#if signInError || $authError}
          <div class="text-red-600 dark:text-red-400 text-sm font-medium">{signInError || $authError}</div>
        {/if}
        <button class="btn variant-filled-primary w-full mt-2" type="submit" disabled={signInLoading}>
          {#if signInLoading}
            <svg class="animate-spin h-5 w-5 mr-3 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          {/if}
          Sign In
        </button>
      </form>
    </div>
    <style>
      .animate-fade-in { animation: fadeIn 0.2s; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
      .input {
        color: #1e293b;
        background: #f8fafc;
        border: 1px solid #cbd5e1;
      }
      .dark .input {
        color: #f1f5f9;
        background: #1e293b;
        border: 1px solid #334155;
      }
      .input::placeholder {
        color: #64748b;
        opacity: 1;
      }
      .dark .input::placeholder {
        color: #94a3b8;
        opacity: 1;
      }
    </style>
  </div>
{/if}

<!-- Logout Modal -->
{#if showLogoutModal && $isAuthenticated}
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" role="button" tabindex="0" on:click={() => showLogoutModal = false} on:keydown={(e) => e.key === 'Escape' && (showLogoutModal = false)}>
    <div class="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-8 w-80 max-w-full flex flex-col gap-5 relative" role="dialog">
      <button class="absolute top-4 right-4 text-slate-500 hover:text-red-500" on:click={() => showLogoutModal = false} aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <h2 class="text-xl font-bold text-blue-700 dark:text-blue-200 mb-2">Account</h2>
      <div class="text-blue-900 dark:text-blue-100 text-base mb-4">Signed in as <span class="font-semibold">{$authUser?.email}</span></div>
      <button class="btn variant-filled-primary w-full" on:click={handleLogout}>Log Out</button>
    </div>
    <style>
      .animate-fade-in { animation: fadeIn 0.2s; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(20px);} to { opacity: 1; transform: none; } }
    </style>
  </div>
{/if}

<style>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
