<script lang="ts">
  import { onMount } from "svelte";
  import type { Searchdims } from "./types/SearchDim";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";
  import MetricColumn from "./components/MetricColumn.svelte";
  import ThreeComp from "./components/threeComp.svelte";
  import { BOXES, selectedPackageSize } from "./api/posten/pakker";
import Slider from "./components/Slider.svelte";
import { HDd, HDh, HDkg, HDPrice, HDv, HDw, HDweightErrorMessage, setHDValue } from "./HD";
import { depthS, heightS, volumS, weightS, widthS } from "./stores/metricStores";

  const mssg = process.env.isProd
    ? "This is production mode"
    : "This is dev mode";
  console.log(mssg);

  onMount(() => {
    // HDv.subscibeValue
    // error håndtering
    /*
    HDv.subscribe({
      next: (val: any) => {
        if (val.value) {
          volumS.set(val.value);
        }
      },
    });
    */
    HDw.subscribeValue((v: number) => widthS.set(v));
    HDd.subscribeValue((v: number) => depthS.set(v));
    HDh.subscribeValue((v: number) => heightS.set(v));
    HDv.subscribeValue((v: number) => volumS.set(v));
    HDPrice.subscribeValue((v: number) => price = v);
    HDkg.subscribeValue((v: number) => weightS.set(v));
    HDweightErrorMessage.subscribeValue((v: string) =>
      weightErrorMessage = v
    );
  });
  
  let price: number;
  let weightErrorMessage: string;

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
  $: {
    setHDValue(HDweightErrorMessage, weightErrorMessage);
  }
  
</script>

<main>
  <h1>3D-Box</h1>
  <div class="mainHub">
    <div class="metrics">
      <MetricColumn>
        <span slot="metric">Width (cm): </span>
        <input
          slot="metric-input"
          bind:value={$widthS}
          type="number"
          id="width"
          placeholder="width"
        />
        <Slider
          slot="metric-slider"
          sliderValue={widthS}
          sliderMax={60}
          sliderMin={13}
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
        <Slider
          slot="metric-slider"
          sliderValue={heightS}
          sliderMin={23}
          sliderMax={120}
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
        <Slider
          slot="metric-slider"
          sliderValue={depthS}
          sliderMax={60}
          sliderMin={1}
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
        <Slider
          slot="metric-slider"
          sliderValue={weightS}
          sliderMax={35}
          sliderMin={0}
        />
        <span slot="metric-errormessage">{weightErrorMessage}</span>
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
    align-items: center;
  }
  .metrics {
    padding-right: 2em;
  }
</style>
