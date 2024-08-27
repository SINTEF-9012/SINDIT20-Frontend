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
	<Arrow
		linkDistance={(linkDistance)*zoomLevel}
		linkDirection={linkDirection}
		linkText="{source.id} -> {target.id}"
		zoomLevel={zoomLevel}
		angleRadians={rotationRadians}
	/>
</div>

<style>
	.link {
		z-index: -1;
	}
</style>
