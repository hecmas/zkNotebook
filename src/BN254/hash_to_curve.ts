// import { SHA3 } from "sha3"; // https://www.npmjs.com/package/sha3
// import { bytesToNumberBE, concatBytes, utf8ToBytes } from "./utils";

// const hash = new SHA3(256);

// // https://www.ietf.org/archive/id/draft-irtf-cfrg-hash-to-curve-16.html
// /**
//  * * `DST` is a domain separation tag, defined in section 2.2.5
//  * * `p` characteristic of F, where F is a finite field of characteristic p and order q = p^m
//  * * `m` is extension degree (1 for prime fields)
//  * * `k` is the target security target in bits (e.g. 128), from section 5.1
//  * * `expand` is `xmd` (SHA2, SHA3, BLAKE) or `xof` (SHAKE, BLAKE-XOF)
//  * * `hash` conforming to `utils.CHash` interface, with `outputLen` / `blockLen` props
//  */
// type UnicodeOrBytes = string | Uint8Array;
// export type Opts = {
//     DST: UnicodeOrBytes;
//     p: bigint;
//     m: number;
//     k: number;
//     expand: "xmd" | "xof";
//     hash: SHA3<256>;
// };

// function validateDST(dst: UnicodeOrBytes): Uint8Array {
//   if (dst instanceof Uint8Array) return dst;
//   if (typeof dst === 'string') return utf8ToBytes(dst);
//   throw new Error('DST must be Uint8Array or string');
// }

// // Octet Stream to Integer
// const os2ip = bytesToNumberBE;

// // Integer to Octet Stream (numberToBytesBE)
// function i2osp(value: number, length: number): Uint8Array {
//     if (value < 0 || value >= 1 << (8 * length)) {
//         throw new Error(`bad I2OSP call: value=${value} length=${length}`);
//     }
//     const res = Array.from({ length }).fill(0) as number[];
//     for (let i = length - 1; i >= 0; i--) {
//         res[i] = value & 0xff;
//         value >>>= 8;
//     }
//     return new Uint8Array(res);
// }

// function strxor(a: Uint8Array, b: Uint8Array): Uint8Array {
//     const arr = new Uint8Array(a.length);
//     for (let i = 0; i < a.length; i++) {
//         arr[i] = a[i] ^ b[i];
//     }
//     return arr;
// }

// function isBytes(item: unknown): void {
//     if (!(item instanceof Uint8Array)) throw new Error("Uint8Array expected");
// }
// function isNum(item: unknown): void {
//     if (!Number.isSafeInteger(item)) throw new Error("number expected");
// }

// // Produces a uniformly random byte string using a cryptographic hash function H that outputs b bits
// // https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-11#section-5.4.1
// export function expand_message_xmd(
//     msg: Uint8Array,
//     DST: Uint8Array,
//     lenInBytes: number,
//     H: CHash
// ): Uint8Array {
//     isBytes(msg);
//     isBytes(DST);
//     isNum(lenInBytes);
//     // https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-16#section-5.3.3
//     if (DST.length > 255)
//         DST = H(concatBytes(utf8ToBytes("H2C-OVERSIZE-DST-"), DST));
//     const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
//     const ell = Math.ceil(lenInBytes / b_in_bytes);
//     if (ell > 255) throw new Error("Invalid xmd length");
//     const DST_prime = concatBytes(DST, i2osp(DST.length, 1));
//     const Z_pad = i2osp(0, r_in_bytes);
//     const l_i_b_str = i2osp(lenInBytes, 2); // len_in_bytes_str
//     const b = new Array<Uint8Array>(ell);
//     const b_0 = H(concatBytes(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
//     b[0] = H(concatBytes(b_0, i2osp(1, 1), DST_prime));
//     for (let i = 1; i <= ell; i++) {
//         const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
//         b[i] = H(concatBytes(...args));
//     }
//     const pseudo_random_bytes = concatBytes(...b);
//     return pseudo_random_bytes.slice(0, lenInBytes);
// }

// /**
//  * Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F
//  * https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve-11#section-5.3
//  * @param msg a byte string containing the message to hash
//  * @param count the number of elements of F to output
//  * @param options `{DST: string, p: bigint, m: number, k: number, expand: 'xmd' | 'xof', hash: H}`, see above
//  * @returns [u_0, ..., u_(count - 1)], a list of field elements.
//  */
// export function hash_to_field(msg: Uint8Array, count: number, options: Opts): bigint[][] {
//   // validateObject(options, {
//   //   DST: 'string',
//   //   p: 'bigint',
//   //   m: 'isSafeInteger',
//   //   k: 'isSafeInteger',
//   //   hash: 'hash',
//   // });
//   const { p, k, m, hash, expand, DST: _DST } = options;
//   isBytes(msg);
//   isNum(count);
//   const DST = validateDST(_DST);
//   const log2p = p.toString(2).length;
//   const L = Math.ceil((log2p + k) / 8); // section 5.1 of ietf draft link above
//   const len_in_bytes = count * m * L;
//   let prb; // pseudo_random_bytes
//   if (expand === 'xmd') {
//     prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
//   // } else if (expand === 'xof') {
//   //   prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
//   // } else if (expand === '_internal_pass') {
//   //   // for internal tests only
//   //   prb = msg;
//   } else {
//     throw new Error('expand must be "xmd" or "xof"');
//   }
//   const u = new Array(count);
//   for (let i = 0; i < count; i++) {
//     const e = new Array(m);
//     for (let j = 0; j < m; j++) {
//       const elm_offset = L * (j + i * m);
//       const tv = prb.subarray(elm_offset, elm_offset + L);
//       e[j] = mod(os2ip(tv), p);
//     }
//     u[i] = e;
//   }
//   return u;
// }
