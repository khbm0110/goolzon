// AI image generation for autopilot-written articles. Deliberately kept
// separate from the AIProvider.complete() text abstraction in
// providers.ts: image APIs have a completely different request/response
// shape than chat completions, and — unlike text rewriting — only a
// couple of the 10 configured providers actually offer image
// generation at all (Groq/DeepSeek/Qwen/Mistral/xAI/Perplexity/Moonshot
// are text-only; Anthropic has no image-gen API either). So this only
// ever tries Gemini (Imagen) or OpenAI, regardless of which provider an
// agent is configured to use for its text — an agent using e.g. Groq
// for writing can still get a Gemini-generated image if GEMINI_API_KEY
// is set.
//
// Safety note: the prompt built below is deliberately generic (league/
// category + generic action-shot phrasing) and never includes a real
// player's name or a club's actual crest — asking an image model to
// depict a specific real, named person is exactly the kind of request
// providers themselves reject or produce unreliable likenesses for, and
// it's not something this project should be doing automatically at
// scale for every headline anyway. This gives every article a relevant
// generic editorial header image, not a (fake) photo of the real event.

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

function buildGenericPrompt(category: string): string {
  return (
    `Professional sports editorial photograph, football/soccer atmosphere related to ${category}. ` +
    'Wide shot of a stadium or pitch, dramatic stadium lighting, motion blur suggesting action, ' +
    'green grass, crowd in soft focus in the background. ' +
    'No visible text, no logos, no crests, no recognizable real faces. ' +
    'Photorealistic, high quality, 16:9 composition.'
  );
}

async function generateWithGemini(category: string): Promise<GeneratedImage | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: buildGenericPrompt(category) }],
        parameters: { sampleCount: 1 },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini (Imagen) request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const prediction = json?.predictions?.[0];
  if (!prediction?.bytesBase64Encoded) throw new Error('Gemini (Imagen): empty response');
  return { base64: prediction.bytesBase64Encoded, mimeType: prediction.mimeType || 'image/png' };
}

async function generateWithOpenAI(category: string): Promise<GeneratedImage | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: buildGenericPrompt(category),
      size: '1536x1024',
      n: 1,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI (images) request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error('OpenAI (images): empty response');
  return { base64: b64, mimeType: 'image/png' };
}

// Tries Gemini first (it's already the default text provider for every
// seeded agent, so GEMINI_API_KEY is the most likely to already be set),
// then falls back to OpenAI if that's not configured. Returns null —
// never throws — if neither is configured or generation fails, since a
// missing header image should never block an article from publishing.
export async function generateArticleImage(category: string): Promise<GeneratedImage | null> {
  for (const generator of [generateWithGemini, generateWithOpenAI]) {
    try {
      const image = await generator(category);
      if (image) return image;
    } catch {
      // Try the next provider; the caller treats a null return the same
      // as "no image available" either way.
    }
  }
  return null;
}
