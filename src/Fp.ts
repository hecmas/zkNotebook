import { egcd, squareAndMultiply } from "./utils.js";
export { Field, FieldElement };

class Field {
    p: number;

    constructor(prime: number) {
        this.p = prime;
    }

    zero(): FieldElement {
        return new FieldElement(0, this);
    }

    one(): FieldElement {
        return new FieldElement(1, this);
    }

    add(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement((a.value + b.value) % this.p, this);
    }

    sub(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement((a.value - b.value) % this.p, this);
    }

    neg(a: FieldElement): FieldElement {
        return new FieldElement(-a.value % this.p, this);
    }

    // This should be improved for large integers
    mul(a: FieldElement, b: FieldElement): FieldElement {
        return new FieldElement((a.value * b.value) % this.p, this);
    }

    inv(a: FieldElement): FieldElement {
        let [x, ,] = egcd(a.value, this.p);
        return new FieldElement(x, this);
    }

    div(a: FieldElement, b: FieldElement): FieldElement {
        let [x, ,] = egcd(b.value, this.p);
        return new FieldElement((a.value * x) % this.p, this);
    }

    exp(a: FieldElement, e: FieldElement): FieldElement {
        return new FieldElement(squareAndMultiply(a.value, e.value, this.p), this);
    }
}

class FieldElement {
    value: number;
    field: Field;

    constructor(_value: number, _field: Field) {
        this.value = _value;
        this.field = _field;
    }

    add(b: FieldElement): FieldElement {
        return this.field.add(this, b);
    }

    sub(b: FieldElement): FieldElement {
        return this.field.sub(this, b);
    }

    neg(): FieldElement {
        return this.field.neg(this);
    }

    mul(b: FieldElement): FieldElement {
        return this.field.mul(this, b);
    }

    inv(): FieldElement {
        return this.field.inv(this);
    }

    div(b: FieldElement): FieldElement {
        return this.field.div(this, b);
    }

    exp(b: FieldElement): FieldElement {
        return this.field.exp(this, b);
    }

    eq(b: FieldElement): boolean {
        return this.value === b.value;
    }

    neq(b: FieldElement): boolean {
        return this.value !== b.value;
    }
}
