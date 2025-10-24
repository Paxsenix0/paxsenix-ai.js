# @paxsenix/ai

A lightweight and intuitive Node.js client for the [Paxsenix AI API](https://api.paxsenix.org/docs).  
Easily integrate AI-powered chat completions, streaming responses, model listing, and more—right into your app.

**Free to use with a rate limit of 5 requests per minute.**  
Need more? API key support with higher limits! :)

![Static Badge](https://img.shields.io/badge/@PaxSenix-AI-blue)
![GitHub top language](https://img.shields.io/github/languages/top/Paxsenix0/paxsenix-ai.js)
![GitHub Repo stars](https://img.shields.io/github/stars/Paxsenix0/paxsenix-ai.js)
![GitHub issues](https://img.shields.io/github/issues/Paxsenix0/paxsenix-ai.js)
![NPM Downloads](https://img.shields.io/npm/dm/@paxsenix/ai)

---

## 📋 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Usage](#-usage)
  - [Initialize the Client](#initialize-the-client)
  - [Chat Completions](#chat-completions)
  - [Streaming Chat Completions](#streaming-chat-completions)
  - [List Available Models](#list-available-models)
- [Error Handling](#️-error-handling)
- [Rate Limits](#-rate-limits)
- [Upcoming Features](#-upcoming-features)
- [License](#-license)
- [Feedback & Contributions](#-feedback--contributions)

---

## 🚀 Features

- **Chat Completions** – Generate AI-powered responses with ease
- **Streaming Responses** – Get output in real-time as the AI types
- **Model Listing** – Retrieve available model options
- **Planned** – Image generation, embeddings, and more (coming soon)

---

## 📦 Installation

```bash
npm install @paxsenix/ai
```

---

## 📖 Usage

### Initialize the Client

```js
import PaxSenixAI from '@paxsenix/ai';

// Without API key (free access)
const paxsenix = new PaxSenixAI();

// With API key
const paxsenix = new PaxSenixAI('YOUR_API_KEY');

// Advanced usage
const paxsenix = new PaxSenixAI('YOUR_API_KEY', {
  timeout: 30000, // Request timeout in ms
  retries: 3, // Number of retry attempts
  retryDelay: 1000 // Delay between retries in ms
});
```

### Chat Completions (Non-Streaming)

```js
const response = await paxsenix.createChatCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a sarcastic assistant.' },
    { role: 'user', content: 'Wassup beach' }
  ],
  temperature: 0.7,
  max_tokens: 100
});

console.log(response.choices[0].message.content);
console.log('Tokens used:', response.usage.total_tokens);
```

Or using resource-specific API:

```js
const chatResponse = await paxsenix.Chat.createCompletion({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'system', content: 'You are a sarcastic assistant.' },
    { role: 'user', content: 'Who tf r u?' }
  ]
});

console.log(chatResponse.choices[0].message.content);
```

### Chat Completions (Streaming)

```js
// Simple callback approach
await paxsenix.Chat.streamCompletion({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }] 
}, (chunk) => console.log(chunk.choices[0]?.delta?.content || '')
);

// With error handling
await paxsenix.Chat.streamCompletion({ 
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello!' }
  ] 
}, (chunk) => console.log(chunk.choices[0]?.delta?.content || ''),
  (error) => console.error('Error:', error),
  () => console.log('Done!')
);

// Using async generator (recommended)
for await (const chunk of paxsenix.Chat.streamCompletionAsync({
  model: 'gpt-3.5-turbo',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
})) {
  const content = chunk.choices?.[0]?.delta?.content;
  if (content) process.stdout.write(content);
}
```

### List Available Models

```js
const models = await paxsenix.listModels();
console.log(models.data);
```

---

## 🛠️ Error Handling

```js
try {
  const response = await paxsenix.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Hello!' }]
  });
} catch (error) {
  console.error('Status:', error.status);
  console.error('Message:', error.message);
  console.error('Data:', error.data);
}
```

---

## ⏱️ Rate Limits

- Free access allows up to **5 requests per minute**.
- Higher rate limits and API key support are planned.
- API keys will offer better stability and priority access.

---

## 🚧 Upcoming Features

- **Image Generation**
- **Embeddings Support**

---

## 📜 License

MIT License. See [LICENSE](LICENSE) for full details. :)

---

## 💬 Feedback & Contributions

Pull requests and issues are welcome.  
Feel free to fork, submit PRs, or just star the repo if it's helpful :P