// import { Point, EllipticCurve } from "./elliptic_curves";

const ATE_LOOP_COUNT = 29793968203157093288;
const LOG_ATE_LOOP_COUNT = 63;

// Create a function representing the line between P1 and P2,
// and evaluate it at T
// function line(P1: Point, P2: Point, T: Point, E: EllipticCurve): Point {
//     if (E.is_zero(P1) || E.is_zero(P2) || E.is_zero(T)) {
//         throw new Error("Cannot evaluate line at zero");
//     }

//     // if (P1.x !== P2.x) {
//     //     const m = (P2.y - P1.y) / (P2.x - P1.x);
//     //     return m * (T.x - P1.x) - (T.y - P1.y);
//     // } elif (P1.y === P2.y) {
//     //     const m = (3n * P1.x * P1.x + E.a) / (2n * P1.y);
//     //     return m * (T.x - P1.x) - (T.y - P1.y);
//     // } else {
//     //     return T.y - P1.y;
//     // }

//     // const m = (P2.y - P1.y) / (P2.x - P1.x);
//     // const b = P1.y - m * P1.x;
//     // return m * T + b;
// }

// Miller loop
// function miller_loop(P: Point, Q: Point): Point {
//     let R = Q;
//     let f = FQ12.one;
//     for (let i = LOG_ATE_LOOP_COUNT - 1; i >= 0; i--) {
//         f = f.square();
//         f = f.mul(line(R, R, Q));
//         R = R.double();
//         if (ATE_LOOP_COUNT & (1n << BigInt(i))) {
//             f = f.mul(line(R, P, Q, E));
//             R = R.add(P);
//         }
//     }
//     return f;
// }

// Pairing computation
// function pairing(P: Point, Q: Point): Point {
//     return miller_loop(P, Q).inverse();
// }

// // Final exponentiation
// function final_exponentiation(f: Point): Point {
//     return f.pow((p ** 12 - 1n) / r);
// }