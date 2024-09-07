<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import type { LogLevel } from '$lib/types';
	import { getNodes } from '$lib/components/states/nodes-state.svelte';


	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodes = getNodes();

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
	if (!metadata.name) throw new Error('Metadata name missing from modal settings.');
	if (!metadata.mode) throw new Error('Metadata mode missing from modal settings.');

	const mode = metadata.mode.toLowerCase().replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
	const title = `${mode} new ${metadata.name}`;
	const body = `${mode} a new ${metadata.name} in the knowledge graph.`;

	// Form Data - to be submitted
	const formData = {
		name: '',
        description: '',
	};

	// Create a new node in the knowledge graph
	function createNewNode(): void {
		let position = {x: 100, y: 100};
		if (metadata.position) {
			position = metadata.position;
		}
		console.log('position:', position);
		nodes.createNode(formData.name, formData.description, position);
	}

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		// if ($modalStore[0].response) $modalStore[0].response(formData);
		// TODO: Create new item in the knowledge graph // this should be handled in separate func
		if (metadata.mode === 'create' && metadata.name === 'node') createNewNode();
		const title = `Successfully "${metadata.mode}d"`;
		const message = `Successfully "${metadata.mode}d" '${formData.name}'`;
		const logLevel: LogLevel = 'info';
		toastState.add(title, message, logLevel);
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
		<header class={cHeader}>{title}</header>
		<article>{body}</article>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<input class="input" type="text" bind:value={formData.name} placeholder="Enter {metadata.name} name..." />
			</label>
			<label class="label">
				<input class="input" type="text" bind:value={formData.description} placeholder="Description..." />
			</label>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>{parent.buttonTextSubmit}</button>
		</footer>
	</div>
{/if}
