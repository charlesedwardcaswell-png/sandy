import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket for drag-and-drop image uploads (Tileset options, GM Settings images, portraits/
// tokens). Must be created on the live Supabase instance before this works - see SQL migrations /
// Storage setup section in sandy-current-state.md. Public bucket: uploaded images need to be
// readable by anyone with the URL (players, no auth), same trust model as every other image URL
// already used throughout the app.
export const IMAGE_BUCKET = 'sandy-images';

// Matches the file size limit set on the sandy-images bucket itself (Supabase Dashboard -> Storage ->
// sandy-images -> bucket settings). Checked client-side too so the person gets an immediate, readable
// message instead of waiting on a round-trip just to hit the same limit as a raw storage error.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// Uploads a File to the image bucket and returns its public URL, or throws with a message suitable
// for showing directly to the user (bucket-not-found is the expected failure before Charles sets it
// up - callers should catch and alert() rather than let this reach an error boundary).
export async function uploadImage(file, pathPrefix = 'uploads') {
  if (!file || !file.type?.startsWith('image/')) throw new Error('Not an image file');
  if (file.size > IMAGE_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`That image is ${mb}MB - the limit is ${IMAGE_MAX_BYTES / (1024 * 1024)}MB. Try a smaller file or compress it first.`);
  }
  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { upsert: false, cacheControl: '31536000' });
  if (error) {
    if (error.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(`Storage bucket "${IMAGE_BUCKET}" doesn't exist yet - ask your GM to set it up (see sandy-current-state.md).`);
    }
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
