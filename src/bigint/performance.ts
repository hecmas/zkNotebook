import { array_karatsuba_mul } from "./array_arithmetic";
import { array_long_mul } from "./auxiliary";
const bigintRnd = require("bigint-rnd"); // 0 <= bigintRnd(n) < n

const maxlen = 100; // number of experiments
const repeats = 1000;  // number of repetitions of the experiment
const ninputs = 10; // number of inputs in each experiment
const B = 1n << 256n;

const input_generator = (len: number) => {
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

const test = (repeats: number, inlen: number, description: string, action: (X: any) => void): void => {
    const X = input_generator(inlen);

    const t1 = Date.now();
    for (let i = 0; i < repeats; ++i) {
        action(X);
    }
    const t2 = Date.now();
    const dt = t2 - t1;
    console.log(`${description}: total time is ${dt} ms`);
};

// Performance tests:

for (let i = 1; i <= maxlen; i++) {
    test(repeats, i, `Schoolbook multiplication with inputs of len ${i}`, (X): void => {
        for (let i = 0; i < X.length; i++) {
            array_long_mul(X[i][0], X[i][1], B);
        }
    });

    test(repeats, i, `Karatsuba multiplication with inputs of len ${i}`, (X): void => {
        for (let i = 0; i < X.length; i++) {
            array_karatsuba_mul(X[i][0], X[i][1], B);
        }
    });
}


