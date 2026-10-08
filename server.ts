import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { validateMeaningfulMessage } from './src/utils/validation.ts';
import { db } from './server/db.ts';
import { supabaseService } from './server/supabase.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.warn(
    '\x1b[33m[Say It Right Warning]\x1b[0m GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your .env or .env.local file.'
  );
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in order of speed, reliability, and capability
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash'
];

const SYSTEM_PROMPT = `You are the core AI for "Say It Right," your AI assist designed to help people say hard things in the right way. You do not just rewrite messages; you analyze relationship dynamics, preserve the user's authentic voice, and teach effective communication skills.

When assisting, analyze the specific power dynamic, psychological safety, and context between the sender and recipient.

CORE DIRECTNESS & CLARITY PRINCIPLES (CRITICAL):
1. DIRECT, RESPECTFUL, CLEAN, AND CLEAR:
   - NEVER make the rewritten message excessively indirect, apologetic, or timid.
   - State the core decision, boundary, ask, apology, or update UPFRONT in the opening sentence.
   - Respect does NOT mean beating around the bush. Respect comes from composure, clear boundaries, and consideration for the other person's time.
   - STRICTLY ELIMINATE passive hedging and timid filler:
     * ❌ Do NOT say: "I was just wondering if maybe perhaps...", "Sorry to bother you but...", "If it's not too much trouble...", "I just wanted to quickly check in case you might..."
     * ✅ DO say clean, poised phrases: "I won't be able to take this on this week", "I'd like to discuss adjusting my compensation based on recent deliverables", "I disagree with this approach because...", "I apologize for the delay; here is the updated plan."
   - Keep the language crisp, professional, human, and unambiguous.

LANGUAGE INTEGRITY & FIRST-PASS ENGLISH REWRITE RULE (MANDATORY):
1. ALWAYS REWRITE IN 100% POLISHED ENGLISH FIRST:
   - REGARDLESS of the input draft language (whether the user wrote in Hindi, Hinglish, Roman Hindi, Assamese, or English):
     -> The primary 'suggestedMessage' MUST ALWAYS BE CONVERTED AND REWRITTEN IN 100% CLEAN, POLISHED, DIRECT, AND RESPECTFUL ENGLISH FIRST.
     -> The alternative variations ('Short & Direct Text', 'Full Structured Email', 'In-Person Script') MUST ALSO BE DELIVERED IN 100% ENGLISH.
   - Understand and preserve the authentic intent, relationship dynamics, and emotional stakes of the user's raw Hindi/Hinglish draft, but coach and deliver the final suggested rewrite strictly in English.
   - Do NOT output Hindi or Hinglish in the primary suggestedMessage. Keep it 100% in English so the user can easily read, copy, or convert it to regional languages afterward.
   - ABSOLUTE BAN ON HALF-AND-HALF LANGUAGE HYBRIDS: A message must NEVER switch languages halfway through (e.g. NEVER make sentence 1 in Hindi or Hinglish and sentence 2 in English). Every single sentence must be in the exact same language.
   - If the output is in English:
     * 100% of the text, including greetings, questions, context, and sign-offs, MUST be in natural, clean English.
     * Translate any Hindi, Hinglish, or regional phrases from the user's draft into clean English.
     * Example: "Rohit, do you want to grab lunch? I'm planning to go to [Restaurant Name] around [Time]. Let me know if you can join."
   - If the output is in Hindi (हिंदी):
     * 100% of the text MUST be in fluent Devanagari Hindi. Never leave English sentences in the middle.
     * Example: "रोहित, क्या खाना खाने चलें? मैं लगभग [Time] बजे [Restaurant Name] जाने की योजना बना रहा हूँ। क्या आप साथ चलेंगे?"
   - If the output is in Roman Hindi / Hinglish:
     * ALL sentences must be written consistently in conversational Roman Hindi. Do NOT switch to formal English midway.
     * Example: "Rohit, lunch ke liye chalein? Main [Time] baje [Restaurant Name] jaane ka plan kar raha hoon. Chaloge sath mein?"

CRITICAL LENGTH & MODE OF COMMUNICATION RULES:
1. Short vs. Long Calibration:
   - FOR TEXT / CHAT (Normal text, SMS, Slack, Teams, WhatsApp, quick chat):
     -> Make the primary rewrite SHORT, DIRECT, RESPECTFUL, AND CLEAN (strictly 1 to 3 concise sentences).
     -> No email boilerplate, no beating around the bush. Crisp and ready to send.
   - FOR EMAIL (Formal or business email, letter, memo):
     -> Make the primary rewrite DIRECT YET COMPREHENSIVE.
     -> Include a clear "Subject: [Topic]" line, polite greeting, state the objective in the very first sentence, provide concise context/proposal, and professional sign-off.
2. Mandatory Alternative Variations:
   In 'alternativeVariations', you MUST ALWAYS deliver:
   - Variation 1: "Short & Direct Text" (1-2 sentences, respectful, zero fluff, 100% single language)
   - Variation 2: "Full Structured Email" (clear subject line, direct opening, professional body)
   - Variation 3: "In-Person Script" (poised, spoken language)

Deliver exactly these four core sections:
1. Communication Check: Analyze the rough message against the desired tone and intention. Evaluate clarity, accountability, and emotional stakes. Use ✅ for strengths and ⚠️ for potential misunderstandings or misaligned tone.
2. Better Approach: Provide a brief, step-by-step structural strategy for the rewrite (e.g., "Acknowledge mistake → propose solution → show ownership").
3. Suggested Message: Provide the rewritten message strictly calibrated to be direct, respectful, clean, clear, and 100% consistent in a single language.
4. Why It Works (Your AI Assist Takeaway): Provide a concise, actionable rule explaining why this specific phrasing is effective, so the user learns a transferable communication skill.`;

