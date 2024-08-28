<script lang="ts">
    import type { LinkDirection } from "$lib/types";

    export let linkDistance: number;
    export let linkDirection: LinkDirection = "left";
    export let linkText: string;
    export let zoomLevel: number;
    export let angleRadians: number;
    export let linkWeight: number;

    let height = 10;
    $: length = Math.max(linkDistance, 0);
    $: angle = angleRadians
    $: centerX = length / 2;
    $: centerY = height / 2;
    $: boxSize = 0.2 * length;

    let linkTextElement: HTMLDivElement;
    let linkWeightElement: HTMLDivElement;

    // Reactive statement to check if the text is upside down whenever relevant properties change
    $: flipText = angle > Math.PI / 2 || angle < -Math.PI / 2;
    // $: console.log(angle, flipText, linkDistance);
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

</script>

<div class="container" style="--zoom-level: {zoomLevel}">
<svg
    xmlns="http://www.w3.org/2000/svg"
    width={length}
    height={height}
    viewBox={`0 0 ${length} ${height}`}>
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

    <!-- Add the div box at the center of the line
    <foreignObject x={centerX - 25} y={centerY - 25} width="20" height="100">
        <div class="center-box"></div>
    </foreignObject> -->
</svg>

{#if zoomLevel > 0.2}
<button class="btn" on:click={() => console.log('click')}>
    <div class="center-box"
        style="
            left: calc(50% - {boxSize / 2})px;
            top: calc(50% - {boxSize / 2})px;
            width: {boxSize}px;
            height: {boxSize}px;
        "
    >
        <!-- Link text above the link line -->
        <div class="center-link-text" bind:this={linkTextElement}>{linkText}</div>
        <!-- Line Weight below the link line -->
        <div class="center-link-weight" bind:this={linkWeightElement}>{linkWeight}</div>
    </div>
</button>
{/if}
</div>

<style>
    .container {
        position: relative;
        width: fit-content;
    }
    .center-link-text {
        white-space: nowrap; /* Prevent text from wrapping */
        overflow: visible; /* Allow text to overflow its box */
        text-align: center;
    }
    .center-link-weight {
        white-space: nowrap; /* Prevent text from wrapping */
        overflow: visible; /* Allow text to overflow its box */
        text-align: center;
    }
    .center-box {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        border: 2px solid white;
        font-size: calc(var(--zoom-level) * 30px);
        transform: translate(200%, -50%);
    }
</style>
