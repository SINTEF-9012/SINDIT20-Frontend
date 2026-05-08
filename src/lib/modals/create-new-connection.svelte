<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { onMount } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getConnectionsState } from '$lib/components/states/connections.svelte';
	import { connectionTypes } from '$lib/stores';
	import type { ConnectionType } from '$lib/types';
	import { getApiBaseUri } from '$lib/utils/uri';
	import { getWorkspace } from '$apis/sindit-backend/workspace';
	import { refreshConnectionByUri } from '$apis/sindit-backend/connection';
	import { listSecretPaths } from '$apis/sindit-backend/vault';

	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const connectionsState = getConnectionsState();

	let form = {
		label: '',
		uri: '',
		description: '',
		host: '',
		port: '',
		connectionType: '' as ConnectionType | '',
		username: '',
		passwordPath: '',
		tokenPath: '',
		configuration: ''
	};

	let configJsonError = '';
	let vaultPaths: string[] = [];

	let uriPrefix = '';
	let uriManuallyEdited = false;

	function slugify(text: string): string {
		return text
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function onLabelInput() {
		if (!uriManuallyEdited && uriPrefix) {
			const slug = slugify(form.label) || 'connection';
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
				form.uri = `${uriPrefix}connection`;
			}
		} catch (_) {
			// non-critical — fall back to api base uri
			try {
				uriPrefix = getApiBaseUri();
				form.uri = `${uriPrefix}connection`;
			} catch (_) {}
		}

		try {
			const result = await listSecretPaths();
			vaultPaths = result.secret_paths ?? [];
		} catch (_) {
			// non-critical — user can type manually
		}
	});

	function isValidPort(value: string): boolean {
		const port = parseInt(value, 10);
		return !isNaN(port) && port >= 1 && port <= 65535;
	}

	function validateConfigJson(value: string): boolean {
		if (!value.trim()) return true;
		try { JSON.parse(value); configJsonError = ''; return true; }
		catch { configJsonError = 'Invalid JSON'; return false; }
	}

	$: if (form.configuration !== undefined) validateConfigJson(form.configuration);

	const configExamples: Record<string, { placeholder: string; hint: string; required: boolean }> = {
		MQTT: { placeholder: '', hint: 'No extra configuration needed for MQTT.', required: false },
		InfluxDB: { placeholder: '', hint: 'No extra configuration needed. Org and bucket are set per property.', required: false },
		S3: {
			placeholder: '{\n  "region_name": "eu-west-1",\n  "secure": "True",\n  "expiration": 3600\n}',
			hint: 'Optional. Keys: region_name (string), secure ("True"/"False"), expiration (seconds, default 3600).',
			required: false
		},
		PostgreSQL: {
			placeholder: '{\n  "dbname": "my_database"\n}',
			hint: 'Required. dbname is the PostgreSQL database name to connect to.',
			required: true
		}
	};

	$: configMeta = configExamples[form.connectionType as string] ?? { placeholder: '{"key": "value"}', hint: '', required: false };

	$: isConfigRequiredAndMissing = configMeta.required && !form.configuration.trim();

	$: isFormValid =
		form.label.trim().length > 0 &&
		form.uri.trim().length > 0 &&
		form.host.trim().length > 0 &&
		isValidPort(form.port) &&
		form.connectionType !== '' &&
		!configJsonError &&
		!isConfigRequiredAndMissing;

	async function handleCreate() {
		if (!isFormValid) return;
		const fullUri = form.uri.trim();
		let parsedConfig: Record<string, unknown> | undefined;
		if (form.configuration.trim()) {
			try { parsedConfig = JSON.parse(form.configuration); } catch { return; }
		}
		try {
			await connectionsState.createConnectionNode(
				form.label.trim(),
				form.description.trim(),
				form.host.trim(),
				parseInt(form.port, 10),
				form.connectionType as ConnectionType,
				fullUri,
				form.username.trim() || undefined,
				form.passwordPath.trim() || undefined,
				form.tokenPath.trim() || undefined,
				parsedConfig
			);
			toastState.add('Connection Created', `Connection "${form.label}" has been created.`, 'info');
			modalStore.close();
			// Trigger backend refresh for this specific connection so isConnected is populated
			try {
				await refreshConnectionByUri(form.uri.trim());
				await new Promise(resolve => setTimeout(resolve, 1500));
				await connectionsState.updateConnectionsFromBackend();
			} catch (_) { /* non-critical */ }
		} catch (err) {
			toastState.add('Error', `Failed to create connection: ${err instanceof Error ? err.message : err}`, 'error');
		}
	}

	function handleCancel() {
		modalStore.close();
	}
