<script lang="ts">
	import Toast from './toast.svelte';

	import { getToastState } from './states/toast-state.svelte';

	const toastState = getToastState();
	const toasts = toastState.toasts;
</script>

<div class="fixed right-6 top-28 flex flex-col gap-2 z-[90]">
	{#each $toasts as toast (toast.id)}
		<Toast {toast} />
	{/each}
</div>
