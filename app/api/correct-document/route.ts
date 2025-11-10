import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import { getServerUser } from '@/utils/server-auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { documentId, correction, originalDocument } = await req.json();

    if (!correction || !originalDocument) {
      return NextResponse.json(
        { error: 'Correction and original document are required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const { user, isAuthenticated } = await getServerUser();
    if (!isAuthenticated || !user) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Apply correction using AI to understand the instruction and modify the document
    const correctedDocument = await applyCorrection(originalDocument, correction);

    // Update document in database if documentId is provided
    if (documentId) {
      const supabase = await createAdminClient();
      const { error } = await supabase
        .from('documents')
        .update({ content: correctedDocument })
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating document:', error);
      }
    }

    return NextResponse.json({
      success: true,
      correctedDocument,
    });
  } catch (error) {
    console.error('Error correcting document:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to correct document' },
      { status: 500 }
    );
  }
}

async function applyCorrection(originalDocument: string, correction: string): Promise<string> {
  // Use KIMI API to apply the correction
  const apiKey = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error('KIMI API key not configured');
  }

  const prompt = `You are a legal document editor. A user wants to make a correction to their legal document.

ORIGINAL DOCUMENT:
${originalDocument.substring(0, 100000)}

USER'S CORRECTION REQUEST:
${correction}

Please apply the correction to the document. Return the FULL corrected document, not just the changes. Make sure the document remains complete and properly formatted.`;

  const response = await fetch('https://api.moonshot.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'kimi-k2-0905-preview',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: 'You are a precise legal document editor. Apply corrections exactly as requested while maintaining document integrity and formatting.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`KIMI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || originalDocument;
}

