<script lang="ts">
	import { goto } from "$app/navigation";

    const dashboards = ["dashboard1", "dashboard2", "dashboard3", "dashboard4", "dashboard5"];

    let selectedDashboard = '';
    let searchQuery = '';
    let filteredDashboards: string[] = [];
	$: {
		if (searchQuery === '') {
            filteredDashboards = dashboards;
		} else {
            filteredDashboards = dashboards.filter(dashboard => dashboard.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
        }
	}
    function selectDashboard(dashboard: string) {
        selectedDashboard = dashboard;
        setTimeout(() => {
            console.log(selectedDashboard);
            goto(`/dashboards/${selectedDashboard}`);
        }, 1000);
    }
    function onCreateNewDashboard() {
        console.log("create new dashboard");
    }
</script>


<div>
    <h1 class="text-4xl">Dashboards</h1>
    <br>
    <header class="flex grid-flow-row columns-3 gap-2">
        <input type="text" bind:value={searchQuery} placeholder="Search dashboards..." />
        <button class="btn variant-ghost-primary"
                on:click={onCreateNewDashboard}
        >
            Create new
        </button>
        <button class="btn variant-ghost-error move-right"
                on:click={onCreateNewDashboard}
        >
            Delete
        </button>
    </header>
    <div class="logo-cloud grid-cols-3 gap-2 p-4">
        {#each filteredDashboards as dashboard}
            {#if dashboard === selectedDashboard}
                <button class="btn logo-item variant-ghost-primary"
                        on:click={() => selectDashboard(dashboard)}
                        class:selected={selectedDashboard === dashboard}
                >
                    <span>{dashboard}</span>
                </button>
            {:else}
                <button class="btn logo-item variant-ghost-tertiary"
                        on:click={() => selectDashboard(dashboard)}
                        class:selected={selectedDashboard === dashboard}
                >
                    <span>{dashboard}</span>
                </button>
            {/if}
        {/each}
    </div>
</div>

<style>
    .logo-item {
        border-radius: 0.5rem;
        padding: 1rem;
        height: 100px;
    }
    input {
        border-radius: 0.5rem;
        color: black;
    }
    .move-right {
        margin-left: auto;
    }
</style>
