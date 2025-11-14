import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';

/**
 * Test endpoint to verify Pinecone connection
 * GET /api/test-pinecone
 */
export async function GET(req: NextRequest) {
  try {
    // Test 1: Check if API key is set
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'PINECONE_API_KEY not found in environment variables',
          step: 'Check .env.local file'
        },
        { status: 400 }
      );
    }

    // Test 2: Initialize Pinecone client
    let client;
    try {
      client = new Pinecone({ apiKey });
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to initialize Pinecone client: ${error.message}`,
          step: 'Check API key format'
        },
        { status: 500 }
      );
    }

    // Test 3: List indexes to verify connection
    let indexes;
    try {
      indexes = await client.listIndexes();
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to connect to Pinecone: ${error.message}`,
          step: 'Check API key validity and network connection'
        },
        { status: 500 }
      );
    }

    // Test 4: Check if the expected index exists
    const indexName = process.env.PINECONE_INDEX_NAME || 'user-memories';
    const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

    if (!indexExists) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Index "${indexName}" not found`,
          step: 'Create the index in Pinecone dashboard',
          instructions: {
            name: indexName,
            dimension: 1536,
            metric: 'cosine',
            url: 'https://app.pinecone.io/'
          },
          availableIndexes: indexes.indexes?.map(idx => idx.name) || []
        },
        { status: 404 }
      );
    }

    // Test 5: Get index stats to verify it's ready
    const index = client.index(indexName);
    let stats;
    try {
      stats = await index.describeIndexStats();
    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Index exists but is not ready: ${error.message}`,
          step: 'Wait for the index to finish creating'
        },
        { status: 503 }
      );
    }

    // All tests passed!
    return NextResponse.json({
      success: true,
      message: 'Pinecone connection successful!',
      details: {
        apiKeyConfigured: true,
        clientInitialized: true,
        connectionVerified: true,
        indexName: indexName,
        indexExists: true,
        indexReady: true,
        totalVectors: stats.totalRecordCount || 0,
        dimension: stats.dimension || 1536,
      },
      nextSteps: [
        'Pinecone is ready to use!',
        'The RAG system will automatically start storing and retrieving user memories.',
        'Test by having a conversation - memories will be stored automatically.'
      ]
    });

  } catch (error: any) {
    console.error('Pinecone test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Unknown error',
        step: 'Check server logs for details'
      },
      { status: 500 }
    );
  }
}

