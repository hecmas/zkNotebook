const u8a = (a: any): a is Uint8Array => a instanceof Uint8Array;

const hexes = Array.from({ length: 256 }, (v, i) =>
    i.toString(16).padStart(2, "0")
);
export function bytesToHex(bytes: Uint8Array): string {
    if (!u8a(bytes)) throw new Error("Uint8Array expected");
    // pre-caching improves the speed 6x
    let hex = "";
    for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
    }
    return hex;
}

export function hexToNumber(hex: string): bigint {
    if (typeof hex !== "string")
        throw new Error("hex string expected, got " + typeof hex);
    // Big Endian
    return BigInt(hex === "" ? "0" : `0x${hex}`);
}

// Big Endian
export function bytesToNumberBE(bytes: Uint8Array): bigint {
    return hexToNumber(bytesToHex(bytes));
}

// Copies several Uint8Arrays into one.
export function concatBytes(...arrs: Uint8Array[]): Uint8Array {
    const r = new Uint8Array(arrs.reduce((sum, a) => sum + a.length, 0));
    let pad = 0; // walk through each item, ensure they have proper type
    arrs.forEach((a) => {
        if (!u8a(a)) throw new Error("Uint8Array expected");
        r.set(a, pad);
        pad += a.length;
    });
    return r;
}

// Global symbols in both browsers and Node.js since v11
// See https://github.com/microsoft/TypeScript/issues/31535
declare const TextEncoder: any;
export function utf8ToBytes(str: string): Uint8Array {
  if (typeof str !== 'string') {
    throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
  }
  return new TextEncoder().encode(str);
}