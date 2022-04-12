<script>
import { widthS } from "../stores/widthStores";


    let slider;
    let sliderMin = 1;
    export let sliderMax = 100;
    export let sliderValue;

  </script>
  
  <style>
  </style>
  
    <div class="slider">
      <input
        bind:this={slider}
        type="range"
        min={sliderMin}
        step="1"
        max={sliderMax}
        bind:value={$sliderValue}
        id="myRange" />
    </div>
