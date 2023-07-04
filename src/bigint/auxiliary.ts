import { t } from "../BN254/constants";

export function gcd(a: bigint, b: bigint): bigint  {
    if (a < b) {
        return gcd(b, a);
    }
    if (b === 0n) {
        return a;
    }

    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    
    return a;
}
export function egcd(a: bigint, b: bigint): bigint[] {
    if (a < b) {
        let result = egcd(b, a);
        return [result[1], result[0], result[2]];
    }

    if (b === 0n) {
        return [1n, 0n, a];
    }

    let [previous_r, r] = [a, b];
    let [previous_s, s] = [1n, 0n];
    let [previous_t, t] = [0n, 1n];

    while (r) {
        let q = previous_r / r;
        [previous_r, r] = [r, previous_r - q * r];
        [previous_s, s] = [s, previous_s - q * s];
        [previous_t, t] = [t, previous_t - q * t];
    }
    return [previous_s, previous_t, previous_r];
}
export function mod(a: bigint, b: bigint): bigint {
    return a >= 0n ? a % b : ((a % b) + b) % b;
}

export function split_at(x: bigint, n: bigint): [bigint, bigint] {
    return [x >> n, x & ((1n << n) - 1n)];
}

export function log2(x: bigint): number {
    if (x === 0n) return 0;

    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}
export function logB(x: bigint, B: bigint): number {
    if (x === 0n) return 0;

    let r = 0;
    while (x > 1n) {
        x = x / B;
        r += 1;
    }
    return r;
}

// assumes x is well-formed
export function bia2scalar(x: bigint[], B: bigint): bigint {
    let result = 0n;
    for (let i = x.length - 1; i >= 0; i--) {
        result = result * B + x[i];
    }
    return result;
}

// Array operations: I assume little-endian representation of numbers in some base B.

/**
 * 
 * @param a 
 * @param b 
 * @returns 1 if a > b, -1 if a < b, 0 if a == b.
 */
function compare(a: bigint[], b: bigint[]): number {
    const alen = a.length;
    const blen = b.length;
    if (alen !== blen) {
        return alen >= blen ? 1 : -1;
    }
    for (let i = alen - 1; i >= 0; i--) {
        if (a[i] !== b[i]) {
            return a[i] > b[i] ? 1 : -1;
        }
    }
    return 0;
}

function trim(a: bigint[]): void {
    let i = a.length - 1;
    while (a[--i] === 0n);
    a.length = i + 1;
}

export function shift_left(a: bigint[], n: number): bigint[] {
    let result: bigint[] = [];
    while (n-- > 0) {
        result.push(0n);
    }
    return result.concat(a);
}

// Assumes a.length >= b.length
function _array_add(a: bigint[], b: bigint[], B: bigint): bigint[] {
    const alen = a.length;
    const blen = b.length;
    let result = new Array<bigint>(alen);
    let sum = 0n;
    let carry = 0n;
    for (let i = 0; i < blen; i++) {
        sum = a[i] + b[i] + carry;
        carry = sum >= B ? 1n : 0n;
        result[i] = sum - carry * B;
    }
    for (let i = blen; i < alen; i++) {
        sum = a[i] + carry;
        carry = sum == B ? 1n : 0n; // the past carry is at most 1n
        result[i] = sum - carry * B;
    }

    if (carry === 1n) {
        result.push(carry);
    }
    return result;
}
export function array_add(a: bigint[], b: bigint[], B: bigint): bigint[] {
    if (a.length < b.length) {
        return _array_add(b, a, B);
    }
    return _array_add(a, b, B);
}

// Assumes a >= b
function _array_sub(a: bigint[], b: bigint[], B: bigint): bigint[] {
    const alen = a.length;
    const blen = b.length;
    let result = new Array<bigint>(alen);
    let diff = 0n;
    let carry = 0n;
    let i = 0;
    for (i = 0; i < blen; i++) {
        diff = a[i] - b[i] - carry;
        carry = diff < 0n ? 1n : 0n;
        result[i] = diff + carry * B;
    }
    for (i = blen; i < alen; i++) {
        diff = a[i] - carry;
        if (diff < 0n) {
            diff += B;
        } else {
            result[i++] = diff;
            break;
        }
        result[i] = diff;
    }
    for (; i < alen; i++) {
        result[i] = a[i];
    }
    trim(result);
    return result;
}
export function array_sub(a: bigint[], b: bigint[], B: bigint): bigint[] {
    let result: bigint[];
    if (compare(a, b) >= 0) {
        result = _array_sub(a, b, B);
    } else {
        result = _array_sub(b, a, B);
        result[result.length - 1] = -result[result.length - 1];
    }

    return result;
}

