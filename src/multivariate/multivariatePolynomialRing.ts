import { PrimeField } from "../primeField";

export class ArrayMap extends Map<number[], bigint> {
    get(key: number[]): bigint | undefined {
        for (const [existingKey, value] of this.entries()) {
            if (eq(existingKey, key)) {
                return value;
            }
        }
        return undefined;
    }

    set(key: number[], value: bigint): this {
        for (const [existingKey] of this.entries()) {
            if (eq(existingKey, key)) {
                super.set(existingKey, value);
                return this;
            }
        }
        super.set(key, value);
        return this;
    }

    //   delete(key: number[]): boolean {
    //     for (const [existingKey] of this.entries()) {
    //       if (eq(existingKey, key)) {
    //         return super.delete(existingKey);
    //       }
    //     }
    //     return false;
    //   }

    has(key: number[]): boolean {
        for (const existingKey of this.keys()) {
            if (eq(existingKey, key)) {
                return true;
            }
        }
        return false;
    }

    [Symbol.iterator](): IterableIterator<[number[], bigint]> {
        const entries = Array.from(super.entries());
        const self = this;
        let index = 0;

        return {
            next(): IteratorResult<[number[], bigint]> {
                if (index < entries.length) {
                    const [key, value] = entries[index++];
                    return { value: [key, value], done: false };
                }
                return { value: undefined, done: true };
            },

            [Symbol.iterator](): IterableIterator<[number[], bigint]> {
                return this;
            },
        };
    }
}

/*
    A multivariate polynomial p(X1,...,Xn) = ∑ (aᵢ·X₁^i₁·X₂^i₂·...·Xₙ^iₙ) is represented
    by the dictionary {[i₁,i₂,...,iₙ] : aᵢ}.
    For now, assume that any aᵢ can be zero and that any index array [i₁,i₂,...,iₙ] can be zero in full.
    Also assume that the variables are ordered in some way, but this ordering is fixed once decided.
 */
export class MultivariatePolynomialRing {
    readonly Fp: PrimeField;

    // Constructor
    constructor(p: bigint) {
        // The prime field over which the polynomials are defined
        this.Fp = new PrimeField(p);
    }

    // Public Accessors
    get zero(): ArrayMap {
        return new ArrayMap([[[], 0n]]);
    }

    get one(): ArrayMap {
        return new ArrayMap([[[], 1n]]);
    }

    // Pretty formatting
    toString(a: ArrayMap, onevar: boolean = false): string {
        const terms: string[] = [];
        for (const [k, v] of a.entries()) {
            if (this.Fp.eq(v, 0n)) {
                continue;
            } else if (this.Fp.eq(v, 1n)) {
                if (k.length === 0 || k.every((x) => x === 0)) {
                    terms.push(`${v}`);
                } else {
                    terms.push(`${this.formatKey(k, onevar)}`);
                }
            } else {
                if (k.length === 0 || k.every((x) => x === 0)) {
                    terms.push(`${v}`);
                } else {
                    terms.push(`${v}·${this.formatKey(k, onevar)}`);
                }
            }
        }
        return terms.join(" + ");
    }

    private formatKey(key: number[], onevar: boolean = false): string {
        const variables: string[] = [];
        for (let i = 0; i < key.length; i++) {
            if (key[i] === 0) {
                continue;
            } else if (key[i] === 1) {
                if (onevar) {
                    variables.push(`X`);
                } else {
                    variables.push(`X${i+1}`);
                }
            } else {
                if (onevar) {
                    variables.push(`X^${key[i]}`);
                } else {
                    variables.push(`X${i+1}^${key[i]}`);
                }
            }
        }
        return variables.join("·");
    }

