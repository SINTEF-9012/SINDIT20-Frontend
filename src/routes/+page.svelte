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

<!-- Modern Home Page Layout -->
<div class="flex-1 overflow-y-auto">
  <div class="min-h-full bg-slate-50 dark:bg-slate-900">
    <!-- Hero Section -->
    <section class="px-8 py-16 md:py-24">
      <div class="max-w-6xl mx-auto text-center">
        <img
          src="/logo/sindit_logo_with_slogan-removebg.png"
          alt="Sindit Logo with Slogan"
          class="mx-auto mb-8 max-h-32 md:max-h-40 w-auto drop-shadow-xl"
        />
        <h1 class="text-3xl md:text-6xl font-bold bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-500 bg-clip-text text-transparent mb-6 tracking-tight">
          Visual Knowledge Graphs for Industry 4.0
          <!-- <span class="block text-3xl md:text-5xl mt-2">for Modern Industry</span> -->
        </h1>
        <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-3xl mx-auto mb-8">
          Build, explore, and connect your industrial data visually with semantic web technologies.
        </p>
      </div>
    </section>

    <!-- Features Section -->
    <section class="px-8 py-16 bg-white/50 dark:bg-slate-800/50">
      <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div class="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Visual Modeling</h3>
            <p class="text-gray-600 dark:text-gray-300">Create and connect nodes visually for fast graph creation and exploration.</p>
          </div>
          <div class="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Semantic Interoperability</h3>
            <p class="text-gray-600 dark:text-gray-300">Powered by semantic web technologies for interoperable knowledge graphs.</p>
          </div>
          <div class="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Industry 4.0 Ready</h3>
            <p class="text-gray-600 dark:text-gray-300">Asset-based digital twin and smart manufacturing support.</p>
          </div>
          <div class="group p-6 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Open & Extensible</h3>
            <p class="text-gray-600 dark:text-gray-300">Connect to any database or system. Easily extend with new connectors.</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</div>

<style>
    /* No custom styles needed - using utility classes */
</style>
