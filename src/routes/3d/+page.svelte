<script lang="ts">
  import { Canvas } from '@threlte/core'
  import Scene from './Scene.svelte'
</script>

<div class="threlte-canvas">
  <Canvas>
    <Scene
    />
  </Canvas>
</div>

<style>
  .threlte-canvas {
    position: relative;
    height: 100%;
    width: 100%;
  }
</style>
