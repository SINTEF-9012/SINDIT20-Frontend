<script lang="ts">
	import type { Toast } from '$lib/types';
	import { XIcon } from 'svelte-feather-icons';
	import { getToastState } from './toast-state.svelte';

	export let toast: Toast;

	const toastState = getToastState();

	function backgroundColor() {
		switch (toast.logLevel) {
			case 'error':
				return 'bg-error-900';
			case 'warning':
				return 'bg-warning-900';
			case 'info':
				return 'bg-primary-900';
			case 'debug':
				return 'bg-primary-500';
			default:
				return 'bg-primary-900';
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
		<button class="absolute right-2 top-2 size-5" on:click={() => toastState.remove(toast.id)}>
			<XIcon class="size-5" />
		</button>
	</button>
</div>