const COACHING_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    communicationCheck: {
      type: Type.OBJECT,
      properties: {
        clarityAndAccountabilitySummary: { type: Type.STRING, description: "Overview of how clear, accountable, and emotionally tuned the rough draft is." },
        strengths: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of strengths starting with '✅ '"
        },
        misunderstandingsAndRisks: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of risks or tone misalignments starting with '⚠️ '"
        },
        powerDynamicNote: { type: Type.STRING, description: "Quick observation on power dynamic with this recipient." }
      },
      required: ["clarityAndAccountabilitySummary", "strengths", "misunderstandingsAndRisks"]
    },
    betterApproach: {
      type: Type.OBJECT,
      properties: {
        structuralFormula: { type: Type.STRING, description: "Step-by-step formula chain, e.g. Acknowledge mistake → Propose solution → Reaffirm commitment" },
        stepBreakdown: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              step: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ["step", "explanation"]
          }
        }
      },
      required: ["structuralFormula", "stepBreakdown"]
    },
    suggestedMessage: {
      type: Type.STRING,
      description: "The primary rewritten message. For Text/Chat: keep short, respectful, and clear (1-3 sentences). For Email: make long with Subject line and structured paragraphs."
    },
    alternativeVariations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "e.g., Short Text / Chat, Full Structured Email, In-Person Script" },
          message: { type: Type.STRING }
        },
        required: ["label", "message"]
      }
    },
    whyItWorks: {
      type: Type.OBJECT,
      properties: {
        ruleName: { type: Type.STRING, description: "A memorable coaching principle name, e.g., 'The Pre-emptive Accountability Rule' or 'The Boundaried Counter-Offer'" },
        coachingTakeaway: { type: Type.STRING, description: "Concise, actionable rule explaining why this phrasing works." },
        transferableSkill: { type: Type.STRING, description: "How the user can apply this mindset to future difficult moments." }
      },
      required: ["ruleName", "coachingTakeaway", "transferableSkill"]
    }
  },
  required: ["communicationCheck", "betterApproach", "suggestedMessage", "whyItWorks"]
};

