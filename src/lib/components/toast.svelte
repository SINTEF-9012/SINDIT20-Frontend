<script lang="ts">
	import type { Toast } from '$lib/types';
	import { XCircleIcon } from 'svelte-feather-icons';
	import { getToastState } from './toast-state.svelte';

	export let toast: Toast;

	const toastState = getToastState();

	function backgroundColor() {
		switch (toast.logLevel) {
			case 'error':
				return 'variant-glass-error';
			case 'warning':
				return 'variant-glass-warning';
			case 'info':
				return 'variant-glass-primary';
			case 'debug':
				return 'variant-glass-primary';
			default:
				return 'variant-glass-primary';
		}
	}

	let backgroundColorClass = backgroundColor();
</script>

<div
	class="relative flex h-16 w-60 flex-col justify-center rounded-md border border-black {backgroundColorClass} p-2 shadow-md"
>
	<span class="text-sm font-medium text-black">{toast.title}</span>
	<span class="text-xs">{toast.message}</span>
	<button class="absolute right-2 top-2 size-5">
		<span class="sr-only">Close toast</span>
		<button class="absolute right-0 top-0 size-5" on:click={() => toastState.remove(toast.id)}>
			<XCircleIcon class="size-5" />
		</button>
	</button>
</div>

<style>
	button {
		border-radius: 50%; /* make it a circle */
	}
</style>
