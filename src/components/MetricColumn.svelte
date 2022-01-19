<div class="dimention">
  <div id="name" class="flex-item">
    <slot name="metric"><!-- optional fallback --></slot>
  </div>
  <div id="metric-input" class="flex-item">
    <slot name="metric-input"><!-- optional fallback --></slot>
  </div>
  <div id="api-search" class="flex-item">
    <slot name="api-search"><!-- optional fallback --></slot>
  </div>
  <div id="api-button" class="flex-item">
    <slot name="api-button"><!-- optional fallback --></slot>
  </div>
</div>

<style>
  .dimention {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
  }
  .dimention div {
    padding: 3px;
  }
</style>
