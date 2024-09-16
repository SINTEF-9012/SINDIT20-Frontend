<script lang="ts">
    import { OrbitControls, useGltf } from '@threlte/extras'
    import { T } from '@threlte/core'
	import { AmbientLight } from 'three';

    const base_path = '/assets/3d-scans';
    const toyfactory = 'toyfactory.gltf';

</script>

<T.PerspectiveCamera
    makeDefault
    position={[5, 5, 5]}
  >
    <OrbitControls
    />
</T.PerspectiveCamera>
<T.DirectionalLight position={[5, 5, 5]} intensity={2} color={0xffffff} />
<T.DirectionalLight position={[-5, -5, -5]} intensity={2} color={0xffffff} />
<T.AmbientLight intensity={0.5} color={0xffffff} />

{#await useGltf(`${base_path}/${toyfactory}`) then gltf}
    <T is={gltf.scene} />
{/await}
