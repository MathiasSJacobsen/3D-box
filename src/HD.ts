import Variable, { defaultConstraintSystem, component } from "./hotdrink/hotdrink";

let system = defaultConstraintSystem;

let comp = component`
    var w=1, d=1, h=1, v;
    
    constraint volum {
      calculateVolum(w, d, h -> v) => w*d*h;
      (v, d, w -> h) => v/(d*w);
      (v, w, h -> d) => v/(w*h);
      (v, d, h -> w) => v/(d*h);
    }	

    var price = 0, kg = 0;
    constraint price {
      m1(w, d, h, kg -> price) => {
        if (kg <= 5) {
          if (h <= 35 && w <= 25 && d <=12) {
            return 70;
          } else if (h <= 120 && w <= 60 && d <=60) {
            return 129;
          } else {
            let spesialgodstillegg = 149;
            return 129 + spesialgodstillegg;
          }
        } else if (kg <=10) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 129;
          } else {
            let spesialgodstillegg = 149;
            return 129 + spesialgodstillegg;
          }
        } else if (kg <= 25) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 229;
          } else {
            let spesialgodstillegg = 149;
            return 229 + spesialgodstillegg;
          }
        } else if (kg <= 35) {
          if (h <= 120 && w <= 60 && d <=60) {
            return 299;
          } else {
            let spesialgodstillegg = 149;
            return 299 + spesialgodstillegg;
          }
        }
      }
    }
    var weightErrorMessage = "";
    constraint error {
      m1(kg -> weightErrorMessage) => {
        if (kg > 35) {
          return "Package is over the maximum weight of 35kg";
        } else {
          return "";
        }
      }
    }

    /*
    var t=3, p;
    constraint test {
      (t -> p) => myDict[t]()
    }
    */
  `;


  comp.vs.w.value.subscribeValue((n: number) =>
    console.log("HD: Value of width: " + n)
  );
  comp.vs.d.value.subscribeValue((n: number) =>
    console.log("HD: Value of depth: " + n)
  );
  comp.vs.h.value.subscribeValue((n: number) =>
    console.log("HD: Value of height: " + n)
  );
  comp.vs.v.value.subscribeValue((n: number) =>
    console.log("HD: Value of volum: " + n)
  );

  comp.vs.price.value.subscribeValue((n: number) =>
    console.log("HD: Value of price: " + n)
  );

  comp.vs.weightErrorMessage.value.subscribeValue((n: string) =>
    console.log("HD: Value of weightErrorMessage: " + n)
  );


system.addComponent(comp);
system.update();


export let HDv: Variable<number> = comp.vs.v.value;
export let HDw: Variable<number> = comp.vs.w.value;
export let HDd: Variable<number> = comp.vs.d.value;
export let HDh: Variable<number> = comp.vs.h.value;

export let HDPrice: Variable<number> = comp.vs.price.value;
export let HDkg: Variable<number> = comp.vs.kg.value;
export let HDweightErrorMessage: Variable<string> = comp.vs.weightErrorMessage.value;


export function setHDValue<T>(HDvariable: Variable<T>, n: T) {
    // TODO: qickfix so that the variable dosnt update twice with the value set by the first call
    if (n !== HDvariable.value) {
      HDvariable.set(n);
    }
  }