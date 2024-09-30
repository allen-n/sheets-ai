type ModelUsageKey = string;

export class DocStorageService {
  private docProperties = PropertiesService.getDocumentProperties();

  /**
   * Get a stored value based on the key
   * @param key the key of the stored value
   * @returns the value or null if it doesn't exist
   */
  getValue(key: ModelUsageKey): string | null {
    const value = this.docProperties.getProperty(key);
    return value ? value : null;
  }

  /**
   * Set a value with a given key
   * @param key the key of the value
   * @param value the value to store
   */
  setValue(key: ModelUsageKey, value: string): void {
    this.docProperties.setProperty(key, value);
  }

  /**
   * Delete a stored value by key
   * @param key The key of the value to delete
   */
  deleteValue(key: ModelUsageKey): void {
    this.docProperties.deleteProperty(key);
  }

  /**
   * Clear all stored values
   */
  clearAllValues(): void {
    this.docProperties.deleteAllProperties();
  }
}
