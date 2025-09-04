class Chat {
  constructor(client) {
    this.client = client;
  }

  /**
   * Create a chat completion
   * @param {Object} params - Parameters for the chat completion
   * @param {Array} params.messages - Array of message objects
   * @param {string} [params.model="gpt-3.5-turbo"] - Model to use
   * @param {number} [params.temperature=0.7] - Sampling temperature
   * @param {number} [params.max_tokens] - Maximum number of tokens to generate
   * @param {boolean} [params.stream=false] - Stream back partial progress
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} - The chat completion response
   */
  async createCompletion(params, options = {}) {
    try {
      const requestParams = {
        ...params,
        model: params.model || 'gpt-3.5-turbo'
      };

      const response = await this.client.post('/v1/chat/completions', requestParams, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Safely parse JSON data from stream
   * @param {string} data - Raw data string to parse
   * @returns {Object|null} - Parsed data or null if invalid
   */
  _safeJsonParse(data) {
    if (!data || typeof data !== 'string') {
      return null;
    }

    const trimmed = data.trim();
    if (trimmed === '' || trimmed === '[DONE]') {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      console.warn('JSON parse failed for data:', JSON.stringify(trimmed));
      return null;
    }
  }

  /**
   * Process a single line from SSE stream
   * @param {string} line - Line to process
   * @returns {Object|null} - Parsed data or null
   */
  _processStreamLine(line) {
    const trimmed = line.trim();
    
    if (trimmed === '' || !trimmed.startsWith('data: ')) {
      return null;
    }

    const data = trimmed.slice(6).trim();
    
    if (data === '[DONE]') {
      return { isDone: true };
    }

    const parsed = this._safeJsonParse(data);
    if (parsed) {
      return { data: parsed, isDone: false };
    }

    return null;
  }

  /**
   * Stream a chat completion response with improved error handling
   * @param {Object} params - Parameters for the chat completion
   * @param {function} onData - Callback for each chunk of data
   * @param {function} [onError] - Callback for errors
   * @param {function} [onEnd] - Callback when stream ends
   * @param {Object} [options] - Request options
   * @returns {Promise<void>}
   */
  async streamCompletion(params, onData, onError, onEnd, options = {}) {
    if (typeof onError !== 'function') {
      options = onEnd || {};
      onEnd = onError;
      onError = null;
    }
    if (typeof onEnd !== 'function') {
      if (typeof onEnd === 'object') {
        options = onEnd;
      }
      onEnd = null;
    }

    try {
      const requestParams = {
        ...params,
        model: params.model || 'gpt-3.5-turbo',
        stream: true
      };

      const response = await this.client.post('/v1/chat/completions', requestParams, {
        ...options,
        stream: true
      });

      return new Promise((resolve, reject) => {
        const stream = response.data;
        let buffer = '';
        let isComplete = false;

        stream.setEncoding('utf8');

        let handleError = (error) => {
          if (isComplete) return;
          isComplete = true;
          
          if (onError) {
            onError(error);
          } else {
            reject(error);
          }
        };

        let handleEnd = () => {
          if (isComplete) return;
          isComplete = true;
          
          if (onEnd) onEnd();
          resolve();
        };

        stream.on('data', (chunk) => {
          if (isComplete) return;

          try {
            buffer += chunk;
            const lines = buffer.split('\n');
            
            buffer = lines.pop() || '';

            for (const line of lines) {
              const result = this._processStreamLine(line);
              
              if (result) {
                if (result.isDone) {
                  handleEnd();
                  return;
                }
                
                if (result.data && onData) {
                  try {
                    onData(result.data);
                  } catch (callbackError) {
                    console.error('Error in onData callback:', callbackError);
                  }
                }
              }
            }
          } catch (error) {
            handleError(new Error(`Stream processing error: ${error.message}`));
          }
        });

        stream.on('end', () => {
          if (isComplete) return;

          if (buffer.trim()) {
            try {
              const lines = buffer.split('\n');
              for (const line of lines) {
                const result = this._processStreamLine(line);
                if (result && result.data && onData) {
                  onData(result.data);
                }
              }
            } catch (error) {
              console.warn('Error processing final buffer:', error.message);
            }
          }

          handleEnd();
        });

        stream.on('error', (error) => {
          handleError(error);
        });

        const timeout = options.timeout || 30000;
        const timeoutId = setTimeout(() => {
          handleError(new Error('Stream timeout'));
        }, timeout);

        const originalHandleEnd = handleEnd;
        const originalHandleError = handleError;
        
        handleEnd = () => {
          clearTimeout(timeoutId);
          originalHandleEnd();
        };
        
        handleError = (error) => {
          clearTimeout(timeoutId);
          originalHandleError(error);
        };
      });
    } catch (error) {
      if (onError) {
        onError(error);
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a completion with custom configuration
   * @param {Object} params - Parameters for the chat completion
   * @param {Object} config - Custom configuration options
   * @returns {Promise<Object>} - The chat completion response
   */
  async createCompletionWithConfig(params, config = {}) {
    const mergedParams = {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: null,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      ...params
    };

    return this.createCompletion(mergedParams, config);
  }

  /**
   * Simple streaming helper with promise-based API and better error handling
   * @param {Object} params - Parameters for the chat completion
   * @param {Object} [options] - Request options
   * @returns {AsyncGenerator} - AsyncGenerator that yields chunks
   */
  async* streamCompletionAsync(params, options = {}) {
    const requestParams = {
      ...params,
      model: params.model || 'gpt-3.5-turbo',
      stream: true
    };

    try {
      const response = await this.client.post('/v1/chat/completions', requestParams, {
        ...options,
        stream: true
      });

      const stream = response.data;
      let buffer = '';

      stream.setEncoding('utf8');

      for await (const chunk of stream) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const result = this._processStreamLine(line);
          
          if (result) {
            if (result.isDone) {
              return;
            }
            
            if (result.data) {
              yield result.data;
            }
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          const result = this._processStreamLine(line);
          if (result && result.data) {
            yield result.data;
          }
        }
      }
    } catch (error) {
      throw new Error(`Stream completion error: ${error.message}`);
    }
  }

  /**
   * Utility method to validate message format
   * @param {Array} messages - Messages array to validate
   * @returns {boolean} - Whether messages are valid
   */
  validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return false;
    }

    return messages.every(msg => 
      msg && 
      typeof msg === 'object' && 
      typeof msg.role === 'string' && 
      typeof msg.content === 'string' &&
      ['system', 'user', 'assistant', 'function'].includes(msg.role)
    );
  }

  /**
   * Create completion with automatic retry on certain errors
   * @param {Object} params - Parameters for the chat completion
   * @param {Object} [options] - Request options
   * @param {number} [maxRetries=3] - Maximum number of retries
   * @returns {Promise<Object>} - The chat completion response
   */
  async createCompletionWithRetry(params, options = {}, maxRetries = 3) {
    if (!this.validateMessages(params.messages)) {
      throw new Error('Invalid messages format');
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.createCompletion(params, options);
      } catch (error) {
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw error;
        }

        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}

module.exports = Chat;