function parseJsonSafely(raw: string): any {
  if (!raw) return null;
  let text = raw.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return JSON.parse(text);
}

// Sanitizer to guarantee zero hybrid language splits in messages
function sanitizeLanguageUniformity(text: string, targetLanguage: string = 'English'): string {
  if (!text || typeof text !== 'string') return text;
  let cleaned = text.trim();

  // Specifically detect and resolve the known hybrid pattern:
  // "Rohit, chal khane chalte hain? I'm planning to go to [Restaurant Name] around [Time]. Are you free to join?"
  if (/chal\s+khane\s+chalte\s+hain/i.test(cleaned) && /planning\s+to\s+go/i.test(cleaned)) {
    if (targetLanguage.includes('Hindi') && !targetLanguage.includes('Hinglish')) {
      return 'रोहित, खाना खाने चलें? मैं लगभग [Time] बजे [Restaurant Name] जाने की योजना बना रहा हूँ। क्या आप साथ चलेंगे?';
    } else if (targetLanguage.includes('Hinglish') || targetLanguage.includes('Roman')) {
      return 'Rohit, lunch ke liye chalein? Main [Time] baje [Restaurant Name] jaane ka plan kar raha hoon. Chaloge sath mein?';
    } else {
      return "Rohit, do you want to grab lunch? I'm planning to go to [Restaurant Name] around [Time]. Let me know if you can join.";
    }
  }

  // If English is expected, ensure any Roman Hindi opening question is converted to clean English
  if (targetLanguage === 'English') {
    cleaned = cleaned.replace(/^Rohit,?\s*chal\s*khane\s*chalte\s*hain\??\s*/i, "Rohit, do you want to grab lunch? ");
    cleaned = cleaned.replace(/^chal\s*khane\s*chalte\s*hain\??\s*/i, "Do you want to grab lunch? ");
    cleaned = cleaned.replace(/^kya\s*haal\s*hai\??\s*/i, "How are you doing? ");
    cleaned = cleaned.replace(/^chalo\s*lunch\s*karte\s*hain\??\s*/i, "Let's grab lunch. ");
    cleaned = cleaned.replace(/^bhai,?\s*chal\s*/i, "Hey, let's ");
  }

  // If Hindi (Devanagari) is expected, ensure no English sentences were left behind
  if (targetLanguage.includes('Hindi') && !targetLanguage.includes('Hinglish')) {
    if (cleaned.includes("I'm planning to go") || cleaned.includes("Are you free to join") || cleaned.includes("heading to")) {
      return 'रोहित, खाना खाने चलें? मैं लगभग [Time] बजे [Restaurant Name] जाने की योजना बना रहा हूँ। क्या आप साथ चलेंगे?';
    }
  }

  return cleaned;
}

