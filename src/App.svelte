<script lang="ts">
  import { onMount } from "svelte";
  import hd from "./hotdrink/hotdrink";
  import type HDValue from "./hotdrink/hotdrink.js";

  let system = new hd.ConstraintSystem();

  let comp = hd.component`
    var w = 1, d=1, h=1, v;
    
    constraint {
      (w, d, h -> v) => w*d*h;
    }	
  `;

  comp.vs.w.value.subscribeValue((v: number) =>
    console.log("HD: Value of width: " + v)
  );
  comp.vs.d.value.subscribeValue((v: number) =>
    console.log("HD: Value of depth: " + v)
  );
  comp.vs.h.value.subscribeValue((v: number) =>
    console.log("HD: Value of height: " + v)
  );
  comp.vs.v.value.subscribeValue((v: number) =>
    console.log("HD: Value of volum: " + v)
  );

  system.addComponent(comp);
  system.update();

  let HDv: HDValue<number> = comp.vs.v.value;
  let HDw: HDValue<number> = comp.vs.w.value;
  let width: number = 1;
  let HDd: HDValue<number> = comp.vs.d.value;
  let depth: number = 1;
  let HDh: HDValue<number> = comp.vs.h.value;
  let height: number = 1;

  $: {
    console.log("---------------------");
    console.log(`Value of width: ${width}`);
    console.log(`Value of height: ${height}`);
    console.log(`Value of depth: ${depth}`);
    console.log("---------------------");
  }

  onMount(() => {
    HDv.subscribe({
      next: (val: any) => {
        if (val.hasOwnProperty("value")) {
          HDv = val.value;
        }
      },
    });
  });

  function setHDValue(HDValue: HDValue<number>, n: number) {
    HDValue.set(n);
  }

  let serachWidth = ''
</script>

<main>
  <h1>3D-Box</h1>
  <p>
    Width: <input
      bind:value={width}
      on:change={() => setHDValue(HDw, width)}
      type="number"
      id="width"
      placeholder="width"
    />
  </p>
  <p>
    Height: <input
      bind:value={height}
      on:change={() => setHDValue(HDh, height)}
      type="number"
      id="height"
      placeholder="height"
    />
  </p>
  <p>
    Depth: <input
      bind:value={depth}
      on:change={() => setHDValue(HDd, depth)}
      type="number"
      id="depth"
      placeholder="depth"
    />
  </p>
  <p>
    Volum: {HDv}
  </p>
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
