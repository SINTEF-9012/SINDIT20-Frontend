<script lang="ts">
    import { OrbitControls, Grid, TransformControls, Portal } from '@threlte/extras'
    import { T, useLoader } from '@threlte/core'
    import type { DirectionalLightHelper } from 'three'
	import type { GLTFModel } from '$lib/types';
    import { Box3, Vector3 } from 'three'
	import { onMount } from 'svelte';
    import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
    import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

    const cameraPosition = [20, 20, 20]
    const lightPosition = [0, 20, 20]
    const gridRadius = 10

    let dlHelper: DirectionalLightHelper
    let loader = useLoader(GLTFLoader);
    let model: GLTF;

    export let selectedModel: GLTFModel;


    async function loadModel() {
        model = await loader.load(selectedModel.path);
        const box = new Box3().setFromObject(model.scene);
        const size = new Vector3();
        const center = new Vector3();
        box.getSize(size)
        box.getCenter(center);

        const maxAxis = Math.max(size.x, size.y, size.z);
        model.scene.scale.multiplyScalar(gridRadius / maxAxis);
    }

    $: if (selectedModel) {
        loadModel();
    }

    onMount(async () => {
        await loadModel();
    });

</script>


<T.PerspectiveCamera
    makeDefault
    position={cameraPosition}
    target={[0, 0, 0]}
    >
    <OrbitControls />
</T.PerspectiveCamera>
<Grid type={'polar'} maxRadius={gridRadius} cellDividers={6} sectionDividers={12}/>
<T.AmbientLight intensity={0.5} color={0xffffff} />
<T.HemisphereLight intensity={0.5} color={0xffffff} />
<T.DirectionalLight
    let:ref
    position={lightPosition} intensity={2} color={0xffffff}
>
    <TransformControls
        object={ref}
        on:objectChange={() => dlHelper.update()}
    />
    <Portal object={model?.scene}>
        <T.DirectionalLightHelper
            args={[ref]}
            bind:ref={dlHelper}
        />
    </Portal>
</T.DirectionalLight>

{#if model}
    <T is={model.scene} />
{/if}
