import { egcd } from "./tools.js";

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

    add(a: number, b: number): FieldElement {
        return new FieldElement((a + b) % this.p, this);
    }

    sub(a: number, b: number): FieldElement {
        return new FieldElement((a - b) % this.p, this);
    }

    neg(a: number): FieldElement {
        return new FieldElement(-a % this.p, this);
    }

    // This should be improved for large integers
    mul(a: number, b: number): FieldElement {
        return new FieldElement((a * b) % this.p, this);
    }

    inv(a: number): FieldElement {
        let [x, ,] = egcd(a, this.p);
        return new FieldElement(x, this);
    }

    div(a: number, b: number): FieldElement {
        let [x, ,] = egcd(b, this.p);
        return new FieldElement((a * x) % this.p, this);
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
        return this.field.add(this.value, b.value);
    }

    sub(b: FieldElement): FieldElement {
        return this.field.sub(this.value, b.value);
    }

    neg(): FieldElement {
        return this.field.neg(this.value);
    }

    mul(b: FieldElement): FieldElement {
        return this.field.mul(this.value, b.value);
    }

    inv(): FieldElement {
        return this.field.inv(this.value);
    }

    div(b: FieldElement): FieldElement {
        return this.field.div(this.value, b.value);
    }

    // TODO: implement square and multiply in tools
    exp(b: FieldElement): FieldElement {
        let result = this.field.one();
        for (let i = 0; i < b.value; i++) {
            result = result.mul(this);
        }
        return result;
    }

    eq(b: FieldElement): boolean {
        return this.value === b.value;
    }

    neq(b: FieldElement): boolean {
        return this.value !== b.value;
    }
}
