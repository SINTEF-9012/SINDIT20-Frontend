<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { LogLevel, ConnectionType } from '$lib/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getConnectionsState } from '$lib/components/states/connections.svelte';
	import { connectionTypes } from '$lib/stores';

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const connectionsState = getConnectionsState();

	$: isFormValid = false;
	$: console.log('isFormValid', isFormValid);

	// Form Data - to be submitted
	$: connection = {
		connectionName: '',
		description: '',
		host: '',
		port: '',
		connectionType: ''
	};

	$: {
		if (connection) {
			isFormValid =
				connection.connectionName != '' &&
				isValidHost(connection.host) &&
				isValidPort(connection.port) &&
				isValidConnectionType(connection.connectionType);
		} else {
			isFormValid = false;
		}
	}

	function isValidHost(value: any): boolean {
		return value.length > 0;
	}

	function isValidPort(value: any): boolean {
		const port = parsePort(value);
		return !isNaN(port) && port >= 999 && port <= 9999;
	}

	function isValidConnectionType(value: any): boolean {
		return connectionTypes.includes(value);
	}

	function getValidConnectionType(value: any): ConnectionType {
		if (!isValidConnectionType(value)) {
			throw new Error(`Invalid connection type: ${value}`);
		}
		return value as ConnectionType;
	}

	function parsePort(value: string): number {
		const port = parseInt(value, 10);
		return port;
	}

	// Create a new node in the knowledge graph
	function handleCreateNewConnection(): void {
		const port = parsePort(connection.port);
		try {
			connectionsState.createConnectionNode(
				connection.connectionName,
				connection.description,
				connection.host,
				port,
				getValidConnectionType(connection.connectionType)
			);
		} catch (error) {
			const title = 'Error';
			const message = `Failed to create connection: ${error.message}`;
			const logLevel: LogLevel = 'error';
			toastState.add(title, message, logLevel);
		}
	}

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		handleCreateNewConnection();
		modalStore.close();
	}

	function onClose(): void {
		const title = 'Canceled';
		const message = `Action create connection canceled`;
		const logLevel: LogLevel = 'warning';
		toastState.add(title, message, logLevel);
		modalStore.close();
	}

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
	const cForm = 'border border-surface-500 p-4 space-y-4 rounded-container-token';
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
	<div class="modal-example-form {cBase}">
		<header class={cHeader}>Create Connection</header>
		<article>Create a new connection</article>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<input
					class="input"
					type="text"
					bind:value={connection.connectionName}
					placeholder="Enter connection name..."
				/>
			</label>
			<label class="label">
				<input
					class="input"
					type="text"
					bind:value={connection.description}
					placeholder="Description..."
				/>
			</label>
			<div class="connection-properties {cForm} ml-4">
				<label>
					<input
						class="input"
						type="text"
						bind:value={connection.host}
						placeholder="Host..."
					/>
				</label>
				<label>
					{#if !isValidPort(connection.port) && connection.port !== ''}
						<span class="error-symbol">⚠️</span>
					{/if}
					<input
						class="input"
						type="text"
						bind:value={connection.port}
						placeholder="Port..."
					/>
				</label>
				<label>
					<select class="input" bind:value={connection.connectionType}>
						<option value="">Select a connection type...</option>
						{#each connectionTypes as conn}
							<option value={conn}>{conn}</option>
						{/each}
					</select>
				</label>
			</div>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit} disabled={!isFormValid}>{parent.buttonTextSubmit}</button>
		</footer>
	</div>
{/if}

<style>
	.input-container {
		display: flex;
		align-items: center;
	}
	.error-symbol {
		margin-left: 8px;
		color: red;
		position: absolute;
		pointer-events: none;
		z-index: 1;
	}
</style>
