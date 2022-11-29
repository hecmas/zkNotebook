"use strict";
// import { Field, FieldElement } from "./Fp";
// /*
//     * Elliptic curve over Fp
//     * y^2 = x^3 + ax + b
//     * a, b are integers
//     * 4a^3 + 27b^2 != 0
//     * p is prime
//     */
// class EllipticCurve {
//     _curveParams: {a: FieldElement, b: FieldElement};
//     _field: Field;
//     constructor(a: FieldElement, b: FieldElement) {
//         this._curveParams = {a: a, b: b};
//         this._field = a.field;
//     }
//     set curveParams({a: FieldElement, b: FieldElement}) {
//         const three = new FieldElement(3, this._field);
//         const two = new FieldElement(2, this._field);
//         const firstSummand = a.exp(three).mul(4);
//         if (4 * a.exp(three).add(b.exp(two)).eq(this._field.zero())) {
//             return;
//         }
//         this._curveParams = values;
//     }
//     contains(x: FieldElement, y: FieldElement): boolean {
//         return y.pow(2).eq(x.pow(3).add(this.a.mul(x)).add(this.b));
//     }
//     add(p: Point, q: Point): Point {
//         if (p.isZero()) {
//             return q;
//         }
//         if (q.isZero()) {
//             return p;
//         }
//         if (p.x.eq(q.x)) {
//             if (p.y.eq(q.y)) {
//                 return this.double(p);
//             } else {
//                 return Point.zero(this);
//             }
//         }
//         let lambda = q.y.sub(p.y).div(q.x.sub(p.x));
//         let x = lambda.pow(2).sub(p.x).sub(q.x);
//         let y = lambda.mul(p.x.sub(x)).sub(p.y);
//         return new Point(x, y, this);
//     }
//     double(p: Point): Point {
//         if (p.isZero()) {
//             return p;
//         }
//         let lambda = p.x.pow(2).mul(3).add(this.a).div(p.y.mul(2));
//         let x = lambda.pow(2).sub(p.x.mul(2));
//         let y = lambda.mul(p.x.sub(x)).sub(p.y);
//         return new Point(x, y, this);
//     }
//     mul(p: Point, e: number): Point {
//         if (e === 0) {
//             return Point.zero(this);
//         }
//         if (e === 1) {
//             return p;
//         }
//         let q = this.double(p);
//         let r = this.mul(p, e - 1);
//         return this.add(q, r);
//     }
// }
//# sourceMappingURL=elliptic_curves.js.map