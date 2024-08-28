import { NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

const systemPrompt = `
You are a helpful restaurant rating assistant designed to help restaurant lovers discover the best dining options based on their cuisine preferences. 
Users will provide their preferred cuisine or specific dining needs, and your job is to analyze their query and present the top 3 restaurant options that best match their preferences. 
Use the power of Retrieval-Augmented Generation (RAG) to pull information from relevant data sources and provide accurate, up-to-date recommendations.

Make sure to:

Ask clarifying questions if the user’s query is too broad or ambiguous.
Provide detailed descriptions of the recommended restaurants, including their cuisine type, ratings, and unique features.
Be friendly, knowledgeable, and concise in your responses.
Encourage users to explore new and exciting dining experiences based on their preferences.
`;

export async function POST(req) {
  const data = await req.json();

  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  const index = pc.index('rag').namespace('ns1');
  const openai = new OpenAI();

  const text = data[data.length - 1].content;
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  const results = await index.query({
    vector: embedding.data[0].embedding,
    topK: 5,
    includeMetadata: true,
  });

  let resultString = '';
  if (results.matches && Array.isArray(results.matches)) {
    results.matches.forEach((match) => {
      resultString += `
            Returned Results:
            Restaurant: ${match.id}
            Review: ${match.metadata.rating}
            Cuisine: ${match.metadata.cuisine}
            Rating: ${match.metadata.rating}
            \n\n`;
    });
  } else {
    resultString = 'No matches found.';
  }

  const lastMessage = data[data.length - 1];
  const lastMessageContent = lastMessage.content + resultString;
  const lastDataWithoutLastMessage = data.slice(0, data.length - 1);

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...lastDataWithoutLastMessage,
      {
        role: 'user',
        content: lastMessageContent,
      },
    ],
    model: 'gpt-3.5-turbo',
    stream: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
  return new NextResponse(stream);
}
