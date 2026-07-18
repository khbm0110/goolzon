import type { AIProvider, AIProviderConfig, RewrittenArticle } from './types';
import { buildRewritePrompt, parseRewriteResponse } from './prompt';

export function createAnthropicProvider(config: AIProviderConfig): AIProvider {
  return {
    ...config,
    isConfigured() {
      return Boolean(process.env[config.envKey]);
    },
    async rewrite(sourceText: string, sourceTitle: string): Promise<RewrittenArticle> {
      const apiKey = process.env[config.envKey];
      if (!apiKey) throw new Error(`${config.name}: ${config.envKey} is not set`);
      const model = process.env[config.modelEnvKey] || config.defaultModel;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 2000,
          messages: [{ role: 'user', content: buildRewritePrompt(sourceTitle, sourceText) }],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`${config.name} request failed (${res.status}): ${body.slice(0, 300)}`);
      }

      const json = await res.json();
      const text = json?.content?.[0]?.text;
      if (!text) throw new Error(`${config.name}: empty response`);
      return parseRewriteResponse(text);
    },
  };
}
