export interface FiniteField<T> {
    readonly zero: T;
    readonly one: T;
    eq(a: T, b: T): boolean;
    neq(a: T, b: T): boolean;
    mod(a: T): T;
    add(a: T, b: T): T;
    neg(a: T): T;
    sub(a: T, b: T): T;
    mul(a: T, b: T): T;
    inv(a: T): T;
    div(a: T, b: T): T;
    exp(base: T, exponent: bigint): T;
}