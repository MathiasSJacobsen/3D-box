<script lang="ts">
  import { onMount } from "svelte";
  import Variable, {
    defaultConstraintSystem,
    component,
  } from "./hotdrink/hotdrink";
  import { depthS } from "./stores/depthStores";
  import { heightS } from "./stores/heightStores";
  import { widthS } from "./stores/widthStores";
  import type { Searchdims } from "./types/SearchDim";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";
  import MetricColumn from "./components/MetricColumn.svelte";
  import { volumS } from "./stores/volumStore";
  import { weightS } from "./stores/weightStore";
  import ThreeComp from "./components/threeComp.svelte";
  import { BOXES, selectedPackageSize } from "./api/posten/pakker";

  const mssg = process.env.isProd
    ? "This is production mode"
    : "This is dev mode";
  console.log(mssg);

  let system = defaultConstraintSystem;

  let comp = component`
    var w=1, d=1, h=1, v;
    
    constraint volum {
      calculateVolum(w, d, h -> v) => w*d*h;
      (v, d, w -> h) => v/(d*w);
      (v, w, h -> d) => v/(w*h);
      (v, d, h -> w) => v/(d*h);
    }	

    var price = 0, kg = 0;
    constraint price {
      m1(w, d, h, kg -> price) => {
        if (kg <= 5) {
          if (h <= 35 && w <= 25 && d <=12) {
            return 70;
          } else if (h <= 120 && w <= 60 && d <=60) {
            return 129;
          } else {
            let spesialgodstillegg = 149;
            return 129 + spesialgodstillegg;
          }
        } else if (kg <=10) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 129;
          } else {
            let spesialgodstillegg = 149;
            return 129 + spesialgodstillegg;
          }
        } else if (kg <= 25) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 229;
          } else {
            let spesialgodstillegg = 149;
            return 229 + spesialgodstillegg;
          }
        } else if (kg <= 35) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 299;
          } else {
            let spesialgodstillegg = 149;
            return 299 + spesialgodstillegg;
          }
        }
      }
    }

    /*
    var t=3, p;
    constraint test {
      (t -> p) => myDict[t]()
    }
    */
  `;

  /*
 {
   small: () => { 
        var promise = new Promise((resolve, reject) => {
          setTimeout(()=> {
            resolve(t*2)
          }, 3*1000)
        });
        return promise;
      };
 }
 */


  comp.vs.w.value.subscribeValue((n: number) =>
    console.log("HD: Value of width: " + n)
  );
  comp.vs.d.value.subscribeValue((n: number) =>
    console.log("HD: Value of depth: " + n)
  );
  comp.vs.h.value.subscribeValue((n: number) =>
    console.log("HD: Value of height: " + n)
  );
  comp.vs.v.value.subscribeValue((n: number) =>
    console.log("HD: Value of volum: " + n)
  );

  comp.vs.price.value.subscribeValue((n: number) =>
    console.log("HD: Value of price: " + n)
  );

  system.addComponent(comp);
  system.update();

  onMount(() => {
    // HDv.subscibeValue
    // error håndtering
    HDv.subscribe({
      next: (val: any) => {
        if (val.value) {
          volumS.set(val.value);
        }
      },
    });
    HDw.subscribeValue((v: number) => widthS.set(v));
    HDd.subscribeValue((v: number) => depthS.set(v));
    HDh.subscribeValue((v: number) => heightS.set(v));
    HDv.subscribeValue((v: number) => volumS.set(v));
    HDPrice.subscribeValue((v: number) => price = v);
    HDkg.subscribeValue((v: number) => weightS.set(v));

    /*
    HDPromise.subscribeValue((p: any) => console.log(p))
    HDTEST.subscibeValue((n:number) => Knut = n)
    */
  });

  function setHDValue<T>(HDvariable: Variable<T>, n: T) {
    // TODO: qickfix so that the variable dosnt update twice with the value set by the first call
    if (n !== HDvariable.value) {
      HDvariable.set(n);
    }
  }

  let HDv: Variable<number> = comp.vs.v.value;
  let HDw: Variable<number> = comp.vs.w.value;
  let HDd: Variable<number> = comp.vs.d.value;
  let HDh: Variable<number> = comp.vs.h.value;

  let HDPrice: Variable<number> = comp.vs.price.value;
  let HDkg: Variable<number> = comp.vs.kg.value;

  let price: number;
  /*
  let HDPromise = comp.vs.p.value;
  let HDTEST = comp.vs.t.value;

  let promise;
  let Knut = 0;
  */

  $: {
    console.log("---------------------");
    console.log(`Value of width: ${$widthS}`);
    console.log(`Value of height: ${$heightS}`);
    console.log(`Value of depth: ${$depthS}`);
    console.log(`Value of volum: ${$volumS}`);
    console.log(`Value of price: ${price}`);
    console.log(`Value of weight: ${$weightS}`);
    console.log("---------------------");
  }

  const assignAPIValues = (
    JSONresponse: UnsplashSearchResponseType | undefined,
    dim: Searchdims
  ) => {
    if (!JSONresponse) return;
    if (dim === "width") HDw.set(JSONresponse.results[0].width);
    else if (dim === "height") HDh.set(JSONresponse.results[0].height);
    else if (dim === "both") {
      HDw.set(JSONresponse.results[0].width);
      HDh.set(JSONresponse.results[0].height);
    } else console.log("Didnt find the property");
  };

  // everytime the "svelte-variable" changes the hd is also upadted
  $: {
    setHDValue(HDv, $volumS);
  }
  $: {
    setHDValue(HDw, $widthS);
  }
  $: {
    setHDValue(HDh, $heightS);
  }
  $: {
    setHDValue(HDd, $depthS);
  }
  $: {
    setHDValue(HDPrice, price);
  }
  $: {
    setHDValue(HDkg, $weightS);
  }
  
</script>

<main>
  <h1>3D-Box</h1>
  <div class="mainHub">
    <div>
      <MetricColumn>
        <span slot="metric">Width (cm): </span>
        <input
          slot="metric-input"
          bind:value={$widthS}
          type="number"
          id="width"
          placeholder="width"
        />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Height (cm):</span>
        <input
          slot="metric-input"
          bind:value={$heightS}
          type="number"
          id="height"
          placeholder="height"
        />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Depth (cm):</span>
        <input
          slot="metric-input"
          bind:value={$depthS}
          type="number"
          id="depth"
          placeholder="depth"
        />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Weight (kg):</span>
        <input
          bind:value={$weightS}
          slot="metric-input"
          type="number"
          id="weight"
          placeholder="weight"
        />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Volum (cm&#179):</span>
        <input
          bind:value={$volumS}
          slot="metric-input"
          type="number"
          id="volume"
          placeholder="volume"
        />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Package Category:</span>
        <select bind:value={$selectedPackageSize} slot="metric-input">
          {#each BOXES as box}
            <option>{box.name}</option>
          {/each}
        </select>
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Price:</span>
        <input bind:value={price} slot="metric-input" type="number" id="price" />
      </MetricColumn>
    </div>
    <ThreeComp />
  </div>
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
  .mainHub {
    display: flex;
    justify-content: center;
  }
</style>