</script>

{#if $modalStore[0]}
	<div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-lg mx-auto">
		<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">New Connection</h2>

		<div class="space-y-4">
			<!-- Label -->
			<div>
				<label for="conn-label" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Label <span class="text-red-500">*</span>
				</label>
				<input
					id="conn-label"
					name="conn-label"
					type="text"
					bind:value={form.label}
					on:input={onLabelInput}
					placeholder="My Connection"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Node URI -->
			<div>
				<label for="conn-uri" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Node URI <span class="text-red-500">*</span>
				</label>
				<input
					id="conn-uri"
					name="conn-uri"
					type="text"
					bind:value={form.uri}
					on:input={onUriInput}
					placeholder="http://sindit.sintef.no/2.0#my-connection"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Connection Type -->
			<div>
				<label for="conn-type" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Connection Type <span class="text-red-500">*</span>
				</label>
				<select
					id="conn-type"
					name="conn-type"
					bind:value={form.connectionType}
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<option value="">— select a type —</option>
					{#each connectionTypes as ct}
						<option value={ct}>{ct}</option>
					{/each}
				</select>
			</div>

			<!-- Host -->
			<div>
				<label for="conn-host" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Host <span class="text-red-500">*</span>
				</label>
				<input
					id="conn-host"
					name="conn-host"
					type="text"
					bind:value={form.host}
					placeholder="localhost"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Port -->
			<div>
				<label for="conn-port" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Port <span class="text-red-500">*</span>
				</label>
				<input
					id="conn-port"
					name="conn-port"
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
				<label for="conn-description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Description
				</label>
				<input
					id="conn-description"
					name="conn-description"
					type="text"
					bind:value={form.description}
					placeholder="Optional description"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Username -->
			<div>
				<label for="conn-username" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Username
				</label>
				<input
					id="conn-username"
					name="conn-username"
					type="text"
					bind:value={form.username}
					placeholder="Optional"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<!-- Password Path -->
			<div>
				<label for="conn-password-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Password Path
					<span class="ml-1 text-xs font-normal text-slate-400">(vault secret key)</span>
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="conn-password-path"
						name="conn-password-path"
						bind:value={form.passwordPath}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— none —</option>
						{#each vaultPaths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				{:else}
					<input
						id="conn-password-path"
						name="conn-password-path"
						type="text"
						bind:value={form.passwordPath}
						placeholder="e.g. my_mqtt_password"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
			</div>

			<!-- Token Path -->
			{#if form.connectionType === 'InfluxDB'}
			<div>
				<label for="conn-token-path" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Token Path
					<span class="ml-1 text-xs font-normal text-slate-400">(vault secret key)</span>
				</label>
				{#if vaultPaths.length > 0}
					<select
						id="conn-token-path"
						name="conn-token-path"
						bind:value={form.tokenPath}
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">— none —</option>
						{#each vaultPaths as path}
							<option value={path}>{path}</option>
						{/each}
					</select>
				{:else}
					<input
						id="conn-token-path"
						name="conn-token-path"
						type="text"
						bind:value={form.tokenPath}
						placeholder="e.g. my_influx_token"
						class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/if}
			</div>
			{/if}

			<!-- Configuration -->
			{#if !form.connectionType || (form.connectionType !== 'MQTT' && form.connectionType !== 'InfluxDB')}
			<div>
				<label for="conn-configuration" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
					Configuration
					{#if configMeta.required}<span class="text-red-500">*</span>{:else}<span class="ml-1 text-xs font-normal text-slate-400">(optional JSON)</span>{/if}
				</label>
				<textarea
					id="conn-configuration"
					name="conn-configuration"
					bind:value={form.configuration}
					placeholder={configMeta.placeholder || '{"key": "value"}'}
					rows="4"
					class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none {configJsonError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'}"
				></textarea>
				{#if configMeta.hint}
					<p class="mt-1 text-xs text-slate-400 dark:text-slate-500">{configMeta.hint}</p>
				{/if}
				{#if configJsonError}
					<p class="mt-1 text-xs text-red-500">{configJsonError}</p>
				{/if}
			</div>
			{/if}
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
