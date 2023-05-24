import { assert } from "chai";
import {
    E,
    tE,
    E12,
    G1,
    G2,
    Fp2,
    Fp6,
    Fp12,
    Fp12a,
    Fp12b,
    xi,
} from "./parameters";
import { x } from "./constants";
import {
    Frobenius_operator1,
    Frobenius_operator2,
    Frobenius_operator3,
    optimal_ate_bn254,
    twist,
} from "./optimal_ate_pairing";
import { line } from "./common";
import { ExtensionFieldOverFq } from "../extensionField";

// Test 1: Optimal Ate Pairing over BN12-254
let tQ = twist(G2, tE);
const R = twist(tE.escalarMul(G2, 77n), tE); // Just to play a little bit
// console.log("R =", tE.escalarMul(G2, 147946756881789318990833708069417712966n));
assert(E12.is_on_curve(tQ), "The twist is not working");
assert(E12.is_on_curve(R), "The twist is not working");

const Fp4 = new ExtensionFieldOverFq(Fp2, [Fp2.neg(xi), [0n], [1n]]);
const cyclo = [
    [
        12879671296228341798957541889042068293248913689212425431224938470232546313254n,
        3326450555199805883965490851796414254830144151329718176108864533289444035270n,
    ],
    [
        11706129207700151979042100288958216850158405562525260961392090752318820540155n,
        13581688218243497693010389261307054804658398598414171976249347555990073884710n,
    ],
    [
        20034916004680903865371475524544157810838259782601065778963371780592670397755n,
        18196221800554323016660057972017335112712278872243164622794778048181747904770n,
    ],
    [
        865661210072615391091663782916883487315505694294592934212781713437127182959n,
        5364456672142552956341240304849409513108281743490635067211876654163672173225n,
    ],
    [
        2650685350723162073065693030364953757603657135232283880472468071129041178893n,
        1415534485628002925645978830263295545820817030311522411523977773123510463790n,
    ],
    [
        11182696274116283149832659131689911508224992839995672842130064887471806829782n,
        13862086431460254638576437312497952755826436162922426416336796129991391475329n,
    ],
];

let cylo2 = iso(cyclo);
let [t12, t01] = Fp4.exp([cylo2[1][0], cylo2[0][2]], 2n);
// console.log("t12 =", t12);
let c12 = Fp2.add(Fp2.mul([2n, 0n], cylo2[1][2]), Fp2.mul([3n, 0n], t12));
console.log("c12 =", c12);

console.log("cyclo =", Fp12.exp(cyclo, Fp12.Fp.p ** 6n + 1n));
// console.log(iso(cyclo));
console.log("cyclo =", Fp12a.exp(iso(cyclo), 2n));

let cyclo2 = iso2(cyclo);
let a2 = cyclo2[1][0];
let a3 = cyclo2[1][1];
let a4 = cyclo2[2][0];
let a5 = cyclo2[2][1];

let A23 = Fp2.mul(Fp2.add(a2, a3), Fp2.add(a2, Fp2.mul([9n, 1n], a3)));
let A45 = Fp2.mul(Fp2.add(a4, a5), Fp2.add(a4, Fp2.mul([9n, 1n], a5)));
let B23 = Fp2.mul(a2, a3);
let B45 = Fp2.mul(a4, a5);
let h2 = Fp2.mul(
    [2n, 0n],
    Fp2.add(a2, Fp2.mul([3n, 0n], Fp2.mul([9n, 1n], B45)))
);
let h3 = Fp2.sub(
    Fp2.mul([3n, 0n], Fp2.sub(A45, Fp2.mul([10n, 1n], B45))),
    Fp2.mul([2n, 0n], a3)
);
let h4 = Fp2.sub(
    Fp2.mul([3n, 0n], Fp2.sub(A23, Fp2.mul([10n, 1n], B23))),
    Fp2.mul([2n, 0n], a4)
);
let h5 = Fp2.mul([2n, 0n], Fp2.add(a5, Fp2.mul([3n, 0n], B23)));
// console.log("h2 =", h2);
// console.log("h3 =", h3);
// console.log("h4 =", h4);
// console.log("h5 =", h5);

let hey = Fp2.div(
    Fp2.sub(
        Fp2.add(
            Fp2.mul(Fp2.exp(a5, 2n), [9n, 1n]),
            Fp2.mul([3n, 0n], Fp2.exp(a4, 2n))
        ),
        Fp2.mul([2n, 0n], a3)
    ),
    Fp2.mul([4n, 0n], a2)
);
// console.log("hola =", hey);
let hoy = Fp2.mul(
    Fp2.sub(
        Fp2.add(Fp2.mul([2n, 0n], Fp2.exp(hey, 2n)), Fp2.mul(a2, a5)),
        Fp2.mul(Fp2.mul([3n, 0n], a3), a4)
    ),
    [9n, 1n]
);
// console.log("adios =", hoy);

