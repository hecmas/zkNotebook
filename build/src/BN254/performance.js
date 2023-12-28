"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parameters_1 = require("./parameters");
const constants_1 = require("./constants");
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n
const maxlen = 3; // number of experiments
const repeats = 1000; // number of repetitions of the experiment
const ninputs = 100; // number of inputs in each experiment
const input_generator = () => {
    const Fp = parameters_1.EFast.Fp;
    let X = [];
    for (let i = 0; i < ninputs; i++) {
        const Px = bigintRnd(constants_1.p);
        const Py = Fp.add(Fp.mul(Fp.mul(Px, Px), Px), 3n);
        const scal = bigintRnd(constants_1.r);
        X.push([{ x: Px, y: Py }, scal]);
    }
    return X;
};
const test = (repeats, description, action) => {
    const t1 = Date.now();
    for (let i = 0; i < repeats; ++i) {
        action(input_generator());
    }
    const t2 = Date.now();
    const dt = t2 - t1;
    const minutes = Math.floor(dt / 60000);
    const seconds = ((dt % 60000) / 1000).toFixed(3);
    console.log(`${description}: total time is ${minutes}m${seconds}s`);
};
// Performance tests:
for (let i = 1; i <= maxlen; i++) {
    console.log(`Test ${i}/${maxlen}:`);
    const w = i + 2;
    test(repeats, `\tDouble-and-add style`, (X) => {
        for (let i = 0; i < X.length; i++) {
            parameters_1.EFast.escalarMul(X[i][0], X[i][1]);
        }
    });
    test(repeats, `\twNAF method for scalar multiplication with w = ${w}`, (X) => {
        for (let i = 0; i < X.length; i++) {
            parameters_1.EFast.escalarMulwNAF(X[i][0], X[i][1], w);
        }
    });
    test(repeats, `\tGLV method with wNAF double scalar multiplication with w = ${w}`, (X) => {
        for (let i = 0; i < X.length; i++) {
            parameters_1.EFast.escalarMulGLV(X[i][0], X[i][1], w);
        }
    });
    console.log();
}
//# sourceMappingURL=performance.js.map