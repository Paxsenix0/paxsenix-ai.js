import { createHttpClient } from './lib/http-client.js';
import Chat from './resources/chat.js';

class PaxSenixAI {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.paxsenix.dpdns.org';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 0;
    this.retryDelay = options.retryDelay || 1000;
    
    this.client = createHttpClient({
      baseURL: this.baseURL,
      headers: {
        'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : "",
        'Content-Type': 'application/json',
        'User-Agent': `PaxSenixAI-Node/${options.version || '0.1.2'}`
      },
      timeout: this.timeout,
      retries: this.retries,
      retryDelay: this.retryDelay
    });

    this.Chat = new Chat(this.client);
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
  async createChatCompletion(params, options = {}) {
    try {
      const requestParams = {
        ...params,
        model: params.model || 'gpt-3.5-turbo'
      };

      const response = await this.client.post('/v1/chat/completions', requestParams, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Create an image with DALL-E (TO-DO)
   * @param {Object} params - Parameters for image generation
   * @param {string} params.prompt - The prompt to generate images for
   * @param {number} [params.n=1] - Number of images to generate
   * @param {string} [params.size="1024x1024"] - Size of the images
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} - The image generation response
   */
  async createImage(params, options = {}) {
    try {
      const response = await this.client.post('/v1/images/generations', params, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Create an embedding (TO-DO)
   * @param {Object} params - Parameters for creating embeddings
   * @param {string|Array<string>} params.input - Input text to embed
   * @param {string} [params.model="text-embedding-ada-002"] - Model to use
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} - The embedding response
   */
  async createEmbedding(params, options = {}) {
    try {
      const requestParams = {
        ...params,
        model: params.model || 'text-embedding-ada-002'
      };

      const response = await this.client.post('/v1/embeddings', requestParams, options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * List available models
   * @param {Object} [options] - Request options
   * @returns {Promise<Object>} - List of models
   */
  async listModels(options = {}) {
    try {
      const response = await this.client.get('/v1/models', options);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Handle API errors
   * @private
   * @param {Error} error - The error object
   */
  _handleError(error) {
    if (error.response) {
      const { status, data } = error.response;

      const enhancedError = new Error(
        `PaxSenix API error: ${status} - ${data.error?.message || JSON.stringify(data)}`
      );
      enhancedError.status = status;
      enhancedError.data = data;
      enhancedError.headers = error.response.headers;
      throw enhancedError;
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      throw new Error(`PaxSenix API connection error: ${error.message}`);
    } else {
      throw new Error(`PaxSenix API client error: ${error.message}`);
    }
  }
}

export default PaxSenixAI;