export function array_long_mul(a: bigint[], b: bigint[], B: bigint): bigint[] {
    const alen = a.length;
    const blen = b.length;
    const len = alen + blen;
    const result = new Array<bigint>(len).fill(0n);
    let product: bigint;
    let carry: bigint;
    let ai: bigint;
    let bj: bigint;
    for (let i = 0; i < alen; i++) {
        ai = a[i];
        for (let j = 0; j < blen; j++) {
            bj = b[j];
            product = ai * bj + result[i + j];
            carry = product / B;
            result[i + j] = product - carry * B;
            result[i + j + 1] += carry;
        }
    }
    trim(result);
    return result;
}
export function array_short_mul(a: bigint[], b: bigint, B: bigint): bigint[] {
    const alen = a.length;
    const len = alen;
    const result = new Array<bigint>(len).fill(0n);
    let product: bigint;
    let carry = 0n;
    let i;
    for (i = 0; i < alen; i++) {
        product = a[i] * b + carry;
        carry = product / B;
        result[i] = product - carry * B;
    }
    while (carry > 0n) {
        result[i++] = carry % B
        carry /= B;
    }
    trim(result);
    return result;
}

// This one is very tricky, found https://github.com/peterolson/BigInteger.js/blob/e5d2154d3c417069c51e7116bafc3b91d0b9fe41/BigInteger.js#L495C99-L495C132
export function divMod2(a: bigint[], b: bigint[], B: bigint): bigint[][] {
    let a_l = a.length
    const b_l = b.length
    const base = B
    let result: bigint[] = []
    let part: bigint[] = []
    let aguess, guess, xlen, highx, highy, check;
    while (a_l) {
        part.unshift(a[--a_l]);
        trim(part);
        if (compare(part, b) < 0n) {
            result.push(0n);
            continue;
        }
        xlen = part.length;
        highx = part[xlen - 1] * base + part[xlen - 2];
        highy = b[b_l - 1] * base + b[b_l - 2];
        if (xlen > b_l) {
            highx = (highx + 1n) * base;
        }
        console.log(highx, highy);
        guess = highx / highy;
        do {
            check = array_short_mul(b, guess, base);
            if (compare(check, part) <= 0) break;
            guess--;
        } while (guess);
        result.push(guess);
        part = array_sub(part, check, base);
    }
    result.reverse();
    return [result, part];
}

export function array_long_div(a: bigint[], b: bigint[], B: bigint): bigint[][] {
    let a_l = a.length
    const b_l = b.length
    const base = B
    let quotient: bigint[] = []
    let remainder: bigint[] = []
    let an: bigint[] = []
    while (compare(an, b) < 0n) {
        an.unshift(a[--a_l]);
    }

    let test: bigint[];
    let qn: bigint;
    while (a_l >= 0) {
        const bm = b[b_l-1];
        const n = an.length;
        let aguess = [an[n-1]]
        if (aguess[0] < bm) {
            aguess.unshift(an[n-2]);
        }

        if (an[n-1] < bm) {
            qn = array_short_div(aguess, bm, base)[0][0]; // this is always a single digit
        } else if (an[n-1] === bm) {
            if (n > b_l) {
                qn = base - 1n;
            } else {
                qn = 1n;
            }
        } else {
            qn = 1n;
        }

        test = array_short_mul(b, qn, base);
        while (compare(test, an) > 0) { // maximum 2 iterations
            qn--;
            test = array_sub(test, b, base);
        }

        quotient.unshift(qn);
        remainder = an = array_sub(an, test, base);
        an.unshift(a[--a_l]);
    }
    return [quotient, remainder];
}

export function array_short_div(a: bigint[], b: bigint, B: bigint): [bigint[], bigint] {
    let a_l = a.length
    const base = B
    let quotient: bigint[] = []
    let remainder: bigint = 0n;
    let divisor,q;

    for (let i = a_l - 1; i >= 0; i--) {
        divisor = remainder * base + a[i];
        q = divisor / b;
        remainder = divisor - q * b;
        quotient.unshift(q);
    }

    return [quotient, remainder];
}

const a = (1n << 256n) - 1n;
// const result = array_short_mul([a, a, a], a, 1n << 256n)
const result = array_long_div([6n, 5n, 1n, 7n, 2n], [2n, 7n], 10n)
// const result = array_short_div([4n, 3n, 2n, 2n], 7n, 10n)
console.log(result);