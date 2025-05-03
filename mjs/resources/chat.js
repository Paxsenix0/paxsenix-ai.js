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

      const response = await this.client.post('/chat/completions', requestParams, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Stream a chat completion response
   * @param {Object} params - Parameters for the chat completion
   * @param {function} onData - Callback for each chunk of data
   * @param {Object} [options] - Request options
   * @returns {Promise<void>}
   */
  async streamCompletion(params, onData, options = {}) {
    try {
      const requestParams = {
        ...params,
        model: params.model || 'gpt-3.5-turbo',
        stream: true
      };

      const response = await this.client.post('/chat/completions', requestParams, {
        ...options,
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        const stream = response.data;
        
        stream.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                resolve();
                return;
              }
              
              try {
                const parsedData = JSON.parse(data);
                onData(parsedData);
              } catch (e) {
                console.error('Error parsing stream data:', e);
              }
            }
          }
        });
        
        stream.on('end', resolve);
        stream.on('error', reject);
      });
    } catch (error) {
      throw error;
    }
  }
}

export default Chat;