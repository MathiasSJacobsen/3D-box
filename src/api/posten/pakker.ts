import { writable } from "svelte/store";
import type { NorgesPakke, PostenBox } from "../../types/Posten";

export const selectedPackageSize = writable();

export const NORGESPAKKE_LITEN: NorgesPakke = {
    minWeight: 0,
    maxWeight: 5,
    box: {
        height: 35,
        width: 25,
        depth: 12,
    },
    price: 70
}

export const NORGESPAKKE_STOR: NorgesPakke = {
    minWeight: 0,
    maxWeight: 35,
    box: {
        height: 120,
        width: 60,
        depth: 60
    },
    price: 0
}

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
