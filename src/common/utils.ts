/**
 * Delays the execution of the current function by the specified number of milliseconds.
 *
 * **Note: this function is blocking**.
 * @param ms the number of milliseconds to delay
 * @returns
 */
export const delayMs = (ms: number) => Utilities.sleep(ms);

export class SheetsGPTError extends Error {}
