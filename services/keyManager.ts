// FIX: Removed reference to "vite/client" which was causing a resolution error.

// These are the environment variable names to be configured in Vercel.
// Client-side variables MUST be prefixed with VITE_.
const KEY_NAMES = {
    ARABIC: 'VITE_GEMINI_API_KEY_ARABIC_LEAGUES',
    SPANISH: 'VITE_GEMINI_API_KEY_SPANISH_LEAGUES',
    ENGLISH: 'VITE_GEMINI_API_KEY_ENGLISH_LEAGUES',
    DEFAULT: 'VITE_GEMINI_API_KEY_DEFAULT',
    // Legacy fallback for single-key setup
    LEGACY: 'VITE_GEMINI_API_KEY', // Renamed from API_KEY to be client-accessible
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

    // In a Vite project, client-side env vars are exposed on import.meta.env.
    // FIX: Using type assertion as a workaround for misconfigured Vite/TS environment.
    const env = (import.meta as any).env;

    if (KEYWORD_TRIGGERS.ARABIC.some(kw => topicLower.includes(kw))) {
        return env[KEY_NAMES.ARABIC] || env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
    }
    if (KEYWORD_TRIGGERS.SPANISH.some(kw => topicLower.includes(kw))) {
        return env[KEY_NAMES.SPANISH] || env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
    }
    if (KEYWORD_TRIGGERS.ENGLISH.some(kw => topicLower.includes(kw))) {
        return env[KEY_NAMES.ENGLISH] || env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
    }

    // Default fallback order: specific default, then legacy key.
    return env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
};

/**
 * Specifically gets the API key designated for fetching Gulf/Arabic headlines.
 * @returns The Arabic-specific API key or a fallback, or null.
 */
export const getGeminiApiKeyForHeadlines = (): string | null => {
    // In a Vite project, client-side env vars are exposed on import.meta.env.
    // FIX: Using type assertion as a workaround for misconfigured Vite/TS environment.
    const env = (import.meta as any).env;
    return env[KEY_NAMES.ARABIC] || env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
};

/**
 * Gets the dedicated API key for performance data sync.
 * This function remains using process.env as it's intended for server-side functions.
 * @returns The performance data API key or a fallback.
 */
export const getPerformanceDataApiKey = (): string | null => {
    return process.env.APIFOOTBALL_KEY_PERFORMANCE_DATA || process.env.VITE_APIFOOTBALL_KEY || null;
};