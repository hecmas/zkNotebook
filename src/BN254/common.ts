import { EllipticCurveOverFq, PointOverFq } from "../ellipticCurve";
import { ExtensionField } from "../extensionField";
import { p } from "./constants";

// I have used the following function to generate and hardcode all the Frobenius constants gammaij
// It assumes p satisfies p === 1 (mod 6)
export function Frobenius_constants(Fq: ExtensionField): bigint[][] {
    const xi = [9n, 1n];
    const e1 = (p - 1n) / 6n;
    const e2 = (p ** 2n - 1n) / 6n;
    const e3 = (p ** 3n - 1n) / 6n;

    let gammas: bigint[][] = [];
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e1));
    }
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e2));
    }
    for (let i = 1n; i < 6n; i++) {
        gammas.push(Fq.exp(xi, i * e3));
    }

    return gammas;
}

export function twist_constants(Fq: ExtensionField): bigint[][] {
    const xi = [9n, 1n];
    const e1 = (p - 1n) / 3n;
    const e2 = (p - 1n) / 2n;

    return [Fq.exp(xi, e1), Fq.exp(xi, e2)];
}

// Find line y = mx + c passing through two points P and Q of E'(Fp2)
// and evaluate it at a point T of E(Fp)
export function line(
    P: PointOverFq,
    Q: PointOverFq,
    T: PointOverFq,
    Fq: ExtensionField,
    E: EllipticCurveOverFq
): bigint[][] {
    if (E.is_zero(P) || E.is_zero(Q) || E.is_zero(T)) {
        throw new Error("Cannot evaluate line at zero");
    }

    // First case: P and Q are distinct and not on the same vertical line
    if (P.x !== Q.x) {
        // (x2'-x1')·y
        const a = Fq.mul(Fq.sub(Q.x, P.x), T.y);

        // (y1'-y2')·x
        const b = Fq.mul(Fq.sub(P.y, Q.y), T.x);

        // (x1'y2'-x2'y1')
        const c = Fq.sub(Fq.mul(P.x, Q.y), Fq.mul(Q.x, P.y));

        return [[0n], [0n], a, b, [0n], c];

        // Second case: P and Q are the same point
    } else if (P.y === Q.y) {
        // (3x'^3 - 2y'^2)(9+u)
        const a = Fq.mul(
            Fq.sub(
                Fq.mul(Fq.exp(P.x, 3n), [3n]),
                Fq.mul(Fq.exp(P.y, 2n), [2n])
            ),
            [9n, 1n]
        );

        // 2y'y
        const b = Fq.mul(Fq.mul(P.y, T.y), [2n]);

        // -3x'^2x
        const c = Fq.mul(Fq.mul(Fq.exp(P.x, 2n), T.x), [-3n]);

        return [a, [0n], [0n], b, c, [0n]];
    }
}
