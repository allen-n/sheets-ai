/**
 * Delays the execution of the current function by the specified number of milliseconds.
 *
 * **Note: this function is blocking**.
 * @param ms the number of milliseconds to delay
 * @returns
 */
export const delayMs = (ms: number) => Utilities.sleep(ms);

export class SheetsAIError extends Error {}

/**
 * Hashes a string using a simple hash function.
 * @param str The string to hash.
 * @returns The hashed string.
 */
export const hashString = (str: string): string => {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};
