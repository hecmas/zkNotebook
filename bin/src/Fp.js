"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FieldElement = exports.Field = void 0;
const utils_js_1 = require("./utils.js");
class Field {
    p;
    constructor(prime) {
        this.p = prime;
    }
    zero() {
        return new FieldElement(0, this);
    }
    one() {
        return new FieldElement(1, this);
    }
    add(a, b) {
        return new FieldElement((a.value + b.value) % this.p, this);
    }
    sub(a, b) {
        return new FieldElement((a.value - b.value) % this.p, this);
    }
    neg(a) {
        return new FieldElement(-a.value % this.p, this);
    }
    // This should be improved for large integers
    mul(a, b) {
        return new FieldElement((a.value * b.value) % this.p, this);
    }
    inv(a) {
        let [x, ,] = (0, utils_js_1.egcd)(a.value, this.p);
        return new FieldElement(x, this);
    }
    div(a, b) {
        let [x, ,] = (0, utils_js_1.egcd)(b.value, this.p);
        return new FieldElement((a.value * x) % this.p, this);
    }
    exp(a, e) {
        return new FieldElement((0, utils_js_1.squareAndMultiply)(a.value, e.value, this.p), this);
    }
}
exports.Field = Field;
class FieldElement {
    value;
    field;
    constructor(_value, _field) {
        this.value = _value;
        this.field = _field;
    }
    add(b) {
        return this.field.add(this, b);
    }
    sub(b) {
        return this.field.sub(this, b);
    }
    neg() {
        return this.field.neg(this);
    }
    mul(b) {
        return this.field.mul(this, b);
    }
    inv() {
        return this.field.inv(this);
    }
    div(b) {
        return this.field.div(this, b);
    }
    exp(b) {
        return this.field.exp(this, b);
    }
    eq(b) {
        return this.value === b.value;
    }
    neq(b) {
        return this.value !== b.value;
    }
}
exports.FieldElement = FieldElement;
//# sourceMappingURL=Fp.js.map