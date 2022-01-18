<script lang="ts">
  import { onMount } from "svelte";
  import hd from "./hotdrink/hotdrink";
  import type HDValue from "./hotdrink/hotdrink.js";

  let system = new hd.ConstraintSystem();

  let comp = hd.component`
    var w = 1, d=1, h=1, a;
    
    constraint {
      (w, d, h -> a) => w*d*h;
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
  comp.vs.a.value.subscribeValue((v: number) =>
    console.log("HD: Value of volum: " + v)
  );

  system.addComponent(comp);
  system.update();

  let a: HDValue<number> = comp.vs.a.value;
  let w: HDValue<number> = comp.vs.w.value;
  let width: number = 1;
  let d: HDValue<number> = comp.vs.d.value;
  let depth: number = 1;
  let h: HDValue<number> = comp.vs.h.value;
  let height: number = 1;

  onMount(() => {
    a.subscribe({
      next: (val: any) => {
        if (val.hasOwnProperty("value")) {
          a = val.value;
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
      on:change={() => setHDValue(w, width)}
      type="number"
      id="width"
      placeholder="width"
    />
  </p>
  <p>
    Height: <input
      bind:value={height}
      on:change={() => setHDValue(h, height)}
      type="number"
      id="height"
      placeholder="height"
    />
  </p>
  <p>
    Depth: <input
      bind:value={depth}
      on:change={() => setHDValue(d, depth)}
      type="number"
      id="depth"
      placeholder="depth"
    />
  </p>
  <p>
    Volum: {a}
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
