<script lang="ts">
	import { onMount } from 'svelte';
	import { listSecretPaths, storeSecret } from '$apis/sindit-backend/vault';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { KeyIcon, PlusIcon, RefreshCwIcon, EyeIcon, EyeOffIcon } from 'svelte-feather-icons';

	const toastState = getToastState();

	let secretPaths: string[] = [];
	let loading = false;
	let searchQuery = '';

	// Add secret form
	let showAddForm = false;
	let newPath = '';
	let newValue = '';
	let showValue = false;
	let submitting = false;

	$: filteredPaths = searchQuery
		? secretPaths.filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
		: secretPaths;

	async function loadPaths() {
		loading = true;
		try {
			const result = await listSecretPaths();
			secretPaths = result.secret_paths ?? [];
		} catch (err) {
			if (err instanceof Error && err.message === 'NOT_AUTHENTICATED') {
				toastState.add('Authentication Required', 'You must sign in to view the vault.', 'error');
			} else {
				toastState.add('Error', 'Failed to load vault secrets.', 'error');
			}
		} finally {
			loading = false;
		}
	}

	onMount(loadPaths);

	async function handleStore() {
		if (!newPath.trim() || !newValue.trim()) return;
		submitting = true;
		try {
			await storeSecret(newPath.trim(), newValue.trim());
			toastState.add('Secret Stored', `Secret at "${newPath.trim()}" has been saved.`, 'info');
			// Refresh list and reset form
			await loadPaths();
			newPath = '';
			newValue = '';
			showAddForm = false;
		} catch (err) {
			toastState.add('Error', `Failed to store secret: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			submitting = false;
		}
	}

	function cancelAdd() {
		newPath = '';
		newValue = '';
		showValue = false;
		showAddForm = false;
	}
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
	<div class="container mx-auto px-6 py-12">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-3xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
				Vault
			</h1>
			<p class="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
				Manage secrets stored in the SINDIT vault.
			</p>
		</div>

		<!-- Search and Actions Bar -->
		<div class="max-w-3xl mx-auto mb-8">
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
							id="vault-search"
							name="vault-search"
							bind:value={searchQuery}
							placeholder="Search secret paths..."
							class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
						/>
					</div>

					<!-- Actions -->
					<div class="flex gap-3 w-full sm:w-auto">
						<button
							class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex-1 sm:flex-none justify-center"
							on:click={() => (showAddForm = true)}
						>
							<PlusIcon size="20" />
							Add Secret
						</button>
						<button
							class="flex items-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
							on:click={loadPaths}
							title="Refresh"
						>
							<RefreshCwIcon size="20" class={loading ? 'animate-spin' : ''} />
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Add Secret Form -->
		{#if showAddForm}
			<div class="max-w-3xl mx-auto mb-8">
				<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-800 p-6">
					<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">New Secret</h2>
					<div class="space-y-4">
						<div>
							<label for="secret-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Secret Path <span class="text-red-500">*</span>
							</label>
							<input
								id="secret-path"
								name="secret-path"
								type="text"
								bind:value={newPath}
								placeholder="/path/to/secret"
								class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
							/>
						</div>
						<div>
							<label for="secret-value" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
								Secret Value <span class="text-red-500">*</span>
							</label>
							<div class="relative">
								{#if showValue}
									<input
										id="secret-value"
										name="secret-value"
										type="text"
										bind:value={newValue}
										placeholder="Enter secret value"
										class="w-full px-4 py-2 pr-12 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
									/>
								{:else}
									<input
										id="secret-value"
										name="secret-value"
										type="password"
										bind:value={newValue}
										placeholder="Enter secret value"
										class="w-full px-4 py-2 pr-12 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
									/>
								{/if}
								<button
									type="button"
									class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
									on:click={() => (showValue = !showValue)}
									title={showValue ? 'Hide value' : 'Show value'}
								>
									{#if showValue}
										<EyeOffIcon size="18" />
									{:else}
										<EyeIcon size="18" />
									{/if}
								</button>
							</div>
						</div>
					</div>
					<div class="flex gap-3 mt-6 justify-end">
						<button
							class="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 font-medium"
							on:click={cancelAdd}
						>
							Cancel
						</button>
						<button
							class="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
							disabled={!newPath.trim() || !newValue.trim() || submitting}
							on:click={handleStore}
						>
							{#if submitting}
								<RefreshCwIcon size="16" class="animate-spin" />
							{/if}
							Save Secret
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Secret Paths List -->
		<div class="max-w-3xl mx-auto">
			{#if loading && secretPaths.length === 0}
				<div class="text-center py-16">
					<RefreshCwIcon size="32" class="animate-spin mx-auto text-amber-500 mb-4" />
					<p class="text-slate-500 dark:text-slate-400">Loading secrets...</p>
				</div>
			{:else if filteredPaths.length === 0}
				<div class="text-center py-16">
					<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-12 max-w-md mx-auto">
						<div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
							<KeyIcon size="32" class="text-slate-400" />
						</div>
						<h3 class="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
							{searchQuery ? 'No matching secrets' : 'No secrets stored'}
						</h3>
						<p class="text-slate-500 dark:text-slate-400 mb-6">
							{searchQuery ? 'Try adjusting your search.' : 'Add your first secret to get started.'}
						</p>
						{#if !searchQuery}
							<button
								class="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg"
								on:click={() => (showAddForm = true)}
							>
								Add First Secret
							</button>
						{/if}
					</div>
				</div>
			{:else}
				<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
					<div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
						<span class="text-sm font-medium text-slate-500 dark:text-slate-400">
							{filteredPaths.length} secret{filteredPaths.length !== 1 ? 's' : ''}
						</span>
					</div>
					<ul class="divide-y divide-slate-100 dark:divide-slate-700">
						{#each filteredPaths as path}
							<li class="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
								<div class="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
									<KeyIcon size="16" class="text-amber-600 dark:text-amber-400" />
								</div>
								<span class="font-mono text-sm text-slate-800 dark:text-slate-200 break-all">
									{path}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>
	</div>
</div>
