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
   * Stream a chat completion response
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

        stream.setEncoding('utf8');

        stream.on('data', (chunk) => {
          buffer += chunk;
          const lines = buffer.split('\n');
          
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) {
              continue;
            }

            const data = trimmedLine.slice(6).trim();
            
            if (data === '[DONE]') {
              if (onEnd) onEnd();
              resolve();
              return;
            }

            try {
              const parsedData = JSON.parse(data);
              onData(parsedData);
            } catch (e) {
              const parseError = new Error(`Error parsing stream data: ${e.message}`);
              parseError.rawData = data;
              if (onError) {
                onError(parseError);
              } else {
                console.error('Stream parsing error:', parseError);
              }
            }
          }
        });

        stream.on('end', () => {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            const lines = buffer.split('\n');
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine && trimmedLine.startsWith('data: ')) {
                const data = trimmedLine.slice(6).trim();
                if (data !== '[DONE]' && data !== '') {
                  try {
                    const parsedData = JSON.parse(data);
                    onData(parsedData);
                  } catch (e) {
                    const parseError = new Error(`Error parsing final stream data: ${e.message}`);
                    parseError.rawData = data;
                    if (onError) {
                      onError(parseError);
                    } else {
                      console.error('Final stream parsing error:', parseError);
                    }
                  }
                }
              }
            }
          }
          
          if (onEnd) onEnd();
          resolve();
        });

        stream.on('error', (error) => {
          if (onError) {
            onError(error);
          } else {
            reject(error);
          }
        });
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
   * Simple streaming helper with promise-based API
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

    const response = await this.client.post('/v1/chat/completions', requestParams, {
      ...options,
      stream: true
    });

    const stream = response.data;
    let buffer = '';

    stream.setEncoding('utf8');

    yield* (async function* () {
      for await (const chunk of stream) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine === '' || !trimmedLine.startsWith('data: ')) {
            continue;
          }

          const data = trimmedLine.slice(6).trim();
          
          if (data === '[DONE]') {
            return;
          }

          try {
            const parsedData = JSON.parse(data);
            yield parsedData;
          } catch (e) {
            console.error('Error parsing stream data:', e, 'Raw data:', data);
          }
        }
      }

      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6).trim();
            if (data !== '[DONE]' && data !== '') {
              try {
                const parsedData = JSON.parse(data);
                yield parsedData;
              } catch (e) {
                console.error('Error parsing final stream data:', e);
              }
            }
          }
        }
      }
    })();
  }
}

export default Chat;