import { URL } from 'url';
import https from 'https';
import http from 'http';

class HttpClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || '';
    this.headers = config.headers || {};
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 0;
    this.retryDelay = config.retryDelay || 1000;
  }

  async request(method, path, data = null, options = {}) {
    const url = new URL(path, this.baseURL);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method.toUpperCase(),
      headers: {
        ...this.headers,
        ...options.headers
      },
      timeout: options.timeout || this.timeout
    };

    if (data) {
      const body = JSON.stringify(data);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(body);
    }

    let attempt = 0;
    const maxAttempts = this.retries + 1;

    while (attempt < maxAttempts) {
      try {
        return await this._makeRequest(httpModule, requestOptions, data, options);
      } catch (error) {
        attempt++;
        
        if (attempt >= maxAttempts || !this._shouldRetry(error)) {
          throw error;
        }

        await this._delay(this.retryDelay * attempt);
      }
    }
  }

  _makeRequest(httpModule, requestOptions, data, options) {
    return new Promise((resolve, reject) => {
      const req = httpModule.request(requestOptions, (res) => {
        // Handle streaming response
        if (options.stream || options.responseType === 'stream') {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              data: res,
              status: res.statusCode,
              headers: res.headers
            });
          } else {
            let errorData = '';
            res.on('data', (chunk) => {
              errorData += chunk;
            });
            res.on('end', () => {
              try {
                const parsedError = errorData ? JSON.parse(errorData) : null;
                const error = new Error(`HTTP ${res.statusCode}`);
                error.response = {
                  status: res.statusCode,
                  data: parsedError,
                  headers: res.headers
                };
                reject(error);
              } catch (parseError) {
                const error = new Error(`HTTP ${res.statusCode} - ${errorData}`);
                error.response = {
                  status: res.statusCode,
                  data: errorData,
                  headers: res.headers
                };
                reject(error);
              }
            });
          }
          return;
        }

        let responseData = '';
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsedData = responseData ? JSON.parse(responseData) : null;
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                data: parsedData,
                status: res.statusCode,
                headers: res.headers
              });
            } else {
              const error = new Error(`HTTP ${res.statusCode}`);
              error.response = {
                status: res.statusCode,
                data: parsedData,
                headers: res.headers
              };
              reject(error);
            }
          } catch (parseError) {
            const error = new Error(`Failed to parse response: ${parseError.message}`);
            error.response = {
              status: res.statusCode,
              data: responseData,
              headers: res.headers
            };
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        const error = new Error('Request timeout');
        error.code = 'TIMEOUT';
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  _shouldRetry(error) {
    // Retry on network errors or 5xx status codes
    return (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'TIMEOUT' ||
      (error.response && error.response.status >= 500)
    );
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async get(path, options = {}) {
    return this.request('GET', path, null, options);
  }

  async post(path, data, options = {}) {
    return this.request('POST', path, data, options);
  }

  async put(path, data, options = {}) {
    return this.request('PUT', path, data, options);
  }

  async delete(path, options = {}) {
    return this.request('DELETE', path, null, options);
  }

  async patch(path, data, options = {}) {
    return this.request('PATCH', path, data, options);
  }
}

export function createHttpClient(config) {
  return new HttpClient(config);
}