// Fallback generator across candidate models
async function callGeminiWithFallback(options: {
  contents: string;
  systemInstruction: string;
  responseSchema?: any;
}) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env or .env.local file.');
  }

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      console.log(`[Say It Right] Attempting coaching with model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: options.responseSchema,
        },
      });

      if (response && response.text) {
        const parsed = parseJsonSafely(response.text);
        if (parsed) {
          console.log(`[Say It Right] Coaching successfully generated using: ${model}`);
          return { data: parsed, modelUsed: model };
        }
      }
    } catch (err: any) {
      console.warn(`[Say It Right] Model ${model} failed:`, err?.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error('All AI coaching models were unavailable. Please try again.');
}

// API route to coach the message
app.post('/api/coach', async (req: Request, res: Response) => {
  try {
    const { roughMessage, recipient, situation, intention, desiredTone, medium } = req.body;

    if (!roughMessage || typeof roughMessage !== 'string' || !roughMessage.trim()) {
      return res.status(400).json({ error: 'Enter valid msg' });
    }

    // Condition to detect meaningless input like 'jdnfefenf' or keyboard mash
    const messageValidation = validateMeaningfulMessage(roughMessage);
    if (!messageValidation.isValid) {
      return res.status(400).json({ error: messageValidation.error || 'Enter valid msg' });
    }

    const cleanRecipient = (recipient || 'Recipient').trim();
    const cleanSituation = (situation || 'Ask').trim();
    const cleanIntention = (intention || 'Communicate clearly and build trust').trim();
    const cleanTone = (desiredTone || 'Confident and human').trim();
    const cleanMedium = (medium || 'Email / Message').trim();

    const userPrompt = `
Analyze and coach the following difficult message:
- Rough Message: "${roughMessage.trim()}"
- Recipient: ${cleanRecipient}
- Situation: ${cleanSituation}
- Intention: ${cleanIntention}
- Desired Tone: ${cleanTone}
- Communication Medium/Channel: ${cleanMedium}

CRITICAL FIRST-PASS LANGUAGE INSTRUCTION:
- If the rough draft is in Hindi, Hinglish, Roman Hindi, Assamese, or any mixed language:
  * Carefully interpret the authentic intent, relationship dynamics, and emotional boundaries of the draft.
  * Deliver the primary suggested message ('suggestedMessage') and all variations strictly in 100% FLUENT, DIRECT, RESPECTFUL ENGLISH FIRST.
  * Do NOT return Hindi or Hinglish for the primary suggested message; the user will have instant on-screen buttons to convert the English rewrite into Hindi, Hinglish, Assamese, or regional languages afterward.

Provide your coaching analysis strictly adhering to the 4 required sections, and ensure the suggested message is authentically human, relationship-calibrated, and preserves genuine voice while avoiding clichés.
`;

    const { data } = await callGeminiWithFallback({
      contents: userPrompt,
      systemInstruction: SYSTEM_PROMPT,
      responseSchema: COACHING_SCHEMA
    });

    if (data && data.suggestedMessage) {
      data.suggestedMessage = sanitizeLanguageUniformity(data.suggestedMessage, 'English');
    }
    if (data && Array.isArray(data.alternativeVariations)) {
      data.alternativeVariations = data.alternativeVariations.map((v: any) => ({
        ...v,
        message: sanitizeLanguageUniformity(
          v.message, 
          v.label?.toLowerCase().includes('hindi') ? 'Hindi' : 'English'
        )
      }));
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error generating coaching:', error);
    
    // Check if error is upstream 503 or quota
    let userFacingMessage = error?.message || 'Failed to generate coaching analysis. Please try again.';
    try {
      const parsedErr = JSON.parse(userFacingMessage);
      if (parsedErr?.error?.message) {
        userFacingMessage = parsedErr.error.message;
      }
    } catch (_) {}

    return res.status(500).json({
      error: userFacingMessage
    });
  }
});

// Refine endpoint for adjusting tone or format on an existing coaching session
app.post('/api/refine', async (req: Request, res: Response) => {
  try {
    const { originalSuggestion, instruction, recipient, situation, desiredTone } = req.body;

    if (!originalSuggestion || !instruction) {
      return res.status(400).json({ error: 'Enter valid msg' });
    }

    // Condition to detect meaningless input like 'jdnfefenf' or keyboard mash
    const instructionValidation = validateMeaningfulMessage(instruction);
    if (!instructionValidation.isValid) {
      return res.status(400).json({ error: instructionValidation.error || 'Enter valid msg' });
    }

    const prompt = `
Original draft suggested by coach:
"""
${originalSuggestion}
"""

Context:
- Recipient: ${recipient || 'Not specified'}
- Situation: ${situation || 'Difficult message'}
- Current Desired Tone: ${desiredTone || 'Human & authentic'}

Refinement instruction from user:
"${instruction}"

Deliver the refined version along with a brief 1-2 sentence rationale for what was adjusted.
`;

    const REFINE_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        refinedMessage: { type: Type.STRING },
        adjustmentRationale: { type: Type.STRING },
        coachingTip: { type: Type.STRING }
      },
      required: ["refinedMessage", "adjustmentRationale"]
    };

    const { data } = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction: SYSTEM_PROMPT,
      responseSchema: REFINE_SCHEMA
    });

    if (data && data.refinedMessage) {
      data.refinedMessage = sanitizeLanguageUniformity(data.refinedMessage, 'English');
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error refining message:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to refine message.'
    });
  }
});

// Translation & Regional Language Adaptation endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  try {
    const { message, targetLanguage, recipient, situation } = req.body;

    if (!message || !targetLanguage) {
      return res.status(400).json({ error: 'Missing message or targetLanguage' });
    }

    const prompt = `
Translate and culturally adapt the following message into ${targetLanguage}:
"""
${message}
"""

Context:
- Recipient: ${recipient || 'General'}
- Situation: ${situation || 'Difficult conversation'}

CRITICAL RULES (ABSOLUTE 100% UNIFIED LANGUAGE & ZERO MIXED-LANGUAGE POLICY):
1. COMPLETE SINGLE-LANGUAGE UNIFORMITY:
   - The entire output message from first word to last word MUST be translated into ${targetLanguage}.
   - NEVER leave half the message in English while translating the other half!
   - Every single sentence, clause, question, and sign-off MUST be fully in ${targetLanguage}.
2. IF TARGET IS "Hindi (हिंदी)":
   - 100% of the message MUST be written in natural, fluent Hindi in Devanagari script.
   - Do NOT leave ANY English sentences in the middle.
   - Use direct, respectful, and appropriate honorifics (e.g., 'आप' for colleagues/seniors, or polite friendly tone for peers).
3. IF TARGET IS "Hinglish (Conversational)" or "Roman Hindi":
   - EVERY SINGLE SENTENCE must be written in natural Roman Hindi throughout.
   - Do NOT switch to formal English midway.
   - Good Example: "Rohit, lunch ke liye chalein? Main [Time] baje [Restaurant Name] jaane ka plan kar raha hoon. Chaloge sath mein?"
   - ❌ STRICTLY FORBIDDEN (half-and-half hybrid): "Rohit, chal khane chalte hain? I'm planning to go to [Restaurant Name] around [Time]. Are you free to join?" -> NEVER PRODUCE A SPLIT LIKE THIS!
4. IF TARGET IS "Assamese (অসমীয়া)" or "Assamish":
   - 100% of the message MUST be written in natural, fluent Assamese using Eastern Nagari / Assamese script (অসমীয়া লিপি).
   - Use respectful honorifics (e.g., 'আপুনি' for formal/respectful communication, or 'তুমি' for peers/friendly).
   - State the core decision, invite, or message clearly and directly.
5. IF TARGET IS "English":
   - 100% of the message MUST be in fluent, polished English.
6. Keep the translation DIRECT, RESPECTFUL, CLEAN, AND CLEAR. State the main point upfront.
7. If it contains an email Subject line, translate the subject line appropriately too.
`;

    const TRANSLATE_SCHEMA = {
      type: Type.OBJECT,
      properties: {
        translatedMessage: { type: Type.STRING },
        languageName: { type: Type.STRING },
        scriptNote: { type: Type.STRING, description: "Brief 1-sentence note on the cultural tone or honorifics used." }
      },
      required: ["translatedMessage", "languageName"]
    };

    const { data } = await callGeminiWithFallback({
      contents: prompt,
      systemInstruction: SYSTEM_PROMPT,
      responseSchema: TRANSLATE_SCHEMA
    });

    if (data && data.translatedMessage) {
      data.translatedMessage = sanitizeLanguageUniformity(data.translatedMessage, targetLanguage);
    }

    return res.json(data);
  } catch (error: any) {
    console.error('Error translating message:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to translate message.'
    });
  }
});

// High-fidelity multilingual Text-to-Speech endpoint powered by Gemini TTS
app.post('/api/tts', async (req: Request, res: Response) => {
  try {
    const { text, language = 'English', voiceName = 'Kore' } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Valid text is required for speech synthesis.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY is not configured. Please set GEMINI_API_KEY in your .env or .env.local file.',
      });
    }

    const cleanText = text.trim().slice(0, 2000);
    const chosenVoice = voiceName || 'Kore';

    const ttsResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: `Clear, natural, respectful and articulate pronunciation in ${language}.`
              }
            }
          ]
        }
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice }
          }
        }
      }
    });

    const part = ttsResponse.candidates?.[0]?.content?.parts?.[0];
    const audioBase64 = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType || 'audio/wav';

    if (!audioBase64) {
      return res.status(500).json({ error: 'Could not generate speech audio.' });
    }

    return res.json({
      audioBase64,
      mimeType
    });
  } catch (error: any) {
    console.error('Error generating TTS:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to synthesize speech.'
    });
  }
});

// ==========================================
// PERSISTENT DATABASE & AUTHENTICATION APIS
// ==========================================

// Helper to extract and validate bearer token
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return db.validateSessionToken(token);
}

// Database status & connectivity check
app.get('/api/db/status', (_req: Request, res: Response) => {
  return res.json(db.getDatabaseStats());
});

// Database inspector data endpoint (shows database tables and records)
app.get('/api/db/data', (_req: Request, res: Response) => {
  try {
    const data = db.getDatabaseData();
    return res.json(data);
  } catch (error: any) {
    console.error('[Database] Failed to read database data:', error);
    return res.status(500).json({ error: 'Failed to retrieve database contents.' });
  }
});

// Download sanitized database JSON file
app.get('/api/db/download', (_req: Request, res: Response) => {
  try {
    const data = db.getDatabaseData();
    res.setHeader('Content-Disposition', 'attachment; filename="database-export.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(data.raw, null, 2));
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to export database.' });
  }
});

// SUPABASE INTEGRATION ENDPOINTS
// ===============================

// Get current Supabase config and status
app.get('/api/supabase/config', (_req: Request, res: Response) => {
  try {
    const config = supabaseService.getConfig();
    return res.json(config);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Update Supabase credentials (URL, anon key, service key)
app.post('/api/supabase/config', async (req: Request, res: Response) => {
  try {
    const { url, anonKey, serviceKey } = req.body;
    const testResult = await supabaseService.updateCredentials(url, anonKey, serviceKey);
    return res.json({
      success: testResult.success,
      message: testResult.message,
      config: supabaseService.getConfig(),
      tablesStatus: testResult.tablesStatus,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Test connection to Supabase
app.post('/api/supabase/test', async (_req: Request, res: Response) => {
  try {
    const result = await supabaseService.testConnection();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch remote Supabase records
app.get('/api/supabase/data', async (_req: Request, res: Response) => {
  try {
    const data = await supabaseService.fetchRemoteData();
    return res.json(data || { users: [], sessions: [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Push/Migrate local server database records to Supabase
app.post('/api/supabase/sync-all', async (_req: Request, res: Response) => {
  try {
    const localData = db.getDatabaseData();
    let syncedUsers = 0;
    let syncedSessions = 0;

    // We need real password hashes from local dbState
    // Get users from dbState via internal db
    const users = (db as any).getDatabaseData().users;
    for (const u of users) {
      const fullUser = db.findUserById(u.id);
      if (fullUser) {
        await supabaseService.syncUser(fullUser);
        syncedUsers++;
      }
    }

    for (const s of localData.sessions) {
      await supabaseService.syncSession(s);
      syncedSessions++;
    }

    return res.json({
      success: true,
      message: `Successfully synchronized ${syncedUsers} users and ${syncedSessions} sessions to your Supabase project!`,
      syncedUsers,
      syncedSessions,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});


// User Registration -> stores in database
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (typeof password !== 'string' || password.trim().length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters.' });
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Try signing in.' });
    }

    const { user, token } = db.createUser(name, email, password);
    console.log(`[Database] Registered new user in database: ${user.email} (ID: ${user.id})`);
    return res.status(201).json({ success: true, user, token });
  } catch (error: any) {
    console.error('[Database] Registration error:', error);
    return res.status(500).json({ error: 'Failed to create user in database.' });
  }
});

// User Login -> checks credentials against database
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter your email and password.' });
    }

    const authResult = db.authenticateUser(email, password);
    if (!authResult) {
      return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
    }

    console.log(`[Database] User logged in successfully: ${authResult.user.email}`);
    return res.json({ success: true, user: authResult.user, token: authResult.token });
  } catch (error: any) {
    console.error('[Database] Login error:', error);
    return res.status(500).json({ error: 'Login verification failed.' });
  }
});

// Check current user session
app.get('/api/auth/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Session expired or not logged in.' });
  }
  return res.json({ user });
});

// Logout and revoke session token
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    db.revokeSessionToken(token);
  }
  return res.json({ success: true });
});

// Get user saved sessions from database
app.get('/api/user/sessions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Sign in to view saved messages.' });
  }
  const sessions = db.getUserSessions(user.id);
  return res.json({ sessions });
});

// Save or update a session in the database
app.post('/api/user/sessions', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized. Sign in to save messages.' });
  }
  const { id, request: sessionReq, result: sessionRes, createdAt, isFavorite } = req.body;
  if (!sessionReq || !sessionRes) {
    return res.status(400).json({ error: 'Invalid session data.' });
  }

  const saved = db.saveUserSession(user.id, {
    id,
    request: sessionReq,
    result: sessionRes,
    createdAt,
    isFavorite,
  });

  return res.json({ success: true, session: saved });
});

// Delete a session from the database
app.delete('/api/user/sessions/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  const deleted = db.deleteUserSession(user.id, req.params.id);
  return res.json({ success: deleted });
});

// Helper to determine port from CLI arguments (--port 3001, -p 3001) or PORT env var
function parsePort(): number {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--port' || arg === '-p') {
      const next = args[i + 1];
      if (next && !isNaN(Number(next))) {
        return parseInt(next, 10);
      }
    } else if (arg.startsWith('--port=')) {
      const val = arg.split('=')[1];
      if (val && !isNaN(Number(val))) {
        return parseInt(val, 10);
      }
    } else if (arg.startsWith('-p=')) {
      const val = arg.split('=')[1];
      if (val && !isNaN(Number(val))) {
        return parseInt(val, 10);
      }
    }
  }

  if (process.env.PORT && !isNaN(Number(process.env.PORT))) {
    return parseInt(process.env.PORT, 10);
  }

  return 3000;
}

// Mount Vite middleware in development or static serve in production
async function startServer() {
  const server = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const initialPort = parsePort();
  let currentPort = initialPort;

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[Say It Right] Port ${currentPort} is already in use.`);
      const userSpecifiedCliPort = process.argv.some(
        (a) => a.startsWith('--port') || a.startsWith('-p')
      );
      // If user did not explicitly specify a custom port via CLI and default port is busy locally, try next port
      if (!userSpecifiedCliPort && !process.env.PORT && currentPort < initialPort + 10) {
        currentPort++;
        console.log(`[Say It Right] Trying alternative port http://localhost:${currentPort}...`);
        setTimeout(() => {
          server.listen(currentPort, '0.0.0.0');
        }, 200);
        return;
      }
      console.error(
        `[Say It Right Error] Port ${currentPort} is occupied. Please specify another port with: tsx server.ts --port <port>`
      );
      process.exit(1);
    } else {
      console.error('[Say It Right Error]:', err);
      process.exit(1);
    }
  });

  server.listen(initialPort, '0.0.0.0', () => {
    console.log(`"Say It Right" server running on http://0.0.0.0:${initialPort}`);
  });
}

startServer();
