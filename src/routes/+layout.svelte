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
	//import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerNode from '$lib/components/info-drawer-node.svelte';
	import InfoDrawerLink from '$lib/components/info-drawer-link.svelte';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { isBackendRunning, selectedWorkspace, isWorkspaceSelected, backendNodesData } from '$lib/stores';
	import { getNodes as getNodesBackendQuery } from '$apis/sindit-backend/kg';
	import { addNodesToStates, getCurrentWorkspace, checkBackendRunningStatus } from '$lib/utils';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { setAuthState, getAuthState } from '$lib/components/states/auth.svelte.ts';
	import { BriefcaseIcon, LinkIcon, Share2Icon, InfoIcon } from 'svelte-feather-icons';
	import { page } from '$app/stores';

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
	<header class="sticky top-0 z-50 backdrop-blur-lg bg-primary-100 dark:bg-primary-900 border-b border-blue-200/50 dark:border-blue-700/30 px-0 flex items-stretch justify-between h-20">
		<!-- Left: Logo -->
		<a href="/" class="flex items-center gap-2 flex-shrink-0 min-w-0 px-6" aria-label="Sindit Home">
			<img src="/logo/sindit_logo_bg_removed.png" alt="Sindit Logo" class="max-h-14 w-auto block" />
		</a>
		<!-- Center: Navigation Tabs (full height, no rounded, stretch) -->
		<nav class="flex-1 flex gap-2 sm:gap-4 text-base font-semibold overflow-x-auto hide-scrollbar h-full">
			<a href="/workspaces"
				class="flex-1 flex items-center justify-center h-full px-6 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 whitespace-nowrap rounded-none
					text-primary-800 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-800/40
					{ $page.url.pathname.startsWith('/workspaces') ? 'border-b-2 border-primary-500 text-primary-900 dark:text-primary-50 shadow-sm' : '' }"
			>
				<BriefcaseIcon class="w-5 h-5 mr-2" />
				Workspaces
			</a>
			<a href="/connections"
				class="flex-1 flex items-center justify-center h-full px-6 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 whitespace-nowrap rounded-none
					text-primary-800 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-800/40
					{ $page.url.pathname.startsWith('/connections') ? 'border-b-2 border-primary-500 text-primary-900 dark:text-primary-50 shadow-sm' : '' }"
			>
				<LinkIcon class="w-5 h-5 mr-2" />
				Connections
			</a>
			<a href="/canvas"
				class="flex-1 flex items-center justify-center h-full px-6 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 whitespace-nowrap rounded-none
					text-primary-800 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-800/40
					{ $page.url.pathname.startsWith('/canvas') ? 'border-b-2 border-primary-500 text-primary-900 dark:text-primary-50 shadow-sm' : '' }"
			>
				<Share2Icon class="w-5 h-5 mr-2" />
				Knowledge Graph
			</a>
			<a href="/about"
				class="flex-1 flex items-center justify-center h-full px-6 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 whitespace-nowrap rounded-none
					text-primary-800 dark:text-primary-100 hover:bg-primary-200 dark:hover:bg-primary-800/40
					{ $page.url.pathname.startsWith('/about') ? 'border-b-2 border-primary-500 text-primary-900 dark:text-primary-50 shadow-sm' : '' }"
			>
				<InfoIcon class="w-5 h-5 mr-2" />
				About
			</a>
		</nav>
		<!-- Right: LightSwitch and Avatar -->
		<div class="flex items-center space-x-4 flex-shrink-0 px-6 h-full">
			<div class="p-2 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-800/30 focus-within:ring-2 focus-within:ring-primary-400 transition-colors duration-200 flex items-center h-full">
				<LightSwitch class="text-primary-600 dark:text-primary-300 focus:ring-primary-400" />
			</div>
			{#if $isAuthenticated}
				<button class="focus:outline-none flex items-center h-full" aria-label="Account" on:click={() => showLogoutModal = true}>
					<Avatar
						initials={($authUser && $authUser.email ? $authUser.email[0].toUpperCase() : 'U')}
						background="bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-700 text-white"
						border="border-2 border-primary-400 dark:border-secondary-600 shadow-lg"
						rounded="rounded-xl"
						width="w-10"
						class="hover:scale-105 transition-transform duration-200 ring-2 ring-primary-200 dark:ring-secondary-700"
					/>
				</button>
			{:else}
				<button class="focus:outline-none flex items-center h-full" aria-label="Sign in" on:click={() => showSignInModal = true}>
					<Avatar
						initials="U"
						background="bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-700 text-white"
						border="border-2 border-primary-400 dark:border-secondary-600 shadow-lg"
						rounded="rounded-xl"
						width="w-10"
						class="hover:scale-105 transition-transform duration-200 ring-2 ring-primary-200 dark:ring-secondary-700"
					/>
				</button>
			{/if}
		</div>
	</header>

	<!-- Page Content -->
	<!-- Main Content Area -->
  	<main class="flex-1 min-h-0 flex flex-col overflow-hidden">
  		<slot />
	</main>


	<!-- Footer with workspace and backend status -->
	<footer class="shrink-0 w-full flex flex-col md:flex-row items-center justify-between px-8 py-4 bg-primary-50 dark:bg-primary-900 border-t border-blue-200/50 dark:border-blue-700/30 text-primary-800 dark:text-primary-100">
		<div class="flex items-center gap-4">
			<button
				on:click={() => goto('/canvas')}
				class="group transition-all duration-200"
			>
				<strong class="text-lg font-bold uppercase bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent hover:from-blue-500 hover:via-indigo-500 hover:to-blue-400 transition-all duration-300">
					{$selectedWorkspace}
				</strong>
			</button>
		</div>
		<div class="flex items-center gap-4">
			{#if $isBackendRunning}
				<div class="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50">
					<div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
					<span class="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Backend Healthy</span>
				</div>
			{:else}
				<div class="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50">
					<AlertTriangleIcon class="w-4 h-4 text-red-500" />
					<span class="text-sm text-red-700 dark:text-red-300 font-medium">Backend Offline</span>
				</div>
			{/if}
		</div>
	</footer>
</div>

<!-- Sign-in Modal -->
{#if showSignInModal && !$isAuthenticated}
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" on:click={() => showSignInModal = false}>
    <div class="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-8 w-96 max-w-full flex flex-col gap-5 relative" on:click|stopPropagation>
      <button class="absolute top-4 right-4 text-slate-500 hover:text-red-500" on:click={() => showSignInModal = false} aria-label="Close">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <h2 class="text-2xl font-bold text-blue-700 dark:text-blue-200 mb-2">Sign In</h2>
      <form on:submit|preventDefault={handleSignInSubmit} class="flex flex-col gap-4">
        <label for="sign-in-username" class="text-sm font-medium text-blue-900 dark:text-blue-100">Username or Email</label>
        <input id="sign-in-username" name="username" class="input" type="text" placeholder="Username or email" bind:value={signInEmail} required autocomplete="username email" />
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
  <div class="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" on:click={() => showLogoutModal = false}>
    <div class="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-2xl p-8 w-80 max-w-full flex flex-col gap-5 relative" on:click|stopPropagation>
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