    // Comparators
    eq(a: ArrayMap, b: ArrayMap): boolean {
        const dega = degree(a);
        const degb = degree(b);
        if (dega === degb) {
            for (const [k, v] of a) {
                if (!b.has(k) || this.Fp.neq(v, b.get(k)!)) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    }

    neq(a: ArrayMap, b: ArrayMap): boolean {
        return !this.eq(a, b);
    }

    eval(pol: ArrayMap, x: bigint[]): bigint {
        if (x.length !== count_number_of_variables(pol)) {
            throw new Error(
                "The number of variables in the polynomial and the number of values to evaluate at are different."
            );
        }

        let result = 0n;
        for (const [k, v] of pol) {
            let prod = v;
            for (let i = 0; i < k.length; i++) {
                prod = this.Fp.mul(prod, this.Fp.exp(x[i], BigInt(k[i])));
            }
            result = this.Fp.add(result, prod);
        }
        return result;
    }

    eval_symbolic(pol: ArrayMap, x: bigint[], start: number = 0): ArrayMap {
        if (x.length + start > count_number_of_variables(pol)) {
            throw new Error(
                "The number of variables in the polynomial is less than the number of values to evaluate at."
            );
        }
        // else if (x.length === count_number_of_variables(pol)) {
        //     return this.eval(pol, x);
        // }

        let result = new ArrayMap([[[], 0n]]);
        for (const [k, v] of pol) {
            let prod = v;
            for (let i = 0; i < x.length; i++) {
                prod = this.Fp.mul(
                    prod,
                    this.Fp.exp(x[i], BigInt(k[start + i]))
                );
            }
            const copyk = k.slice();
            copyk.splice(start, x.length);
            const remaining_pol = new ArrayMap([[copyk, prod]]);
            result = this.add(result, remaining_pol);
        }
        return result;
    }

    // Basic Arithmetic
    add(a: ArrayMap, b: ArrayMap): ArrayMap {
        const nvara = count_number_of_variables(a);
        const nvarb = count_number_of_variables(b);
        const nvar = nvara >= nvarb ? nvara : nvarb;
        const c = new ArrayMap();
        for (const [k, v] of a) {
            const padding = new Array<number>(nvar - k.length).fill(0);
            const exponents = k.concat(padding);
            c.set(exponents, v);
        }
        for (const [k, v] of b) {
            const padding = new Array<number>(nvar - k.length).fill(0);
            const exponents = k.concat(padding);
            if (c.has(exponents)) {
                c.set(exponents, this.Fp.add(c.get(exponents)!, v));
            } else {
                c.set(exponents, v);
            }
        }

        return c;
    }

    neg(a: ArrayMap): ArrayMap {
        const c = new ArrayMap();
        for (const [k, v] of a) {
            c.set(k, this.Fp.neg(v));
        }
        return c;
    }

    sub(a: ArrayMap, b: ArrayMap): ArrayMap {
        const nvara = count_number_of_variables(a);
        const nvarb = count_number_of_variables(b);
        const nvar = nvara >= nvarb ? nvara : nvarb;
        const c = new ArrayMap();
        for (const [k, v] of a) {
            const padding = new Array<number>(nvar - k.length).fill(0);
            const exponents = k.concat(padding);
            c.set(exponents, v);
        }
        for (const [k, v] of b) {
            const padding = new Array<number>(nvar - k.length).fill(0);
            const exponents = k.concat(padding);
            if (c.has(exponents)) {
                c.set(exponents, this.Fp.sub(c.get(exponents)!, v));
            } else {
                c.set(exponents, v);
            }
        }

        return c;
    }

    mul(a: ArrayMap, b: ArrayMap): ArrayMap {
        const nvara = count_number_of_variables(a);
        const nvarb = count_number_of_variables(b);
        const nvar = nvara >= nvarb ? nvara : nvarb;
        const dega = degree(a);
        const degb = degree(b);
        if (dega === 0) {
            if (degb === 0) {
                return new ArrayMap([
                    [[], this.Fp.mul(a.get([])!, b.get([])!)],
                ]);
            } else {
                const c = new ArrayMap();
                for (const [k, v] of b) {
                    c.set(k, this.Fp.mul(a.get([])!, v));
                }
                return c;
            }
        } else if (degb === 0) {
            const c = new ArrayMap();
            for (const [k, v] of a) {
                c.set(k, this.Fp.mul(v, b.get([])!));
            }
            return c;
        } else {
            const c = new ArrayMap();
            for (const [k1, v1] of a) {
                for (const [k2, v2] of b) {
                    const exponent = new Array<number>(nvar).fill(0);
                    for (let i = 0; i < k1.length; i++) {
                        exponent[i] += k1[i];
                    }
                    for (let i = 0; i < k2.length; i++) {
                        exponent[i] += k2[i];
                    }
                    if (c.has(exponent)) {
                        c.set(
                            exponent,
                            this.Fp.add(c.get(exponent)!, this.Fp.mul(v1, v2))
                        );
                    } else {
                        c.set(exponent, this.Fp.mul(v1, v2));
                    }
                }
            }
            return c;
        }
    }

    // TODO
    // exp(base: ArrayMap, exponent: bigint): ArrayMap {
    //     // edge cases
    //     if (this.eq(base, this.zero)) {
    //         if (exponent === 0n) {
    //             throw new Error("0^0 is undefined");
    //         }
    //         return this.zero;
    //     }

    //     return squareAndMultiply(base, exponent, this);
    // }
}

const p = 67n;
const MPR = new MultivariatePolynomialRing(p);
const pol1 = new ArrayMap();
pol1.set([1, 2], 1n);
pol1.set([2, 1, 4], 15n);
pol1.set([13], 3n);
pol1.set([2, 1, 4, 10], 7n);

const pol2 = new ArrayMap();
pol2.set([2, 1, 4, 10, 4], 7n);
pol2.set([13, 4], 3n);
pol2.set([1, 2], 3n);

// console.log(MPR.add(pol1, pol2));
// console.log(MPR.sub(pol1, pol2));
// console.log(MPR.neg(pol1));
// console.log(degree(pol1));
// console.log(degree(pol2));

const pol3 = new ArrayMap();
pol3.set([1, 2, 0], 1n);
pol3.set([2, 4, 1], 3n);
pol3.set([0, 4, 1], 3n);
// pol3.set([13], 3n);
// pol3.set([2, 1, 4, 10], 7n);
// console.log(MPR.eval(pol3, [3n,1n,2n]));
// console.log(MPR.eval_symbolic(pol3, [2n], 2));
// console.log(degree_j(pol3,1));

const pol4 = new ArrayMap();
// pol4.set([1, 2], 1n);
// pol4.set([2, 1, 4], 15n);
// pol4.set([3], 2n);
// pol4.set([13], 3n);
// pol4.set([2], 2n);
pol4.set([0], 2n);
// console.log(MPR.mul(pol3, pol4));
// console.log(degree(pol4));

function eq(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

export function count_number_of_variables(p: ArrayMap): number {
    let result = 0;
    for (const [k] of p) {
        k.length > result ? (result = k.length) : result;
    }

    return result;
}

export function degree(a: ArrayMap): number {
    if (count_number_of_variables(a) === 0) {
        return 0;
    }

    let d = 0;
    for (const [k] of a) {
        const sum = k.reduce((a, b) => a + b);
        sum > d ? (d = sum) : d;
    }

    return d;
}

export function degree_j(a: ArrayMap, j: number): number {
    const nvars = count_number_of_variables(a);
    if (j < 0) {
        throw new Error(`j must be positive`);
    } else if (j > nvars) {
        throw new Error(`j must be less than or equal to ${nvars}`);
    }

    if (nvars === 0) {
        return 0;
    }

    let d = 0;
    for (const [k] of a) {
        k[j - 1] > d ? (d = k[j - 1]) : d;
    }

    return d;
}

// function squareAndMultiply(
//     base: ArrayMap,
//     exponent: bigint,
//     Fp: PrimeField
// ): bigint[] {
//     let result = base.slice();
//     let binary = exponent.toString(2);
//     for (let i = 1; i < binary.length; i++) {
//         result = Fq.mul(result, result);
//         if (binary[i] === "1") {
//             result = Fq.mul(result, base);
//         }
//     }
//     return result;
// }
