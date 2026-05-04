<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getConnectionsState } from '$lib/components/states/connections.svelte';
	import { connectionTypes } from '$lib/stores';
	import type { Connection, ConnectionType } from '$lib/types';
	import { updateNode } from '$apis/sindit-backend/kg';
	import { refreshConnectionByUri } from '$apis/sindit-backend/connection';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const connectionsState = getConnectionsState();

	let connection: Connection | null = null;

	let form = {
		label: '',
		description: '',
		host: '',
		port: '',
		connectionType: '' as ConnectionType | ''
	};

	onMount(() => {
		const conn = ($modalStore[0]?.meta?.connection ?? null) as Connection | null;
		if (conn) {
			connection = conn;
			form.label = conn.connectionName ?? '';
			form.description = conn.description ?? '';
			form.host = conn.host ?? '';
			form.port = conn.port != null ? String(conn.port) : '';
			form.connectionType = (conn.connectionType as ConnectionType) ?? '';
		}
	});

	function isValidPort(value: string): boolean {
		const port = parseInt(value, 10);
		return !isNaN(port) && port >= 1 && port <= 65535;
	}

	$: isFormValid =
		form.label.trim().length > 0 &&
		form.host.trim().length > 0 &&
		isValidPort(form.port) &&
		form.connectionType !== '';

	async function handleUpdate() {
		if (!isFormValid || !connection) return;
		const updatedNode = {
			uri: connection.id,
			label: form.label.trim(),
			connectionDescription: form.description.trim(),
			host: form.host.trim(),
			port: parseInt(form.port, 10),
			type: form.connectionType,
			isConnected: connection.isConnected
		};
		try {
			await updateNode(updatedNode, true);
			toastState.add('Connection Updated', `"${form.label}" has been updated.`, 'info');
			modalStore.close();
			// Re-test so isConnected reflects any host/port changes
			try {
				await refreshConnectionByUri(connection.id);
				await new Promise(resolve => setTimeout(resolve, 1500));
				await connectionsState.updateConnectionsFromBackend();
			} catch (_) { /* non-critical */ }
		} catch (err) {
			toastState.add('Error', `Failed to update connection: ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

{#if $modalStore[0] && connection}
	<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Update Connection</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 font-mono mb-6 break-all">{connection.id}</p>

		<div class="space-y-4">
			<!-- Label -->
			<div>
				<label for="upd-conn-label" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Label <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-conn-label"
					name="upd-conn-label"
					type="text"
					bind:value={form.label}
					placeholder="My Connection"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Connection Type -->
			<div>
				<label for="upd-conn-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Connection Type
				</label>
				<input
					id="upd-conn-type"
					name="upd-conn-type"
					type="text"
					value={form.connectionType}
					disabled
					class="w-full px-4 py-2 bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 cursor-not-allowed"
				/>
			</div>

			<!-- Host -->
			<div>
				<label for="upd-conn-host" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Host <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-conn-host"
					name="upd-conn-host"
					type="text"
					bind:value={form.host}
					placeholder="localhost"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Port -->
			<div>
				<label for="upd-conn-port" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Port <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-conn-port"
					name="upd-conn-port"
					type="number"
					bind:value={form.port}
					placeholder="1883"
					min="1"
					max="65535"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 {form.port && !isValidPort(form.port) ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}"
				/>
				{#if form.port && !isValidPort(form.port)}
					<p class="mt-1 text-xs text-red-500">Port must be between 1 and 65535.</p>
				{/if}
			</div>

			<!-- Description -->
			<div>
				<label for="upd-conn-description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Description
				</label>
				<input
					id="upd-conn-description"
					name="upd-conn-description"
					type="text"
					bind:value={form.description}
					placeholder="Optional description"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>
		</div>

		<!-- Actions -->
		<div class="flex gap-3 mt-8 justify-end">
			<button
				class="px-6 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-200 font-medium"
				on:click={handleCancel}
			>
				Cancel
			</button>
			<button
				class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!isFormValid}
				on:click={handleUpdate}
			>
				Save Changes
			</button>
		</div>
	</div>
{/if}
