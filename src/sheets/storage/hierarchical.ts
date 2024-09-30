import { DocStorageService } from '@/sheets/storage/base';

export class HierarchicalStorageService {
  private docStorageService = new DocStorageService();

  /**
   * Get a stored value based on the hierarchical path
   * @param path the hierarchical path (e.g., 'openai/gpt-4o/output_tokens')
   * @returns the value or null if it doesn't exist
   */
  getValue(path: string): string | null {
    const key = this.pathToKey(path);
    return this.docStorageService.getValue(key);
  }

  /**
   * Set a value for a specific hierarchical path
   * @param path the hierarchical path (e.g., 'openai/gpt-4o/output_tokens')
   * @param value the value to store
   */
  setValue(path: string, value: string): void {
    const key = this.pathToKey(path);
    this.docStorageService.setValue(key, value);
  }

  /**
   * Delete a stored value by hierarchical path
   * @param path the hierarchical path
   */
  deleteValue(path: string): void {
    const key = this.pathToKey(path);
    this.docStorageService.deleteValue(key);
  }

  /**
   * Clear all stored values
   */
  clearAllValues(): void {
    this.docStorageService.clearAllValues();
  }

  /**
   * Convert a hierarchical path to a flat key
   * @param path the hierarchical path
   * @returns a flat key
   */
  private pathToKey(path: string): string {
    return path.replace(/\//g, '_');
  }
}
