export class SheetsAIError extends Error {}

class Utils {
  static getLogoUrl = () => {
    return 'https://drive.usercontent.google.com/download?id=1G8MTjmb8bzhUQrZAasP88pYWgWN_ygk1';
  };
  /**
   * Delays the execution of the current function by the specified number of milliseconds.
   *
   * **Note: this function is blocking**.
   * @param ms the number of milliseconds to delay
   * @returns
   */
  static delayMs = (ms: number) => Utilities.sleep(ms);

  // cyrb53 (c) 2018 bryc (github.com/bryc). License: Public domain. Attribution appreciated.
  // A fast and simple 64-bit (or 53-bit) string hash function with decent collision resistance.
  // Largely inspired by MurmurHash2/3, but with a focus on speed/simplicity.
  // See https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/52171480#52171480
  // https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js
  static cyrb64 = (str: string, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    // For a single 53-bit numeric return value we could return
    // 4294967296 * (2097151 & h2) + (h1 >>> 0);
    // but we instead return the full 64-bit value:
    return [h2 >>> 0, h1 >>> 0];
  };

  /**
   * Hashes a string using a 64-bit hash function. An insecure hash function that's short, fast, and has no dependencies.
   * @param str The string to hash.
   * @param seed The seed for the hash function.
   * @returns The hashed string. The output is always 14 characters.
   */
  static cyrb64Hash = (str: string, seed = 0) => {
    const [h2, h1] = Utils.cyrb64(str, seed);
    return h2.toString(36).padStart(7, '0') + h1.toString(36).padStart(7, '0');
  };
}

export { Utils };
