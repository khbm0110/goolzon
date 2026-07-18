// A rewritten article, in our own words, ready to slot into the
// `articles` table shape.
export interface RewrittenArticle {
  title: string;
  summary: string;
  content: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  envKey: string; // which env var holds this provider's API key
  modelEnvKey: string; // env var that can override the default model
  defaultModel: string;
}

export interface AIProvider extends AIProviderConfig {
  isConfigured(): boolean;
  rewrite(sourceText: string, sourceTitle: string): Promise<RewrittenArticle>;
}
