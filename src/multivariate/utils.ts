// from LSB to MSB
export function to_bits(n: bigint, l: number): bigint[] {
    let bits: bigint[] = [];
    for (let i = 0; i < l; i++) {
        bits.push(n & 1n);
        n >>= 1n;
    }
    const diff = l - bits.length;
    for (let i = 0; i < diff; i++) {
        bits.push(0n);
    }
    return bits;
}
// console.log(to_bits(4n, 6));
