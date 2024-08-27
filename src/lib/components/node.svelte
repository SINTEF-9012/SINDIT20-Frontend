<script lang="ts">
	export let nodeName;
	export let nodeDescription;
	export let size = 200;
	export let position = { x: 0, y: 0 };
	export let zoomLevel = 1;

	let offset = { x: 0, y: 0 };
	let moving = false;
	let threshold = 20;

	$: fontSize = size * 0.15;
	$: fontSizeTitle = fontSize * 1.1 + 'px';
	$: fontSizeDescription = fontSize * 0.8 + 'px';

	function startMoving(event: MouseEvent) {
		moving = true;
		offset.x = event.clientX - position.x * zoomLevel;
		offset.y = event.clientY - position.y * zoomLevel;
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			stopMoving();
		}
	}

	function stopMoving() {
		moving = false;
	}

	function move(event: MouseEvent) {
		if (moving) {
			position.x = (event.clientX - offset.x) / zoomLevel;
			position.y = (event.clientY - offset.y) / zoomLevel;
		}
	}
</script>

<svelte:window on:mouseup={stopMoving} />

<div
	on:mousedown={startMoving}
	on:keydown={onKeyDown}
	on:mousemove={move}
	tabindex="0"
	role="button"
	class="node border border-primary-500 bg-surface-500 bg-transparent"
	style="transform: translate({position.x - size / 2}px, {position.y - size / 2}px); width: {size}px; height: {size}px;"
>
	{#if size >= threshold}
		<div class="grid-cols-1 gap-1">
			<div class="text-center">
				<span class="text-white" style="font-size: {fontSizeTitle}">{nodeName}</span>
			</div>
			<div class="text-center">
				<span class="text-gray-400" style="font-size: {fontSizeDescription}"
					>{nodeDescription}</span
				>
			</div>
		</div>
	{/if}
</div>

<style>
	.node {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		position: absolute;
		cursor: move;
		user-select: none;
		padding: 10px;
		min-width: 10px;
		max-width: 500px;
		overflow-x: visible;
		text-wrap: nowrap;
		border-radius: 50%; /* make it a circle */
	}
</style>
