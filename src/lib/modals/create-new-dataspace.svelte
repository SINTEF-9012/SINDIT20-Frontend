<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getDataspacesState } from '$lib/components/states/dataspace-state.svelte';
	import { getWorkspace } from '$apis/sindit-backend/workspace';
	import { listSecretPaths } from '$apis/sindit-backend/vault';
	import { env } from '$env/dynamic/public';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const dataspaceState = getDataspacesState();

	let form = {
		uri: '',
		endpoint: '',
		dataspaceDescription: '',
		authenticationType: '',
		authenticationKeyPath: '',
		sinditApiBaseUrl: '',
		sinditWorkspaceUri: '',
		sinditCallbackKeyPath: ''
	};

	let vaultPaths: string[] = [];

	onMount(async () => {
		try {
			const workspaceResponse = await getWorkspace();
			const wsUri: string =
				(workspaceResponse as any)?.uri ??
				(workspaceResponse as any)?.workspace_uri ??
				'';
			if (wsUri) {
				form.sinditWorkspaceUri = wsUri;
				// Derive namespace prefix: everything up to and including the last '#' or '/'
				const sepIdx = Math.max(wsUri.lastIndexOf('#'), wsUri.lastIndexOf('/'));
				const prefix = sepIdx >= 0 ? wsUri.substring(0, sepIdx + 1) : wsUri + '#';
				form.uri = `${prefix}Dataspace_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
			}
		} catch (_) {
			// non-critical — user can fill it in manually
		}

		try {
			form.sinditApiBaseUrl = env.PUBLIC_SINDIT_BACKEND_API ?? '';
		} catch (_) {
			// non-critical
		}

		try {
			const result = await listSecretPaths();
			vaultPaths = result.secret_paths ?? [];
		} catch (_) {
			// non-critical — user can type manually
		}
	});

	$: isFormValid =
		form.uri.trim().length > 0 &&
		form.endpoint.trim().length > 0 &&
		form.sinditApiBaseUrl.trim().length > 0 &&
		form.sinditCallbackKeyPath.trim().length > 0;

	async function handleCreate() {
		if (!isFormValid) return;
		try {
			await dataspaceState.create({
				...(form.uri.trim() ? { uri: form.uri.trim() } : {}),
				endpoint: form.endpoint.trim(),
				dataspaceDescription: form.dataspaceDescription.trim() || undefined,
				authenticationType: form.authenticationType.trim() || undefined,
				authenticationKeyPath: form.authenticationKeyPath.trim() || undefined,
				sinditApiBaseUrl: form.sinditApiBaseUrl.trim() || undefined,
				sinditWorkspaceUri: form.sinditWorkspaceUri.trim() || undefined,
				sinditCallbackKeyPath: form.sinditCallbackKeyPath.trim() || undefined
			});
			toastState.add('Dataspace Created', `Dataspace "${form.endpoint}" has been created.`, 'info');
			modalStore.close();
		} catch (err) {
			toastState.add('Error', `Failed to create dataspace: ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">New Dataspace</h2>

		<div class="space-y-4">
			<!-- Node URI -->
			<div>
				<label for="ds-uri" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Node URI <span class="text-red-500">*</span>
				</label>
				<input
					id="ds-uri"
					name="ds-uri"
					type="text"
					bind:value={form.uri}
					placeholder="http://sindit.sintef.no/2.0#MyDataspace"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Endpoint -->
			<div>
				<label for="ds-endpoint" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Endpoint <span class="text-red-500">*</span>
				</label>
				<input
					id="ds-endpoint"
					name="ds-endpoint"
					type="text"
					bind:value={form.endpoint}
					placeholder="https://dataspace.example.com"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Description -->
			<div>
				<label for="ds-description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Description
				</label>
				<input
					id="ds-description"
					name="ds-description"
					type="text"
					bind:value={form.dataspaceDescription}
					placeholder="Optional description"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Authentication Type -->
			<div>
				<label for="ds-auth-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Authentication Type
				</label>
				<input
					id="ds-auth-type"
					name="ds-auth-type"
					type="text"
					bind:value={form.authenticationType}
					placeholder="e.g. api_key, oauth2"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Auth Key Path -->
			<div>
				<label for="ds-auth-key" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Authentication Key Path
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="ds-auth-key"
						name="ds-auth-key"
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
						id="ds-auth-key"
						name="ds-auth-key"
						type="text"
						bind:value={form.authenticationKeyPath}
						placeholder="/path/to/key"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
			</div>

			<!-- SINDIT API Base URL -->
			<div>
				<label for="ds-sindit-url" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					SINDIT API Base URL <span class="text-red-500">*</span>
				</label>
				<input
					id="ds-sindit-url"
					name="ds-sindit-url"
					type="text"
					bind:value={form.sinditApiBaseUrl}
					placeholder="https://sindit.example.com"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- SINDIT Workspace URI -->
			<div>
				<label for="ds-workspace-uri" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					SINDIT Workspace URI
				</label>
				<input
					id="ds-workspace-uri"
					name="ds-workspace-uri"
					type="text"
					bind:value={form.sinditWorkspaceUri}
					placeholder="urn:sindit:workspace:..."
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Callback Key Path -->
			<div>
				<label for="ds-callback-key" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					SINDIT Callback Key Path <span class="text-red-500">*</span>
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="ds-callback-key"
						name="ds-callback-key"
						bind:value={form.sinditCallbackKeyPath}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— select a vault path —</option>
						{#each vaultPaths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				{:else}
					<input
						id="ds-callback-key"
						name="ds-callback-key"
						type="text"
						bind:value={form.sinditCallbackKeyPath}
						placeholder="/path/to/callback/key"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
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
				on:click={handleCreate}
			>
				Create
			</button>
		</div>
	</div>
{/if}
