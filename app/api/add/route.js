import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI and Pinecone clients with API keys
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index('rag'); // Use the correct index name

// Function to handle user input
async function handleUserInput(userInput) {
  let records = [];

  // Check if input is an array or an object
  if (Array.isArray(userInput.restaurant)) {
    records = userInput.restaurant;
  } else {
    console.error('Invalid input format:', userInput);
    return [];
  }

  const processedData = [];

  for (const record of records) {
    console.log('Processing record:', record);

    // Ensure fields are properly mapped
    const mappedRecord = {
      restaurant: record.restaurant,
      review: record.review,
      cuisine: record.cuisine,
      rating: record.rating,
    };

    if (
      !mappedRecord.restaurant ||
      !mappedRecord.review ||
      !mappedRecord.cuisine ||
      typeof mappedRecord.rating !== 'number'
    ) {
      console.error('Invalid record data:', mappedRecord);
      continue;
    }

    try {
      const response = await openai.embeddings.create({
        input: mappedRecord.review,
        model: 'text-embedding-3-small', // Ensure this model is available
      });

      const embedding = response.data?.[0]?.embedding;

      if (!Array.isArray(embedding)) {
        throw new Error('Embedding is not an array');
      }

      processedData.push({
        id: mappedRecord.restaurant, // Use 'restaurant' field for id
        values: embedding, // Embedding should be an array
        metadata: {
          review: mappedRecord.review,
          cuisine: mappedRecord.cuisine,
          rating: mappedRecord.rating,
        },
      });
    } catch (error) {
      console.error('Error creating embedding:', error.message);
    }
  }

  return processedData;
}

// Function to upsert data into Pinecone
async function upsertData(processedData) {
  try {
    // Ensure processedData is in the correct format
    const formattedData = processedData.map((record) => ({
      id: record.id,
      values: record.values,
      metadata: record.metadata,
    }));

    // Perform upsert operation
    const upsertResponse = await index.upsert({
      vectors: formattedData,
      namespace: 'ns1', // Replace with your namespace if needed
    });

    console.log(`Upserted count: ${upsertResponse.upserted_count}`);
  } catch (error) {
    console.error('Error upserting data into Pinecone:', error.message);
    throw new Error('Failed to upsert data');
  }
}

// Function to print index statistics
async function printIndexStats() {
  try {
    const stats = await index.describeIndexStats();
    console.log('Index statistics:', stats);
  } catch (error) {
    console.error('Error describing index stats:', error.message);
  }
}

// POST request handler
export async function POST(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    console.log('Received request body:', JSON.stringify(body, null, 2)); // Pretty print

    const processedData = await handleUserInput(body);

    if (processedData.length > 0) {
      await upsertData(processedData);
    } else {
      console.log('No valid data to upsert');
    }

    await printIndexStats();

    return new Response(JSON.stringify({ message: 'Successfully added to lunch box' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error adding restaurant:', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
    });
  }
}
