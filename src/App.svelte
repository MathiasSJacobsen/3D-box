<script lang="ts">
  import { onMount } from "svelte";
  import hd from "./hotdrink/hotdrink";
  import type HDValue from "./hotdrink/hotdrink.js";
  import type { UnsplashSearchResponseType } from "./types/UnsplashTypes";

  let system = new hd.ConstraintSystem();

  let comp = hd.component`
    var w = 1, d=1, h=1, v;
    
    constraint {
      (w, d, h -> v) => w*d*h;
    }	
  `;

  comp.vs.w.value.subscribeValue((v: number) =>
    console.log("HD: Value of width: " + v)
  );
  comp.vs.d.value.subscribeValue((v: number) =>
    console.log("HD: Value of depth: " + v)
  );
  comp.vs.h.value.subscribeValue((v: number) =>
    console.log("HD: Value of height: " + v)
  );
  comp.vs.v.value.subscribeValue((v: number) =>
    console.log("HD: Value of volum: " + v)
  );

  system.addComponent(comp);
  system.update();

  let HDv: HDValue<number> = comp.vs.v.value;
  let HDw: HDValue<number> = comp.vs.w.value;
  let width: number = 1;
  let HDd: HDValue<number> = comp.vs.d.value;
  let depth: number = 1;
  let HDh: HDValue<number> = comp.vs.h.value;
  let height: number = 1;

  $: {
    console.log("---------------------");
    console.log(`Value of width: ${width}`);
    console.log(`Value of height: ${height}`);
    console.log(`Value of depth: ${depth}`);
    console.log("---------------------");
  }

  onMount(() => {
    HDv.subscribe({
      next: (val: any) => {
        if (val.hasOwnProperty("value")) {
          HDv = val.value;
        }
      },
    });
  });

  function setHDValue(HDValue: HDValue<number>, n: number) {
    HDValue.set(n);
  }

  let serachWidth = "";
  let searchHeight = "";

  const fetchPicture = async (searchWord: string, dim: string) => {
    var myHeaders = new Headers();
    myHeaders.append(
      "Authorization",
      
    );

    var requestOptions = {
      method: "GET",
      headers: myHeaders,
    };
    const per_page = 1;
    const page = 1;
    const response = await fetch(`https://api.unsplash.com/search/photos?page=${page}&query=${searchWord}&per_page=${per_page}`, requestOptions)
    const picture: UnsplashSearchResponseType = await response.json()
    
      if (dim ==='width') width = picture.results[0].width;
      else if (dim === 'height') height = picture.results[0].height;     
      else console.log('didnt find the property');
    
  };
  // everytime the "svelte-variable" changes the hd is also upadted
  $: {
    setHDValue(HDw, width)
  }
  $: {
    setHDValue(HDh, height)
  }
  $: {
    setHDValue(HDd, depth)
  }
</script>

<main>
  <h1>3D-Box</h1>
  <p>
    Width: <input
      bind:value={width}
      type="number"
      id="width"
      placeholder="width"
    /> <input bind:value={serachWidth} type="text" placeholder="bookshelf" />
    <button on:click={() => fetchPicture(serachWidth, "width")} type="submit">Search</button>
  </p>
  <p>
    Height: <input
      bind:value={height}
      type="number"
      id="height"
      placeholder="height"
    /> <input bind:value={searchHeight} type="text" placeholder="table" />
    <button on:click={() => fetchPicture(searchHeight, "height")} type="submit">Search</button>
  </p>
  <p>
    Depth: <input
      bind:value={depth}
      type="number"
      id="depth"
      placeholder="depth"
    />
  </p>
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
</style>
