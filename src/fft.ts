import { PrimeField } from "./primeField";

class FFT {
    readonly F: PrimeField;

    // Constructor
    constructor(F: PrimeField, G) {
        this.F = F;
        this.G = G;


    }

    fft(pol: bigint[]) {
        if (pol.length <= 1) return pol;

        const bits = pol.length.toString(2).length - 1;
        const n = 1 << bits;
        if (n != pol.length) {
            throw new Error("The number of coefficients must be a power of 2");
        }

        const n2 = n / 2;
        const even = new Array<bigint>(n2);
        const odd = new Array<bigint>(n2);
        for (let i = 0; i < n2; i++) {
            even[i] = pol[2 * i];
            odd[i] = pol[2 * i + 1];
        }

        const evenfft = this.fft(even);
        const oddfft = this.fft(odd);

        const w = new Array<bigint>(n);
        for (let i = 0; i < n; i++) {
            w[i] = 0n;
        }

        const wn = 0n;
        for (let i = 0; i < n2; i++) {
            w[i] = evenfft[i] + wn * oddfft[i];
            w[i + n2] = evenfft[i] - wn * oddfft[i];
        }

        return w;
    }
}

const pol = [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n];
const fft = new FFT();
console.log(fft.fft(pol));
