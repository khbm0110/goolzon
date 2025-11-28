const KEY_NAMES = {
    ARABIC: 'VITE_GEMINI_API_KEY_ARABIC_LEAGUES',
    SPANISH: 'VITE_GEMINI_API_KEY_SPANISH_LEAGUES',
    ENGLISH: 'VITE_GEMINI_API_KEY_ENGLISH_LEAGUES',
    DEFAULT: 'VITE_GEMINI_API_KEY_DEFAULT',
    LEGACY: 'VITE_GEMINI_API_KEY',
};

const KEYWORD_TRIGGERS = {
    ARABIC: ['الهلال', 'النصر', 'الاتحاد', 'الأهلي', 'السعودي', 'الإماراتي', 'قطر', 'الكويت', 'عمان', 'البحرين', 'العين', 'السد'],
    SPANISH: ['ريال مدريد', 'برشلونة', 'الإسباني', 'أتلتيكو'],
    ENGLISH: ['مانشستر', 'ليفربول', 'أرسنال', 'تشيلسي', 'الإنجليزي', 'أبطال أوروبا', 'champions league'],
};

export const getGeminiApiKeyForTopic = (topic: string): string | null => {
    const topicLower = topic.toLowerCase();
    // Fix: Cast import.meta to any
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

    return env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
};

export const getGeminiApiKeyForHeadlines = (): string | null => {
    // Fix: Cast import.meta to any
    const env = (import.meta as any).env;
    return env[KEY_NAMES.ARABIC] || env[KEY_NAMES.DEFAULT] || env[KEY_NAMES.LEGACY] || null;
};