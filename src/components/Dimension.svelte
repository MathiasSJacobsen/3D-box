<script lang="ts">
  import { disabledButtonIfBothFromAPI } from "../stores/disablingStores";

  import { heightS, searchHeightS } from "../stores/heightStores";
  import type { Searchdims } from "../types/SearchDim";
  import MetricColumn from "./MetricColumn.svelte";
  export let dimension: string;

  export let fetchPicture: (searchWord: string, dim: Searchdims) => void;
</script>

<MetricColumn>
  <span slot="metric">{dimension}</span>
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
    on:click={() => fetchPicture($searchHeightS, "height")}
    type="submit"
    disabled={$disabledButtonIfBothFromAPI}>Get from REST API</button
  >
</MetricColumn>

<style>
</style>
