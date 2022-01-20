<script lang="ts">
  import { onMount } from "svelte";
  import Dimension from "./components/Dimension.svelte";
  import hd from "./hotdrink/hotdrink";
  import type HDValue from "./hotdrink/hotdrink.js";
  import {
    bothFromAPI,
    disabledButtonIfBothFromAPI,
  } from "./stores/disablingStores";
  import { heightS, searchHeightS } from "./stores/heightStores";
  import type { Searchdims } from "./types/SearchDim";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";

  let system = new hd.ConstraintSystem();

  let comp = hd.component`
    var w = 1, d=1, h=1, v;
    
    constraint {
      calculateVolum(w, d, h -> v) => w*d*h;
    }	
  `;

  let test = hd.component`
    var l = false, m;
    constraint {
        test(l -> m) => !l;
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

  test.vs.l.value.subscribeValue((v: boolean) =>
    console.log("HD: Value of l: " + v)
  );

  system.addComponent(comp);
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

  function bindHDValue<T>(HDValue: HDValue<T>, n: T) {
    HDValue.set(n);
  }

  let HDv: HDValue<number> = comp.vs.v.value;
  let HDw: HDValue<number> = comp.vs.w.value;
  let width: number = 1;
  let HDd: HDValue<number> = comp.vs.d.value;
  let depth: number = 1;
  let HDh: HDValue<number> = comp.vs.h.value;
  //let height: number = 1;

  $: {
    console.log("---------------------");
    console.log(`Value of width: ${width}`);
    console.log(`Value of height: ${$heightS}`);
    console.log(`Value of depth: ${depth}`);
    console.log("---------------------");
  }

  let serachWidth = "";
  // let searchHeight = "";
  let searchBoth = "";
  let likes = 0;

  const fetchPicture = async (searchWord: string, dim: Searchdims) => {
    const per_page = 1;
    const page = 1;
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      "Client-ID Hv5JD1AXGRtPaHVXhRCYej93Qu5Oxwa5Mioxe4d0Yt8"
    );

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
    };

    console.log("Sending request");

    const response = await fetch(
      `https://api.unsplash.com/search/photos?page=${page}&query=${searchWord}&per_page=${per_page}`,
      requestOptions
    );
    const JSONresponse: UnsplashSearchResponseType = await response.json();

    if (JSONresponse.results.length === 0) {
      console.log("No picture fund!");
      return;
    }

    if (dim === "width") width = JSONresponse.results[0].width;
    else if (dim === "height") heightS.set(JSONresponse.results[0].height);
    // height = picture.results[0].height;
    else if (dim === "both") {
      width = JSONresponse.results[0].width;
      heightS.set(JSONresponse.results[0].height); // height = picture.results[0].height;
      likes = JSONresponse.results[0].likes;
    } else console.log("didnt find the property");
  };

  // everytime the "svelte-variable" changes the hd is also upadted
  $: {
    bindHDValue(HDw, width);
  }
  $: {
    bindHDValue(HDh, $heightS);
  }
  $: {
    bindHDValue(HDd, depth);
  }
</script>

<main>
  <h1>3D-Box</h1>
  <p>
    <input
      bind:value={searchBoth}
      type="text"
      placeholder="alves"
      disabled={$bothFromAPI ? false : true}
    />
    <input type="checkbox" class="larger" on:change={bothFromAPI.change} /> Get both
    values from REST API
  </p>
  <p>
    <button
      disabled={$bothFromAPI ? false : true}
      on:click={() => fetchPicture(searchBoth, "both")}>BOTH</button
    >
  </p>
  <p>
    Width: <input
      bind:value={width}
      type="number"
      id="width"
      placeholder="width"
    />
    <input
      bind:value={serachWidth}
      type="text"
      placeholder="bookshelf"
      disabled={$disabledButtonIfBothFromAPI}
    />
    <button
      on:click={() => fetchPicture(serachWidth, "width")}
      type="submit"
      disabled={$disabledButtonIfBothFromAPI}>Get from REST API</button
    >
  </p>
  <p>
    Height: <input
      bind:value={$heightS}
      type="number"
      id="height"
      placeholder="height"
    />
    <input
      bind:value={$searchHeightS}
      type="text"
      placeholder="table"
      disabled={$disabledButtonIfBothFromAPI}
    />
    <button
      on:click={() => fetchPicture($searchHeightS, "height")}
      type="submit"
      disabled={$disabledButtonIfBothFromAPI}>Get from REST API</button
    >
  </p>
  <p>
    Depth: <input
      bind:value={depth}
      type="number"
      id="depth"
      placeholder="depth"
    />

    <button
      on:click={() => {
        depth = likes;
      }}
      type="submit"
      disabled={!bothFromAPI}>Get from likes</button
    >
  </p>
  <p>
    Volum: {HDv}
  </p>

  <!--
  <Dimension 
  dimension="Height"
  {fetchPicture}/>
-->
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
