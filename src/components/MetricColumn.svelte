<div class="dimention">
  <div id="name" class="flex-item">
    <slot name="metric"><!-- optional fallback --></slot>
  </div>
  <div id="metric-input" class="flex-item">
    <slot name="metric-input"><!-- optional fallback --></slot>
  </div>
</div>

<style>
  .dimention {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .dimention div {
    padding: 3px;
  }
</style>
