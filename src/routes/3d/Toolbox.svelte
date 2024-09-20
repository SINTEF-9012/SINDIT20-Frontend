<script lang="ts">
	import { createEventDispatcher } from "svelte";

    const dispatcher = createEventDispatcher()

    function handleClick() {
        dispatcher('closeToolbox', {message: 'close'})
    }

</script>

<div class="toolbox-content flex flex-col text-black">
    <header class="flex justify-center">
        <h1 class="text-xl">3D Toolbox</h1>
    </header>
    <br />
    <main class="grid grid-cols-1 gap-4">
        Toolbox
    </main>
    <footer class="flex justify-center">
        <button class="btn variant-ghost-warning" on:click={handleClick}>
            Close 3D Toolbox
        </button>
    </footer>
</div>
