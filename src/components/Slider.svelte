<script>
    let slider;
    export let sliderMin;;
    export let sliderMax;
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
