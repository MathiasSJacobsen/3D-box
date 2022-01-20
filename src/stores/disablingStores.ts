import { writable } from "svelte/store";


  function createDisableIfBothFromAPIStore() {
    const { subscribe, set, update } = writable(false);

    return {
        subscribe,
        change: () => update(b => !b),
    }
}
export const disabledButtonIfBothFromAPI = createDisableIfBothFromAPIStore()

function createBothFromAPIStore() {
	const { subscribe, set, update } = writable(false);

    return {
        subscribe,
        change: () => {
            update(b => !b)
            disabledButtonIfBothFromAPI.change()
        }
    }
}

  export const bothFromAPI = createBothFromAPIStore()
