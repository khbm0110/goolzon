import type { AIProvider, AIProviderConfig, RewrittenArticle } from './types';
import { buildRewritePrompt, parseRewriteResponse } from './prompt';

export function createGeminiProvider(config: AIProviderConfig): AIProvider {
  return {
    ...config,
    isConfigured() {
      return Boolean(process.env[config.envKey]);
    },
    async rewrite(sourceText: string, sourceTitle: string): Promise<RewrittenArticle> {
      const apiKey = process.env[config.envKey];
      if (!apiKey) throw new Error(`${config.name}: ${config.envKey} is not set`);
      const model = process.env[config.modelEnvKey] || config.defaultModel;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: buildRewritePrompt(sourceTitle, sourceText) }] }],
          }),
        }
      );

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${config.name} request failed (${res.status}): ${body.slice(0, 300)}`);
      }

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`${config.name}: empty response`);
      return parseRewriteResponse(text);
    },
  };
}
