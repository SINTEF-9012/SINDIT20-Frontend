<script lang="ts">
    import type { LinkDirection } from "$lib/types";
    import type { Link as LinkType } from '$lib/types';
    import { onMount } from "svelte";
    import { getLinks } from "$lib/components/states/links-state.svelte";
    import { selectedLinkId } from "$lib/stores";
    import { getDrawerStore } from "@skeletonlabs/skeleton";

    export let link: LinkType;
    export let linkDistance: number;
    export let linkDirection: LinkDirection = "left";
    export let linkText: string;
    export let zoomLevel: number;
    export let angleRadians: number;
    export let linkWeight: number;

    let linksState = getLinks();
    const drawerStore = getDrawerStore();

    let height = 10; // Height of the link line element (ink arrow)
    let linkButtonHeight: number = 60;
    let linkTextElement: HTMLDivElement;
    let linkWeightElement: HTMLDivElement;

    $: length = Math.max(linkDistance, 0);
    $: angle = angleRadians
    $: centerX = length / 2;
    $: centerY = height / 2;
    $: boxSize = 0.8 * length;
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
        console.log("link dblclick", link);
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
    <!-- Define the arrow marker -->
    <defs>
        <marker
            id="arrow"
            viewBox={`0 0 10 ${height}`}
            refX="10"
            refY={height / 2}
            markerWidth="6"
            markerHeight={height}
            orient="auto-start-reverse">
            <path d={`M 0 0 L 10 ${height / 2} L 0 ${height} z`} fill="white" />
        </marker>
    </defs>

    <line
        x1={0}
        y1={height / 2}
        x2={length}
        y2={height / 2}
        stroke="white"
        stroke-width={linkWeight}
        marker-start={linkDirection === "left" ? "url(#arrow)" : ""}
        marker-end={linkDirection === "right" ? "url(#arrow)" : ""}
    />
</svg>

{#if zoomLevel > 0.2 && zoomLevel < 2}
    <button class="center-box"
        style="
            left: {centerX}px;
            top: {centerY}px;
            width: {boxSize}px;
            height: {linkButtonHeight}px;
            transform: translate(-50%, -50%);
            pointer-events: auto;
        "
        on:click={onLinkClick}
    >
        <!-- Link text above the link line -->
         {#if flipText}
            <div class="center-link-weight text-gray-400" bind:this={linkWeightElement}>{linkWeight}</div>
            <div class="center-link-text text-white" bind:this={linkTextElement}>{linkText}</div>
        {:else}
            <div class="center-link-text text-white" bind:this={linkTextElement}>{linkText}</div>
            <div class="center-link-weight text-gray-400" bind:this={linkWeightElement}>{linkWeight}</div>
        {/if}
    </button>
{/if}
</div>

<style>
    .container {
        position: relative;
        width: fit-content;
        z-index: 1;
    }
    .center-link-text {
        white-space: nowrap; /* Prevent text from wrapping */
        overflow: visible; /* Allow text to overflow its box */
        text-align: center;
        z-index: 1;
    }
    .center-link-weight {
        white-space: nowrap; /* Prevent text from wrapping */
        overflow: visible; /* Allow text to overflow its box */
        text-align: center;
        z-index: 1;
    }
    .center-box {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: none;
        background: transparent;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
		cursor: pointer;
        z-index: 2;
    }
</style>
