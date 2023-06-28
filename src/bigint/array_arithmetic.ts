// I assume little-endian representation of numbers in some base B.

import {  gcd, egcd, array_sub, split_at, log2, logB, bia2scalar, array_add, shift_left, array_long_mul } from "./auxiliary";

// const N = Number.MAX_SAFE_INTEGER; // 2^53 - 1 For computations.
// const M = Number.MAX_VALUE; // 2^1024 - 1 For representation.
// const B = 1n << 32n; // b is the base of which numbers are represented.

const KARAT_CUTOFF = 1n << 4n; // TODO: Find a precise value.


/**
 * It computes the product of two positive integers using Karatsuba's algorithm.
 * @param a The first multiplicand, represented as an array of `al` base-`B` digits.
 * @param b The second multiplicand, represented as an array of `bl` base-`B` digits.
 * @param B The base of the representation.
 * @returns The product of a and b, represented as an array of `al + bl` base-`B` digits.
 */
function array_karatsuba_mul(a: bigint[], b: bigint[], B: bigint) : bigint[] {
    const n = Math.max(a.length, b.length);

    // TODO: This has been arbitrarily chosen. Find a precise value.
    if (n <= 10) {
        return array_long_mul(a, b, B);
    }

    const n2 = n >> 1;

    const ah = a.slice(n2);
    const al = a.slice(0, n2);
    const bh = b.slice(n2);
    const bl = b.slice(0, n2);

    const d0 = array_karatsuba_mul(al, bl, B);
    const d1 = array_karatsuba_mul(array_add(al, ah, B), array_add(bl, bh, B), B);
    const d2 = array_karatsuba_mul(ah, bh, B);

    const result = array_add(
        array_add(
            d0,
            shift_left(array_sub(array_sub(d1, d0, B), d2, B), n2),
            B
        ),
        shift_left(d2, 2 * n2),
        B
    );
    return result;
}

/**
 * It computes the square of a positive integer using Karatsuba's algorithm.
 * @param a The multiplicand.
 * @returns The square of a.
 */
function karatsuba_square(a: bigint) : bigint {
    if (a < KARAT_CUTOFF) {
        return a ** 2n;
    }

    const m = BigInt(log2(a));
    const m2 = m >> 1n;

    const [ah, al] = split_at(a, m2);

    const d0 = karatsuba_square(al);
    const d1 = karatsuba_square(al + ah);
    const d2 = karatsuba_square(ah);

    const result = d0 + (d1 - d0 - d2) * 2n ** m2 + d2 * 2n ** (2n * m2);
    return result;
}

/**
 * @param T The input value. It should be an integer in the range [0, M·R - 1].
 * @param R The helper modulus. It should be an integer coprime to M.
 * @param M The modulus to reduce the input to. It should be an integer coprime to R.
 * @returns Integer S in the range [0, M - 1] such that S = T·R (mod M).
 */
function montgomery_form(T: bigint, R: bigint, M: bigint): bigint {
    const max = BigInt(Number.MAX_VALUE);
    if (T < 0n || T > max) {
        throw new Error(`Overflow: T must be in the range [0, ${max}]`);
    }

    // if (gcd(R, M) !== 1) {
    //     throw new Error(`R and M must be coprime`);
    // }

    return (T * R) % M; // TODO: Optimize.
}

/**
 * @param T The input value. It should be an integer in the range [0, M·R - 1].
 * @param R The helper modulus. It should be an integer coprime to M.
 * @param M The modulus to reduce the input to. It should be an integer coprime to R.
 * @param Minv Inverse of M modulo R.
 * @returns Integer S in the range [0, M - 1] such that S = T·R⁻¹ (mod M).
 */
