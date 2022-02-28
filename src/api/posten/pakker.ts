import type { NorgesPakke, PostenBox } from "../../types/Posten";

export const NORGESPAKKE_LITEN: NorgesPakke = {
    minWeight: 0,
    maxWeight: 5,
    box: {
        height: 35,
        width: 25,
        depth: 12,
    },
}

export const NORGESPAKKE_STOR: NorgesPakke = {
    minWeight: 0,
    maxWeight: 35,
    box: {
        height: 120,
        width: 60,
        depth: 60
    }
}

export const BOX_MINI: PostenBox = {
    name: "mini",
    box: {
        height: 24,
        width: 15.9,
        depth: 6
    }
}

export const BOX_LITEN: PostenBox = {
    name: "liten",
    box: {
        height: 35,
        width: 25,
        depth: 7
    }
}

export const BOX_MELLOMSTOR: PostenBox = {
    name: "mellomstor",
    box: {
        height: 30,
        width: 35,
        depth: 12
    }
}

export const BOX_STOR: PostenBox = {
    name: "stor",
    box: {
        height: 50,
        width: 30,
        depth: 20
    }
}