export { egcd };

// https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm#Pseudocode
function egcd(a: number, b: number): number[] {
    if (a < b) {
        let result = egcd(b, a);
        return [result[1], result[0], result[2]];
    }

    if (b === 0) {
        return [1, 0, a];
    }

    let [previous_r, r] = [a, b];
    let [previous_s, s] = [1, 0];
    let [previous_t, t] = [0, 1];

    while (r) {
        let q = Math.floor(previous_r / r);
        [previous_r, r] = [r, previous_r - q * r];
        [previous_s, s] = [s, previous_s - q * s];
        [previous_t, t] = [t, previous_t - q * t];
    }
    return [previous_s, previous_t, previous_r];
}

// console.log(egcd(7, 5));
