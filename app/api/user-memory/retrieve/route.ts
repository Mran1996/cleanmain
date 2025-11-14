import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getRelevantUserContext } from '@/lib/user-memory';

/**
 * Retrieve relevant user memories and context for a query
 * GET /api/user-memory/retrieve?query=...
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeMemories = searchParams.get('includeMemories') !== 'false';
    const includeSummaries = searchParams.get('includeSummaries') !== 'false';
    const includeInsights = searchParams.get('includeInsights') !== 'false';

    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    const context = await getRelevantUserContext(user.id, query, {
      includeMemories,
      includeSummaries,
      includeInsights,
      limit,
    });

    return NextResponse.json({
      success: true,
      context,
      query,
    });

  } catch (error) {
    console.error('Error retrieving user context:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve user context' },
      { status: 500 }
    );
  }
}


