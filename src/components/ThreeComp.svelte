<script type="ts">
  import {
    Canvas,
    Scene,
    PerspectiveCamera,
    DirectionalLight,
    AmbientLight,
    BoxBufferGeometry,
    Mesh,
    MeshStandardMaterial,
    WebGLRenderer,
  } from "svelthree";
import { depthS } from "../stores/depthStores";

  let cubeGeometry = new BoxBufferGeometry(1, 1, 1);
  let cubeMaterial = new MeshStandardMaterial()
  

  $: {
    console.log(`Dette er i threeJS ${$depthS}`);

  }

</script>

<div>
  <Canvas let:sti w={500} h={500} interactive>

    <Scene {sti} let:scene id="scene1" props={{ background: 0x00000 } } >
      
      <PerspectiveCamera {scene} id="cam1" pos={[0, 0, 10]} lookAt={[0, 0, 0]} />
      <AmbientLight {scene} intensity={1.25} />
      <DirectionalLight {scene} pos={[3, 3, 3]} />
      <Mesh
        {scene}
        geometry={cubeGeometry}
        material={cubeMaterial}
        mat={{ roughness: 0.5, metalness: 0.5, color: 0xFF8001, }}
        pos={[0, 0, 0]}
        rot={[0.5, 0.6, 0]}
        scale={[1, 1, 1]} 
        interact
        onClick={()=> cubeGeometry = new BoxBufferGeometry($depthS, 1, 1) }
        />
    </Scene>
  
    <WebGLRenderer
      {sti}
      sceneId="scene1"
      camId="cam1"
      config={{ antialias: true, alpha: false }} />
  
  </Canvas>
</div>


<style>
</style>
