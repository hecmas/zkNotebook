"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array_short_div = exports.array_long_div = exports.divMod2 = exports.array_short_mul = exports.array_long_mul = exports.array_sub = exports.array_add = exports.shift_left = exports.trim = exports.compare = exports.bia2scalar = exports.logB = exports.log2 = exports.split_at = exports.mod = exports.egcd = exports.gcd = void 0;
function gcd(a, b) {
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
exports.gcd = gcd;
function egcd(a, b) {
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
exports.egcd = egcd;
function mod(a, b) {
    return a >= 0n ? a % b : ((a % b) + b) % b;
}
exports.mod = mod;
function split_at(x, n) {
    return [x >> n, x & ((1n << n) - 1n)];
}
exports.split_at = split_at;
function log2(x) {
    if (x === 0n)
        return 0;
    let r = 1;
    while (x > 1n) {
        x = x >> 1n;
        r += 1;
    }
    return r;
}
exports.log2 = log2;
function logB(x, B) {
    if (x === 0n)
        return 0;
    let r = 0;
    while (x > 1n) {
        x = x / B;
        r += 1;
    }
    return r;
}
exports.logB = logB;
// assumes x is well-formed
function bia2scalar(x, B) {
    let result = 0n;
    for (let i = x.length - 1; i >= 0; i--) {
        result = result * B + x[i];
    }
    return result;
}
exports.bia2scalar = bia2scalar;
// Array operations: I assume little-endian representation of numbers in some base B.
/**
 *
 * @param a
 * @param b
 * @returns 1 if a > b, -1 if a < b, 0 if a == b.
 */
function compare(a, b) {
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
exports.compare = compare;
function isZero(a) {
    return (a.length === 1) && (a[0] === 0n);
}
function isOdd(a) {
    return (a[0] & 1n) === 1n;
}
function Hamming_weight(x) {
    let result = 0;
    for (let i = 0; i < x.length; i++) {
        let y = x[i];
        while (y) {
            result += Number(y & 1n);
            y = y >> 1n;
        }
    }
    return result;
}
// it sets a.length = 0 if a = [0n]
function trim(a) {
    let i = a.length;
    if (i === 1)
        return;
    while (a[--i] === 0n)
        ;
    a.length = i + 1;
}
exports.trim = trim;
function shift_left(a, n) {
    let result = [];
    while (n-- > 0) {
        result.push(0n);
    }
    return result.concat(a);
}
exports.shift_left = shift_left;
// Assumes a.length >= b.length
function _array_add(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    let result = new Array(alen);
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
function array_add(a, b, B) {
    if (a.length < b.length) {
        return _array_add(b, a, B);
    }
    return _array_add(a, b, B);
}
exports.array_add = array_add;
function array_add_small(a, b, B) {
    const alen = a.length;
    let result = new Array(alen);
    let sum = 0n;
    let i;
    for (i = 0; i < alen; i++) {
        sum = a[i] - B + b;
        b = sum / B;
        result[i] = sum - b * B;
        b += 1n;
    }
    while (b > 0) {
        result[i++] = b % B;
        b = b / B;
    }
    return result;
}
// Assumes a >= b
function _array_sub(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    let result = new Array(alen);
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
        }
        else {
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
function array_sub(a, b, B) {
    let result;
    if (compare(a, b) >= 0) {
        result = _array_sub(a, b, B);
    }
    else {
        result = _array_sub(b, a, B);
        result[result.length - 1] = -result[result.length - 1];
    }
    if (result.length === 0) {
        result.push(0n);
    }
    return result;
}
exports.array_sub = array_sub;
function array_long_mul(a, b, B) {
    const alen = a.length;
    const blen = b.length;
    const len = alen + blen;
    const result = new Array(len).fill(0n);
    let product;
    let carry;
    let ai;
    let bj;
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
exports.array_long_mul = array_long_mul;
function array_short_mul(a, b, B) {
    const alen = a.length;
    const len = alen;
    const result = new Array(len).fill(0n);
    let product;
    let carry = 0n;
    let i;
    for (i = 0; i < alen; i++) {
        product = a[i] * b + carry;
        carry = product / B;
        result[i] = product - carry * B;
    }
    if (carry > 0n) {
        result.push(carry);
    }
    // while (carry > 0n) {
    //     result[i++] = carry % B
    //     carry /= B;
    // }
    trim(result);
    return result;
}
exports.array_short_mul = array_short_mul;
function array_square(a, B) {
    let len = a.length;
    let result = new Array(len).fill(0n);
    let product;
    let carry;
    let a_i;
    let a_j;
    for (let i = 0; i < len; i++) {
        a_i = a[i];
        carry = 0n - a_i * a_i;
        for (var j = i; j < len; j++) {
            a_j = a[j];
            product = 2n * (a_i * a_j) + result[i + j] + carry;
            carry = product / B;
            result[i + j] = product - carry * B;
        }
        result[i + len] = carry;
    }
    trim(result);
    return result;
}
// TODO: Do the comparsion between the three long division algorithms
// Found https://github.com/peterolson/BigInteger.js/blob/e5d2154d3c417069c51e7116bafc3b91d0b9fe41/BigInteger.js#L437
function divMod1(a, b, B) {
    const a_l = a.length;
    const b_l = b.length;
    const base = B;
    let result = new Array(b_l).fill(0n);
    let divisorMostSignificantDigit = b[b_l - 1];
    // normalization
    let lambda = base / (2n * divisorMostSignificantDigit);
    let remainder = array_short_mul(a, lambda, base);
    let divisor = array_short_mul(b, lambda, base);
    let quotientDigit;
    let shift;
    let carry;
    let borrow;
    let i;
    let l;
    let q;
    if (remainder.length <= a_l)
        remainder.push(0n);
    divisor.push(0n);
    divisorMostSignificantDigit = divisor[b_l - 1];
    for (shift = a_l - b_l; shift >= 0; shift--) {
        quotientDigit = base - 1n;
        if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
            quotientDigit = (remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit;
        }
        // quotientDigit <= base - 1
        carry = 0n;
        borrow = 0n;
        l = divisor.length;
        for (i = 0; i < l; i++) {
            carry += quotientDigit * divisor[i];
            q = carry / base;
            borrow += remainder[shift + i] - (carry - q * base);
            carry = q;
            if (borrow < 0) {
                remainder[shift + i] = borrow + base;
                borrow = -1n;
            }
            else {
                remainder[shift + i] = borrow;
                borrow = 0n;
            }
        }
        while (borrow !== 0n) {
            quotientDigit -= 1n;
            carry = 0n;
            for (i = 0; i < l; i++) {
                carry += remainder[shift + i] - base + divisor[i];
                if (carry < 0) {
                    remainder[shift + i] = carry + base;
                    carry = 0n;
                }
                else {
                    remainder[shift + i] = carry;
                    carry = 1n;
                }
            }
            borrow += carry;
        }
        result[shift] = quotientDigit;
    }
    // denormalization
    remainder = array_short_div(remainder, lambda, base)[0];
    return [result, remainder];
}
// This one is very tricky, found https://github.com/peterolson/BigInteger.js/blob/e5d2154d3c417069c51e7116bafc3b91d0b9fe41/BigInteger.js#L495
function divMod2(a, b, B) {
    let a_l = a.length;
    const b_l = b.length;
    const base = B;
    let result = [];
    let part = [];
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
        guess = highx / highy;
        do {
            check = array_short_mul(b, guess, base);
            if (compare(check, part) <= 0)
                break;
            guess--;
        } while (guess);
        result.push(guess);
        part = array_sub(part, check, base);
    }
    result.reverse();
    return [result, part];
}
exports.divMod2 = divMod2;
function normalize(a, b, B) {
    let bm = b[b.length - 1];
    let shift = 1n; // shift cannot be larger than log2(B) - 1
    while (bm < B / 2n) {
        b = array_short_mul(b, 2n, B); // left-shift b by 2
        bm = b[b.length - 1];
        shift *= 2n;
    }
    a = array_short_mul(a, shift, B); // left-shift a by 2^shift
    return [a, b, shift];
}
function array_long_div(a, b, B) {
    if (isZero(a)) {
        return [[0n], [0n]];
    }
    if (isZero(b)) {
        throw new Error("Division by zero");
    }
    let comparison = compare(a, b);
    if (comparison === 0) {
        return [[1n], [0n]];
    }
    else if (comparison === -1) {
        return [[0n], a];
    }
    let shift;
    [a, b, shift] = normalize(a, b, B);
    let a_l = a.length;
    const b_l = b.length;
    const base = B;
    let quotient = [];
    let remainder = [];
    let an = [];
    while (compare(an, b) === -1) {
        an.unshift(a[--a_l]);
    }
    const bm = b[b_l - 1];
    let test, aguess;
    let qn, n;
    while (a_l >= 0) {
        n = an.length;
        if (an[n - 1] < bm) {
            aguess = [an[n - 2], an[n - 1]];
        }
        else {
            aguess = [an[n - 1]];
        }
        if (an[n - 1] < bm) {
            qn = array_short_div(aguess, bm, base)[0][0]; // this is always a single digit
        }
        else if (an[n - 1] === bm) {
            if (b_l < n) {
                qn = base - 1n;
            }
            else {
                qn = 1n;
            }
        }
        else {
            qn = 1n;
        }
        test = array_short_mul(b, qn, base);
        while (compare(test, an) === 1) { // maximum 2 iterations
            qn--;
            test = array_sub(test, b, base);
        }
        quotient.unshift(qn);
        remainder = array_sub(an, test, base);
        an = remainder;
        if (a_l === 0)
            break;
        an.unshift(a[--a_l]);
    }
    remainder = array_short_div(remainder, shift, base)[0];
    trim(quotient);
    trim(remainder);
    return [quotient, remainder];
}
exports.array_long_div = array_long_div;
function array_short_div(a, b, B) {
    let a_l = a.length;
    const base = B;
    let quotient = [];
    let remainder = 0n;
    let dividendi;
    let qi;
    for (let i = a_l - 1; i >= 0; i--) {
        dividendi = remainder * base + a[i];
        qi = dividendi / b;
        remainder = dividendi - qi * b;
        quotient[i] = qi;
    }
    trim(quotient);
    return [quotient, remainder];
}
exports.array_short_div = array_short_div;
function check_array_div(a, b, B) {
    const [q1, r1] = array_long_div(a, b, B);
    const [q2, r2] = divMod1(a, b, B);
    if (compare(q1, q2) !== 0 || compare(r1, r2) !== 0) {
        console.log(`Array long div: quotient: [${q1}], remainder: [${r1}]`);
        console.log(`quotient: [${q2}], remainder: [${r2}]`);
        return false;
    }
    console.log(`quotient: [${q1}]\n\nremainder: [${r1}]`);
    if (compare(array_add(array_long_mul(q1, b, B), r1, B), a) !== 0) {
        return false;
    }
    return true;
}
function array_mod_pow(b, exp, mod, B) {
    if (isZero(mod))
        throw new Error("Cannot take modPow with modulus 0");
    let r = [1n];
    let base = array_long_div(b, mod, B)[1];
    while (!isZero(exp)) {
        if (isZero(base))
            return [0n];
        if (isOdd(exp)) {
            r = array_long_div(array_long_mul(r, base, B), mod, B)[1];
        }
        exp = array_short_div(exp, 2n, B)[0]; // this can be optimized
        base = array_long_div(array_square(base, B), mod, B)[1];
    }
    return r;
}
;
const a = (1n << 256n) - 1n;
// console.log(check_array_div([a, 7n, a, 12n, a, 20n, a, 80n], [a, a, a, a, 100n], 1n << 256n));
// console.log(array_mod_pow([2n, 1n, 1n, 1n], [3n, 5n], [4n, 6n, 7n], 1n << 256n));
// console.log(array_mod_pow([100n, 2831023n, 0n, 73916234139162n], [115792089237316195423570985008687907853269984665640564039457584007913129639935n], [0n, 0n, 8238129386n, 23102318237n], 1n << 256n));
// console.log(array_mod_pow([100n, 2831023n, 0n, 73916234139162n, 100n, 2831023n, 0n, 73916234139162n,100n, 2831023n, 0n, 73916234139162n], [903741926349715234612309461283471234n], [0n, 0n, 8238129386n, 23102318237n, 1892397612351n, 7246598123051n, 8238129386n, 1264591241237897123126n], 1n << 256n));
//# sourceMappingURL=auxiliary.js.map