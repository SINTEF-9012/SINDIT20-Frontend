<script lang="ts">
	import type { PaginationState } from '$lib/pagination';
	import { ChevronLeftIcon, ChevronRightIcon } from 'svelte-feather-icons';

	export let state: PaginationState;
	export let onLoadMore: () => Promise<void>;
	export let onLoadAll: (() => Promise<void>) | null = null;

	let loading = false;

	async function handleLoadMore() {
		if (loading || !state.hasMore) return;
		loading = true;
		try {
			await onLoadMore();
		} finally {
			loading = false;
		}
	}

	async function handleLoadAll() {
		if (!onLoadAll || loading || !state.hasMore) return;
		loading = true;
		try {
			await onLoadAll();
		} finally {
			loading = false;
		}
	}
</script>

{#if state.hasMore || state.totalItems !== null}
	<div
		class="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
	>
		<!-- Info Section -->
		<div class="text-sm text-slate-600 dark:text-slate-400">
			{#if state.totalItems !== null}
				Showing <span class="font-semibold text-slate-900 dark:text-slate-100"
					>{state.totalItems}</span
				> items
			{/if}
			{#if state.hasMore}
				<span class="text-slate-500 dark:text-slate-500">• More available</span>
			{/if}
		</div>

		<!-- Action Buttons -->
		<div class="flex items-center gap-3">
			{#if state.hasMore}
				<button
					on:click={handleLoadMore}
					disabled={loading || state.isLoading}
					class="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
				>
					{#if loading || state.isLoading}
						<svg
							class="animate-spin h-4 w-4"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"
							></path>
						</svg>
					{:else}
						<ChevronRightIcon size="16" />
					{/if}
					Load More
				</button>

				{#if onLoadAll}
					<button
						on:click={handleLoadAll}
						disabled={loading || state.isLoading}
						class="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
					>
						{#if loading || state.isLoading}
							<svg
								class="animate-spin h-4 w-4"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8v8H4z"
								></path>
							</svg>
						{:else}
							<svg
								class="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
								/>
							</svg>
						{/if}
						Load All
					</button>
				{/if}
			{/if}
		</div>
	</div>
{/if}
