<script lang="ts">
	import { onMount } from 'svelte';
	import { getDataspacesState } from '$lib/components/states/dataspace-state.svelte';
	import type { DataspaceManagement } from '$lib/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { RefreshCwIcon, CheckCircleIcon, XCircleIcon } from 'svelte-feather-icons';

	const modalStore = getModalStore();
	const dataspaceState = getDataspacesState();
	const toastState = getToastState();

	$: dataspaces = dataspaceState.dataspaces;
	let searchQuery = '';
	let filteredDataspaces: DataspaceManagement[] = [];
	let testingIds = new Set<string>();
	let syncingIds = new Set<string>();
	let unpublishingIds = new Set<string>(); // key: `${dataspaceId}::${assetUri}`

	$: {
		if (searchQuery === '') {
			filteredDataspaces = $dataspaces.slice();
		} else {
			filteredDataspaces = $dataspaces.filter(
				(d) =>
					d.endpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(d.dataspaceDescription ?? '').toLowerCase().includes(searchQuery.toLowerCase())
			);
		}
	}

	onMount(async () => {
		try {
			await dataspaceState.updateDataspacesFromBackend();
		} catch (err) {
			if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
				toastState.add('Authentication Required', 'You must sign in to load dataspaces.', 'error');
			} else {
				toastState.add('Error', 'Failed to load dataspaces.', 'error');
			}
		}
	});

	function onCreateDataspace() {
		modalStore.trigger({
			type: 'component',
			component: 'createNewDataspace'
		});
	}

	async function onTestConnection(dataspace: DataspaceManagement) {
		testingIds = new Set(testingIds).add(dataspace.id);
		testingIds = testingIds; // trigger reactivity
		try {
			await dataspaceState.testConnection(dataspace.id);
			toastState.add('Connection Tested', `Connection to "${dataspace.endpoint}" tested successfully.`, 'info');
		} catch (err) {
			toastState.add('Test Failed', `Failed to test connection: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			const next = new Set(testingIds);
			next.delete(dataspace.id);
			testingIds = next;
		}
	}

	async function onSync(dataspace: DataspaceManagement) {
		syncingIds = new Set(syncingIds).add(dataspace.id);
		syncingIds = syncingIds;
		try {
			await dataspaceState.sync(dataspace.id);
			toastState.add('Sync Triggered', `Sync started for "${dataspace.endpoint}".`, 'info');
		} catch (err) {
			toastState.add('Sync Failed', `Failed to sync: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			const next = new Set(syncingIds);
			next.delete(dataspace.id);
			syncingIds = next;
		}
	}

	async function onDelete(dataspace: DataspaceManagement) {
		try {
			await dataspaceState.delete(dataspace.id);
			toastState.add('Dataspace Deleted', `"${dataspace.endpoint}" has been removed.`, 'info');
		} catch (err) {
			toastState.add('Error', `Failed to delete dataspace: ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function getAssetUri(asset: any): string {
		return asset?.uri ?? String(asset);
	}

	function onPublish(dataspace: DataspaceManagement) {
		const existingAssets = (dataspace.dataspaceAssets ?? []).map(getAssetUri);
		modalStore.trigger({
			type: 'component',
			component: 'publishToDataspace',
			meta: { dataspaceId: dataspace.id, existingAssets }
		});
	}

	async function onUnpublishAsset(dataspace: DataspaceManagement, assetUri: string) {
		const key = `${dataspace.id}::${assetUri}`;
		unpublishingIds = new Set(unpublishingIds).add(key);
		try {
			await dataspaceState.unpublishAsset(dataspace.id, assetUri);
			toastState.add('Asset Unpublished', `Asset removed from "${dataspace.endpoint}".`, 'info');
		} catch (err) {
			toastState.add('Error', `Failed to unpublish asset: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			const next = new Set(unpublishingIds);
			next.delete(key);
			unpublishingIds = next;
		}
	}
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent mb-4">
				Dataspaces
			</h1>
			<p class="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
				Manage dataspace integrations — connect, sync, and monitor remote SINDIT instances.
			</p>
		</div>

		<!-- Search and Actions Bar -->
		<div class="max-w-4xl mx-auto mb-8">
			<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6">
				<div class="flex flex-col sm:flex-row gap-4 items-center">
					<!-- Search -->
					<div class="relative flex-1 w-full">
						<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
							</svg>
						</div>
						<input
							type="text"
							id="dataspace-search"
							name="dataspace-search"
							bind:value={searchQuery}
							placeholder="Search dataspaces..."
							class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
						/>
					</div>

					<!-- Create Button -->
					<button
						class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto justify-center"
						on:click={onCreateDataspace}
					>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Add Dataspace
					</button>
				</div>
			</div>
		</div>

		<!-- Dataspaces Grid -->
		<div class="max-w-6xl mx-auto">
			{#if filteredDataspaces.length === 0}
				<div class="text-center py-16">
					<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 max-w-md mx-auto">
						<div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
							</svg>
						</div>
						<h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
							{searchQuery ? 'No matching dataspaces' : 'No dataspaces yet'}
						</h3>
						<p class="text-slate-500 dark:text-slate-400 mb-6">
							{searchQuery ? 'Try adjusting your search terms.' : 'Add your first dataspace to get started.'}
						</p>
						{#if !searchQuery}
							<button
								class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
								on:click={onCreateDataspace}
							>
								Add Your First Dataspace
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredDataspaces as dataspace (dataspace.id)}
						<div class="group relative bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 transform">
							<!-- Header -->
							<div class="flex items-start justify-between mb-4">
								<div class="flex items-center gap-3 min-w-0">
									<div class="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
										<svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
										</svg>
									</div>
									<div class="min-w-0">
										<h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 break-all">
											{dataspace.id}
										</h3>

									</div>
								</div>

								<!-- Status badge -->
								<div class="flex-shrink-0 ml-2">
									{#if dataspace.isActive}
										<div class="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
											<CheckCircleIcon size="12" />
											Active
										</div>
									{:else}
										<div class="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium rounded-full">
											<XCircleIcon size="12" />
											Inactive
										</div>
									{/if}
								</div>
							</div>

							<!-- Details -->
							<div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mb-4 space-y-2 text-xs">							{#if dataspace.dataspaceDescription}
								<div class="flex flex-col gap-0.5">
									<span class="text-slate-500 dark:text-slate-400">Description</span>
									<span class="font-medium text-slate-700 dark:text-slate-300">{dataspace.dataspaceDescription}</span>
								</div>
							{/if}								<div class="flex flex-col gap-0.5">
									<span class="text-slate-500 dark:text-slate-400">Endpoint</span>
									<span class="font-medium text-slate-700 dark:text-slate-300 break-all">{dataspace.endpoint}</span>
								</div>
								{#if dataspace.authenticationType}
									<div class="flex justify-between">
										<span class="text-slate-500 dark:text-slate-400">Auth Type</span>
										<span class="font-medium text-slate-700 dark:text-slate-300">{dataspace.authenticationType}</span>
									</div>
								{/if}
								{#if dataspace.sinditApiBaseUrl}
									<div class="flex flex-col gap-0.5">
										<span class="text-slate-500 dark:text-slate-400">SINDIT API</span>
									<span class="font-medium text-slate-700 dark:text-slate-300 break-all">
										{dataspace.sinditApiBaseUrl}
									</span>
								</div>
							{/if}
							{#if dataspace.sinditWorkspaceUri}
								<div class="flex flex-col gap-0.5">
									<span class="text-slate-500 dark:text-slate-400">Workspace URI</span>
									<span class="font-medium text-slate-700 dark:text-slate-300 break-all">
											{dataspace.sinditWorkspaceUri}
										</span>
									</div>
								{/if}
								{#if dataspace.dataspaceAssets && dataspace.dataspaceAssets.length > 0}
								<div class="flex flex-col gap-1">
									<span class="text-slate-500 dark:text-slate-400">Published Assets ({dataspace.dataspaceAssets.length})</span>
									<ul class="space-y-1 mt-1">
										{#each dataspace.dataspaceAssets as asset}
											{@const assetUri = getAssetUri(asset)}
											{@const key = `${dataspace.id}::${assetUri}`}
											<li class="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 rounded px-2 py-1">
												<span class="font-mono break-all text-slate-700 dark:text-slate-300 flex-1">{assetUri}</span>
												<button
													class="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
													disabled={unpublishingIds.has(key)}
													title="Unpublish asset"
													on:click={() => onUnpublishAsset(dataspace, assetUri)}
												>
													{#if unpublishingIds.has(key)}
														<RefreshCwIcon size="12" class="animate-spin" />
													{:else}
														<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
														</svg>
													{/if}
												</button>
											</li>
										{/each}
									</ul>
									</div>
								{/if}
							</div>

							<!-- Actions -->
							<div class="flex gap-2 flex-wrap">
								<button
									class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 font-medium rounded-lg transition-all duration-200 text-sm"
									on:click={() => onPublish(dataspace)}
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
									</svg>
									Publish
								</button>

								<button
									class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 font-medium rounded-lg transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
									disabled={testingIds.has(dataspace.id)}
									on:click={() => onTestConnection(dataspace)}
								>
									{#if testingIds.has(dataspace.id)}
										<RefreshCwIcon size="14" class="animate-spin" />
									{:else}
										<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
										</svg>
									{/if}
									Test
								</button>

								<button
									class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 font-medium rounded-lg transition-all duration-200 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
									disabled={syncingIds.has(dataspace.id)}
									on:click={() => onSync(dataspace)}
								>
									{#if syncingIds.has(dataspace.id)}
										<RefreshCwIcon size="14" class="animate-spin" />
									{:else}
										<RefreshCwIcon size="14" />
									{/if}
									Sync
								</button>

								<button
									class="flex items-center justify-center px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium rounded-lg transition-all duration-200 text-sm"
									on:click={() => onDelete(dataspace)}
								>
									Delete
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
