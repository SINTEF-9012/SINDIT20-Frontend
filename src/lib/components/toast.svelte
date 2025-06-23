<script lang="ts">
	import type { Toast } from '$lib/types';
	import { XCircleIcon } from 'svelte-feather-icons';
	import { getToastState } from './states/toast-state.svelte';

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
	class="relative flex min-h-16 min-w-60 max-w-xs flex-col justify-center rounded-md border border-black {backgroundColorClass} p-3 shadow-md break-words"
>
	<span class="text-sm font-medium text-slate-900 dark:text-slate-100">{toast.title}</span>
	<span class="text-xs text-slate-800 dark:text-slate-200 break-words whitespace-pre-line">{toast.message}</span>
	<button class="absolute right-2 top-2 size-6 bg-white/70 dark:bg-slate-800/70 hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-700 dark:text-slate-200 flex items-center justify-center" on:click={() => toastState.remove(toast.id)}>
		<span class="sr-only">Close toast</span>
		<XCircleIcon class="size-5" />
	</button>
</div>

<style>
	button {
		border-radius: 50%; /* make it a circle */
	}
</style>
