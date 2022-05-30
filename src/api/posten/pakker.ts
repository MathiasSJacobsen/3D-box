import { writable } from "svelte/store";
import type { NorgesPakke, PostenBox } from "../../types/Posten";

export const selectedPackageSize = writable();


const BOX_MINI: PostenBox = {
    name: "Mini",
    box: {
        height: 24,
        width: 15.9,
        depth: 6
    }
}

const BOX_LITEN: PostenBox = {
    name: "Liten",
    box: {
        height: 35,
        width: 25,
        depth: 7
    }
}

const BOX_MELLOMSTOR: PostenBox = {
    name: "Mellomstor",
    box: {
        height: 30,
        width: 35,
        depth: 12
    }
}

const BOX_STOR: PostenBox = {
    name: "Stor",
    box: {
        height: 50,
        width: 30,
        depth: 20
    }
}

export const BOXES = [BOX_MINI, BOX_LITEN, BOX_MELLOMSTOR, BOX_STOR]