// console.log(iso2(cyclo));
// console.log("cyclo1 =", Fp12b.exp(iso2(cyclo), Fp12.Fp.p**4n - Fp12.Fp.p**2n + 1n));
// console.log("cyclo2 =", Fp12b.exp(iso2(cyclo), Fp12.Fp.p**6n + 1n));

// const another = [
//     [
//         20034916004680903865371475524544157810838259782601065778963371780592670397755n,
//         18196221800554323016660057972017335112712278872243164622794778048181747904770n,
//     ],
//     [
//         11182696274116283149832659131689911508224992839995672842130064887471806829782n,
//         13862086431460254638576437312497952755826436162922426416336796129991391475329n,
//     ],
// ];
// console.log("another",Fp4.exp(another, 2n));

const aaa = [
    [10n, 2n],
    [5n, 13n],
];
console.log("hey =", Fp4.exp(aaa, 2n));

const a = [
    [10n, 2n],
    [5n, 13n],
    [7n, 5n],
];
const b = [
    [9n, 1n],
    [1n, 2n],
    [14n, 2n],
];
console.log(
    "hola =",
    Fp6.mul(a, [
        [3n, 100n],
        [0n, 0n],
        [17n, 8n],
    ])
);

// console.log("sq =",Fp2.exp([1n,4n],2n));
// console.log(Fp6.exp(a, 2n));
// console.log(Fp6.inv(a));

// Field isomporphism between Fp2[w]/<w⁶ - (9+u)> and Fp6[w]/<w² - v>
export function iso(b: bigint[][]): bigint[][][] {
    return [
        [b[0], b[2], b[4]],
        [b[1], b[3], b[5]],
    ];
}

// Field isomporphism between Fp2[w]/<w⁶ - (9+u)> and Fp4[w³]/<(w³)² - (9+u)>
export function iso2(b: bigint[][]): bigint[][][] {
    return [
        [b[0], b[3]],
        [b[1], b[4]],
        [b[2], b[5]],
    ];
}

// Field isomporphism between Fp6[w]/<w² - v> and Fp2[w]/<w⁶ - (9+u)>
function inv_iso(a: bigint[][][]): bigint[][] {
    return [a[0][0], a[1][0], a[0][1], a[1][1], a[0][2], a[1][2]];
}

// Field isomporphism between Fp4[w³]/<(w³)² - (9+u)> and Fp2[w]/<w⁶ - (9+u)>
export function inv_iso2(a: bigint[][][]): bigint[][] {
    return [a[0][0], a[1][0], a[2][0], a[0][1], a[1][1], a[2][1]];
}

// const ab = [
//     [10n, 2n],
//     [5n, 13n],
//     [7n, 5n],
//     [9n, 1n],
//     [1n, 2n],
//     [14n, 2n],
// ];
// console.log("iso2 =", inv_iso2(iso2(ab)));
// const ba = [
//     [[5n, 0n],
//     [13n, 7n]],
//     [[1n, -2n],
//     [4n, 3n]],
//     [[1n, 1n],
//     [16n, 3n]],
// ];
// console.log("inv_iso2 =", iso2(inv_iso2(ba)));

// const a = [
//     [10n, 2n],
//     [5n, 13n],
//     [7n, 5n],[1n, 0n],[2n, 3n],[7n, 7n]
// ];
const c = [
    [
        [10n, 2n],
        [5n, 13n],
        [7n, 5n],
    ],
    [
        [1n, 0n],
        [2n, 3n],
        [7n, 7n],
    ],
];
// console.log(iso(inv_iso(c)))
// console.log(iso(a))

const d = [
    [
        [78n, 5n],
        [3n, 193n],
        [20n, 2n],
    ],
    [
        [1n, 0n],
        [0n, 3n],
        [69n, 27n],
    ],
];

const ca = [
    [
        [2n, 4n],
        [0n, 0n],
        [0n, 5n],
    ],
    [
        [5n, 10n],
        [20n, 30n],
        [7n, 69n],
    ],
];
const ba = [
    [[7n, 6n], [0n], [7n,83n]],
    [[0n], [2n, 29n], [0n]],
];
// console.log(
//     "adiosbro =",
//     Fp6.add(
//         Fp6.mul(ca[0], ba[0]),
//         Fp6.mul([[0n], [1n], [0n]], Fp6.mul(ca[1], ba[1]))
//     )
// );
console.log("adiosbro =", Fp12a.mul(ca, ba));
// console.log("add =",Fp12a.add(c,d));
// console.log("sub =",Fp12a.sub(c,d));
// console.log("mul =",Fp12a.mul(c,d));
// console.log("mul2 =",Fp12a.mul(ca,da));
// console.log("square =",Fp12a.mul(ca,ca));
// console.log("exp =",Fp12a.exp(ca,167n));
const inv = Fp12a.inv(ca);
// console.log("inverse =",inv);
// console.log(Fp12a.mul(ca,inv));
// const t = [[2n,4n],[0n, 0n],[0n, 5n],[5n, 10n],[20n, 30n],[7n, 69n]];
// console.log(inv_iso(ca))
const tt = [
    [2n, 4n],
    [5n, 10n],
    [0n, 0n],
    [20n, 30n],
    [0n, 5n],
    [7n, 69n],
];
// console.log("frob =",iso(Frobenius_operator1(tt, Fp2)))
// console.log("frob2 =",iso(Frobenius_operator2(tt, Fp2)))
// console.log("frob3 =",iso(Frobenius_operator3(tt, Fp2)))

