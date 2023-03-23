import { EllipticCurveOverFq, PointOverFq } from "./ellipticCurve";
import { ExtensionField } from "./extensionField";

export function log2(x: bigint): number {
    if (x == 0n) return 0;

    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}

// Find line y = mx + c passing through two points P and Q
// or vertical line y = x0 if Q = -P
// and evaluate it at a point T
export function line(
    P: PointOverFq,
    Q: PointOverFq,
    T: PointOverFq,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[] {
    // Should we check that P, Q, T are on the curve?

    if (E.is_zero(P) || E.is_zero(Q) || E.is_zero(T)) {
        throw new Error("Cannot evaluate line at zero");
    }

    // First case: P and Q are distinct and not on the same vertical line
    if (P.x !== Q.x) {
        const m = Fq.div(Fq.sub(Q.y, P.y), Fq.sub(Q.x, P.x));
        const c = Fq.sub(P.y, Fq.mul(m, P.x));
        return Fq.sub(T.y, Fq.add(Fq.mul(m, T.x), c));

        // Second case: P and Q are the same point
    } else if (P.y === Q.y) {
        const m = Fq.div(
            Fq.add(Fq.mul([3n], Fq.mul(P.x, P.x)), E.a),
            Fq.mul([2n], P.y)
        );
        const c = Fq.sub(P.y, Fq.mul(m, P.x));
        return Fq.sub(T.y, Fq.add(Fq.mul(m, T.x), c));

        // Third case: P and Q are distinct and on the same vertical line
        // The line is y = P.x
    } else {
        return Fq.sub(T.y, P.x);
    }
}