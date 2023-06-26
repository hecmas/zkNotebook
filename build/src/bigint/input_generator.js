"use strict";
let x = new Array(8).fill(0);
for (let i = 0; i < x.length; i++) {
    x[i] = Math.floor(Math.random() * 0x100000000); // 2**32
}
console.log(x);
//# sourceMappingURL=input_generator.js.map