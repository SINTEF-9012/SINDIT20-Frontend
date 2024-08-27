<script lang="ts">
	import CreateNew from '$lib/modals/create-new.svelte';
	import type { Node, LinkDirection } from '$lib/types';
	import Arrow from '$lib/components/svg/arrow.svelte';

	export let source: Node;  // source node
	export let target: Node;  // target node
	export let zoomLevel = 1;
	export let linkDirection: LinkDirection = 'none';  // default direction from source to target
	export let linkWeight = 10;

	function distance(source: Node, target: Node) {
		const dx = target.position.x - source.position.x;
		const dy = target.position.y - source.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getRotation(source: Node, target: Node) {
		const dx = target.position.x - source.position.x;
		const dy = target.position.y - source.position.y;
		return Math.atan2(dy, dx);
	}

	function getRotationDeg(rotationRadians: number) {
		return (rotationRadians * 180) / Math.PI;
	}

	function getOffset(rotationRadians: number, radius: number) {
        return {
            x: Math.cos(rotationRadians) * radius,
            y: Math.sin(rotationRadians) * radius
        };
    }

	$: rotationRadians = getRotation(source, target);			// angle between source and target
	$: rotationDeg = getRotationDeg(rotationRadians);			// angle between source and target in degrees
    $: sourceOffset = getOffset(rotationRadians, source.size);  // offset from source center to surface (start point of the link)
	$: nodeDistance = distance(source, target);					// distance between source and target (center to center)
	$: linkDistance = nodeDistance - source.size - target.size;	// distance between source and target surfaces

</script>


<div
	class="link"
	style="
		position: absolute;
		left: {(source.position.x + sourceOffset.x) * zoomLevel}px;
		top: {(source.position.y + sourceOffset.y) * zoomLevel}px;
		width: {linkDistance * zoomLevel}px;
		transform-origin: top left;
		transform: rotate({rotationDeg}deg);
	"
>
	<div
		class="line border border-primary-500 bg-surface-500"
		style="
			width: 100%;
			height: {linkWeight}px;
		"
	></div>
	{#if linkDirection === 'left'}
		<!-- Arrow at the start of the line -->
		<div
			class="arrow-start"
			style="
				position: absolute;
				left: 5%;
				top: 50%;
				transform: translateY(-100%) rotate(90deg);
				transform-origin: 0% 50%;
				border-left: {linkWeight * 2}px solid transparent;
				border-right: {linkWeight * 2}px solid transparent;
				border-top: {linkWeight * 3}px solid white;
			"
		></div>
	{:else if linkDirection === 'right'}
		<!-- Arrow at the end of the line pointing towards the target -->
		<div
			class="arrow-end"
			style="
				position: absolute;
				right: +2%;
				top: 50%;
				transform: translateY(+30%) rotate(90deg);
				transform-origin: 100% 50%;
				border-left: {linkWeight * 2}px solid transparent;
				border-right: {linkWeight * 2}px solid transparent;
				border-bottom: {linkWeight * 3}px solid white;
			"
		></div>
	{/if}
	<div class="arrow-svg">
		<Arrow
			linkDistance={(linkDistance)*zoomLevel}
			linkDirection={linkDirection}
			linkText="{source.id} -> {target.id}"
			zoomLevel={zoomLevel}
			angleRadians={rotationRadians}
		/>
	</div>
</div>

<style>
	.link {
		z-index: -1;
	}
	.line {
		z-index: -1;
		position: absolute;
	}
    .arrow-start {
        z-index: 1;
    }
	.arrow-end {
		z-index: 1;
	}
</style>
