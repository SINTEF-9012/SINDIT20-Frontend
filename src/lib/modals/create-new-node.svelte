<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getWorkspace } from '$apis/sindit-backend/workspace';
	import { getApiBaseUri } from '$lib/utils/uri';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodes = getNodesState();

	const position = $modalStore[0]?.meta?.position ?? null;

	let form = {
		label: '',
		uri: '',
		description: ''
	};

	let uriPrefix = '';
	let uriManuallyEdited = false;

	function slugify(text: string): string {
		return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
	}

	function onLabelInput() {
		if (!uriManuallyEdited && uriPrefix) {
			const slug = slugify(form.label) || 'node';
			form.uri = `${uriPrefix}${slug}`;
		}
	}

	function onUriInput() {
		uriManuallyEdited = true;
	}

	onMount(async () => {
		try {
			const workspaceResponse = await getWorkspace();
			const wsUri: string =
				(workspaceResponse as any)?.uri ??
				(workspaceResponse as any)?.workspace_uri ??
				'';
			if (wsUri) {
				const sepIdx = Math.max(wsUri.lastIndexOf('#'), wsUri.lastIndexOf('/'));
				uriPrefix = sepIdx >= 0 ? wsUri.substring(0, sepIdx + 1) : wsUri + '#';
				form.uri = `${uriPrefix}node`;
			}
		} catch (_) {
			try {
				uriPrefix = getApiBaseUri();
				form.uri = `${uriPrefix}node`;
			} catch (_) {}
		}
	});

	$: isFormValid = form.label.trim().length > 0 && form.uri.trim().length > 0;

	async function handleCreate() {
		if (!isFormValid) return;
		try {
			await nodes.createAbstractAssetNode(
				form.label.trim(),
				form.description.trim(),
				position ?? { x: Math.random() * 800 + 100, y: Math.random() * 600 + 100 },
				form.uri.trim()
			);
			toastState.add('Node Created', `Node "${form.label}" has been created.`, 'info');
			modalStore.close();
		} catch (err) {
			toastState.add(
				'Error',
				`Failed to create node: ${err instanceof Error ? err.message : err}`,
				'error'
			);
		}
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
		class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto"
		on:keydown={handleKeydown}
	>
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">New Node</h2>

		<div class="space-y-4">
			<!-- Label -->
			<div>
				<label
					for="node-label"
					class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
				>
					Label <span class="text-red-500">*</span>
				</label>
				<input
					id="node-label"
					name="node-label"
					type="text"
					bind:value={form.label}
					on:input={onLabelInput}
					placeholder="My Sensor"
					autofocus
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Node URI -->
			<div>
				<label
					for="node-uri"
					class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
				>
					Node URI <span class="text-red-500">*</span>
				</label>
				<input
					id="node-uri"
					name="node-uri"
					type="text"
					bind:value={form.uri}
					on:input={onUriInput}
					placeholder="http://sindit.sintef.no/2.0#my-node"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Description -->
			<div>
				<label
					for="node-description"
					class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
				>
					Description
				</label>
				<input
					id="node-description"
					name="node-description"
					type="text"
					bind:value={form.description}
					placeholder="Optional description..."
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
				Create Node
			</button>
		</div>
	</div>
{/if}

<style>
	.error-symbol {
		margin-left: 8px;
		color: red;
		position: absolute;
		pointer-events: none;
		z-index: 1;
	}
</style>
