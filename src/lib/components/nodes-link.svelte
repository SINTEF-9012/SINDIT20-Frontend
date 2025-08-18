<script lang="ts">
	import type { VisualizableNode } from '$lib/types';
	import type { Link as LinkType } from '$lib/types';
	import Link from '$lib/components/svg/link.svelte';
	import { getNodesState } from '$lib/components/states/nodes-state.svelte';
	import { nodeSize } from '$lib/stores'

	const nodesState = getNodesState();

	function distance(source: VisualizableNode, target: VisualizableNode) {
		if (!source?.position || !target?.position) return 0;
		const dx = target.position.x - source.position.x;
		const dy = target.position.y - source.position.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function getRotation(source: VisualizableNode, target: VisualizableNode) {
		if (!source?.position || !target?.position) return 0;
		const dx = target.position.x - source.position.x;
		const dy = target.position.y - source.position.y;
		return Math.atan2(dy, dx);
	}

	export let link: LinkType;
	export let zoomLevel: number;

	// Declare variables for calculated values
	let rotationRadians = 0;
	let rotationDeg = 0;
	let sourceOffset = { x: 0, y: 0 };
	let nodeDistance = 0;
	let linkDistance = 0;

	$: source = nodesState.getNodeById(link.sourceNodeId) as VisualizableNode;
	$: target = nodesState.getNodeById(link.targetNodeId) as VisualizableNode;
	$: linkDescription = link.linkDescription;
	$: linkWeight = link.linkWeight;
	$: linkDirection = link.linkDirection;

	function getRotationDeg(rotationRadians: number) {
		return (rotationRadians * 180) / Math.PI;
	}

	function getOffset(rotationRadians: number, radius: number) {
        return {
            x: Math.cos(rotationRadians) * radius,
            y: Math.sin(rotationRadians) * radius
        };
    }

	// TODO: fix this undefined issue! (source and target are undefined initially)
	// Calculate link properties with better error handling
	$: {
		// Ensure both nodes exist and have positions before calculating
		if (source && target && source.position && target.position) {
			rotationRadians = getRotation(source, target);
			rotationDeg = getRotationDeg(rotationRadians);
			sourceOffset = getOffset(rotationRadians, nodeSize / 2);
			nodeDistance = distance(source, target);
			linkDistance = Math.max(nodeDistance - nodeSize, 10); // Minimum distance of 10px
			console.log(`Link ${link.id}: source=${source.id}, target=${target.id}, distance=${linkDistance}`);
		} else {
			// Default values when nodes are missing
			rotationRadians = 0;
			rotationDeg = 0;
			sourceOffset = { x: 0, y: 0 };
			nodeDistance = 0;
			linkDistance = 0;
			console.log(`Link ${link.id}: source or target missing/invalid`, {
				sourceExists: !!source,
				targetExists: !!target,
				sourceHasPosition: source?.position ? true : false,
				targetHasPosition: target?.position ? true : false
			});
		}
	}

</script>

{#if source && target && source.position && target.position && linkDistance > 0}
<div
	class="link"
	style="
		position: absolute;
		left: {(source.position.x + sourceOffset.x)}px;
		top: {(source.position.y + sourceOffset.y)}px;
		width: {linkDistance}px;
		height: 2px;
		transform-origin: top left;
		transform: rotate({rotationDeg}deg);
		z-index: 1;
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
{/if}

<style>
	.link {
		z-index: 1;
	}
</style>
