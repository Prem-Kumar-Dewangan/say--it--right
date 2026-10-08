// Utility to validate if a message or instruction has meaningful communicative content to rewrite.
// Detects random gibberish, keyboard smashing (e.g. 'jdnfefenf', 'asdfghjk', 'zzzzz'),
// purely numeric/symbol strings, and nonsense sequences without human communicative intent.

const COMMON_RECOGNIZED_WORDS = new Set([
  // Basic pronouns, verbs, prepositions, conjunctions
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'theirs',
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'so', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'to', 'with', 'from', 'about', 'into', 'over', 'after', 'before', 'between', 'under', 'through',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'doing', 'done',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'no', 'not', 'yes', 'yeah', 'yep', 'nope', 'ok', 'okay', 'hi', 'hey', 'hello', 'bye', 'goodbye', 'thanks', 'thank', 'thx', 'please', 'pls', 'sorry',

  // Workplace, instructions & communication
  'call', 'text', 'meet', 'meeting', 'work', 'office', 'time', 'day', 'today', 'tomorrow', 'yesterday', 'later', 'now', 'soon',
  'boss', 'sir', 'maam', 'madam', 'colleague', 'team', 'manager', 'lead', 'client', 'customer', 'bro', 'dude', 'friend',
  'update', 'project', 'deadline', 'task', 'mail', 'email', 'message', 'draft', 'report', 'review', 'code', 'file',
  'urgent', 'delay', 'delayed', 'late', 'early', 'leave', 'sick', 'vacation', 'holiday', 'pto', 'wfh', 'fyi', 'asap', 'pr', 'hr',
  'talk', 'speak', 'discuss', 'help', 'assist', 'need', 'want', 'give', 'take', 'send', 'ask', 'tell', 'know', 'think',
  'good', 'bad', 'great', 'fine', 'better', 'best', 'well', 'sure', 'fine', 'happy', 'sad', 'angry', 'upset',
  'reschedule', 'cancel', 'reminder', 'schedule', 'appointment', 'doctor', 'hospital', 'medical', 'emergency',
  'make', 'shorten', 'lengthen', 'soften', 'firmer', 'warmer', 'polite', 'direct', 'clear', 'clarify', 'tone', 'rewrite',
  'add', 'remove', 'change', 'adjust', 'sound', 'more', 'less', 'formal', 'casual', 'friendly', 'professional',
  'why', 'what', 'when', 'where', 'how', 'who', 'which',

  // Hinglish & Romanized Hindi common vocabulary
  'bhai', 'yaar', 'bhaiya', 'didi', 'sahab', 'sahib',
  'chal', 'chalo', 'chalte', 'chala', 'chali', 'aao', 'aaunga', 'aaungi', 'aaoge', 'aana', 'aaj', 'kal', 'parso',
  'khane', 'khana', 'khate', 'peene', 'peena', 'milte', 'milna', 'milo', 'batao', 'bata', 'bol', 'bolo', 'sun', 'suno',
  'hain', 'hai', 'ho', 'hoon', 'tha', 'thi', 'the', 'hoga', 'hogi', 'honge',
  'main', 'mera', 'meri', 'mere', 'hum', 'humaara', 'hamaari', 'aap', 'aapka', 'aapki', 'aapke', 'tum', 'tumhara', 'tumhari',
  'kya', 'kyu', 'kyun', 'kaise', 'kaha', 'kahan', 'kab', 'kaun', 'kitna', 'kitne', 'kitni',
  'nahi', 'na', 'mat', 'haan', 'sahi', 'galat', 'theek', 'thik', 'accha', 'achha', 'achhi', 'badhiya',
  'paunga', 'paungi', 'sakta', 'sakti', 'sakte', 'kar', 'karna', 'karo', 'karega', 'karenge', 'karta', 'karti',
  'baat', 'dekh', 'dekho', 'samajh', 'samjha', 'kaam', 'paisa', 'paise', 'baje', 'subah', 'shaam', 'raat', 'dopahar',
  'chutti', 'doctor', 'hospital', 'tabiyat', 'madad'
]);

