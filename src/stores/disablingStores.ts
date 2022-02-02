import { writable } from "svelte/store";


  function createDisableIfBothFromAPIStore() {
    const { subscribe, set, update } = writable(false);

    return {
        subscribe,
        change: () => update(b => !b),
        set,
    }
}
export const disabledButtonIfBothFromAPI = createDisableIfBothFromAPIStore()

function createBothFromAPIStore() {
	const { subscribe, set, update } = writable(true);
    
    return {
        subscribe,
        change: () => {
            update(b => !b)
            disabledButtonIfBothFromAPI.change()
        },
        set,
    }
}

  export const bothFromAPI = createBothFromAPIStore()
