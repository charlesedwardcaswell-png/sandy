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

// Separate bucket from images - 3D model files (.glb/.gltf) are typically much larger than the
// portraits/icons/tokens IMAGE_BUCKET is sized for, so this gets its own, higher, limit rather than
// sharing IMAGE_MAX_BYTES. Must be created on the live Supabase instance before this works - same
// "public bucket + explicit INSERT policy" setup as sandy-images, see sandy-current-state.md.
export const MODEL_BUCKET = 'sandy-3d-assets';
export const MODEL_MAX_BYTES = 25 * 1024 * 1024; // 25MB - generous for a single glTF/.glb prop or tile

// Uploads a 3D model File (.glb/.gltf) and returns its public URL - same throw-a-readable-message
// contract as uploadImage. glTF's "embedded" .glb form is a single binary file (textures/materials
// packed in), which is what this expects; a "separate .gltf + .bin + textures" export would need each
// file uploaded and kept together, which isn't handled here yet - .glb only for now, simpler and it's
// what most free/cheap asset sites (Kenney.nl, Quaternius, Sketchfab, itch.io) offer directly anyway.
export async function uploadModel(file, pathPrefix = 'uploads') {
  if (!file) throw new Error('No file given');
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (ext !== 'glb' && ext !== 'gltf') throw new Error('Only .glb or .gltf files are supported.');
  if (file.size > MODEL_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`That model is ${mb}MB - the limit is ${MODEL_MAX_BYTES / (1024 * 1024)}MB.`);
  }
  const path = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(MODEL_BUCKET).upload(path, file, { upsert: false, cacheControl: '31536000' });
  if (error) {
    if (error.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(`Storage bucket "${MODEL_BUCKET}" doesn't exist yet - ask your GM to set it up (see sandy-current-state.md).`);
    }
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from(MODEL_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// Icon Library (games.settings.icon_library) - unlike IMAGE_BUCKET/MODEL_BUCKET above, this bucket is
// populated by Charles dragging a whole pre-made icon pack into the Supabase Dashboard directly, not
// through in-app uploads - these helpers only ever READ the bucket's file listing (to auto-match/pick
// icons by name), never write to it. See TilesetTab.jsx's IconLibraryPanel for the actual UI.
export const ICON_BUCKET = 'sandy-icons';

// Supabase Storage's .list() caps out at 1000 entries per call - a 6000-file pack needs pagination to
// enumerate in full. Only called once per session (on "Auto-Match" click), result cached by the caller.
export async function listAllIcons() {
  const PAGE = 1000;
  let offset = 0;
  let all = [];
  for (;;) {
    const { data, error } = await supabase.storage.from(ICON_BUCKET).list('', { limit: PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error) {
      if (error.message?.toLowerCase().includes('bucket not found')) {
        throw new Error(`Storage bucket "${ICON_BUCKET}" doesn't exist yet - see sandy-current-state.md for setup.`);
      }
      throw new Error(error.message);
    }
    if (!data || data.length === 0) break;
    all = all.concat(data.filter(f => f.id)); // .list() also returns folder placeholder entries with no id - skip those
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  return all.map(f => ({ name: f.name, url: supabase.storage.from(ICON_BUCKET).getPublicUrl(f.name).data.publicUrl }));
}

// Lightweight search for the per-row manual picker (typing "sword" while assigning one entry) - doesn't
// need the full 6000-file list, just whatever Storage's own search matches.
export async function searchIcons(term) {
  if (!term || !term.trim()) return [];
  const { data, error } = await supabase.storage.from(ICON_BUCKET).list('', { limit: 30, search: term.trim() });
  if (error) return [];
  return (data || []).filter(f => f.id).map(f => ({ name: f.name, url: supabase.storage.from(ICON_BUCKET).getPublicUrl(f.name).data.publicUrl }));
}

// Sound effect uploads (Sound Effects tab) - custom audio to override the app's bundled/synthesized
// cues (click, success, failure, dice roll, explosion, chest open, damage). Own bucket since audio
// files are a different size/type profile than icons or portrait images.
export const AUDIO_BUCKET = 'sandy-sounds';
export const AUDIO_MAX_BYTES = 3 * 1024 * 1024; // 3MB - generous for a short sound effect (not music)

export async function uploadAudio(file, pathPrefix = 'uploads') {
  if (!file || !file.type?.startsWith('audio/')) throw new Error('Not an audio file');
  if (file.size > AUDIO_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`That sound is ${mb}MB - the limit is ${AUDIO_MAX_BYTES / (1024 * 1024)}MB. A sound effect should be short - trim it or use a lower bitrate.`);
  }
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
  const path = `${pathPrefix}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(AUDIO_BUCKET).upload(path, file, { upsert: false, cacheControl: '31536000' });
  if (error) {
    if (error.message?.toLowerCase().includes('bucket not found')) {
      throw new Error(`Storage bucket "${AUDIO_BUCKET}" doesn't exist yet - ask your GM to set it up (see sandy-current-state.md).`);
    }
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
