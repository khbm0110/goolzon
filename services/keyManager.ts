import { Category } from '../types';

// These are the environment variable names to be configured in Vercel.
const KEY_NAMES = {
    ARABIC: 'GEMINI_API_KEY_ARABIC_LEAGUES',
    SPANISH: 'GEMINI_API_KEY_SPANISH_LEAGUES',
    ENGLISH: 'GEMINI_API_KEY_ENGLISH_LEAGUES',
    DEFAULT: 'GEMINI_API_KEY_DEFAULT',
    // Legacy fallback for single-key setup
    LEGACY: 'API_KEY', 
};

// Keywords to determine which key to use based on a topic string.
const KEYWORD_TRIGGERS = {
    ARABIC: ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'السعودي', 'الإماراتي', 'قطر', 'الكويت', 'عمان', 'البحرين', 'العين', 'السد'],
    SPANISH: ['ريال مدريد', 'برشلونة', 'الإسباني', 'أتلتيكو'],
    ENGLISH: ['مانشستر', 'ليفربول', 'أرسنال', 'تشيلسي', 'الإنجليزي', 'أبطال أوروبا', 'champions league'],
};

/**
 * Gets the most appropriate Gemini API key based on keywords in the topic.
 * Falls back to a default key if no specific category is matched.
 * @param topic The topic string to analyze.
 * @returns The selected API key string, or null if no keys are configured.
 */
export const getGeminiApiKeyForTopic = (topic: string): string | null => {
    const topicLower = topic.toLowerCase();

    if (KEYWORD_TRIGGERS.ARABIC.some(kw => topicLower.includes(kw))) {
        return process.env[KEY_NAMES.ARABIC] || process.env[KEY_NAMES.DEFAULT] || process.env[KEY_NAMES.LEGACY] || null;
    }
    if (KEYWORD_TRIGGERS.SPANISH.some(kw => topicLower.includes(kw))) {
        return process.env[KEY_NAMES.SPANISH] || process.env[KEY_NAMES.DEFAULT] || process.env[KEY_NAMES.LEGACY] || null;
    }
    if (KEYWORD_TRIGGERS.ENGLISH.some(kw => topicLower.includes(kw))) {
        return process.env[KEY_NAMES.ENGLISH] || process.env[KEY_NAMES.DEFAULT] || process.env[KEY_NAMES.LEGACY] || null;
    }

    // Default fallback order: specific default, then legacy key.
    return process.env[KEY_NAMES.DEFAULT] || process.env[KEY_NAMES.LEGACY] || null;
};

/**
 * Specifically gets the API key designated for fetching Gulf/Arabic headlines.
 * @returns The Arabic-specific API key or a fallback, or null.
 */
export const getGeminiApiKeyForHeadlines = (): string | null => {
    return process.env[KEY_NAMES.ARABIC] || process.env[KEY_NAMES.DEFAULT] || process.env[KEY_NAMES.LEGACY] || null;
};
