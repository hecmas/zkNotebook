"use strict";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
let x = new Array(8).fill(0n);
for (let i = 0; i < x.length; i++) {
    x[i] = bigintRnd(340282366920938463463374607431768211456n); // 2**128
}
console.log(x);
// For array mul
const len = 10; // chosen arbitrary
const B = 1n << 256n;
// write a two-dimensional array of random numbers
let y = new Array();
for (let i = 0; i < len; i++) {
    const element = [[bigintRnd(B), bigintRnd(B)], [bigintRnd(B), bigintRnd(B)]];
    y.push(element);
}
console.log(y);
//# sourceMappingURL=input_generator.js.map