function REDC(T: bigint, R: bigint, M: bigint, Minv: bigint): bigint {
    // R and M must be coprime.
    if (gcd(R, M) !== 1n) {
        throw new Error(`R = ${R} and M = ${M} must be coprime`);
    }

    // Minv must be the inverse of M modulo R.
    if ((M*Minv) % R !== 1n) {
        throw new Error(`Minv = ${Minv} must be the inverse of M = ${M} modulo R = ${R}`);
    }

    // T must be in the range [0, M·R - 1].
    const limit = M * R - 1n;
    if (T < 0 || T > limit) {
        throw new Error(`T = ${T} must be in the range [0, ${limit}]`);
    }

    const m = ((T % R) * Minv) % R;
    const t = (T - m * M) / R;
    if (t < 0n) {
        return t + M;
    } else {
        return t;
    }
}

/**
 * @param T The input value. Integer in the range [0, M·R - 1], represented in t=m+r chunks of B bits.
 * @param R The helper modulus. Integer assumed to be equal to Bʳ.
 * @param M The modulus to reduce the input to. It should be an integer coprime to B (and therefore to R). It is represented in m chunks of B bits.
 * @param Minv Inverse of M modulo B.
 * @param B The base of the representation.
 * @returns Integer S in the range [0, M - 1] such that S = T·R⁻¹ (mod M). It is represented in m chunks of B bits.
 */
function mpREDC(T: bigint[], R: bigint, M: bigint[], Minv: bigint, B: bigint): bigint[] {
    // 1] TODO: Verify the correctness of the inputs.
    // // R and M must be coprime.
    // if (gcd(R, M) !== 1) {
    //     throw new Error(`R = ${R} and M = ${M} must be coprime`);
    // }

    // // Minv must be the inverse of M modulo R.
    // if ((M*Minv) % R !== 1) {
    //     throw new Error(`Minv = ${Minv} must be the inverse of M = ${M} modulo R = ${R}`);
    // }

    // // T must be in the range [0, M·R - 1].
    // const limit = M * R - 1;
    // if (T < 0 || T > limit) {
    //     throw new Error(`T = ${T} must be in the range [0, ${limit}]`);
    // }

    const t = T.length;
    const m = M.length;
    const r = logB(R,B);
    if (t > m + r) {
        throw new Error(`T = ${T} cannot be represented with more than m+r = ${m + r} chunks of B = ${B} bits`);
    } else if (t <= m + r) {
        T = T.concat(new Array<bigint>(m + r + 1 - t).fill(0n)); // We add one extra chunk to handle the carry.
    }

    // Loop1: At each iteration, make T divisible by Bⁱ⁺¹
    for (let i = 0; i < r; i++) {
        let c = 0n;
        let p = (T[i] * Minv) % BigInt(B);
        // Loop2a: At each iteration, add to T the low chunk of p·M[j] and the past carry and find the new carry.
        for (let j = 0; j < m; j++) {
            const x = T[i + j] - p * M[j] + c;
            T[i + j] = x % BigInt(B);
            c = x / BigInt(B);
        }
        // Loop2b: At each iteration, add to T the past carry and find the new carry.
        for (let j = m; j < m + r + 1 - i; j++) {
            const x = T[i + j] + c;
            T[i + j] = x % BigInt(B);
            c = x / BigInt(B);
        }
    }

    let S = new Array<bigint>(m).fill(0n);
    for (let i = 0; i < m; i++) {
        S[i] = T[i+r];
    }

    if (S[m - 1] >= M[m - 1]) {
        return array_sub(S, M, B);
    } else {
        return S;
    }
}

/**
 * 
 * @param Tsize Byte size of B.
 * @param Esize Byte size of E.
 * @param Msize Byte size of M.
 * @param B Base as unsigned integer.
 * @param E Exponent as unsigned integer.
 * @param M Modulus as unsigned integer.
 * @returns 
 */
// function modExp(Tsize: bigint, Esize: bigint, Msize: bigint, T: bigint[], E: bigint[], M: bigint[]): bigint[] {
//     const B = 1n << 128n
    
//     const Mnumchunks = M.length;
//     if (Mnumchunks === 1 && M[0] === 0n) {
//         return [0n];
//     }
//     const Tnumchunks = T.length;
//     const Enumchunks = E.length;

//     let nbitsE = Esize * 8n;
//     let result = new Array<bigint>(m).fill(0n);
//     result[0] = 1n;

