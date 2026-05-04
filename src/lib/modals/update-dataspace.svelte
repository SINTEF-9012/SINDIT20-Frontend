<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getDataspacesState } from '$lib/components/states/dataspace-state.svelte';
	import { listSecretPaths } from '$apis/sindit-backend/vault';
	import type { DataspaceManagement } from '$lib/types';
	import { createDataspaceManagement } from '$apis/sindit-backend/dataspace';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const dataspaceState = getDataspacesState();

	let dataspace: DataspaceManagement | null = null;
	let vaultPaths: string[] = [];

	let form = {
		label: '',
		endpoint: '',
		dataspaceDescription: '',
		authenticationType: '',
		authenticationKeyPath: '',
		sinditApiBaseUrl: '',
		sinditWorkspaceUri: '',
		sinditCallbackKeyPath: ''
	};

	onMount(async () => {
		const ds = ($modalStore[0]?.meta?.dataspace ?? null) as DataspaceManagement | null;
		if (ds) {
			dataspace = ds;
			form.label = ds.label ?? '';
			form.endpoint = ds.endpoint ?? '';
			form.dataspaceDescription = ds.dataspaceDescription ?? '';
			form.authenticationType = ds.authenticationType ?? '';
			form.authenticationKeyPath = ds.authenticationKeyPath ?? '';
			form.sinditApiBaseUrl = ds.sinditApiBaseUrl ?? '';
			form.sinditWorkspaceUri = ds.sinditWorkspaceUri ?? '';
			form.sinditCallbackKeyPath = ds.sinditCallbackKeyPath ?? '';
		}

		try {
			const result = await listSecretPaths();
			vaultPaths = result.secret_paths ?? [];
		} catch (_) {
			// non-critical
		}
	});

	$: isFormValid =
		form.label.trim().length > 0 &&
		form.endpoint.trim().length > 0 &&
		form.sinditApiBaseUrl.trim().length > 0;

	async function handleUpdate() {
		if (!isFormValid || !dataspace) return;
		try {
			await createDataspaceManagement({
				uri: dataspace.id,
				label: form.label.trim(),
				endpoint: form.endpoint.trim(),
				dataspaceDescription: form.dataspaceDescription.trim() || undefined,
				authenticationType: form.authenticationType.trim() || undefined,
				authenticationKeyPath: form.authenticationKeyPath.trim() || undefined,
				sinditApiBaseUrl: form.sinditApiBaseUrl.trim() || undefined,
				sinditWorkspaceUri: form.sinditWorkspaceUri.trim() || undefined,
				sinditCallbackKeyPath: form.sinditCallbackKeyPath.trim() || undefined
			});
			toastState.add('Dataspace Updated', `"${form.label}" has been updated.`, 'info');
			modalStore.close();
			// Refresh from backend so isActive reflects the connector restart
			try {
				await dataspaceState.updateDataspacesFromBackend();
			} catch (_) { /* non-critical */ }
		} catch (err) {
			toastState.add('Error', `Failed to update dataspace: ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

{#if $modalStore[0] && dataspace}
	<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Update Dataspace</h2>
		<p class="text-sm text-slate-500 dark:text-slate-400 font-mono mb-6 break-all">{dataspace.id}</p>

		<div class="space-y-4">
			<!-- Label -->
			<div>
				<label for="upd-ds-label" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Label <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-ds-label"
					name="upd-ds-label"
					type="text"
					bind:value={form.label}
					placeholder="My Dataspace"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Endpoint -->
			<div>
				<label for="upd-ds-endpoint" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Endpoint <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-ds-endpoint"
					name="upd-ds-endpoint"
					type="text"
					bind:value={form.endpoint}
					placeholder="https://dataspace.example.com"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="upd-ds-description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Description
				</label>
				<input
					id="upd-ds-description"
					name="upd-ds-description"
					type="text"
					bind:value={form.dataspaceDescription}
					placeholder="Optional description"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Authentication Type -->
			<div>
				<label for="upd-ds-auth-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Authentication Type
				</label>
				<input
					id="upd-ds-auth-type"
					name="upd-ds-auth-type"
					type="text"
					bind:value={form.authenticationType}
					placeholder="e.g. api_key, oauth2"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Auth Key Path -->
			<div>
				<label for="upd-ds-auth-key" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Authentication Key Path
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="upd-ds-auth-key"
						name="upd-ds-auth-key"
						bind:value={form.authenticationKeyPath}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— none —</option>
						{#each vaultPaths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				{:else}
					<input
						id="upd-ds-auth-key"
						name="upd-ds-auth-key"
						type="text"
						bind:value={form.authenticationKeyPath}
						placeholder="/path/to/key"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
			</div>

			<!-- SINDIT API Base URL -->
			<div>
				<label for="upd-ds-sindit-url" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					SINDIT API Base URL <span class="text-red-500">*</span>
				</label>
				<input
					id="upd-ds-sindit-url"
					name="upd-ds-sindit-url"
					type="text"
					bind:value={form.sinditApiBaseUrl}
					placeholder="https://sindit.example.com"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- SINDIT Workspace URI -->
			<div>
				<label for="upd-ds-workspace-uri" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					SINDIT Workspace URI
				</label>
				<input
					id="upd-ds-workspace-uri"
					name="upd-ds-workspace-uri"
					type="text"
					bind:value={form.sinditWorkspaceUri}
					placeholder="http://sindit.sintef.no/2.0#workspace"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Callback Key Path -->
			<div>
				<label for="upd-ds-callback-key" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Callback Key Path
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="upd-ds-callback-key"
						name="upd-ds-callback-key"
						bind:value={form.sinditCallbackKeyPath}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— none —</option>
						{#each vaultPaths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				{:else}
					<input
						id="upd-ds-callback-key"
						name="upd-ds-callback-key"
						type="text"
						bind:value={form.sinditCallbackKeyPath}
						placeholder="/path/to/callback-key"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
			</div>
		</div>

		<!-- Buttons -->
		<div class="flex gap-3 mt-8">
			<button
				type="button"
				class="flex-1 px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium rounded-xl transition-all duration-200"
				on:click={handleCancel}
			>
				Cancel
			</button>
			<button
				type="button"
				class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
				disabled={!isFormValid}
				on:click={handleUpdate}
			>
				Save Changes
			</button>
		</div>
	</div>
{/if}
