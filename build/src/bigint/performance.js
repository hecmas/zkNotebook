"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_arithmetic_1 = require("./array_arithmetic");
const auxiliary_1 = require("./auxiliary");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
const maxlen = 100; // number of experiments
const repeats = 1000; // number of repetitions of the experiment
const ninputs = 10; // number of inputs in each experiment
const B = 1n << 256n;
const input_generator = (len) => {
    let X = [];
    for (let i = 0; i < ninputs; i++) {
        let element = [];
        for (let j = 0; j < 2; j++) {
            let element_k = [];
            for (let k = 0; k < len; k++) {
                element_k.push(bigintRnd(B));
            }
            element.push(element_k);
        }
        X.push(element);
    }
    return X;
};
const test = (repeats, inlen, description, action) => {
    const X = input_generator(inlen);
    const t1 = Date.now();
    for (let i = 0; i < repeats; ++i) {
        action(X);
    }
    const t2 = Date.now();
    const dt = t2 - t1;
    const minutes = Math.floor(dt / 60000);
    const seconds = ((dt % 60000) / 1000).toFixed(3);
    console.log(`${description}: total time is ${minutes}m${seconds}s`);
};
// Performance tests:
for (let i = 1; i <= maxlen; i++) {
    test(repeats, i, `Schoolbook multiplication with inputs of len ${i}`, (X) => {
        for (let i = 0; i < X.length; i++) {
            (0, auxiliary_1.array_long_mul)(X[i][0], X[i][1], B);
        }
    });
    test(repeats, i, `Karatsuba multiplication with inputs of len ${i}`, (X) => {
        for (let i = 0; i < X.length; i++) {
            (0, array_arithmetic_1.array_karatsuba_mul)(X[i][0], X[i][1], B);
        }
    });
}
//# sourceMappingURL=performance.js.map