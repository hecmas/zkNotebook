"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const constants_1 = require("./constants");
const optimal_ate_pairing_1 = require("./optimal_ate_pairing");
const parameters_1 = require("./parameters");
const bigintRnd = require("bigint-rnd");
function hash_to_G1_mock(msg) {
    const ell = msg.length;
    const rand = BigInt((ell ** 5 + 3) ** 5); // a very complex random function
    return parameters_1.E.escalarMul(parameters_1.G1, rand);
}
function keyGen() {
    const sk = bigintRnd(constants_1.r);
    const PK = parameters_1.tE.escalarMul(parameters_1.G2, sk);
    return [sk, PK];
}
function sign(sk, msg) {
    const h = hash_to_G1_mock(msg);
    const SIG = parameters_1.E.escalarMul(h, sk);
    return SIG;
}
function verify(PK, msg, SIG) {
    const h = hash_to_G1_mock(msg);
    // e(SIG, G2) = e(h, PK)
    const lhs = (0, optimal_ate_pairing_1.optimal_ate_bn254)(SIG, parameters_1.G2, parameters_1.Fp12);
    const rhs = (0, optimal_ate_pairing_1.optimal_ate_bn254)(h, PK, parameters_1.Fp12);
    return parameters_1.Fp12.eq(lhs, rhs);
}
function verify_multiple(PKs, msgs, SIGs) {
    const hashes = msgs.map(hash_to_G1_mock);
    const rhsItems = hashes.map((h, i) => (0, optimal_ate_pairing_1.optimal_ate_bn254)(h, PKs[i], parameters_1.Fp12));
    const rhs = rhsItems.reduce((acc, item) => parameters_1.Fp12.mul(acc, item), parameters_1.Fp12.one);
    const aSIG = SIGs.reduce((acc, SIG) => parameters_1.E.add(acc, SIG), parameters_1.E.zero);
    // const aPK = PKs.reduce((acc, PK) => tE.add(acc, PK), tE.zero);
    const lhs = (0, optimal_ate_pairing_1.optimal_ate_bn254)(aSIG, parameters_1.G2, parameters_1.Fp12);
    return parameters_1.Fp12.eq(lhs, rhs);
}
function verify_multiple_one_message(PKs, msg, SIGs) {
    const h = hash_to_G1_mock(msg);
    const aPK = PKs.reduce((acc, PK) => parameters_1.tE.add(acc, PK), parameters_1.tE.zero);
    const aSIG = SIGs.reduce((acc, SIG) => parameters_1.E.add(acc, SIG), parameters_1.E.zero);
    const rhs = (0, optimal_ate_pairing_1.optimal_ate_bn254)(h, aPK, parameters_1.Fp12);
    const lhs = (0, optimal_ate_pairing_1.optimal_ate_bn254)(aSIG, parameters_1.G2, parameters_1.Fp12);
    return parameters_1.Fp12.eq(lhs, rhs);
}
// https://xn--2-umb.com/22/bls-signatures/
// 1. One signer and one message
const [sk, PK] = keyGen();
const msg = "Hello world!";
const SIG = sign(sk, msg);
(0, chai_1.assert)(verify(PK, msg, SIG), "Signature verification failed");
// Now, let's check that the verification fails if we change either the message, the signature or the public key
(0, chai_1.assert)(!verify(parameters_1.tE.escalarMul(PK, 2n), msg, SIG), "Signature verification failed");
(0, chai_1.assert)(!verify(PK, msg, parameters_1.E.escalarMul(SIG, 2n)), "Signature verification failed");
(0, chai_1.assert)(!verify(PK, msg + "whatever", parameters_1.E.escalarMul(SIG, 2n)), "Signature verification failed");
// 2. Multiple signers and multiple messages
const [sk1, PK1] = keyGen();
const [sk2, PK2] = keyGen();
const [sk3, PK3] = keyGen();
const msg1 = "Hey man, how are you.";
const msg2 = "I'm fine, thanks. And you?";
const msg3 = "I'm fine too.";
const SIG1 = sign(sk1, msg1);
const SIG2 = sign(sk2, msg2);
const SIG3 = sign(sk3, msg3);
// We can naively verify all of them individually
// e(SIG1,G2) = e(h1,PK1), e(SIG2,G2) = e(h2,PK2), e(SIG3,G2) = e(h3,PK3)
(0, chai_1.assert)(verify(PK1, msg1, SIG1), "Signature verification failed");
(0, chai_1.assert)(verify(PK2, msg2, SIG2), "Signature verification failed");
(0, chai_1.assert)(verify(PK3, msg3, SIG3), "Signature verification failed");
// Or we can aggregate them and verify the aggregated signature
// e(aSIG,G2) = e(h1,PK1) * e(h2,PK2) * e(h3,PK3) = e(ah,aPK)
(0, chai_1.assert)(verify_multiple([PK1, PK2, PK3], [msg1, msg2, msg3], [SIG1, SIG2, SIG3]), "Signature verification failed");
// 3. Multiple signers and one messages
const [sk4, PK4] = keyGen();
const [sk5, PK5] = keyGen();
const [sk6, PK6] = keyGen();
const SIG4 = sign(sk4, msg);
const SIG5 = sign(sk5, msg);
const SIG6 = sign(sk6, msg);
(0, chai_1.assert)(verify_multiple_one_message([PK4, PK5, PK6], msg, [SIG4, SIG5, SIG6]), "Signature verification failed");
//# sourceMappingURL=BLS_signature.js.map