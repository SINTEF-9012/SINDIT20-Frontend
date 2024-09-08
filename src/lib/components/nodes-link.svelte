<script lang="ts">
	import type { Node as NodeType } from '$lib/types';
	import type { Link as LinkType } from '$lib/types';
	import Link from '$lib/components/svg/link.svelte';
	import { getNodes } from '$lib/components/states/nodes-state.svelte';
	import { nodeSize } from '$lib/stores'

	const nodesState = getNodes();

	export let link: LinkType;
	export let zoomLevel: number;

	$: source = nodesState.getNode(link.sourceNodeId);
	$: target = nodesState.getNode(link.targetNodeId);
	$: linkDescription = link.linkDescription;
	$: linkWeight = link.linkWeight;
	$: linkDirection = link.linkDirection;

	function distance(source: NodeType, target: NodeType) {
		const dx = target.position.x - source.position.x;
		const dy = target.position.y - source.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getRotation(source: NodeType, target: NodeType) {
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

	// TODO: why are these undefined initially?
	if (source === undefined || target === undefined) {
		console.log('Source or target node not found');
		console.log('Source:', source);
		console.log('Target:', target);
	}

	// TODO: fix this undefined issue! (source and target are undefined initially)
	$: rotationRadians = getRotation(source, target);			// angle between source and target
	$: rotationDeg = getRotationDeg(rotationRadians);			// angle between source and target in degrees
    $: sourceOffset = getOffset(rotationRadians, nodeSize);  // offset from source center to surface (start point of the link)
	$: nodeDistance = distance(source, target);					// distance between source and target (center to center)
	$: linkDistance = nodeDistance - (2 * nodeSize);	// distance between source and target surfaces

</script>


<div
	class="link"
	style="
		position: absolute;
		left: {(source.position.x + sourceOffset.x)}px;
		top: {(source.position.y + sourceOffset.y)}px;
		width: {linkDistance}px;
		transform-origin: top left;
		transform: rotate({rotationDeg}deg);
	"
>
	<Link
		link={link}
		linkDistance={linkDistance}
		linkDirection={linkDirection}
		linkText={linkDescription}
		linkWeight={linkWeight}
		zoomLevel={zoomLevel}
		angleRadians={rotationRadians}
	/>
</div>

<style>
	.link {
		z-index: 1;
	}
</style>
