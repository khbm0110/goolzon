import type { AIProvider, AIProviderConfig, RewrittenArticle } from './types';
import { buildRewritePrompt, parseRewriteResponse } from './prompt';

// Covers every provider whose API mimics OpenAI's /chat/completions
// shape — which today is most of them (OpenAI itself, DeepSeek, Qwen,
// Groq, Mistral, xAI/Grok, Perplexity, Moonshot...). Adding a new one
// later is just another config entry in providers.ts, never a new
// adapter file or a site redeploy of core logic.
export function createOpenAICompatibleProvider(config: AIProviderConfig & { baseUrl: string }): AIProvider {
  return {
    ...config,
    isConfigured() {
      return Boolean(process.env[config.envKey]);
    },
    async rewrite(sourceText: string, sourceTitle: string): Promise<RewrittenArticle> {
      const apiKey = process.env[config.envKey];
      if (!apiKey) throw new Error(`${config.name}: ${config.envKey} is not set`);
      const model = process.env[config.modelEnvKey] || config.defaultModel;

      const res = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: buildRewritePrompt(sourceTitle, sourceText) }],
          temperature: 0.6,
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${config.name} request failed (${res.status}): ${body.slice(0, 300)}`);
      }

      const json = await res.json();
      const text = json?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${config.name}: empty response`);
      return parseRewriteResponse(text);
    },
  };
}
