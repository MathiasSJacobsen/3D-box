<script lang="ts">
  import { onMount } from "svelte";
  import Variable, { defaultConstraintSystem, component } from "./hotdrink/hotdrink";
  import { depthS } from "./stores/depthStores";
  import {
    bothFromAPI,
    disabledButtonIfBothFromAPI,
  } from "./stores/disablingStores";
  import { heightS, searchHeightS } from "./stores/heightStores";
  import { widthS, searchWidth } from "./stores/widthStores";
  import { fetchPicture } from "./api/unsplash";
  import type { Searchdims } from "./types/SearchDim";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";
  import MetricColumn from "./components/MetricColumn.svelte";

  const mssg = process.env.isProd
    ? "This is production mode"
    : "This is dev mode";
  console.log(mssg);

  let system = defaultConstraintSystem;

  let comp = component`
    var w = 1, d=1, h=1, v;
    
    constraint b {
      calculateVolum(w, d, h -> v) => w*d*h;
    }	
  `;

  let disable = component`
    var isDisabledIfBothFromAPI=false, bothFromAPI;
    constraint disable{
        combine1(isDisabledIfBothFromAPI -> bothFromAPI) => !isDisabledIfBothFromAPI;
      }
  `;

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

  disable.vs.isDisabledIfBothFromAPI.value.subscribeValue((v: boolean) =>
    console.log("HD: Value of isDisabledIfBothFromAPI: " + v)
  );
  disable.vs.bothFromAPI.value.subscribeValue((v: boolean) =>
    console.log("HD: Value of bothFromAPI: " + v)
  );

  system.addComponent(comp);
  system.addComponent(disable); // Hva gjør denne?
  system.update();

  onMount(() => {
    HDv.subscribe({
      next: (val: any) => {
        if (val.hasOwnProperty("value")) {
          HDv = val.value;
        }
      },
    });
  });

  function bindHDValue<T>(HDvariable: Variable<T>, n: T) {
    HDvariable.set(n);
  }

  let HDv: Variable<number> = comp.vs.v.value;
  let HDw: Variable<number> = comp.vs.w.value;
  let HDd: Variable<number> = comp.vs.d.value;
  let HDh: Variable<number> = comp.vs.h.value;

  let isDisabledIfBothFromAPI = disable.vs.isDisabledIfBothFromAPI.value;
  let HDbothFromAPI = disable.vs.bothFromAPI.value;

  $: {
    console.log("---------------------");
    console.log(`Value of width: ${$widthS}`);
    console.log(`Value of height: ${$heightS}`);
    console.log(`Value of depth: ${$depthS}`);
    console.log(`Value of bothFromAPI: ${$bothFromAPI}`);
    console.log(
      `Value of isDisabledIfBothFromAPI: ${$disabledButtonIfBothFromAPI}`
    );
    console.log("---------------------");
  }

  let searchBoth = "";
  let likes = 0;

  const assignAPIValues = (
    JSONresponse: UnsplashSearchResponseType | undefined,
    dim: Searchdims
  ) => {
    if (!JSONresponse) return;
    if (dim === "width") widthS.set(JSONresponse.results[0].width);
    else if (dim === "height") heightS.set(JSONresponse.results[0].height);
    else if (dim === "both") {
      widthS.set(JSONresponse.results[0].width);
      heightS.set(JSONresponse.results[0].height);
      likes = JSONresponse.results[0].likes;
    } else console.log("Didnt find the property");
  };

  // everytime the "svelte-variable" changes the hd is also upadted
  $: {
    bindHDValue(HDw, $widthS);
  }
  $: {
    bindHDValue(HDh, $heightS);
  }
  $: {
    bindHDValue(HDd, $depthS);
  }
  $: {
    bindHDValue(HDbothFromAPI, $bothFromAPI);
  }
  $: {
    bindHDValue(isDisabledIfBothFromAPI, $disabledButtonIfBothFromAPI);
  }
</script>

<main>
  <h1>3D-Box</h1>
  <div>
    <p>
      <input
        bind:value={searchBoth}
        type="text"
        placeholder="alves"
        disabled={$bothFromAPI}
      />
      <input type="checkbox" class="larger" on:change={bothFromAPI.change} /> Get
      both values from REST API
    </p>
    <p>
      <button
        disabled={$bothFromAPI}
        on:click={() =>
          fetchPicture(searchBoth).then((res) => assignAPIValues(res, "both"))}
        >BOTH</button
      >
    </p>
    <MetricColumn>
      <span slot="metric">Width: </span>
      <input
        slot="metric-input"
        bind:value={$widthS}
        type="number"
        id="width"
        placeholder="width"
      />
      <input
        slot="api-search"
        bind:value={$searchWidth}
        type="text"
        placeholder="bookshelf"
        disabled={$disabledButtonIfBothFromAPI}
      />
      <button
        slot="api-button"
        on:click={() =>
          fetchPicture($searchWidth).then((res) =>
            assignAPIValues(res, "width")
          )}
        type="submit"
        disabled={$disabledButtonIfBothFromAPI}>Get from REST API</button
      >
    </MetricColumn>
    <MetricColumn>
      <span slot="metric">Height:</span>
      <input
        slot="metric-input"
        bind:value={$heightS}
        type="number"
        id="height"
        placeholder="height"
      />
      <input
        slot="api-search"
        bind:value={$searchHeightS}
        type="text"
        placeholder="table"
        disabled={$disabledButtonIfBothFromAPI}
      />
      <button
        slot="api-button"
        on:click={() =>
          fetchPicture($searchHeightS).then((res) =>
            assignAPIValues(res, "height")
          )}
        type="submit"
        disabled={$disabledButtonIfBothFromAPI}>Get from REST API</button
      >
    </MetricColumn>
    <MetricColumn>
      <span slot="metric">Depth:</span>
      <input
        slot="metric-input"
        bind:value={$depthS}
        type="number"
        id="depth"
        placeholder="depth"
      />

      <button
        slot="api-button"
        on:click={() => {
          depthS.set(likes);
        }}
        type="submit"
        disabled={!bothFromAPI}>Get from likes</button
      >
    </MetricColumn>
  </div>
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
  input.larger {
    width: 30px;
    height: 30px;
  }
</style>
