import { assert } from "chai";
import { PointOverFp, PointOverFq } from "../ellipticCurve";
import { r } from "./constants";
import { optimal_ate_bn254 } from "./optimal_ate_pairing";
import { E, tE, G1, G2, Fp12 } from "./parameters";
const bigintRnd = require("bigint-rnd");

function hash_to_G1_mock(msg: string) {
    const ell = msg.length;
    const rand = BigInt((ell ** 5 + 3) ** 5); // a very complex random function ;)
    return E.escalarMul(G1, rand);
}

function keyGen() {
    const sk = bigintRnd(r);
    const PK = tE.escalarMul(G2, sk);
    return [sk, PK];
}

function sign(sk: bigint, msg: string) {
    const h = hash_to_G1_mock(msg);
    const SIG = E.escalarMul(h, sk);
    return SIG;
}

function verify(PK: PointOverFq, msg: string, SIG: PointOverFp) {
    const h = hash_to_G1_mock(msg);
    // e(SIG, G2) = e(h, PK)
    const lhs = optimal_ate_bn254(SIG, G2, Fp12);
    const rhs = optimal_ate_bn254(h, PK, Fp12);
    return Fp12.eq(lhs, rhs);
}

function verify_multiple(
    PKs: PointOverFq[],
    msgs: string[],
    SIGs: PointOverFp[]
) {
    const hashes = msgs.map(hash_to_G1_mock);
    const rhsItems = hashes.map((h, i) => optimal_ate_bn254(h, PKs[i], Fp12));
    const aSIG = SIGs.reduce((acc, SIG) => E.add(acc, SIG), E.zero);
    // e(aSIG,G2) = e(h1,PK1) * e(h2,PK2) * e(h3,PK3)
    const lhs = optimal_ate_bn254(aSIG, G2, Fp12);
    const rhs = rhsItems.reduce((acc, item) => Fp12.mul(acc, item), Fp12.one);
    return Fp12.eq(lhs, rhs);
}

function verify_multiple_one_message(
    PKs: PointOverFq[],
    msg: string,
    SIGs: PointOverFp[]
) {
    const h = hash_to_G1_mock(msg);
    const aPK = PKs.reduce((acc, PK) => tE.add(acc, PK), tE.zero);
    const aSIG = SIGs.reduce((acc, SIG) => E.add(acc, SIG), E.zero);
    // e(aSIG,G2) = e(h,PK1) * e(h,PK2) * e(h,PK3) = e(ah,aPK)
    const lhs = optimal_ate_bn254(aSIG, G2, Fp12);
    const rhs = optimal_ate_bn254(h, aPK, Fp12);
    return Fp12.eq(lhs, rhs);
}

// https://xn--2-umb.com/22/bls-signatures/
// 1. One signer and one message
const [sk, PK] = keyGen();
const msg = "Hello world!";
const SIG = sign(sk, msg);
assert(verify(PK, msg, SIG), "Signature verification failed");

// Now, let's check that the verification fails if we change either the message, the signature or the public key
assert(
    !verify(tE.escalarMul(PK, 2n), msg, SIG),
    "Signature verification failed"
);
assert(
    !verify(PK, msg, E.escalarMul(SIG, 2n)),
    "Signature verification failed"
);
assert(
    !verify(PK, msg + "whatever", E.escalarMul(SIG, 2n)),
    "Signature verification failed"
);

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
assert(verify(PK1, msg1, SIG1), "Signature verification failed");
assert(verify(PK2, msg2, SIG2), "Signature verification failed");
assert(verify(PK3, msg3, SIG3), "Signature verification failed");

// Or we can aggregate them and verify the aggregated signature
// e(aSIG,G2) = e(h1,PK1) * e(h2,PK2) * e(h3,PK3) = e(ah,aPK)
assert(
    verify_multiple([PK1, PK2, PK3], [msg1, msg2, msg3], [SIG1, SIG2, SIG3]),
    "Signature verification failed"
);

// 3. Multiple signers and one messages
const [sk4, PK4] = keyGen();
const [sk5, PK5] = keyGen();
const [sk6, PK6] = keyGen();
const SIG4 = sign(sk4, msg);
const SIG5 = sign(sk5, msg);
const SIG6 = sign(sk6, msg);
assert(verify_multiple_one_message([PK4, PK5, PK6], msg, [SIG4, SIG5, SIG6]), "Signature verification failed");