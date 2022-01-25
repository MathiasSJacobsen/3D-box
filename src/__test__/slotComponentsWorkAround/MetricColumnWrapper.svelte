<script lang="ts">
  import MetricColumn from "../../components/MetricColumn.svelte";
  export let title: string;
  export let inputValue: number;
  export let searxhString: string;
  export let disabledButtonIfBothFromAPI: boolean;
</script>

<MetricColumn>
    <span slot="metric">{title}: </span>
    <input
    data-testid="metric-test-input"
      slot="metric-input"
      bind:value={inputValue}
      type="number"
      id="width"
      placeholder="width"
    />
    <input
      slot="api-search"
      bind:value={searxhString}
      type="text"
      placeholder="bookshelf"
      disabled={disabledButtonIfBothFromAPI}
    />
    <button
      slot="api-button"
      on:click={() =>{
       // fetchPicture($searchWidth).then((res) =>
       //   assignAPIValues(res, "width")
       // )
        }}
      type="submit"
      disabled={disabledButtonIfBothFromAPI}>Get from REST API</button
    >
</MetricColumn>
