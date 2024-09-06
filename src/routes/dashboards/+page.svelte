<script lang="ts">
	import { goto } from "$app/navigation";

    const dashboards = ["dashboard1", "dashboard2", "dashboard3", "dashboard4", "dashboard5",
        "Neo", "Morpheus", "Trinity", "Cypher", "Tank", "Dozer", "Mouse", "Agent Smith", "The Oracle",
    ];

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

<header class="fixed-header w-full">
    <h1 class="text-4xl">Dashboards</h1>
    <br>
    <div class="flex grid-flow-row columns-3 gap-2">
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
    </div>
</header>
<main class="main-content">
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
</main>

<style>
    .fixed-header {
        position: fixed;
        top: 10%;
        left: 0%;
        padding-top: 5px;
        padding-left: 2rem;
        padding-right: 2rem;
        width: 100%;
        height: 80px;
        z-index: 1;
    }
    .main-content {
        overflow-y: auto;
        margin-top: 120px;
        height: calc(90% - 120px);
        z-index: 0;
    }
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
