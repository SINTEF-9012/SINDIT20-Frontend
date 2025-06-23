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
    <!-- Define gradients and patterns -->
    <defs>
        <!-- Gradient for the main line -->
        <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#64748b;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#475569;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#64748b;stop-opacity:1" />
        </linearGradient>

        <!-- Enhanced arrow marker -->
        <marker
            id="arrow"
            viewBox="0 0 12 12"
            refX="11"
            refY="6"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse">
            <path
                d="M 0 2 L 10 6 L 0 10 L 2 6 z"
                fill="url(#arrowGradient)"
                stroke="#1e293b"
                stroke-width="0.5"
            />
        </marker>

        <!-- Arrow gradient -->
        <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#334155;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
        </linearGradient>
    </defs>

    <!-- Background line for better visibility -->
    <line
        x1={2}
        y1={height / 2}
        x2={length - 2}
        y2={height / 2}
        stroke="#e2e8f0"
        stroke-width={Math.max(linkWeight + 3, 4)}
        stroke-linecap="round"
        opacity="0.9"
    />

    <!-- Fallback solid line for maximum visibility -->
    <line
        x1={2}
        y1={height / 2}
        x2={length - 2}
        y2={height / 2}
        stroke="#334155"
        stroke-width={Math.max(linkWeight, 3)}
        stroke-linecap="round"
        opacity="1"
        marker-start={linkDirection === "left" ? "url(#arrow)" : ""}
        marker-end={linkDirection === "right" ? "url(#arrow)" : ""}
        class="link-line"
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
            <div class="center-link-weight" bind:this={linkWeightElement}>
                <span class="weight-badge">Weight: {linkWeight}</span>
            </div>
            <div class="center-link-text" bind:this={linkTextElement}>
                <span class="link-label">{linkText}</span>
            </div>
        {:else}
            <div class="center-link-text" bind:this={linkTextElement}>
                <span class="link-label">{linkText}</span>
            </div>
            <div class="center-link-weight" bind:this={linkWeightElement}>
                <span class="weight-badge">Weight: {linkWeight}</span>
            </div>
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

    /* Enhanced link line with hover effects */
    :global(.link-line) {
        transition: all 0.3s ease;
        cursor: pointer;
    }

    :global(.link-line:hover) {
        stroke: #1e293b;
        stroke-width: 4;
    }

    .center-link-text {
        white-space: nowrap;
        overflow: visible;
        text-align: center;
        z-index: 1;
        margin-bottom: 4px;
    }

    .link-label {
        display: inline-block;
        color: #1f2937;
        font-weight: 600;
        font-size: 13px;
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        padding: 6px 12px;
        border-radius: 8px;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(59, 130, 246, 0.2);
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        min-width: 60px;
    }

    .center-link-weight {
        white-space: nowrap;
        overflow: visible;
        text-align: center;
        z-index: 1;
    }

    .weight-badge {
        display: inline-block;
        color: #6b7280;
        font-weight: 500;
        font-size: 10px;
        background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
        padding: 3px 8px;
        border-radius: 6px;
        backdrop-filter: blur(4px);
        border: 1px solid rgba(156, 163, 175, 0.3);
        transition: all 0.2s ease;
    }

    /* Dark mode styles */
    :global(.dark) .link-label {
        color: #f3f4f6;
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-color: rgba(148, 163, 184, 0.3);
    }

    :global(.dark) .weight-badge {
        color: #9ca3af;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-color: rgba(148, 163, 184, 0.2);
    }

    .center-box {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: none;
        background: transparent;
        justify-content: space-between;
        cursor: pointer;
        z-index: 2;
        transition: all 0.2s ease;
        padding: 4px;
        border-radius: 8px;
    }
</style>
