"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to_bits = void 0;
// from LSB to MSB
function to_bits(n, l) {
    let bits = [];
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
exports.to_bits = to_bits;
// console.log(to_bits(4n, 6));
//# sourceMappingURL=utils.js.map