//     return T;
// }


// function test_karatsuba() {
//     const a = [123456789n, 987654321n, 123456789n, 987654321n];
//     const b = [123456789n, 987654321n, 123456789n, 987654321n];

//     for (let i = 0; i < a.length; i++) {
//         const expectedMul = a[i] * b[i];
//         const mul = karatsuba_mul(a[i], b[i]);
//         if (expectedMul !== mul) {
//             throw new Error(`Error: expected ${expectedMul}, got ${mul}`);
//         } else {
//             // console.log(`${a[i]} · ${b[i]} = ${mul}\n`);
//             console.log("Karatsuba Mul test passed");
//         }

//         const expectedSquare = a[i] ** 2n;
//         const square = karatsuba_square(a[i]);
//         if (expectedSquare !== square) {
//             throw new Error(`Error: expected ${expectedSquare}, got ${square}`);
//         } else {
//             // console.log(`${a[i]}^2 = ${square}\n`);
//             console.log("Karatsuba Sq test passed");
//         }

//     }
// }

function test_REDC() {
    const R = 1n << 16n;
    const M = 123456789n;
    let Minv = egcd(R, M)[1];
    const T = 987654321n;
    const expectedResult = T % M;
    const result = montgomery_form(REDC(T, R, M, Minv),R,M);
    
    if (expectedResult !== result) {
        throw new Error(`Error: expected ${expectedResult}, got ${result}`);
    } else {
        // console.log(`${T} mod ${M} = ${result}`);
        console.log("REDC test passed");
    }
}

function test_mpREDC1() {
    const T = [
        236287500539791393639949766424153981693n,
        9987349287020111142892010793940439742n,
        93593981823846933379545110016457294077n,
        17213463078146180362830445753644188492n,
        208922638622608340257376142744302473934n,
        262536095740453045045411918842097501903n,
        249711929963109668613287962193510370391n,
        248391936649258605054234440895903610156n,
    ];
    const B = 2n ** 128n; 
    const R = B ** 10n;
    const M = [
        288693961375620708181572571472501394033n,
        284142130773265162324564928372406588740n,
        16280493972938261907141697622959871081n,
        275270938456989854962852188188871396425n,
        145313252718541816580607959579735668507n,
        143820246249879084291810517122621962309n,
        276560065624253518817218920121545234872n,
        125072878806399272090334221739292697786n,
    ];
    let Minv = egcd(B, bia2scalar(M,B))[1];
    const expectedResult = bia2scalar(T,B) % bia2scalar(M,B);
    const result = montgomery_form(bia2scalar(mpREDC(T, R, M, Minv, B),B),R,bia2scalar(M,B));
    
    if (expectedResult !== result) {
        throw new Error(`Error: expected ${expectedResult}, got ${result}`);
    } else {
        // console.log(`${T} mod ${M} = ${result}`);
        console.log("mpREDC1 test passed");
    }

}

function test_mpREDC2() {
    const T = [1n, 2n];
    const B = 1n << 128n; 
    const R = B ** 8n;
    const M = [3n, 4n];
    let Minv = egcd(B, bia2scalar(M,B))[1];
    const expectedResult = bia2scalar(T,B) % bia2scalar(M,B);
    const result = montgomery_form(bia2scalar(mpREDC(T, R, M, Minv, B),B),R,bia2scalar(M,B));
    
    if (expectedResult !== result) {
        throw new Error(`Error: expected ${expectedResult}, got ${result}`);
    } else {
        // console.log(`${bia2scalar(T,B)} mod ${bia2scalar(M,B)} = ${result}`);
        console.log("mpREDC2 test passed");
    }

}

// test_karatsuba();
test_REDC();
test_mpREDC1();
test_mpREDC2();

console.log(shift_left([1n,2n], 2));
console.log(array_add([2n,6n,2n], [8n,3n], 10n));
console.log(array_add([8n,3n], [2n,6n,2n], 10n));
console.log(array_sub([1n,2n], [0n,4n], 10n));
console.log(array_long_mul([2n,6n,2n], [8n,3n], 10n));