import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';
import { TILE_TYPES } from './EncounterTab';

export default function TilesetTab({ isDeveloper }) {
  if (!isDeveloper) return null; // App.js already gates the parent tab; belt and suspenders
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <MasterAtlasPanel />
      <TileDefaultsPanel />
    </div>
  );
}

// ── Master Atlas — the shared 768×768 sprite sheet every Battle Grid's Tileset row draws from ──────
function MasterAtlasPanel() {
  const [atlasUrl, setAtlasUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setAtlasUrl(data?.settings?.master_atlas_url || '');
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), master_atlas_url: atlasUrl } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save master_atlas_url failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>Master Atlas</div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
        768×768 image, 12×12 grid of 64×64 tiles. Rows are tilesets (themes), columns are terrain types —
        a saved Battle Grid's Tileset choice just moves down to a different row of this same shared image.
      </p>
      <input type="text" placeholder="Master atlas image URL" value={atlasUrl}
        onChange={e => setAtlasUrl(e.target.value)} style={{ fontSize: 12, width: '100%', marginBottom: 6 }} />
      <button className="btn btn-p" onClick={save}>{saved ? '✓ Saved' : 'Save Atlas URL'}</button>
    </div>
  );
}

// ── Tile Defaults — default color/icon per terrain type, with an optional default image URL ──────
function TileDefaultsPanel() {
  const [imageUrls, setImageUrls] = useState({});
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      setImageUrls(data?.settings?.tile_default_images || {});
      setLoaded(true);
    });
  }, []);

  const save = async () => {
    const { data: current } = await supabase.from('games').select('settings').eq('id', GAME_ID).single();
    const { error } = await supabase.from('games')
      .update({ settings: { ...(current?.settings || {}), tile_default_images: imageUrls } })
      .eq('id', GAME_ID);
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else console.error('save tile_default_images failed:', error.message);
  };

  if (!loaded) return <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>;

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Each terrain type's default color/label stand-in, until the master atlas image exists. Set an optional
        default image URL per type — once a real tileset image is chosen for a battle grid, that takes priority instead.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '.5rem 1rem', alignItems: 'center' }}>
        {TILE_TYPES.map(t => (
          <React.Fragment key={t.key}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: t.color, display: 'inline-block', border: '1px solid rgba(255,255,255,.2)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{t.short}</span>
            </div>
            <input type="text" placeholder={`Default image URL for ${t.label} (optional)`}
              value={imageUrls[t.key] || ''}
              onChange={e => setImageUrls(prev => ({ ...prev, [t.key]: e.target.value }))}
              style={{ fontSize: 12, padding: '4px 8px' }} />
          </React.Fragment>
        ))}
      </div>
      <button className="btn btn-p" onClick={save} style={{ marginTop: '1rem' }}>
        {saved ? '✓ Saved' : 'Save Defaults'}
      </button>
    </div>
  );
}
