export type NorgesPakke = {
    minWeight: number, // KG
    maxWeight: number, // KG
    box: Box
}

type Box = {
    height: number, // cm
    width: number, // cm
    depth:  number, // cm
}

export type PostenBox = {
    name: string, 
    box: Box
}