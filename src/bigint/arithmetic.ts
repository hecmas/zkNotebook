// https://cp-algorithms.com/algebra/montgomery_multiplication.html

const N = Number.MAX_SAFE_INTEGER; // 2^53 - 1 For computations.
// const M = Number.MAX_VALUE; // 2^1024 - 1 For representation.
const B = 2 ** 32; // b is the base of which numbers are represented.

const KARAT_CUTOFF = 1 << 4; // TODO: Find a precise value.

function karatsuba_mul(a: number, b: number) : number {
    if (a < KARAT_CUTOFF || b < KARAT_CUTOFF) {
        return a * b;
    }

    const m = Math.max(log2(a), log2(b));
    const m2 = m >> 1;

    const [ah, al] = split_at(a, m2);
    const [bh, bl] = split_at(b, m2);

    const d0 = karatsuba_mul(al, bl);
    const d1 = karatsuba_mul(al + ah, bl + bh);
    const d2 = karatsuba_mul(ah, bh);

    const result = d0 + (d1 - d0 - d2) * 2 ** m2 + d2 * 2 ** (2 * m2);
    return result;
}

function karatsuba_square(a: number) : number {
    if (a < KARAT_CUTOFF) {
        return a ** 2;
    }

    const m = log2(a);
    const m2 = m >> 1;

    const [ah, al] = split_at(a, m2);

    const d0 = karatsuba_square(al);
    const d1 = karatsuba_square(al + ah);
    const d2 = karatsuba_square(ah);

    const result = d0 + (d1 - d0 - d2) * 2 ** m2 + d2 * 2 ** (2 * m2);
    return result;
}

// Add assumptions to the inputs.
// TODO: Decide how to choose R.

/**
 * @param T The input value. It should be an integer in the range [0, M·R - 1].
 * @param R The helper modulus. It should be an integer coprime to M.
 * @param M The modulus to reduce the input to. It should be an integer coprime to R.
 * @returns Integer S in the range [0, M - 1] such that S = T·R (mod M).
 */
function montgomery_form(T: number, R: number, M: number): number {
    if (T < 0 
        //|| T > N
        ) {
        throw new Error(`Overflow: T must be in the range [0, ${N}]`);
    }

    if (gcd(R, M) !== 1) {
        throw new Error(`R and M must be coprime`);
    }

    return (T * R) % M; // TODO: Optimize.
}

/**
 * @param T The input value. It should be an integer in the range [0, M·R - 1].
 * @param R The helper modulus. It should be an integer coprime to M.
 * @param M The modulus to reduce the input to. It should be an integer coprime to R.
 * @param Minv Pseudo-inverse of M modulo R.
 * @returns Integer S in the range [0, M - 1] such that S = T·R⁻¹ (mod M).
 */
function REDC(T: number, R: number, M: number, Minv: number): number {
    // R and M must be coprime.
    if (gcd(R, M) !== 1) {
        throw new Error(`R = ${R} and M = ${M} must be coprime`);
    }

    // Minv must be the pseudo-inverse of M modulo R.
    if ((M*Minv) % R !== 1) {
        throw new Error(`Minv = ${Minv} must be the pseudo-inverse of M = ${M} modulo R = ${R}`);
    }

    // T must be in the range [0, M·R - 1].
    const limit = M * R - 1;
    if (T < 0 || T > limit) {
        throw new Error(`T = ${T} must be in the range [0, ${limit}]`);
    }

    const m = ((T % R) * Minv) % R;
    const t = (T + m * M) / R;
    if (t >= M) {
        return t - M;
    } else {
        return t;
    }
}

/**
 * @param T The input value. Integer in the range [0, M·R - 1], represented in t=m+r chunks of B bits.
 * @param R The helper modulus. Integer assumed to be equal to Bʳ.
 * @param M The modulus to reduce the input to. It should be an integer coprime to B (and therefore to R). It is represented in m chunks of B bits.
 * @param Minv Pseudo-inverse of M modulo B.
 * @returns Integer S in the range [0, M - 1] such that S = T·R⁻¹ (mod M). It is represented in m chunks of B bits.
 */