const P = G1;
const Pm = { x: [P.x], y: [P.y] };
const Q = G2;
const Q2 = tE.escalarMul(Q, 2n);
// console.log("P =",P);
// console.log("Q =",Q);
// console.log("2Q =",Q2);
// console.log(iso(line(Q, Q, Pm, Fp2, tE)))
// console.log(iso(line(Q, Q2, Pm, Fp2, tE)))
// console.log("[2]Q =",tE.escalarMul(Q, 2n));
// console.log("[3]Q =",tE.escalarMul(Q, 3n));
// console.log("[4]Q =",tE.escalarMul(Q, 4n));
// console.log("[5]Q =",tE.escalarMul(Q, 5n));
// console.log(6n*x**2n);
// console.log("[6x²]Q =",tE.escalarMul(Q, 6n * x ** 2n));
// console.log("[3]Q =",tE.add(Q2,Q));
const e = optimal_ate_bn254(P, Q);
// console.log("e =",e);

const example = [
    [
        12879671296228341798957541889042068293248913689212425431224938470232546313254n,
        3326450555199805883965490851796414254830144151329718176108864533289444035270n,
        11706129207700151979042100288958216850158405562525260961392090752318820540155n,
        13581688218243497693010389261307054804658398598414171976249347555990073884710n,
        20034916004680903865371475524544157810838259782601065778963371780592670397755n,
        18196221800554323016660057972017335112712278872243164622794778048181747904770n,
    ],
    [
        865661210072615391091663782916883487315505694294592934212781713437127182959n,
        5364456672142552956341240304849409513108281743490635067211876654163672173225n,
        2650685350723162073065693030364953757603657135232283880472468071129041178893n,
        1415534485628002925645978830263295545820817030311522411523977773123510463790n,
        11182696274116283149832659131689911508224992839995672842130064887471806829782n,
        13862086431460254638576437312497952755826436162922426416336796129991391475329n,
    ],
];
// console.log("e =", Fp12.exp(example, Fp12.Fp.p ** 6n + 1n));
// console.log("e =", Fp12.exp(example, 2n));
// console.log("e =", Fp12.exp(e, 24n));

// Let's check the bilinearity of the pairing
const P2 = E.escalarMul(P, 2n);
const P12 = E.escalarMul(P, 12n);
// const Q2 = tE.escalarMul(Q, 2n);
const Q12 = tE.escalarMul(Q, 12n);
// console.log("[2]P =",P2);
// console.log("[12]P =", P12);
// console.log("[2]Q =", Q2);
// console.log("[12]Q =",Q12);

const e1 = optimal_ate_bn254(P2, Q12);
const e2 = Fp12.exp(optimal_ate_bn254(P, Q12), 2n);
const e3 = Fp12.exp(optimal_ate_bn254(P2, Q), 12n);
const e4 = Fp12.exp(optimal_ate_bn254(P, Q), 24n);
const e5 = optimal_ate_bn254(P12, Q2);
// console.log("e5 =", e5);

assert(
    Fp12.eq(e1, e2) && Fp12.eq(e1, e3) && Fp12.eq(e1, e4) && Fp12.eq(e1, e5),
    "The pairing is not bilinear"
);

const PP1 = E.escalarMul(P, 1087n);
const PP2 = E.escalarMul(P, 5n);
// console.log(PP1);
// console.log(PP2);
// console.log(E.add(PP1, PP2));
// console.log(E.add(PP1, PP1));
// console.log(E.add(PP2, PP2));
// console.log(E.escalarMul(P,2n));

// // More examples
// const P1005 = E.escalarMul(P, 1005n);
// const P1788 = E.escalarMul(P, 1788n);
// const Q1005 = tE.escalarMul(Q, 1005n);
// const Q1788 = tE.escalarMul(Q, 1788n);
// const e6 = optimal_ate_bn254(P1005, Q1788);
// const e7 = Fp12.exp(optimal_ate_bn254(P, Q1788), 1005n);
// const e8 = Fp12.exp(optimal_ate_bn254(P1005, Q), 1788n);
// const e9 = Fp12.exp(optimal_ate_bn254(P, Q), 1788n * 1005n);
// const e10 = optimal_ate_bn254(P1788, Q1005);

// assert(
//     Fp12.eq(e6, e7) && Fp12.eq(e6, e8) && Fp12.eq(e6, e9) && Fp12.eq(e6, e10),
//     "The pairing is not bilinear"
// );
