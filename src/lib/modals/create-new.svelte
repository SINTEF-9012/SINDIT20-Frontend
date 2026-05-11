<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();

	let workspaceName = '';

	$: isFormValid = workspaceName.trim().length > 0;

	function handleCreate() {
		if (!isFormValid) return;
		if ($modalStore[0]?.response) {
			$modalStore[0].response({ name: workspaceName.trim() });
		}
		modalStore.close();
	}

	function handleCancel() {
		modalStore.close();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && isFormValid) handleCreate();
		if (event.key === 'Escape') handleCancel();
	}
</script>

{#if $modalStore[0]}
	<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
	<div
		role="dialog"
		aria-modal="true"
		class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md mx-auto"
		on:keydown={handleKeydown}
	>
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">New Workspace</h2>

		<div class="space-y-4">
			<div>
				<label for="ws-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Workspace Name <span class="text-red-500">*</span>
				</label>
				<input
					id="ws-name"
					name="ws-name"
					type="text"
					bind:value={workspaceName}
					placeholder="my-workspace"
					autofocus
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<div class="flex justify-end gap-3 mt-8">
			<button
				type="button"
				on:click={handleCancel}
				class="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
			>
				Cancel
			</button>
			<button
				type="button"
				on:click={handleCreate}
				disabled={!isFormValid}
				class="px-4 py-2 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				Create Workspace
			</button>
		</div>
	</div>
{/if}
