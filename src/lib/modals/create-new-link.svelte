<script lang="ts">
	import { onMount, type SvelteComponent } from 'svelte';
	import type { LogLevel, LinkDirection } from '$lib/types';
	import type { Node as NodeType } from '$lib/types';
	import { getModalStore, RangeSlider } from '@skeletonlabs/skeleton';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { getLinksState } from '$lib/components/states/links-state.svelte';
	import { selectedNodes } from '$lib/stores';

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();
	const toastState = getToastState();
	const nodes = getNodesState();
	const links = getLinksState();

	let source: NodeType;
	let target: NodeType;

    // Modal metadata - data input
    const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
	if (!metadata.name) throw new Error('Metadata name missing from modal settings.');
	if (!metadata.mode) throw new Error('Metadata mode missing from modal settings.');

	const mode = metadata.mode.toLowerCase().replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
	const title = `${mode} new ${metadata.name}`;
	let body = `${mode} a new ${metadata.name}`;

	// Form Data - to be submitted
	const formData = {
        linkDescription: '',
        linkWeight: 1,
        linkDirection: 'none' as LinkDirection,
	};

	// Create a new link between two selected nodes in the knowledge graph
	function createNewLink(): void {
		console.log("link created...");
		const linkDescription = formData.linkDescription;
		const linkWeight = formData.linkWeight;
		const linkDirection = formData.linkDirection;
		const sourceNodeId = source.id;
		const targetNodeId = target.id;

		links.createLink(
			linkDescription,
			linkWeight,
			linkDirection,
			sourceNodeId,
			targetNodeId
		);
		selectedNodes.set([]);
	}

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
		// if ($modalStore[0].response) $modalStore[0].response(formData);
		// TODO: Create new item in the knowledge graph // this should be handled in separate func
		if (metadata.mode === 'create' && metadata.name === 'link') createNewLink();
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

	onMount(() => {
		// console.log('source:', source);
		// console.log('target:', target);
		const sourceNode = nodes.getNode($selectedNodes[0]);
		const targetNode = nodes.getNode($selectedNodes[1]);
		if (!sourceNode || !targetNode) {
			const title = 'Error';
			const message = 'Please select two nodes to create a link between.';
			const logLevel: LogLevel = 'error';
			toastState.add(title, message, logLevel);
			modalStore.close();
		} else {
			source = sourceNode;
			target = targetNode;
			body += ` between ${source.nodeName} and ${target.nodeName} in the knowledge graph.`;

		}

	});
</script>

<!-- @component This example creates a simple form modal. -->

{#if $modalStore[0]}
	<div class="modal-example-form {cBase}">
		<header class={cHeader}>{title}</header>
		<article>{body}</article>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<input class="input" type="text" bind:value={formData.linkDescription} placeholder="Enter {metadata.name} name..." />
			</label>
			<label class="label">
				<select class="select" bind:value={formData.linkDirection}>
					<option value="none" selected>None</option>
					<option value="left">Left</option>
					<option value="right">Right</option>
				</select>
			</label>
			<RangeSlider name="range-slider" bind:value={formData.linkWeight} max={25} min={1} step={1} ticked>Weight {formData.linkWeight}</RangeSlider>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>{parent.buttonTextSubmit}</button>
		</footer>
	</div>
{/if}
