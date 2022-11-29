class PrimeField {
    readonly p: bigint;

    constructor(_p: bigint) {
        this.p = _p;
    }
}

console.log(new PrimeField(5n));