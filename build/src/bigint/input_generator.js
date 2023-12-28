"use strict";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
let x = new Array(8).fill(0n);
for (let i = 0; i < x.length; i++) {
    x[i] = bigintRnd(340282366920938463463374607431768211456n); // 2**128
}
console.log(x);
//# sourceMappingURL=input_generator.js.map