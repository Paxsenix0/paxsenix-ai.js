import PaxSenixAI from './esm/index.js';

// Initialize the client with your API key
const paxsenix = new PaxSenixAI("YOUR_API_KEY");

async function runExamples() {
  try {
    // Example 1: List available models
    console.log('Listing available models...');
    const models = await paxsenix.listModels();
    console.log(`Available models: ${models.data.map(model => model.id).join(', ')}`);
    console.log('-------------------');

    // Example 2: Chat completion
    console.log('Creating chat completion...');
    const chatResponse = await paxsenix.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'What is the capital of France?' }
      ],
      temperature: 0.7
    });
    console.log(`Chat response: ${chatResponse.choices[0].message.content}`);
    console.log('-------------------');

    // Example 3: Stream chat completion
    console.log('Streaming chat completion...');
    console.log('Response: ');
    await paxsenix.Chat.streamCompletion({
      model: 'gpt-3.5-turbo',
      stream: true,
      messages: [
        { role: 'system', content: 'You are a sarcastic assistant.' },
        { role: 'user', content: "What's the meaning of life?" }
      ]
    }, (chunk) => {
      if (chunk.choices && chunk.choices[0].delta.content) {
        process.stdout.write(chunk.choices[0].delta.content);
      }
    });
    console.log('\n-------------------');

    // Example 4: Generate an image (TO-DO)
    // console.log('Generating an image...');
    // const imageResponse = await paxsenix.Images.generate({
    //  prompt: 'A futuristic city with flying cars',
    //  n: 1,
    //  size: '512x512'
    // });
    // console.log(`Image URL: ${imageResponse.data[0].url}`);
    // console.log('-------------------');

    // Example 5: Create embeddings (TO-DO)
    // console.log('Creating embeddings...');
    // const embeddingResponse = await paxsenix.Embeddings.create({
    //  model: 'text-embedding-ada-002',
    //  input: [
    //    'The food was delicious and the service was excellent.',
    //    'The food was terrible and the service was poor.'
    //  ]
    // });
    
    // Calculate similarity between the two embeddings
    // const similarity = paxsenix.Embeddings.cosineSimilarity(
    //  embeddingResponse.data[0].embedding,
    //  embeddingResponse.data[1].embedding
    // );
    
    // console.log(`Number of embeddings: ${embeddingResponse.data.length}`);
    // console.log(`First embedding length: ${embeddingResponse.data[0].embedding.length}`);
    // console.log(`Similarity between the two texts: ${similarity}`);
    // console.log('-------------------');
  } catch (error) {
    console.error('Error:', error.message);
    if (error.data) {
      console.error('API Error details:', error.data);
    }
  }
}

runExamples();