import { NextRequest, NextResponse } from 'next/server';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  html?: string;
  timestamp: number;
  read: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, prompt, context } = body;

    switch (action) {
      case 'analyze':
        return analyzeEmail(email);
      case 'suggestions':
        return generateUsernameSuggestions();
      case 'chat':
        return handleChat(prompt, context);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function analyzeEmail(email: Email) {
  // Simulate AI analysis
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const phishingIndicators = [
    email.from.includes('verify'),
    email.from.includes('confirm'),
    email.subject.toLowerCase().includes('urgent'),
    email.subject.toLowerCase().includes('action required'),
    email.body.toLowerCase().includes('click here'),
    email.body.toLowerCase().includes('suspended'),
  ];

  const riskScore = phishingIndicators.filter(Boolean).length;
  const phishingRisk: 'Low' | 'Medium' | 'High' =
    riskScore >= 4 ? 'High' : riskScore >= 2 ? 'Medium' : 'Low';

  // Generate summary
  const sentences = email.body.split('.').filter((s) => s.trim().length > 0);
  const summary = sentences.slice(0, 3).map((s) => s.trim() + '.');

  return NextResponse.json({
    summary,
    phishingRisk,
    suggestions: [
      phishingRisk === 'High'
        ? '⚠️ यह ईमेल संदिग्ध लग रहा है। किसी भी लिंक पर क्लिक न करें।'
        : phishingRisk === 'Medium'
        ? '⚠️ सावधानी बरतें। भेजने वाले को verify करें।'
        : '✓ यह ईमेल सुरक्षित लगता है।',
    ],
  });
}

async function generateUsernameSuggestions() {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const adjectives = ['swift', 'clever', 'bright', 'quick', 'sharp', 'smart'];
  const nouns = ['fox', 'wolf', 'eagle', 'tiger', 'falcon', 'hawk'];
  const suffixes = ['123', '456', '2024', 'x', 'pro', 'dev'];

  const suggestions = [];
  for (let i = 0; i < 6; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    suggestions.push(`${adj}${noun}${suffix}`);
  }

  return NextResponse.json({ suggestions });
}

async function handleChat(prompt: string, context: any) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simple keyword-based responses
  const lowerPrompt = prompt.toLowerCase();

  let response = '';

  if (lowerPrompt.includes('summary') || lowerPrompt.includes('summarize')) {
    response = context
      ? `यह ईमेल ${context.from} से है और विषय "${context.subject}" है। मुख्य बात: ${context.body.substring(0, 100)}...`
      : 'कृपया पहले कोई ईमेल चुनें।';
  } else if (lowerPrompt.includes('safe') || lowerPrompt.includes('phishing')) {
    response = 'मैं इस ईमेल की जांच कर रहा हूं। कृपया संदिग्ध लिंक पर क्लिक न करें।';
  } else if (lowerPrompt.includes('help')) {
    response = 'मैं आपकी ईमेल summarize करने, phishing detect करने, और username suggestions देने में मदद कर सकता हूं।';
  } else {
    response = 'मैं आपकी मदद करने के लिए यहां हूं। कृपया मुझे बताएं कि आपको क्या चाहिए।';
  }

  return NextResponse.json({ response });
}
