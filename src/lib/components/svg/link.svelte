<script lang="ts">
    import type { LinkDirection } from "$lib/types";
    import type { Link as LinkType } from '$lib/types';
    import { onMount } from "svelte";
    import { getLinksState } from "$lib/components/states/links-state.svelte";
    import { selectedLinkId } from "$lib/stores";
    import { getDrawerStore } from "@skeletonlabs/skeleton";

    export let link: LinkType;
    export let linkDistance: number;
    export let linkDirection: LinkDirection = "left";
    export let linkText: string;
    export let zoomLevel: number;
    export let angleRadians: number;
    export let linkWeight: number;

    let linksState = getLinksState();
    const drawerStore = getDrawerStore();

    let height = 12; // Height of the link line element (ink arrow)
    let linkButtonHeight: number = 70;
    let linkTextElement: HTMLDivElement;
    let linkWeightElement: HTMLDivElement;

    $: length = Math.max(linkDistance, 0);
    $: angle = angleRadians
    $: centerX = length / 2;
    $: centerY = height / 2;
    $: boxSize = Math.min(0.8 * length, 200); // Limit max width for better appearance
    $: flipText = angle > Math.PI / 2 || angle < -Math.PI / 2;
    $: {
        if (linkTextElement) {
            linkTextElement.style.transform = flipText === true
                ? 'rotate(180deg)'
                : '';
        }
        if (linkWeightElement) {
            linkWeightElement.style.transform = flipText === true
                ? 'rotate(180deg)'
                : '';
        }
    }

    function onLinkClick() {
        selectedLinkId.set(link.id);
        drawerStore.open({id: 'info-drawer-link'});
    }

    onMount(() => {
    });
</script>

<div class="container" style="pointer-events: auto">
<svg
    xmlns="http://www.w3.org/2000/svg"
    width={length}
    height={height}
    viewBox={`0 0 ${length} ${height}`}
    pointer-events="none"
    style="pointer-events: none; z-index: 0"
    >
    <!-- Define gradients and patterns -->
    <defs>
        <!-- Simple arrow marker -->
        <marker
            id="arrow"
            viewBox="0 0 12 12"
            refX="11"
            refY="6"
            markerWidth="10"
            markerHeight="10"
            orient="auto-start-reverse">
            <path
                d="M 0 2 L 10 6 L 0 10 L 2 6 z"
                fill="#374151"
                stroke="#1f2937"
                stroke-width="0.5"
            />
        </marker>
    </defs>

    <!-- Background line for better visibility -->
    <line
        x1={2}
        y1={height / 2}
        x2={length - 2}
        y2={height / 2}
        stroke="rgba(0, 0, 0, 0.1)"
        stroke-width={Math.max(linkWeight + 2, 4)}
        stroke-linecap="round"
        opacity="0.5"
    />

    <!-- Main link line with solid colors -->
    <line
        x1={2}
        y1={height / 2}
        x2={length - 2}
        y2={height / 2}
        stroke={linkText.includes('property') ? '#a3a3a3' :
               linkText.includes('asset') ? '#525252' :
               '#1e40af'}
        stroke-width={Math.max(linkWeight, 3)}
        stroke-linecap="round"
        opacity="0.8"
        marker-start={linkDirection === "left" ? "url(#arrow)" : ""}
        marker-end={linkDirection === "right" ? "url(#arrow)" : ""}
        class="link-line"
    />
</svg>
</div>

<style>
    .container {
        position: relative;
        width: fit-content;
        z-index: 1;
    }

    /* Minimalist link line */
    :global(.link-line) {
        transition: stroke 0.2s;
        cursor: pointer;
        stroke: #64748b;
        stroke-width: 2;
        opacity: 0.8;
    }
    :global(.link-line:hover) {
        stroke: #0f172a;
        stroke-width: 3;
        opacity: 1;
    }
</style>
