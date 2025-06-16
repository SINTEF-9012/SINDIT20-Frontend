<!-- src/routes/index.svelte -->
<script lang="ts">
    import { modeCurrent } from '@skeletonlabs/skeleton';
    import { backendNodesData } from '$lib/stores'
    import { onMount } from 'svelte';


	const nodeId = "#1234"
    const nodeName = "Node Name"
    const nodeDescription = "Node Description"

    let darkMode = "";
    $: darkMode = $modeCurrent === false ? "jse-theme-dark" : "";


    function handleData(data: any) {
        console.log(data);
    }

    onMount(() => {
        // streamData("streamingproperty2tilt", handleData);
    });
</script>

<!-- Main page content: header/footer handled by layout, only content scrolls -->
<div class="w-full flex flex-col items-center justify-center p-0"> <!-- remove all padding -->
  <div class="flex flex-col items-center justify-center flex-1 w-full min-h-0">
    <div class="w-full max-w-5xl mx-auto flex flex-col items-stretch justify-center gap-8 pt-0 pb-4"> <!-- force single column layout -->
      <!-- Left: Logo and Headline -->
      <div class="flex flex-col items-center justify-center w-full text-center"> <!-- center align all main content -->
        <img src="/logo/sindit_logo_with_slogan-removebg.png" alt="Sindit Logo with Slogan" class="mx-auto mb-4 max-h-36 sm:max-h-56 w-auto drop-shadow-xl" />
        <h1 class="text-3xl lg:text-5xl font-extrabold bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-500 bg-clip-text text-transparent mb-2 tracking-tight">
          Visual Knowledge Graphs for Industry 4.0
        </h1>
        <p class="text-lg lg:text-2xl text-slate-700 dark:text-slate-200 leading-relaxed max-w-xl mx-auto mb-5">
          Build, explore, and connect your industrial data visually. 
        </p>
      </div>
      <!-- Features: now full width, below main content -->
      <div class="w-full flex flex-col justify-center mt-2">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 w-full text-center">
          <div class="p-8 rounded-2xl bg-white/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 shadow-lg flex flex-col items-center h-full min-h-[180px]">
            <span class="font-semibold text-slate-800 dark:text-slate-100 text-xl mb-2">Visual Modeling</span>
            <span class="text-base text-slate-600 dark:text-slate-300">Create and connect nodes visually for fast graph creation.</span>
          </div>
          <div class="p-8 rounded-2xl bg-white/80 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 shadow-lg flex flex-col items-center h-full min-h-[180px]">
            <span class="font-semibold text-slate-800 dark:text-slate-100 text-xl mb-2">Semantic Interoperability</span>
            <span class="text-base text-slate-600 dark:text-slate-300">Powered by semantic web technologies for interoperable knowledge graphs.</span>
          </div>
          <div class="p-8 rounded-2xl bg-white/80 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700/50 shadow-lg flex flex-col items-center h-full min-h-[180px]">
            <span class="font-semibold text-slate-800 dark:text-slate-100 text-xl mb-2">Industry 4.0 Ready</span>
            <span class="text-base text-slate-600 dark:text-slate-300">Asset-based digital twin and smart manufacturing support.</span>
          </div>
          <div class="p-8 rounded-2xl bg-white/80 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700/50 shadow-lg flex flex-col items-center h-full min-h-[180px]">
            <span class="font-semibold text-slate-800 dark:text-slate-100 text-xl mb-2">Open & Extensible</span>
            <span class="text-base text-slate-600 dark:text-slate-300">Connect to any database or system. Easily extend with new connectors and APIs.</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
    /* No custom styles needed - using utility classes */
</style>
