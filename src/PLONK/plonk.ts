import { UnivariatePolynomialRing } from "../univariatePolynomialRing";
import { PrimeField } from "../primeField";
import { r } from "../BN254/constants";
import * as fs from "fs";

// TODO: Implement FFT
function Lagrange_interpolation(xs: bigint[], ys: bigint[], p: bigint) {
    const n = xs.length;
    if (n !== ys.length) {
        throw new Error("xs and ys must have the same length");
    }

    const RPp = new UnivariatePolynomialRing(p);
    let result = RPp.zero;
    for (let i = 0; i < n; i++) {
        let Li = [ys[i]];
        for (let j = 0; j < n; j++) {
            if (i != j) {
                Li = RPp.mul(
                    Li,
                    RPp.div(
                        RPp.sub([0n, 1n], [xs[j]]),
                        RPp.sub([xs[j]], [xs[i]])
                    )
                );
            }
        }
        result = RPp.add(result, Li);
    }

    return result;
}

// I view an arithmetic circuit C: F^n --> F as the set of functions QM,QL,QR,QO,QC: F^n --> F indicating the type of gates
// and a permutation sigma: [3n] --> [3n] indicating the relationship between the wires.
// Here, n is the number of gates and 3n is the number of wires (counting repetitions).
// For example:
// H = {w^0,w^1,w^2,...,w^{n-1}}
function circuit_preprocessing(
    p: bigint,
    H: bigint[],
    k1: bigint,
    k2: bigint,
    QLs: bigint[],
    QRs: bigint[],
    QMs: bigint[],
    QCs: bigint[],
    QOs: bigint[],
    sigmas: bigint[]
): bigint[][] {
    const Fp = new PrimeField(p);
    const omega = H[1];

    const n = QMs.length;
    // if (QL.length !== n || QR.length !== n || QC.length !== n || QO.length !== n || sigma.length !== 3*n) {
    //     throw new Error("Invalid circuit");
    // }

    const QL = Lagrange_interpolation(H, QLs, p);
    const QR = Lagrange_interpolation(H, QRs, p);
    const QM = Lagrange_interpolation(H, QMs, p);
    const QC = Lagrange_interpolation(H, QCs, p);
    const QO = Lagrange_interpolation(H, QOs, p);

    // BIGINT
    const sigma_r = new Array<bigint>(3 * n);
    for (let i = 0; i < 3 * n; i++) {
        // if (sigmas[i] < 0n || sigmas[i] >= m) {
        //     throw new Error("Invalid permutation");
        // }

        const index = sigmas[i];
        const omegai = Fp.exp(omega, index);
        if (index <= n) {
            sigma_r[i] = omegai;
        } else if (index > n && index <= 2 * n) {
            sigma_r[i] = Fp.mul(omegai, k1);
        } else {
            sigma_r[i] = Fp.mul(omegai, k2);
        }
    }
    const S1 = Lagrange_interpolation(H, sigma_r.slice(0, n), p);
    const S2 = Lagrange_interpolation(H, sigma_r.slice(n, 2 * n), p);
    const S3 = Lagrange_interpolation(H, sigma_r.slice(2 * n, 3 * n), p);

    return [QL, QR, QM, QC, QO, S1, S2, S3];
}

const Fr = new PrimeField(r);
const g = 5n; // Generator of Fr
const n = 2 ** 28; // Number of points
const omega = Fr.exp(g, (r - 1n) / 2n ** 28n); // 2^28th primitive root of unity
const H = new Array<bigint>(n);
for (let i = 0; i < n; i++) {
    H[i] = Fr.exp(omega, BigInt(i));
}

let write = fs.createWriteStream("src/KZG/H.json");
write.write(
    JSON.stringify(
        H,
        (_, value) => (typeof value === "bigint" ? value.toString() : value),
        " "
    ),
    (err) => {
        if (err) throw err;
        console.log("H.json has been saved!");
    }
);