function multi_precision_REDC(T: number[], R: number, M: number[], Minv: number): number[] {
    // 1] TODO: Verify the correctness of the inputs.
    // // R and M must be coprime.
    // if (gcd(R, M) !== 1) {
    //     throw new Error(`R = ${R} and M = ${M} must be coprime`);
    // }

    // // Minv must be the pseudo-inverse of M modulo R.
    // if ((M*Minv) % R !== 1) {
    //     throw new Error(`Minv = ${Minv} must be the pseudo-inverse of M = ${M} modulo R = ${R}`);
    // }

    // // T must be in the range [0, M·R - 1].
    // const limit = M * R - 1;
    // if (T < 0 || T > limit) {
    //     throw new Error(`T = ${T} must be in the range [0, ${limit}]`);
    // }

    const t = T.length;
    const m = M.length;
    const r = log2(R);
    if (t > m + r) {
        throw new Error(`T = ${T} cannot be represented with more than m+r = ${m + r} chunks of B = ${B} bits`);
    } else if (t <= m + r) {
        T = T.concat(new Array<number>(m + r + 1 - t).fill(0)); // We add one extra chunk to handle the carry.
    }


    // Loop: At each iteration, make T divisible by Bⁱ⁺¹
    for (let i = 0; i < r; i++) {
        let c = 0;
        let p = (T[i] * Minv) % B;
        // Loop: At each iteration, add to T the low chunk of p·M[j] and the past carry and find the new carry.
        for (let j = 0; j < m; j++) {
            const x = T[i + j] + p * M[j] + c;
            T[i + j] = x % B;
            c = Math.floor(x / B);
        }
        // Loop: At each iteration, add to T the past carry and find the new carry.
        for (let j = m; j < m + r + 1 - i; j++) {
            const x = T[i + j] + c;
            T[i + j] = x % B;
            c = Math.floor(x / B);
        }
    }

    let S = new Array<number>(m).fill(0);
    for (let i = 0; i < m; i++) {
        S[i] = T[i+r];
    }

    if (S[m - 1] >= M[m - 1]) {
        return array_sub(S, M);
    } else {
        return S;
    }
}


// auxiliary functions

// assumes non-negative inputs
function gcd(a: number, b: number): number  {
    if (a < b) {
        return gcd(b, a);
    }
    if (b === 0) {
        return a;
    }

    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    
    return a;
}
function egcd(a: number, b: number): [number, number, number] {
    if (a < b) {
        let result = egcd(b, a);
        return [result[1], result[0], result[2]];
    }
    if (b === 0) {
        return [1, 0, a];
    }
    let [previous_r, r] = [a, b];
    let [previous_s, s] = [1, 0];
    let [previous_t, t] = [0, 1];
    while (r) {
        let q = Math.floor(previous_r / r);
        [previous_r, r] = [r, previous_r - q * r];
        [previous_s, s] = [s, previous_s - q * s];
        [previous_t, t] = [t, previous_t - q * t];
    }
    return [previous_s, previous_t, previous_r];
}

function mod(a: number, b: number): number {
    return a >= 0 ? a % b : ((a % b) + b) % b;
}

function array_sub(a: number[], b: number[]): number[] {
    const alen = a.length;
    const blen = b.length;
    const len = Math.max(alen, blen);
    const result = new Array<number>(len).fill(0);
    let borrow = 0;
    for (let i = 0; i < len; i++) {
        const ai = i < alen ? a[i] : 0;
        const bi = i < blen ? b[i] : 0;

        let diff = ai - borrow;
        if (i < blen) {
            diff -= bi;
        }
        if (diff < 0) {
            diff += B;
            borrow = 1;
        } else {
            borrow = 0;
        }
        result[i] = diff;
    }
    return result;
}

function split_at(x: number, n: number): [number, number] {
    return [x >> n, x & ((1 << n) - 1)];
}

function log2(x: number): number {
    if (x === 0) return 0;

    let r = 1;
    while (x > 1) {
        x = x >> 1;
        r += 1;
    }
    return r;
}

function test_gcd() {
    const a = 123456789;
    const b = 987654321;
    const result = gcd(a, b);
    console.log(`gcd(${a}, ${b}) = ${result}`);
    console.log(`gcd(${a}, ${0}) = ${gcd(a, 0)}`);
    console.log(`gcd(${0}, ${b}) = ${gcd(0, b)}`);
    console.log(`gcd(${0}, ${0}) = ${gcd(0, 0)}`);
}

function test_montgomery_reduction() {
    const R = 2 ** 16;
    const M = 123456789;
    let Minv = egcd(R, M)[1];
    // Minv = mod(R - Minv, R);
    const T = 987654321;
    const expectedResult = T % M;
    const result = montgomery_form(REDC(T, R, M, Minv),R,M);
    
    if (expectedResult !== result) {
        throw new Error(`Error: expected ${expectedResult}, got ${result}`);
    } else {
        console.log(`${T} mod ${M} = ${result}`);
    }
}

function test_karatsuba() {
    const a = [123456789, 987654321, 123456789, 987654321];
    const b = [123456789, 987654321, 123456789, 987654321];

    for (let i = 0; i < a.length; i++) {
        const expectedMul = a[i] * b[i];
        const mul = karatsuba_mul(a[i], b[i]);
        if (expectedMul !== mul) {
            throw new Error(`Error: expected ${expectedMul}, got ${mul}`);
        } else {
            console.log(`${a[i]} · ${b[i]} = ${mul}\n`);
        }

        const expectedSquare = a[i] ** 2;
        const square = karatsuba_square(a[i]);
        if (expectedSquare !== square) {
            throw new Error(`Error: expected ${expectedSquare}, got ${square}`);
        } else {
            console.log(`${a[i]}^2 = ${square}\n`);
        }

    }
}

function test_MPMR() {
    const T = [
        456851579, 3106704095, 710596368, 3131116627, 2303124019, 1619357350,
        2743281300, 2804640968,
    ];
    const R = B;
    const M = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1];
    const Minv = 1;

}

// test_karatsuba();
// test_gcd();
test_montgomery_reduction();