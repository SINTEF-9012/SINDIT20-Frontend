<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  import Toolbox from './Toolbox.svelte'

  let showToolbox = false

  function handleCloseToolbox(event: any) {
    if ((event.detail.message === 'close') && (showToolbox = true)) {
      showToolbox = false
    }
  }
</script>

<div class="three-page">
  <div class="content-wrapper">
  {#if showToolbox}
    <div class="column toolbox bg-gray-300 border-gray-50">
      <Toolbox on:closeToolbox={handleCloseToolbox} />
    </div>
  {/if}
  <div class="column threlte-canvas" class:full-width={!showToolbox}>
    <Canvas>
      <Scene
      />
    </Canvas>
  </div>
  </div>
</div>

{#if !showToolbox}
  <div class="toolbox-button">
    <button class="btn variant-ghost-success" on:click={() => showToolbox = !showToolbox}>
      Toolbox
    </button>
  </div>
{/if}

<style>
  .three-page {
    position: relative;
    height: 100%;
    width: 100%;
  }
  .content-wrapper {
    position: absolute;
    display: flex;
    height: 100%;
    width: 100%;
  }
  .column {
    flex: 1;
  }
  .toolbox {
    flex: 0 0 200px;
    height: 100%;
  }
  .threlte-canvas {
    height: 100%;
    width: 100%;
    display: block;
  }
  .toolbox-button {
    position: fixed;
    z-index: 1;
    bottom: 0;
    left: 1;
    padding-bottom: 10px;
  }
  .threlte-canvas.full-width {
    flex: 1 1 100%;
  }
</style>
