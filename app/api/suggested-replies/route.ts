import { NextRequest, NextResponse } from 'next/server';

// Lightweight heuristic suggestions generator based on recent chat content and category.
// Returns simple string suggestions consumed by Step 1 and split-pane pages.

function detectSuggestions(messages: Array<{ sender: string; text: string }>, category?: string): string[] {
  const MASTER = {
    default: [
      'I need help with a legal document',
      'I want to understand my legal options',
      'Can you explain what I should do?',
      "I'm not sure what to file.",
    ],
    criminal: [
      'I need help with a post-conviction motion.',
      'I want to challenge my conviction.',
      'I want to file a motion to reduce my sentence.',
      'I need help preparing for my criminal appeal.',
    ],
    civilRights: [
      'I want to file a civil suit against the prison.',
      'I was assaulted by a corrections officer.',
      'I need to report abuse or mistreatment in jail.',
      'I want to file a federal 1983 civil rights complaint.',
    ],
    civil: [
      'I need help with a civil lawsuit.',
      'I want to file a demand letter.',
      'I have an employment dispute regarding unpaid wages.',
      'I need help with a landlord-tenant issue.',
    ],
    motions: [
      'I want to file a motion to dismiss.',
      'I want to file a motion to suppress evidence.',
      'I need help preparing a discovery motion.',
      'I want to file a motion in limine.',
    ],
    appeals: [
      'I want to appeal my conviction.',
      'I need help filing an appeal.',
      'I want to prepare an appellate brief.',
      'I need help identifying reversible errors.',
    ],
    sentenceModification: [
      'I want to request a sentence reduction.',
      'I need help filing a resentencing motion.',
      'I want to correct my sentence or record.',
      "I'm eligible under new sentencing laws.",
    ],
  } as const;

  if (!messages || messages.length === 0) {
    return MASTER.default.slice(0, 4);
  }

  const recentUser = messages
    .filter((m) => m.sender === 'user')
    .slice(-3)
    .map((m) => m.text.toLowerCase())
    .join(' ');

  // Category-weighted suggestions
  if (category && category.toLowerCase() === 'criminal') {
    if (recentUser.includes('appeal') || recentUser.includes('conviction') || recentUser.includes('verdict') || recentUser.includes('lost trial')) {
      return MASTER.appeals.slice(0, 4);
    }
    if (recentUser.includes('sentence') || recentUser.includes('resentencing') || recentUser.includes('reduction') || recentUser.includes('time served')) {
      return MASTER.sentenceModification.slice(0, 4);
    }
    if (recentUser.includes('motion') || recentUser.includes('dismiss') || recentUser.includes('suppress') || recentUser.includes('discovery') || recentUser.includes('evidence')) {
      return MASTER.motions.slice(0, 4);
    }
    if (recentUser.includes('prison') || recentUser.includes('jail') || recentUser.includes('assault') || recentUser.includes('abuse') || recentUser.includes('mistreatment') || recentUser.includes('guard') || recentUser.includes('officer')) {
      return MASTER.civilRights.slice(0, 4);
    }
    return MASTER.criminal.slice(0, 4);
  }

  if (category && category.toLowerCase() === 'civil') {
    if (recentUser.includes('wage') || recentUser.includes('employment') || recentUser.includes('pay') || recentUser.includes('salary') || recentUser.includes('overtime')) {
      return MASTER.civil.slice(0, 4);
    }
    if (recentUser.includes('landlord') || recentUser.includes('tenant') || recentUser.includes('eviction') || recentUser.includes('rent') || recentUser.includes('lease')) {
      return MASTER.civil.slice(0, 4);
    }
    if (recentUser.includes('discrimination') || recentUser.includes('harassment') || recentUser.includes('wrongful termination')) {
      return MASTER.civil.slice(0, 4);
    }
    return MASTER.civil.slice(0, 4);
  }

  // General keyword detection
  if (recentUser.includes('appeal') || recentUser.includes('conviction') || recentUser.includes('trial') || recentUser.includes('sentence') || recentUser.includes('guilty') || recentUser.includes('innocent')) {
    return MASTER.criminal.slice(0, 4);
  }
  if (recentUser.includes('prison') || recentUser.includes('jail') || recentUser.includes('assault') || recentUser.includes('abuse') || recentUser.includes('mistreatment') || recentUser.includes('guard') || recentUser.includes('officer')) {
    return MASTER.civilRights.slice(0, 4);
  }
  if (recentUser.includes('wage') || recentUser.includes('landlord') || recentUser.includes('tenant') || recentUser.includes('employment') || recentUser.includes('work') || recentUser.includes('job')) {
    return MASTER.civil.slice(0, 4);
  }
  if (recentUser.includes('charges') || recentUser.includes('arrested') || recentUser.includes('indicted') || recentUser.includes('prosecution') || recentUser.includes('criminal')) {
    return MASTER.criminal.slice(0, 4);
  }
  if (recentUser.includes('motion') || recentUser.includes('dismiss') || recentUser.includes('suppress') || recentUser.includes('discovery') || recentUser.includes('evidence') || recentUser.includes('court')) {
    return MASTER.motions.slice(0, 4);
  }

  return MASTER.default.slice(0, 4);
}

export async function POST(req: NextRequest) {
  try {
    // Be resilient to empty body or invalid JSON
    let body: any = {};
    try {
      const raw = await req.text();
      body = raw && raw.trim().length > 0 ? JSON.parse(raw) : {};
    } catch (parseErr) {
      // Fallback to empty body on parse errors
      body = {};
    }

    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const category = typeof body?.category === 'string' ? body.category : undefined;

    const suggestions = detectSuggestions(messages, category);
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in /api/suggested-replies:', error);
    // Always respond with a safe default to avoid client errors
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok' });
}