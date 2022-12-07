"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const primeFields_1 = require("../src/primeFields");
let Fp;
describe("Prime Fields", () => {
    describe("Basic Arithmetic", () => {
        describe("add()", () => {
            [
                {
                    p: 3n,
                    tests: [
                        [1n, 1n, 2n],
                        [2n, 2n, 1n],
                        [5n, 5n, 1n],
                        [5n, 6n, 2n],
                        [3n, 0n, 0n],
                        [9n, 9n, 0n],
                    ],
                },
                {
                    p: 11n,
                    tests: [
                        [1n, 1n, 2n],
                        [2n, 2n, 4n],
                        [5n, 4n, 9n],
                        [5n, 5n, 10n],
                        [5n, 6n, 0n],
                        [10n, 0n, 10n],
                        [11n, 11n, 0n],
                        [10n, 1n, 0n],
                    ],
                },
                {
                    p: 101n,
                    tests: [
                        [1n, 1n, 2n],
                        [2n, 2n, 4n],
                        [5n, 5n, 10n],
                        [50n, 23n, 73n],
                        [50n, 50n, 100n],
                        [50n, 60n, 9n],
                        [100n, 100n, 99n],
                    ],
                },
            ].forEach(({ p, tests }) => {
                describe(`p = ${p}n`, () => {
                    beforeEach(() => {
                        Fp = new primeFields_1.PrimeField(p);
                    });
                    tests.forEach(([a, b, result]) => {
                        it(`add(${a}n, ${b}n) = ${result}n`, () => {
                            (0, chai_1.expect)(Fp.add(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });
        describe("sub()", () => {
            [
                {
                    p: 3n,
                    tests: [
                        [1n, 1n, 0n],
                        [2n, 1n, 1n],
                        [5n, 1n, 1n],
                        [5n, 6n, 2n],
                        [3n, 0n, 0n],
                        [9n, 0n, 0n],
                        [0n, 1n, 2n],
                        [0n, 2n, 1n],
                        [1n, 2n, 2n],
                    ],
                },
                {
                    p: 11n,
                    tests: [
                        [1n, 1n, 0n],
                        [5n, 2n, 3n],
                        [5n, 4n, 1n],
                        [5n, 5n, 0n],
                        [5n, 6n, 10n],
                        [10n, 0n, 10n],
                        [10n, 10n, 0n],
                    ],
                },
                {
                    p: 101n,
                    tests: [
                        [1n, 1n, 0n],
                        [5n, 2n, 3n],
                        [5n, 4n, 1n],
                        [5n, 5n, 0n],
                        [50n, 60n, 91n],
                        [100n, 0n, 100n],
                        [100n, 100n, 0n],
                    ],
                },
            ].forEach(({ p, tests }) => {
                describe(`p = ${p}n`, () => {
                    beforeEach(() => {
                        Fp = new primeFields_1.PrimeField(p);
                    });
                    tests.forEach(([a, b, result]) => {
                        it(`sub(${a}n, ${b}n) = ${result}n`, () => {
                            (0, chai_1.expect)(Fp.sub(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });
        describe("mul()", () => {
            [
                {
                    p: 11n,
                    tests: [
                        [1n, 1n, 1n],
                        [2n, 2n, 4n],
                        [5n, 4n, 9n],
                        [5n, 5n, 3n],
                        [5n, 6n, 8n],
                        [10n, 0n, 0n],
                        [10n, 10n, 1n],
                    ],
                },
                {
                    p: 101n,
                    tests: [
                        [1n, 1n, 1n],
                        [2n, 2n, 4n],
                        [5n, 4n, 20n],
                        [5n, 5n, 25n],
                        [5n, 6n, 30n],
                        [10n, 0n, 0n],
                        [10n, 10n, 100n],
                        [20n, 50n, 91n],
                    ],
                },
            ].forEach(({ p, tests }) => {
                describe(`p = ${p}n`, () => {
                    beforeEach(() => {
                        Fp = new primeFields_1.PrimeField(p);
                    });
                    tests.forEach(([a, b, result]) => {
                        it(`mul(${a}n, ${b}n) = ${result}n`, () => {
                            (0, chai_1.expect)(Fp.mul(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });
        describe("inv()", () => {
            [
                {
                    p: 11n,
                    tests: [1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n, 10n, 21n],
                },
                {
                    p: 101n,
                    tests: [5n, 20n, 50n, 99n, 100n, 150n],
                },
            ].forEach(({ p, tests }) => {
                describe(`p = ${p}n`, () => {
                    beforeEach(() => {
                        Fp = new primeFields_1.PrimeField(p);
                    });
                    tests.forEach((num) => {
                        it(`Should calculate the inverse of ${num}n`, () => {
                            const inverse = Fp.inv(num);
                            (0, chai_1.expect)(Fp.mul(num, inverse)).to.equal(1n);
                        });
                    });
                });
            });
        });
        describe("div()", () => {
            [
                {
                    p: 11n,
                    tests: [
                        [1n, 1n, 1n],
                        [2n, 1n, 2n],
                        [6n, 1n, 6n],
                        [10n, 1n, 10n],
                        [11n, 1n, 0n],
                        [1n, 2n, 6n],
                        [2n, 2n, 1n],
                        [3n, 2n, 7n],
                        [4n, 2n, 2n],
                        [1n, 3n, 4n],
                        [2n, 3n, 8n],
                        [3n, 3n, 1n],
                        [4n, 3n, 5n],
                        [5n, 3n, 9n],
                        [6n, 3n, 2n],
                        [7n, 3n, 6n],
                        [4n, 6n, 8n],
                        [5n, 6n, 10n],
                        [1n, 100n, 1n],
                        [2n, 100n, 2n],
                        [7n, 100n, 7n],
                        [100n, 100n, 1n], // * 1n
                    ],
                },
                {
                    p: 101n,
                    tests: [
                        [1n, 1n, 1n],
                        [5n, 1n, 5n],
                        [100n, 1n, 100n],
                        [101n, 1n, 0n],
                        [1n, 2n, 51n],
                        [2n, 2n, 1n],
                        [3n, 2n, 52n],
                        [5n, 2n, 53n],
                        [1n, 4n, 76n],
                        [2n, 4n, 51n],
                        [3n, 4n, 26n],
                        [4n, 4n, 1n],
                        [20n, 4n, 5n],
                        [1n, 5n, 81n],
                        [2n, 5n, 61n],
                        [20n, 5n, 4n],
                        [25n, 5n, 5n],
                        [30n, 5n, 6n],
                        [1n, 6n, 17n],
                        [2n, 6n, 34n],
                        [3n, 6n, 51n],
                        [30n, 6n, 5n],
                        [36n, 6n, 6n],
                        [1n, 10n, 91n],
                        [2n, 10n, 81n],
                        [5n, 10n, 51n],
                        [10n, 10n, 1n],
                        [1n, 20n, 96n],
                        [2n, 20n, 91n],
                        [7n, 20n, 66n],
                        [60n, 20n, 3n],
                        [120n, 20n, 6n],
                        [1n, 30n, 64n],
                        [3n, 30n, 91n],
                        [29n, 30n, 38n],
                        [90n, 30n, 3n], // * 64n
                    ],
                },
            ].forEach(({ p, tests }) => {
                describe(`p = ${p}n`, () => {
                    beforeEach(() => {
                        Fp = new primeFields_1.PrimeField(p);
                    });
                    tests.forEach(([a, b, result]) => {
                        it(`div(${a}n, ${b}n) = ${result}n`, () => {
                            (0, chai_1.expect)(Fp.div(a, b)).to.equal(result);
                        });
                    });
                });
            });
        });
        describe("exp()", () => {
            describe("positive exponent", () => {
                [
                    {
                        p: 11n,
                        tests: [
                            [1n, 0n, 1n],
                            [2n, 0n, 1n],
                            [5n, 0n, 1n],
                            [10n, 0n, 1n],
                            [0n, 1n, 0n],
                            [0n, 2n, 0n],
                            [0n, 5n, 0n],
                            [0n, 10n, 0n],
                            [1n, 1n, 1n],
                            [2n, 1n, 2n],
                            [2n, 2n, 4n],
                            [2n, 3n, 8n],
                            [2n, 4n, 5n],
                            [3n, 1n, 3n],
                            [3n, 2n, 9n],
                            [3n, 3n, 5n],
                            [6n, 1n, 6n],
                            [6n, 2n, 3n],
                            [10n, 1n, 10n],
                        ],
                    },
                    {
                        p: 101n,
                        tests: [
                            [1n, 0n, 1n],
                            [2n, 0n, 1n],
                            [5n, 0n, 1n],
                            [10n, 0n, 1n],
                            [0n, 1n, 0n],
                            [0n, 2n, 0n],
                            [0n, 5n, 0n],
                            [0n, 10n, 0n],
                            [1n, 1n, 1n],
                            [2n, 2n, 4n],
                            [3n, 3n, 27n],
                            [4n, 4n, 54n],
                            [6n, 2n, 36n],
                            [10n, 2n, 100n],
                        ],
                    },
                ].forEach(({ p, tests }) => {
                    describe(`p = ${p}n`, () => {
                        beforeEach(() => {
                            Fp = new primeFields_1.PrimeField(p);
                        });
                        tests.forEach(([a, b, result]) => {
                            it(`exp(${a}n, ${b}n) = ${result}n`, () => {
                                (0, chai_1.expect)(Fp.exp(a, b)).to.equal(result);
                            });
                        });
                    });
                });
            });
            describe("negative exponent", () => {
                [
                    {
                        p: 11n,
                        tests: [
                            [1n, -1n, 1n],
                            [2n, -1n, 6n],
                            [2n, -2n, 3n],
                            [2n, -3n, 7n],
                            [3n, -1n, 4n],
                            [3n, -2n, 5n],
                            [3n, -3n, 9n],
                            [6n, -1n, 2n],
                            [6n, -2n, 4n],
                            [10n, -1n, 10n], // 10 ** 1
                        ],
                    },
                    {
                        p: 101n,
                        tests: [
                            [1n, -1n, 1n],
                            [2n, -2n, 76n],
                            [3n, -3n, 15n],
                            [4n, -4n, 58n],
                            [6n, -2n, 87n],
                            [10n, -2n, 100n], // 91 ** 2
                        ],
                    },
                ].forEach(({ p, tests }) => {
                    describe(`p = ${p}n`, () => {
                        beforeEach(() => {
                            Fp = new primeFields_1.PrimeField(p);
                        });
                        tests.forEach(([a, b, result]) => {
                            it(`exp(${a}n, ${b}n) = ${result}n`, () => {
                                (0, chai_1.expect)(Fp.exp(a, b)).to.equal(result);
                            });
                        });
                    });
                });
            });
        });
    });
});
//# sourceMappingURL=primeFields_spec.js.map