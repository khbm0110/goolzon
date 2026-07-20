import type { AIProvider } from './types';
import { createOpenAICompatibleProvider } from './openaiCompatible';
import { createGeminiProvider } from './gemini';
import { createAnthropicProvider } from './anthropic';

// The "top 10" list. Model name strings drift often — every provider
// can be overridden without a code change via its {X}_MODEL env var
// (e.g. OPENAI_MODEL=gpt-4.1-mini). Switching WHICH provider is active
// is a dropdown in لوحة التحكم → الأتمتة, not a deploy — this file only
// needs to change when adding a brand-new provider that isn't here yet.
export const AI_PROVIDERS: AIProvider[] = [
  createOpenAICompatibleProvider({
    id: 'openai',
    name: 'ChatGPT (OpenAI)',
    envKey: 'OPENAI_API_KEY',
    modelEnvKey: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  }),
  createAnthropicProvider({
    id: 'anthropic',
    name: 'Claude (Anthropic)',
    envKey: 'ANTHROPIC_API_KEY',
    modelEnvKey: 'ANTHROPIC_MODEL',
    defaultModel: 'claude-3-5-sonnet-latest',
  }),
  createGeminiProvider({
    id: 'gemini',
    name: 'Gemini (Google)',
    envKey: 'GEMINI_API_KEY',
    modelEnvKey: 'GEMINI_MODEL',
    defaultModel: 'gemini-2.0-flash',
  }),
  createOpenAICompatibleProvider({
    id: 'deepseek',
    name: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    modelEnvKey: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
    baseUrl: 'https://api.deepseek.com/v1',
  }),
  createOpenAICompatibleProvider({
    id: 'qwen',
    name: 'Qwen (Alibaba)',
    envKey: 'QWEN_API_KEY',
    modelEnvKey: 'QWEN_MODEL',
    defaultModel: 'qwen-plus',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  }),
  createOpenAICompatibleProvider({
    id: 'groq',
    name: 'Llama (عبر Groq)',
    envKey: 'GROQ_API_KEY',
    modelEnvKey: 'GROQ_MODEL',
    defaultModel: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  }),
  createOpenAICompatibleProvider({
    id: 'mistral',
    name: 'Mistral',
    envKey: 'MISTRAL_API_KEY',
    modelEnvKey: 'MISTRAL_MODEL',
    defaultModel: 'mistral-large-latest',
    baseUrl: 'https://api.mistral.ai/v1',
  }),
  createOpenAICompatibleProvider({
    id: 'xai',
    name: 'Grok (xAI)',
    envKey: 'XAI_API_KEY',
    modelEnvKey: 'XAI_MODEL',
    defaultModel: 'grok-2-latest',
    baseUrl: 'https://api.x.ai/v1',
  }),
  createOpenAICompatibleProvider({
    id: 'perplexity',
    name: 'Perplexity',
    envKey: 'PERPLEXITY_API_KEY',
    modelEnvKey: 'PERPLEXITY_MODEL',
    defaultModel: 'sonar',
    baseUrl: 'https://api.perplexity.ai',
  }),
  createOpenAICompatibleProvider({
    id: 'moonshot',
    name: 'Kimi (Moonshot)',
    envKey: 'MOONSHOT_API_KEY',
    modelEnvKey: 'MOONSHOT_MODEL',
    defaultModel: 'moonshot-v1-8k',
    baseUrl: 'https://api.moonshot.cn/v1',
  }),
];

export function getProvider(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}
