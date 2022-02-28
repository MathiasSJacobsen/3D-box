<script lang="ts">
  import { onMount } from "svelte";
  import Variable, {
    defaultConstraintSystem,
    component,
  } from "./hotdrink/hotdrink";
  import { depthS } from "./stores/depthStores";
  import {
    bothFromAPI,
    disabledButtonIfBothFromAPI,
  } from "./stores/disablingStores";
  import { heightS, searchHeightS } from "./stores/heightStores";
  import { widthS, searchWidthS } from "./stores/widthStores";
  import { fetchPicture } from "./api/unsplash";
  import type { Searchdims } from "./types/SearchDim";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";
  import MetricColumn from "./components/MetricColumn.svelte";
  import { volumS } from "./stores/volumStore";
  import { searchBothS } from "./stores/bothStore";
  import { weightS } from "./stores/weightStore";
import ThreeComp from "./components/threeComp.svelte";

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
    var isDisabledIfBothFromAPI=false, bothFromAPI;
    constraint disable {
      combine1(isDisabledIfBothFromAPI -> bothFromAPI) => !isDisabledIfBothFromAPI;
    }
    
    var searchH="", searchW="", searchBoth;
    constraint search {
      searchForBoth(searchBoth -> searchW, searchH) => ["", ""];
      invidual(searchW, searchH -> searchBoth) => "";
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

  comp.vs.isDisabledIfBothFromAPI.value.subscribeValue((v: boolean) =>
    console.log("HD: Value of isDisabledIfBothFromAPI: " + v)
  );
  comp.vs.bothFromAPI.value.subscribeValue((v: boolean) =>
    console.log("HD: Value of bothFromAPI: " + v)
  );

  comp.vs.searchH.value.subscribeValue((n: string) =>
    console.log("HD: Value of searchH: " + n)
  );

  comp.vs.searchW.value.subscribeValue((n: string) =>
    console.log("HD: Value of searchW: " + n)
  );

  comp.vs.searchBoth.value.subscribeValue((n: string) =>
    console.log("HD: Value of searchBoth: " + n)
  );

  console.log(comp);
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

    HDbothFromAPI.subscribeValue((b: boolean) => bothFromAPI.set(b));
    HDisDisabledIfBothFromAPI.subscribeValue((b: boolean) =>
      disabledButtonIfBothFromAPI.set(b)
    );

    HDsearchHeight.subscribeValue((s: string) => searchHeightS.set(s));
    HDsearchWidth.subscribeValue((s: string) => searchWidthS.set(s));
    HDsearchBoth.subscribeValue((s: string) => searchBothS.set(s));
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

  let HDisDisabledIfBothFromAPI: Variable<boolean> =
    comp.vs.isDisabledIfBothFromAPI.value;
  let HDbothFromAPI: Variable<boolean> = comp.vs.bothFromAPI.value;

  let HDsearchHeight: Variable<string> = comp.vs.searchH.value;
  let HDsearchWidth: Variable<string> = comp.vs.searchW.value;
  let HDsearchBoth: Variable<string> = comp.vs.searchBoth.value;
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
    console.log(`Value of bothFromAPI: ${$bothFromAPI}`);
    console.log(
      `Value of isDisabledIfBothFromAPI: ${$disabledButtonIfBothFromAPI}`
    );
    console.log(`Value of searchH: ${$searchHeightS}`);
    console.log(`Value of searchW: ${$searchWidthS}`);
    console.log(`Value of searchBoth: ${$searchBothS}`);
    console.log("---------------------");
  }

  let likes = 0; // TODO: Likes only get set when both values comes from the picture

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
      likes = JSONresponse.results[0].likes;
    } else console.log("Didnt find the property");
  };

  // everytime the "svelte-variable" changes the hd is also upadted
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
    setHDValue(HDbothFromAPI, $bothFromAPI);
  }
  $: {
    setHDValue(HDisDisabledIfBothFromAPI, $disabledButtonIfBothFromAPI);
  }
  $: {
    setHDValue(HDv, $volumS);
  }
  $: {
    setHDValue(HDsearchHeight, $searchHeightS);
  }
  $: {
    setHDValue(HDsearchWidth, $searchWidthS);
  }
  $: {
    setHDValue(HDsearchBoth, $searchBothS);
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
        <input slot="metric-input" type="string" id="pkgcat" />
      </MetricColumn>
      <MetricColumn>
        <span slot="metric">Price:</span>
        <input slot="metric-input" type="number" id="price" />
      </MetricColumn>
    </div>
    <ThreeComp/>
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
