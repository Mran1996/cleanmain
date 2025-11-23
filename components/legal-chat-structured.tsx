'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Role = 'assistant' | 'user';

export type GenerationState = {
  caseNumber?: string;
  county?: string;
  state?: string;
  opposingParty?: string;
  courtName?: string;
  includeCaseLaw?: boolean;
  uploadedDocMeta?: {
    filename?: string;
    pages?: number;
    extractedFields?: Record<string, string>;
  };
  partyYou?: string;          // your full legal name
  partyOpposingRole?: string; // e.g., Plaintiff/Respondent/Superintendent
  documentType?: 'letter' | 'motion' | 'petition' | 'brief' | 'other';
  goals?: string;
  factsSummary?: string;
  reliefRequested?: string;
  chatHistory?: Array<{ role: Role; content: string }>;
};

type QA = {
  id: string;
  ask: (s: GenerationState) => string; // humanized prompt builder
  // optional field extraction (runs after user answers this question)
  extract?: (answer: string, s: GenerationState) => Partial<GenerationState>;
  // condition to skip this question if already satisfied
  shouldAsk?: (s: GenerationState) => boolean;
};

// ---------------------- UTIL: STORAGE ----------------------
const STATE_KEY = 'askai.genState';
const CHAT_KEY = 'askai.chat';

