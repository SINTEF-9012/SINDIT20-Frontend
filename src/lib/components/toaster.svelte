<script lang="ts">
	import Toast from './toast.svelte';

	import { getToastState } from './toast-state.svelte';

	const toastState = getToastState();
	const toasts = toastState.toasts;
</script>

<div class="absolute right-2 top-2 flex flex-col gap-2 z-50">
	{#each $toasts as toast}
		<Toast {toast} />
	{/each}
</div>
