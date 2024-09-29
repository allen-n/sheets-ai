type SecretKey = 'USER_OPENAI_KEY';

type SecretMap = {
  USER_OPENAI_KEY: string;
};

class SecretService {
  private userProperties = PropertiesService.getUserProperties();

  /**
   * Get a secret based on the key
   * @param key the key of the secret
   * @returns the value of the secret or null if it doesn't exist
   */
  getSecret<T extends keyof SecretMap>(key: T): SecretMap[T] | null {
    const value = this.userProperties.getProperty(key);
    return value ? (value as SecretMap[T]) : null;
  }

  /**
   * Set a secret with a given key and value
   * @param key the key of the secret
   * @param value the value of the secret
   */
  setSecret<T extends keyof SecretMap>(key: T, value: SecretMap[T]): void {
    this.userProperties.setProperty(key, value);
  }

  /**
   * Delete a secret by key
   * @param key The key of the secret to delete
   */
  deleteSecret<T extends keyof SecretMap>(key: T): void {
    this.userProperties.deleteProperty(key);
  }

  /**
   * Clear all secrets for the current user
   */
  clearAllSecrets(): void {
    this.userProperties.deleteAllProperties();
  }
}
