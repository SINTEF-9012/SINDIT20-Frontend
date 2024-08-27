<script lang="ts">
    import type { LinkDirection } from "$lib/types";

    export let linkDistance: number;
    export let linkDirection: LinkDirection = "left";
    export let linkText: string;
    export let zoomLevel: number;
    export let angleRadians: number;

    let linkWeight = 2;
    let height = 10;
    $: length = Math.max(linkDistance, 0);
    $: angle = angleRadians

    let centerTextElement: HTMLDivElement;

    // Reactive statement to check if the text is upside down whenever relevant properties change
    $: flipText = angle > Math.PI / 2 || angle < -Math.PI / 2;
    // $: console.log(angle, flipText, linkDistance);
    $: {
        if (centerTextElement) {
            centerTextElement.style.transform = flipText === true
                ? "translate(-50%, 10%) rotate(180deg)"
                : "translate(-50%, 10%)";
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
</svg>

<!-- Add linkText in a div at the center of the line -->
<div class="center-text" bind:this={centerTextElement}>{linkText}</div>

</div>

<style>
    .container {
        position: relative;
        width: fit-content;
    }
    .center-text {
        position: absolute;
        top: 0%;
        left: 50%;
        transform: translate(-50%, 10%); /* Adjust the vertical position as needed */
        color: white;
        font-size: calc(10px * var(--zoom-level)); /* Adjust font size based on zoomLevel */
        white-space: nowrap; /* Prevent text from wrapping */
        overflow: visible; /* Allow text to overflow its box */
    }
</style>
