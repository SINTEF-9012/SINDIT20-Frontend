<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import type { LogLevel, NodeType } from '$lib/types';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';


	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodes = getNodesState();

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
	if (!metadata.name) throw new Error('Metadata name missing from modal settings.');
	if (!metadata.mode) throw new Error('Metadata mode missing from modal settings.');

	const mode = metadata.mode.toLowerCase().replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
	const nodeTypes: NodeType[] = ['AbstractAsset'];

	$: isBaseFormValid = false;
	$: isFormValid = false;

	// Form Data - to be submitted
	$: abstractAsset = {
		nodeName: '',
        nodeDescription: '',
		nodeType: 'AbstractAsset',
	};

	$: {
		isBaseFormValid = ((abstractAsset.nodeName != '') && (isValidNodeType(abstractAsset.nodeType)));
		if (abstractAsset.nodeType === 'AbstractAsset') {
			isFormValid = isBaseFormValid;
		} else {
			isFormValid = false;
		}
	}

	function isValidNodeType(value: any): boolean {
		return nodeTypes.includes(value);
	}

	function isValidPort(value: any): boolean {
		const port = parsePort(value);
		return !isNaN(port) && port >= 999 && port <= 9999;
	}

	function parsePort(value: string): number {
		const port = parseInt(value, 10);
		return port;
	}

	// Create a new node in the knowledge graph
	function createNewNode(): void {
		let position = {x: Math.random()*300, y: Math.random()*300};
		let title = '';
		let message = '';
		let logLevel: LogLevel = 'info';
		if (metadata.position) {
			position = metadata.position;
		}
		if (abstractAsset.nodeType === 'AbstractAsset') {
			nodes.createAbstractAssetNode(abstractAsset.nodeName, abstractAsset.nodeDescription, position);
			title = `Successfully Created`;
			message = `Created new node '${abstractAsset.nodeName}'`;
		} else {
			title = 'Error';
			message = `Node type '${abstractAsset.nodeType}' not supported.`;
			logLevel = 'error';
		}
		toastState.add(title, message, logLevel);
	}

	function onFormSubmit(): void {
		// TODO: Create new item in the knowledge graph // this should be handled in separate func
		if (metadata.mode === 'create' && metadata.name === 'node') createNewNode();
		modalStore.close();
	}

	function onClose(): void {
		const title = 'Canceled';
		const message = `Action '${metadata.mode}' '${metadata.name}' canceled`;
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
		<header class={cHeader}>Create New Node</header>
		<article>Create a new node in the knowledge graph</article>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<input class="input" type="text" bind:value={abstractAsset.nodeName} placeholder="Enter {metadata.name} name..." />
			</label>
			<label class="label">
				<input class="input" type="text" bind:value={abstractAsset.nodeDescription} placeholder="Description..." />
			</label>
			<label class="label">
				<select class="input" bind:value={abstractAsset.nodeType}>
					{#each nodeTypes as nodeType}
						<option value={nodeType}>{nodeType}</option>
					{/each}
				</select>
			</label>
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
