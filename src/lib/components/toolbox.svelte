<script lang="ts">
    import { getDrawerStore } from "@skeletonlabs/skeleton";
    import { PlusCircleIcon } from 'svelte-feather-icons';
    import { getModalStore } from '@skeletonlabs/skeleton';
    import type { ModalSettings, DrawerSettings } from '@skeletonlabs/skeleton';

    const modalStore = getModalStore();
    const drawerStore = getDrawerStore();

    const settingsToolbox: DrawerSettings = {
        id: "toolbox",
        width: "w-60",
        position: 'right',
        border: "border-gray-50",
        bgDrawer: "bg-gray-300",
        shadow: "shadow-lg",
    };

    drawerStore.open(settingsToolbox);

    const cards = ["card 1", "card 2", "card 3", "card 4", "card 5"];

    const modal: ModalSettings = {
        type: 'component',
        component: 'createNew',
        title: "<mode> new <name>",
        body: "<mode> a new <name> in the knowledge graph.",
        meta: {name: 'card', mode: 'create'},
        response: (data: {name: string, description: string}) => console.log('response:', data)
    };

    let selectedCard: string = '';
    function openModal() {
        modal.meta = {name: selectedCard, mode: 'update'};
        modalStore.trigger(modal);
    }

</script>


<div class="toolbox-content flex-col columns-1 text-black">
    <header class="flex justify-center">
        <h2>Toolbox</h2>
    </header>
    <main class="grid grid-cols-2 gap-4">
        {#each cards as card}
            <button class="btn border border-tertiary-500 bg-tertiary-50" on:click={() => {selectedCard = card; openModal()}}>
                <div class="card-content columns-1 gap-1">
                    <div>
                        {card}
                    </div>
                    <div>
                        <PlusCircleIcon />
                    </div>
                </div>
            </button>
        {/each}
    </main>
    <footer class="flex justify-center">
        <div class="search-bar">
            <input type="text" placeholder="Search..." class="input" />
        </div>
    </footer>
</div>


<style>
    .toolbox-content {
        padding-left : 20px;
        padding-right: 5px;
        width: 100%;
    }
    .card-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>
