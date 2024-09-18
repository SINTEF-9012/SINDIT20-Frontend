<script lang="ts">
    import type { SvelteComponent } from 'svelte';
	import type { LogLevel } from '$lib/types';
	import { getToastState } from '$lib/components/states/toast-state.svelte';
    import { getModalStore } from '@skeletonlabs/skeleton';

	// Props
	/** Exposes parent props to this component. */
	export let parent: SvelteComponent;

    const modalStore = getModalStore();
	const toastState = getToastState();

	// Form Data - to be submitted
	const formData = {
        name: '',
	};

	// Modal metadata - data input
	const metadata = $modalStore[0].meta;
	if (!metadata) throw new Error('Metadata missing from modal settings.');
	if (!metadata.name) throw new Error('Metadata name missing from modal settings.');
	const element = metadata.name;

	// We've created a custom submit function to pass the response and close the modal.
	function onFormSubmit(): void {
        if ($modalStore[0].response === undefined) {
            console.error('No response function found in modal settings.');
            throw new Error('No response function found in modal settings.');
        }
        $modalStore[0].response({name: formData.name});
        toastState.add('Success', `New ${element} created: ${formData.name}`, 'info');
		modalStore.close();
	}

	function onClose(): void {
		const title = 'Canceled';
		const message = `Creating a new ${element} cancelled.`;
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
		<header class={cHeader}>Create new {element}</header>
		<!-- Enable for debugging: -->
		<form class="modal-form {cForm}">
			<label class="label">
				<input class="input" type="text" bind:value={formData.name} placeholder='Enter new {element} name...' />
			</label>
		</form>
		<!-- prettier-ignore -->
		<footer class="modal-footer {parent.regionFooter}">
			<button class="btn {parent.buttonNeutral}" on:click={onClose}>{parent.buttonTextCancel}</button>
			<button class="btn {parent.buttonPositive}" on:click={onFormSubmit}>{parent.buttonTextSubmit}</button>
		</footer>
	</div>
{/if}
