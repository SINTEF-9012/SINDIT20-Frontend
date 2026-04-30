<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getDataspacesState } from '$lib/components/states/dataspace-state.svelte';
	import { getAllNodes } from '$apis/sindit-backend/kg';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const dataspaceState = getDataspacesState();

	const meta = $modalStore[0]?.meta as { dataspaceId: string; existingAssets: string[] };
	const dataspaceId = meta?.dataspaceId ?? '';
	const existingAssetUris = new Set<string>(meta?.existingAssets ?? []);

	type KGNode = { uri?: string; id?: string; nodeType?: string; label?: string; name?: string };

	let allNodes: KGNode[] = [];
	let loading = true;
	let publishing = false;
	let searchQuery = '';
	let selected = new Set<string>();

	$: filtered = allNodes.filter((n) => {
		const uri = n.uri ?? n.id ?? '';
		const label = n.label ?? n.name ?? '';
		const type = n.nodeType ?? '';
		const q = searchQuery.toLowerCase();
		return uri.toLowerCase().includes(q) || label.toLowerCase().includes(q) || type.toLowerCase().includes(q);
	});

	onMount(async () => {
		try {
			const nodes = await getAllNodes(1, 200);
			allNodes = (nodes as KGNode[]).filter((n) => {
				const uri = n.uri ?? n.id ?? '';
				return uri.length > 0 && !existingAssetUris.has(uri);
			});
		} catch (err) {
			toastState.add('Error', `Failed to load nodes: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			loading = false;
		}
	});

	function toggleNode(uri: string) {
		const next = new Set(selected);
		if (next.has(uri)) {
			next.delete(uri);
		} else {
			next.add(uri);
		}
		selected = next;
	}

	function toggleAll() {
		if (selected.size === filtered.length && filtered.length > 0) {
			selected = new Set();
		} else {
			selected = new Set(filtered.map((n) => n.uri ?? n.id ?? '').filter(Boolean));
		}
	}

	async function handlePublish() {
		if (selected.size === 0 || publishing) return;
		publishing = true;
		try {
			await dataspaceState.publishAssets(dataspaceId, [...selected]);
			toastState.add('Published', `${selected.size} node(s) published to dataspace.`, 'info');
			modalStore.close();
		} catch (err) {
			toastState.add('Error', `Failed to publish: ${err instanceof Error ? err.message : err}`, 'error');
		} finally {
			publishing = false;
		}
	}
</script>

<div class="card w-[640px] max-w-[95vw] max-h-[85vh] flex flex-col shadow-2xl bg-white dark:bg-slate-800 rounded-2xl overflow-hidden">
	<!-- Header -->
	<div class="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
		<div>
			<h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Publish Nodes</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-mono break-all">{dataspaceId}</p>
		</div>
		<button
			class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
			on:click={() => modalStore.close()}
		>
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<!-- Search + Select All -->
	<div class="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 space-y-3">
		<div class="relative">
			<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
				<svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			</div>
			<input
				type="text"
				id="publish-node-search"
				name="publish-node-search"
				bind:value={searchQuery}
				placeholder="Search nodes by URI or type..."
				class="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
			/>
		</div>

		{#if !loading && filtered.length > 0}
			<div class="flex items-center justify-between text-sm">
				<button
					class="text-blue-600 dark:text-blue-400 hover:underline"
					on:click={toggleAll}
				>
					{selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'} ({filtered.length})
				</button>
				<span class="text-slate-500 dark:text-slate-400">{selected.size} selected</span>
			</div>
		{/if}
	</div>

	<!-- Node list -->
	<div class="flex-1 overflow-y-auto px-6 py-3 min-h-0">
		{#if loading}
			<div class="flex items-center justify-center py-12 text-slate-400">
				<svg class="w-5 h-5 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Loading nodes...
			</div>
		{:else if filtered.length === 0}
			<div class="text-center py-12 text-slate-400 text-sm">
				{searchQuery ? 'No nodes match your search.' : 'All nodes are already published to this dataspace.'}
			</div>
		{:else}
			<ul class="space-y-1.5">
				{#each filtered as node}
					{@const uri = node.uri ?? node.id ?? ''}
					{@const isSelected = selected.has(uri)}
					<li>
						<button
							class="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors
								{isSelected
									? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
									: 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'}"
							on:click={() => toggleNode(uri)}
						>
							<!-- Checkbox -->
							<div class="flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
								{isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-500'}">
								{#if isSelected}
									<svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
									</svg>
								{/if}
							</div>
							<!-- Content -->
							<div class="flex-1 min-w-0">
								{#if node.label || node.name}
									<p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
										{node.label ?? node.name}
									</p>
								{/if}
								<p class="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{uri}</p>
								{#if node.nodeType}
									<span class="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] rounded">
										{node.nodeType}
									</span>
								{/if}
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Footer -->
	<div class="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 flex-shrink-0">
		<button
			class="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
			on:click={() => modalStore.close()}
		>
			Cancel
		</button>
		<button
			class="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={selected.size === 0 || publishing}
			on:click={handlePublish}
		>
			{#if publishing}
				<svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Publishing...
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
				</svg>
				Publish {selected.size > 0 ? `(${selected.size})` : ''}
			{/if}
		</button>
	</div>
</div>