// Known keyboard walk or smash fragments
const KEYBOARD_SMASH_PATTERNS = [
  /^[asdfghjkl]+$/i,
  /^[qwertyuiop]+$/i,
  /^[zxcvbnm]+$/i,
  /jdnf|dfef|efenf|dnfe/i,
  /asdf|sdfg|dfgh|fghj|ghjk|hjkl|jkl;|qwerty|werty|ertyu|rtyui|tyuio|yuio|uiop|zxcv|xcvb|cvbn|vbnm/i,
  /[bcdfghjklmnpqrstvwxyz]{5,}/i, // 5+ consecutive consonants
  /^[jqzxbcdfghjkmpqvwxz]{4,}/i   // 4 consonants starting with unusual letters
];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMeaningfulMessage(text: string | null | undefined): ValidationResult {
  if (!text || typeof text !== 'string') {
    return { isValid: false, error: 'Enter valid msg' };
  }

  const trimmed = text.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  // Allow non-Latin scripts (Devanagari, Assamese/Bengali, Tamil, Telugu, etc.)
  // Range \u0900-\u0D7F
  const indicChars = trimmed.match(/[\u0900-\u0D7F]/g);
  if (indicChars && indicChars.length >= 2) {
    return { isValid: true };
  }

  // Check if string contains only symbols or numbers
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, '').toLowerCase();
  if (lettersOnly.length < 2) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  // Repeated single character like "aaaaaaa", "zzzzz", "xxxxxx"
  if (/^(.)\1{2,}$/.test(lettersOnly)) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  // Explicit check for meaningless string mentioned in prompt or similar keyboard mash
  if (/^jdnfefenf$/i.test(trimmed) || /jdnfefenf/i.test(trimmed)) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  // Extract individual words
  const words = trimmed.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 0);
  if (words.length === 0) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  // Single word evaluation:
  // If the user entered only 1 word, it must be either in COMMON_RECOGNIZED_WORDS,
  // or have a recognized English structure (at least 1 vowel, reasonable ratio, not keyboard smash)
  if (words.length === 1) {
    const word = words[0];
    if (COMMON_RECOGNIZED_WORDS.has(word)) {
      return { isValid: true };
    }
    const isSmash = KEYBOARD_SMASH_PATTERNS.some(pattern => pattern.test(word));
    if (isSmash) {
      return { isValid: false, error: 'Enter valid msg' };
    }
    const vowels = word.match(/[aeiouy]/g) || [];
    if (vowels.length === 0 || vowels.length / word.length < 0.2 || vowels.length / word.length > 0.8) {
      return { isValid: false, error: 'Enter valid msg' };
    }
    // High consonant clusters or random letter patterns
    if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(word) || /(.)\1{2,}/.test(word)) {
      return { isValid: false, error: 'Enter valid msg' };
    }
    // If it's a random word of length >= 6 that isn't recognized and has low phonetic predictability
    if (word.length >= 7 && !COMMON_RECOGNIZED_WORDS.has(word)) {
      // Check for alternating patterns like wioefjiowef or repeating substrings
      if (/([a-z]{3,})\1/.test(word) || !/[aeiouy]/.test(word)) {
        return { isValid: false, error: 'Enter valid msg' };
      }
    }
  }

  let recognizedWordCount = 0;
  let gibberishWordCount = 0;

  for (const word of words) {
    // If in recognized dictionary
    if (COMMON_RECOGNIZED_WORDS.has(word)) {
      recognizedWordCount++;
      continue;
    }

    // Time/number tokens like "10am", "5pm", "9baje", "30%"
    if (/^\d+(am|pm|baje|st|nd|rd|th|%)?$/.test(word)) {
      recognizedWordCount++;
      continue;
    }

    // Check if word hits keyboard smash or impossible consonant clusters
    const isSmash = KEYBOARD_SMASH_PATTERNS.some(pattern => pattern.test(word));
    if (isSmash && !COMMON_RECOGNIZED_WORDS.has(word)) {
      gibberishWordCount++;
      continue;
    }

    // Check vowel presence
    const vowels = word.match(/[aeiouy]/g) || [];
    if (vowels.length === 0 && word.length >= 3) {
      gibberishWordCount++;
      continue;
    }

    // Repeated characters inside a word (e.g. "jddddn", "ffff")
    if (/(.)\1{2,}/.test(word)) {
      gibberishWordCount++;
      continue;
    }

    // Reasonable phonetic length & vowel ratio
    const vowelRatio = vowels.length / word.length;
    if (vowelRatio >= 0.15 && vowelRatio <= 0.85) {
      recognizedWordCount++;
    } else {
      gibberishWordCount++;
    }
  }

  // If there are words but 0 recognized/meaningful words, or gibberish overwhelms:
  if (recognizedWordCount === 0 || (words.length === 1 && gibberishWordCount > 0)) {
    return { isValid: false, error: 'Enter valid msg' };
  }

  return { isValid: true };
}
