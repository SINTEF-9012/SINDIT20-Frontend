<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { getLinks } from './states/links-state.svelte';
    import PropertyDisplay from "./property-display.svelte";
    import type { DrawerSettings } from '@skeletonlabs/skeleton';
    import type { Link as LinkType } from '$lib/types';
    import { selectedLinkId } from "$lib/stores";

    const drawerStore = getDrawerStore();
    const linksState = getLinks();
    const link: LinkType = linksState.getLink($selectedLinkId) as LinkType;

    const settingsInfoDrawer: DrawerSettings = {
        id: "info-drawer-link",
        width: "w-60",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
    };

    drawerStore.open(settingsInfoDrawer);

</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">Link properties</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        {#each Object.keys(link) as key}
            <PropertyDisplay {key} value={link[key]} />
        {/each}
    </main>
    <footer class="flex justify-center">
        <button class="btn variant-ghost-error" disabled>Update link</button>
    </footer>
</div>


<style>
    .toolbox-content {
        padding-left : 20px;
        padding-right: 5px;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
    }
    main {
        flex-grow: 1;
        display: grid;
        grid-auto-rows: min-content;
        align-items: start;
    }
    footer {
        padding: 10px;
    }
</style>
