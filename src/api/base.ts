import { Utils } from '@/common/utils';

// src/api/base.gs
class ApiServiceError extends Error {}

class ApiService {
  private baseUrl: string;
  private headers: Record<string, string>;
  private maxRetries: number;

  constructor(
    baseUrl: string,
    headers: Record<string, string> = {},
    maxRetries: number = 3
  ) {
    this.baseUrl = baseUrl;
    this.headers = headers;
    this.maxRetries = maxRetries;
  }

  updateBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  toUrlSearchParams(params: Record<string, any>): string {
    const searchParams = [];
    for (const key in params) {
      if (params[key] === undefined) {
        continue;
      } else if (params[key] instanceof Date) {
        searchParams.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(
            params[key].toISOString()
          )}`
        );
      } else if (typeof params[key] === 'boolean') {
        searchParams.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(
            params[key].toString()
          )}`
        );
      } else {
        searchParams.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        );
      }
    }
    return searchParams.join('&');
  }

  updateHeaders(newHeaders: Record<string, string>): void {
    this.headers = { ...this.headers, ...newHeaders };
  }

  setHeaderValue(key: string, value: string): void {
    if (!this.headers) {
      this.headers = {};
    }
    this.headers[key] = value;
  }

  private request(
    endpoint: string,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const url = `${this.baseUrl}${endpoint}`;
    console.log('req to url:', url);
    const headers = { ...this.headers, ...options.headers };
    const config: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      ...options,
      headers,
    };
    const maxTries = this.maxRetries;
    let tries = 0;
    let innerError = null;
    let outerRes: GoogleAppsScript.URL_Fetch.HTTPResponse;

    while (tries < maxTries) {
      try {
        const res = UrlFetchApp.fetch(url, config);
        outerRes = res;
        if (res.getResponseCode() >= 400) {
          throw new Error(
            `Error in request to ${url}. Status: ${res.getResponseCode()}. ${res.getContentText()}`
          );
        }
        return res;
      } catch (error) {
        innerError = error;
        tries++;
        Utils.delayMs(500 * Math.pow(2, tries));
      }
    }
    throw new ApiServiceError(
      `Request failed after ${maxTries} attempts: ${innerError}`
    );
  }

  get(
    endpoint: string,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    return this.request(endpoint, { ...options, method: 'get' });
  }

  post(
    endpoint: string,
    body: any,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    let parsedBody = body;
    if (
      options.headers &&
      'Content-Type' in options.headers &&
      options.headers['Content-Type'] === 'application/x-www-form-urlencoded'
    ) {
      parsedBody = this.toUrlSearchParams(body);
    } else if (typeof body === 'object') {
      parsedBody = JSON.stringify(body);
    }
    console.log('req to', endpoint, parsedBody);
    return this.request(endpoint, {
      ...options,
      method: 'post',
      payload: parsedBody,
    });
  }

  put(
    endpoint: string,
    body: any,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    let parsedBody = body;
    if (
      options.headers &&
      'Content-Type' in options.headers &&
      options.headers['Content-Type'] === 'application/x-www-form-urlencoded'
    ) {
      parsedBody = this.toUrlSearchParams(body);
    } else {
      parsedBody = JSON.stringify(body);
    }
    return this.request(endpoint, {
      ...options,
      method: 'put',
      payload: parsedBody,
    });
  }

  delete(
    endpoint: string,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    return this.request(endpoint, { ...options, method: 'delete' });
  }

  patch(
    endpoint: string,
    body: any,
    options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {}
  ): GoogleAppsScript.URL_Fetch.HTTPResponse {
    let parsedBody = body;
    if (
      options.headers &&
      'Content-Type' in options.headers &&
      options.headers['Content-Type'] === 'application/x-www-form-urlencoded'
    ) {
      parsedBody = this.toUrlSearchParams(body);
    } else {
      parsedBody = JSON.stringify(body);
    }
    return this.request(endpoint, {
      ...options,
      method: 'patch',
      payload: parsedBody,
    });
  }
}
export { ApiService, ApiServiceError };
