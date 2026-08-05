import type { SupabaseClient } from '@supabase/supabase-js';
import type { GeneratedImage } from './ai/imageGen';

// Every image everywhere else in this project (article.imageUrl,
// club.logo, player.image...) is just an admin-pasted external URL —
// there was no file-upload/storage code in this project at all before
// AI image generation needed one. Generated images come back as raw
// bytes (base64), not a URL, so they need somewhere permanent to live;
// the 'article-images' bucket + this upload helper is that.
//
// Requires the storage bucket created in
// supabase/migrations/004_article_images_bucket.sql to have been run.
export async function uploadGeneratedImage(
  admin: SupabaseClient,
  image: GeneratedImage,
  pathHint: string
): Promise<string> {
  const ext = image.mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const path = `${pathHint}.${ext}`;
  const bytes = Buffer.from(image.base64, 'base64');

  const { error } = await admin.storage.from('article-images').upload(path, bytes, {
    contentType: image.mimeType,
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = admin.storage.from('article-images').getPublicUrl(path);
  return data.publicUrl;
}
