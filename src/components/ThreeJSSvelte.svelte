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
      SphereBufferGeometry,
    } from "svelthree";
  import { depthS, heightS, widthS } from "../stores/metricStores";
  
  
    let radiusFotball = 3
    let cubeGeometry = new BoxBufferGeometry($heightS, $widthS, $depthS);
    let cubeMaterial = new MeshStandardMaterial()
  
    let sphereGeometry = new SphereBufferGeometry(radiusFotball, 64, 32)
    let sphereMaterial = new MeshStandardMaterial()
    const findMax = (arr: number[]) => {
      return Math.max(...arr);
    };
    let camDepth = findMax([$depthS, $heightS, $widthS]) * 3;
  
    $: {
      camDepth = findMax([$depthS, $heightS, $widthS]) * 3;
      cubeGeometry = new BoxBufferGeometry($widthS, $heightS, $depthS);
    }
    let canvasWidth = window.innerWidth;
    let canvasHeight = window.innerHeight;
  
  </script>
  
  <div>
    <Canvas let:sti w={canvasWidth*.6} h={canvasHeight * .6} interactive>
  
      <Scene {sti} let:scene id="scene1" props={{ background: 0x00000 } } >
        
        <PerspectiveCamera {scene} id="cam1" pos={[0, 0, camDepth]} lookAt={[0, 0, 0]} />
        <AmbientLight {scene} intensity={1.25} />
        <DirectionalLight {scene} pos={[3, 3, 3]} />
        <Mesh
          {scene}
          geometry={cubeGeometry}
          material={cubeMaterial}
          mat={{ roughness: 0.5, metalness: 0.5, color: 0xFF8001, }}
          pos={[-1, 0, 0]}
          rot={[.3, .4, 0]}
          scale={[1, 1, 1]} 
          />
  
          <Mesh
            {scene}
            geometry={sphereGeometry}
            material={sphereMaterial}
            mat={{ roughness: 0.5, metalness: 0.5, color: 0xF6E05E, }}
            pos={[$widthS*(3/4)+ ($depthS/5), 0, 0]}
            rot={[.2, .2, 0]}
            scale={[1, 1, 1]} 
          />
  
      </Scene>
    
      <WebGLRenderer
        {sti}
        sceneId="scene1"
        camId="cam1"
        config={{ antialias: true, alpha: true }} />
    
    </Canvas>
    <div>
      <span>The yellow ball is a point of refrence. The ball have a radius of {radiusFotball}. </span>
    </div>
  </div>
  
  
  <style>
  </style>
  