<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
  import Toolbox from './Toolbox.svelte'
  import { selected3DModel } from '$lib/stores'
  import type { GLTFModel } from '$lib/types'

  let showToolbox = false
  let addNodeMode = false

  let nodes = []

  let models: GLTFModel[] = [
    { name: 'Toyfactory', path: 'assets/3d-scans/toyfactory.gltf'},
    { name: 'Powerplant', path: 'assets/3d-models/powerplant/scene.gltf'},
  ]
  selected3DModel.set(models[0])

  function handleCloseToolbox(event: any) {
    if ((event.detail.message === 'close') && (showToolbox = true)) {
      showToolbox = false
    }
  }

  function handleAddNode(event: any) {
    if ((event.detail.message === 'addNodeMode')) {
      addNodeMode = true
    }
  }

  function handleCanvasClick(event: MouseEvent) {
    if (addNodeMode) {
      const { clientX, clientY } = event
      // Convert screen coordinates to 3D coordinates
      const node = { x: clientX, y: clientY, text: 'Node Text' }
      nodes = [...nodes, node]
      addNodeMode = false
    }
  }
</script>

<div class="three-page">
  <div class="content-wrapper">
  {#if showToolbox}
    <div class="column toolbox bg-gray-300 border-gray-50">
      <Toolbox {models} on:closeToolbox={handleCloseToolbox} />
    </div>
  {/if}
  <div class="column threlte-canvas" class:full-width={!showToolbox}>
    <Canvas>
      <Scene selectedModel={$selected3DModel} />
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
