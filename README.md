# Paxsenix AI Node.js Library

A Node.js client library for the [Paxsenix AI API](https://api.paxsenix.biz.id/v1).

## Installation

```bash
npm install paxsenix-ai
```

## Usage

### Initialize the client

```javascript
const PaxsenixAI = require('paxsenix-ai');

// Initialize with your API key
const paxsenix = new PaxsenixAI('your-api-key');
```

### Chat Completions

```javascript
// Create a chat completion
const response = await paxsenix.createChatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7,
  max_tokens: 100
});

console.log(response.choices[0].message.content);

// Or using the resource-specific API
const chatResponse = await paxsenix.Chat.createCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Hello!' }
  ]
});
```

### Streaming Chat Completions

```javascript
// Stream a chat completion
await paxsenix.Chat.streamCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'Tell me a story.' }
  ]
}, (chunk) => {
  if (chunk.choices && chunk.choices[0].delta.content) {
    process.stdout.write(chunk.choices[0].delta.content);
  }
});
```

### Generate Images (TO-DO)

### Create Embeddings (TO-DO)

### List Available Models

```javascript
// Get a list of available models
const models = await paxsenix.listModels();
console.log(models.data);
```

## Error Handling

```javascript
try {
  const response = await paxsenix.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
} catch (error) {
  console.error('Error status:', error.status);
  console.error('Error message:', error.message);
  console.error('Error data:', error.data);
}
```

## License

MIT