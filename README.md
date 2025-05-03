# PaxSenix-AI.js

A robust and intuitive Node.js client library for the [Paxsenix-AI API](https://api.paxsenix.biz.id/docs). Seamlessly integrate AI-powered chat completions, embeddings, and more into your Node.js applications.

![Static Badge](https://img.shields.io/badge/PaxSenix-AI.js-blue)
![GitHub top language](https://img.shields.io/github/languages/top/paxsenix/paxsenix-ai.js)
![GitHub Repo stars](https://img.shields.io/github/stars/paxsenix/paxsenix-ai.js)
![GitHub issues](https://img.shields.io/github/issues/paxsenix/paxsenix-ai.js)
![NPM Downloads](https://img.shields.io/npm/dm/paxsenix-ai.js)

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
  - [Initialize the Client](#initialize-the-client)
  - [Chat Completions](#chat-completions)
  - [Streaming Chat Completions](#streaming-chat-completions)
  - [List Available Models](#list-available-models)
- [Error Handling](#️-error-handling)
- [Upcoming Features](#-upcoming-features)
- [License](#-license)
- [Feedback and Contributions](#-feedback-and-contributions)

## 🚀 Features

- **Chat Completions**: Generate AI-powered responses tailored to your input
- **Streaming Responses**: Stream chat completions for real-time applications
- **Model Management**: Fetch and manage available AI models
- **Planned Features**: Image generation and embeddings (coming soon)

## 📦 Installation

```bash
npm install paxsenix-ai.js
```

## 📖 Usage

### Initialize the Client

```javascript
const PaxsenixAI = require('paxsenix-ai.js');

// Initialize with your API key
const paxsenix = new PaxsenixAI('your-api-key');
```

### Chat Completions

#### Basic Chat Completion

```javascript
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
```

#### Using Resource-Specific API

```javascript
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

### List Available Models

```javascript
const models = await paxsenix.listModels();
console.log(models.data);
```

## 🛠️ Error Handling

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

## 🚧 Upcoming Features

- **Image Generation**: Generate AI-powered imagery for your applications
- **Embeddings**: Create vector representations for advanced AI tasks

## 📜 License

This library is distributed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## 💬 Feedback and Contributions

We value your feedback! Feel free to submit issues and pull requests to improve this library.