function loadState(): GenerationState {
  try {
    if (typeof window === 'undefined') return {};
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveState(s: GenerationState) {
  if (typeof window === 'undefined') return;
  const toSave = { ...s };
  localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
}

function loadChat(): Array<{ role: Role; content: string }> {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChat(c: Array<{ role: Role; content: string }>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAT_KEY, JSON.stringify(c));
}

// ---------------------- UTIL: EXTRACTION ----------------------
const caseNoRegex =
  /\b(\d{2}-\d{1,2}-\d{5}-[A-Z]{2,3}|\d{1,4}[-–]\d{1,4}[-–]\d{1,6}\s?[A-Z]{0,3}|\d{2}:\d{2}-[a-z]{2}-\d{4,6}-[A-Z]{2,})\b/i;
const countyRegex = /\b([A-Z][a-z]+)\s+County\b/;
const stateRegex =
  /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\sHampshire|New\sJersey|New\sMexico|New\sYork|North\sCarolina|North\sDakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\sIsland|South\sCarolina|South\sDakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\sVirginia|Wisconsin|Wyoming)\b/i;
const courtRegex =
  /\b(Superior Court|District Court|Court of Appeals|Supreme Court|United States District Court|U\.S\. District Court|Municipal Court)(?:,?\s+[^,]+)?/i;

function extractFields(answer: string, s: GenerationState): Partial<GenerationState> {
  const out: Partial<GenerationState> = {};
  const caseMatch = answer.match(caseNoRegex);
  if (!s.caseNumber && caseMatch) out.caseNumber = caseMatch[1].trim();

  const countyMatch = answer.match(countyRegex);
  if (!s.county && countyMatch) out.county = countyMatch[1].trim();

  const stateMatch = answer.match(stateRegex);
  if (!s.state && stateMatch) out.state = titleCase(stateMatch[0].trim());

  const courtMatch = answer.match(courtRegex);
  if (!s.courtName && courtMatch) out.courtName = courtMatch[0].trim();

  // naive name capture for "I am <name>" or "My name is <name>"
  const nameMatch = answer.match(/\b(I am|I'm|My name is)\s+([A-Z][a-z]+(?:\s+[A-Z]\.)?(?:\s+[A-Z][a-z]+)+)\b/);
  if (!s.partyYou && nameMatch) out.partyYou = nameMatch[2];

  return out;
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// ---------------------- QUESTION FLOW (25) ----------------------
const QUESTIONS: QA[] = [
  {
    id: 'intro',
    ask: () =>
      "Hi there 👋 I'm Khristian, your AI legal assistant. I'll guide this like an experienced attorney — one question at a time. To begin, what court is handling your matter (e.g., King County Superior Court or U.S. District Court, W.D. Wash.)?",
    shouldAsk: s => !s.courtName,
    extract: (a, s) => extractFields(a, s),
  },
  {
    id: 'division',
    ask: s =>
      `Thanks — noted${s.courtName ? `: ${s.courtName}` : ''}. If applicable, what division or location (e.g., Seattle, Kent, Division I)?`,
    shouldAsk: () => true,
    extract: a => {
      const division = (a || '').trim();
      return division ? { courtName: undefined } : {}; // leave courtName untouched; division stored inside courtName parenthetically by Step 2 if needed
    },
  },
  {
    id: 'county',
    ask: () => 'Which county is on the caption (if any)?',
    shouldAsk: s => !s.county,
    extract: (a, s) => extractFields(a, s),
  },
  {
    id: 'state',
    ask: () => 'What state is this in?',
    shouldAsk: s => !s.state,
    extract: (a, s) => extractFields(a, s),
  },
  {
    id: 'caseNumber',
    ask: () => 'Do you know the case number? If yes, please paste it exactly as shown on filings.',
    shouldAsk: s => !s.caseNumber,
    extract: (a, s) => extractFields(a, s),
  },
  {
    id: 'yourName',
    ask: () => 'What is your full legal name as it appears in court documents?',
    shouldAsk: s => !s.partyYou,
    extract: (a, s) => extractFields(a, s),
  },
  {
    id: 'oppParty',
    ask: () => 'Who is on the other side? Please list the opposing party name(s) and their role (e.g., Plaintiff, Respondent, Superintendent).',
    shouldAsk: s => !s.opposingParty,
    extract: (a) => ({ opposingParty: a.trim() }),
  },
  {
    id: 'oppRole',
    ask: () => 'How are you listed in the case (e.g., Defendant, Petitioner, Appellant)?',
    shouldAsk: s => !s.partyOpposingRole,
    extract: (a) => ({ partyOpposingRole: a.trim() }),
  },
  {
    id: 'matterType',
    ask: () => 'Briefly, what kind of legal matter is this (e.g., unlawful detainer, post-conviction petition, wage claim, civil rights)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'facts1',
    ask: () => 'Give me the short version of the facts: what happened and when?',
    shouldAsk: s => !s.factsSummary,
    extract: (a) => ({ factsSummary: a.trim() }),
  },
  {
    id: 'facts2',
    ask: () => 'Are there any key documents, orders, or exhibits I should be aware of (e.g., lease, police report, management agreement, medical records)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'filings',
    ask: () => 'What has been filed so far by either side (motions, answers, appeals)? Include dates if you have them.',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'deadlines',
    ask: () => 'Are there any upcoming hearings, deadlines, or renotes I should target?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'goals',
    ask: () => 'What outcome are you aiming for right now (e.g., dismissal, summary judgment, stay of sentence, settlement)?',
    shouldAsk: s => !s.goals,
    extract: (a) => ({ goals: a.trim() }),
  },
  {
    id: 'relief',
    ask: () => 'If we draft a filing, what relief should it ask for in plain English (what do you want the judge to order)?',
    shouldAsk: s => !s.reliefRequested,
    extract: (a) => ({ reliefRequested: a.trim() }),
  },
  {
    id: 'docType',
    ask: () => 'Which are you looking to create: a letter, motion, petition, or legal brief? (If unsure, say "not sure" and I'll recommend.)',
    shouldAsk: s => !s.documentType,
    extract: (a) => {
      const t = a.toLowerCase();
      let documentType: GenerationState['documentType'] = 'other';
      if (t.includes('letter')) documentType = 'letter';
      else if (t.includes('motion')) documentType = 'motion';
      else if (t.includes('petition')) documentType = 'petition';
      else if (t.includes('brief')) documentType = 'brief';
      return { documentType };
    },
  },
  {
    id: 'adverseFacts',
    ask: () => 'Any tough facts or weaknesses I should anticipate (missed deadlines, adverse orders, bad facts)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'evidence',
    ask: () => 'What evidence best supports your position (witnesses, texts, emails, videos, receipts)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'priorCounsel',
    ask: () => 'Have you had an attorney before on this matter? If so, any advice or filings from them I should consider?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'service',
    ask: () => 'Any issues with service, notice, or procedure that you believe are important (e.g., improper service)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'caseLaw',
    ask: () => 'Do you want me to include legal authority and case law where helpful? (Yes/No — you can always add more later.)',
    shouldAsk: s => typeof s.includeCaseLaw === 'undefined',
    extract: (a) => {
      const y = a.trim().toLowerCase();
      return { includeCaseLaw: y.startsWith('y') || y === '1' || y === 'true' };
    },
  },
  {
    id: 'serviceAddress',
    ask: () => 'Where should legal correspondence go (e.g., mailing address or facility address)?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'toneLen',
    ask: () => 'Any style preferences for the document (formal/concise, assertive/neutral)? If none, I'll use a polished, court-ready tone.',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'finalCheck1',
    ask: (s) =>
      `Quick check: I have ${s.partyYou ? s.partyYou : 'your name'}, ${s.opposingParty ? s.opposingParty : 'opposing party pending'}, ${s.courtName ? s.courtName : 'court pending'}, ${s.caseNumber ? s.caseNumber : 'case # pending'}. Anything to correct?`,
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'finalCheck2',
    ask: () => 'Great. Any final details you want in the document before I draft?',
    shouldAsk: () => true,
    extract: () => ({}),
  },
  {
    id: 'readyToDraft',
    ask: () =>
      'I believe I have what I need to draft your document. When you're ready, click "Continue to Final Step" to generate your court-ready draft.',
    shouldAsk: () => true,
    extract: () => ({}),
  },
];

// ---------------------- COMPONENT ----------------------
export default function LegalChatStructured() {
  const [messages, setMessages] = useState<Array<{ role: Role; content: string }>>([]);
  const [input, setInput] = useState('');
  const [state, setState] = useState<GenerationState>({});
  const [qIndex, setQIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  // load persisted
  useEffect(() => {
    const s = loadState();
    const c = loadChat();
    setState(s);
    setMessages(c);
  }, []);

  // persist on changes
  useEffect(() => saveState(state), [state]);
  useEffect(() => saveChat(messages), [messages]);

  // start interview once
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    enqueueNextQuestion(loadState(), loadChat(), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activePlan = useMemo(() => QUESTIONS, []);

  function findNextIndex(s: GenerationState, from = 0) {
    for (let i = from; i < activePlan.length; i++) {
      const q = activePlan[i];
      if (q.shouldAsk ? q.shouldAsk(s) : true) return i;
    }
    return activePlan.length - 1;
  }

  function enqueueNextQuestion(s: GenerationState, current: Array<{ role: Role; content: string }>, first = false) {
    const idx = findNextIndex(s, first ? 0 : qIndex + 1);
    setQIndex(idx);
    const q = activePlan[idx];
    const prompt = q.ask(s);
    const add: Array<{ role: Role; content: string }> = first
      ? [{ role: 'assistant', content: prompt }]
      : [...current, { role: 'assistant', content: prompt }];
    setMessages(add);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const prev = [...messages, { role: 'user', content: text }];

    // extract fields for current question
    const currentQ = activePlan[qIndex];
    let updates: Partial<GenerationState> = {};
    if (currentQ?.extract) {
      try {
        updates = { ...updates, ...currentQ.extract(text, state) };
      } catch {
        // no-op on extractor issues
      }
    } else {
      updates = { ...updates, ...extractFields(text, state) };
    }

    const nextState = { ...state, ...updates, chatHistory: prev };
    setMessages(prev);
    setState(nextState);
    setInput('');

    // craft an acknowledgment line that feels human
    const ack = makeAcknowledgement(text);

    // append ack, then next question
    const afterAck = [...prev, { role: 'assistant', content: ack }];
    setMessages(afterAck);

    // small delay to feel conversational (no timers if you prefer instant)
    setTimeout(() => {
      enqueueNextQuestion(nextState, afterAck);
      inputRef.current?.focus();
    }, 100);
  }

  function makeAcknowledgement(answer: string) {
    const trimmed = answer.slice(0, 240);
    if (trimmed.length < 6) return 'Understood. Thanks.';
    return `Thank you — noted. ${shortReflect(trimmed)}.`;
  }

  function shortReflect(s: string) {
    // simple reflective summary — trims to a short clause
    const parts = s.split(/[.?!]\s/).filter(Boolean);
    const first = parts[0] || s;
    return first.length > 120 ? first.slice(0, 120) + '…' : first;
  }

  function handleClear() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(CHAT_KEY);
    setState({});
    setMessages([]);
    setQIndex(0);
    enqueueNextQuestion({}, [], true);
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-2xl font-semibold">Step 1 — Legal Chat</h1>
        <button onClick={handleClear} className="text-sm px-3 py-1 rounded border">Clear Chat</button>
      </div>

      <div className="border rounded-xl p-4 h-[60vh] overflow-y-auto bg-white">
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === 'assistant' ? '' : 'text-right'}`}>
            <div
              className={`inline-block px-4 py-2 rounded-2xl ${
                m.role === 'assistant' ? 'bg-gray-100' : 'bg-blue-100'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' ? handleSend() : undefined}
          placeholder="Type your answer…"
          className="flex-1 border rounded-xl px-4 py-2"
        />
        <button onClick={handleSend} className="px-4 py-2 rounded-xl bg-black text-white">
          Send
        </button>
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Just so you know — I'm not an attorney. I don't get tired, upset, or biased. I'm here to give you the strongest legal
        support I can based on what you share with me.
      </p>
    </div>
  );
}




