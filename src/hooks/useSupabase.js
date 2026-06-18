import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

// ── Generic hook ──────────────────────────────────────────────────────────────
export function useSupabase(table, query = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let q = supabase.from(table).select(query.select || '*');
    if (query.eq) Object.entries(query.eq).forEach(([k, v]) => { q = q.eq(k, v); });
    if (query.order) q = q.order(query.order, { ascending: query.ascending ?? true });
    if (query.single) q = q.single();
    const { data: result, error: err } = await q;
    setData(result);
    setError(err);
    setLoading(false);
  }, [table, JSON.stringify(query)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ── Game ──────────────────────────────────────────────────────────────────────
export function useGame() {
  return useSupabase('games', { eq: { id: GAME_ID }, single: true });
}

// ── Session ───────────────────────────────────────────────────────────────────
export function useActiveSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('game_id', GAME_ID)
      .eq('is_active', true)
      .maybeSingle();
    setSession(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time subscription — keeps all clients in sync when encounter_data changes
  useEffect(() => {
    const channel = supabase
      .channel('session_sync_' + GAME_ID)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'sessions',
        filter: `game_id=eq.${GAME_ID}`,
      }, payload => {
        if (payload.new?.is_active) {
          // Parse encounter_data if it came back as a string
          const newSession = { ...payload.new };
          if (typeof newSession.encounter_data === 'string') {
            try { newSession.encounter_data = JSON.parse(newSession.encounter_data); } catch {}
          }
          setSession(newSession);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const startSession = async (sessionNumber) => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ game_id: GAME_ID, session_number: sessionNumber, is_active: true })
      .select()
      .single();
    if (error) { console.error('startSession failed:', error.message, error.code, error.details, error.hint); return null; }
    setSession(data);
    return data;
  };

  const endSession = async (sessionId, recap = '') => {
    await supabase
      .from('sessions')
      .update({ is_active: false, closed_at: new Date().toISOString(), recap, encounter_data: null })
      .eq('id', sessionId);
    setSession(null);
  };

  const saveEncounter = async (sessionId, encounterState) => {
    if (!sessionId) return;
    await supabase
      .from('sessions')
      .update({ encounter_data: encounterState })
      .eq('id', sessionId);
  };

  const saveEventLog = async (sessionId, events) => {
    if (!sessionId) return;
    await supabase
      .from('sessions')
      .update({ event_log: events })
      .eq('id', sessionId);
  };

  return { session, loading, startSession, endSession, saveEncounter, saveEventLog, refetch: fetch };
}

// ── Characters ────────────────────────────────────────────────────────────────
export function useCharacters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('created_at');
    setCharacters(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createCharacter = async (charData) => {
    const { data, error } = await supabase
      .from('characters')
      .insert({ ...charData, game_id: GAME_ID })
      .select()
      .single();
    if (error) { console.error('createCharacter error:', error); return null; }
    if (data) setCharacters(prev => [...prev, data]);
    return data;
  };

  const updateCharacter = async (id, updates) => {
    const { data, error } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updateCharacter failed:', error.message); return null; }
    setCharacters(prev => prev.map(c => c.id === id ? data : c));
    return data;
  };

  const deleteCharacter = async (id) => {
    await supabase.from('characters').delete().eq('id', id);
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // Real-time subscription
  useEffect(() => {
    const sub = supabase
      .channel('characters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `game_id=eq.${GAME_ID}` },
        payload => {
          if (payload.eventType === 'UPDATE') {
            setCharacters(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
          } else if (payload.eventType === 'INSERT') {
            setCharacters(prev => [...prev.filter(c => c.id !== payload.new.id), payload.new]);
          } else if (payload.eventType === 'DELETE') {
            setCharacters(prev => prev.filter(c => c.id !== payload.old.id));
          }
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  return { characters, loading, createCharacter, updateCharacter, deleteCharacter, refetch: fetch };
}

// ── NPCs ──────────────────────────────────────────────────────────────────────
export function useNPCs() {
  const [npcs, setNpcs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('npcs')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('faction');
    setNpcs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createNPC = async (npcData) => {
    const { data, error } = await supabase
      .from('npcs')
      .insert({ ...npcData, game_id: GAME_ID })
      .select()
      .single();
    if (error) { console.error('createNPC error:', error); return null; }
    if (data) setNpcs(prev => [...prev, data]);
    return data;
  };

  const updateNPC = async (id, updates) => {
    const { data, error } = await supabase
      .from('npcs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updateNPC failed:', error.message); return null; }
    setNpcs(prev => prev.map(n => n.id === id ? data : n));
    return data;
  };

  const deleteNPC = async (id) => {
    await supabase.from('npcs').delete().eq('id', id);
    setNpcs(prev => prev.filter(n => n.id !== id));
  };

  // Real-time
  useEffect(() => {
    const sub = supabase
      .channel('npcs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'npcs', filter: `game_id=eq.${GAME_ID}` },
        payload => {
          if (payload.eventType === 'UPDATE') setNpcs(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          else if (payload.eventType === 'INSERT') setNpcs(prev => [...prev.filter(n => n.id !== payload.new.id), payload.new]);
          else if (payload.eventType === 'DELETE') setNpcs(prev => prev.filter(n => n.id !== payload.old.id));
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  return { npcs, loading, createNPC, updateNPC, deleteNPC, refetch: fetch };
}

// ── Quests ────────────────────────────────────────────────────────────────────
export function useQuests(sessionId) {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('quests')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('sort_order');
    setQuests(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createQuest = async (questData) => {
    const { data, error } = await supabase
      .from('quests')
      .insert({ ...questData, game_id: GAME_ID, session_id: sessionId || null })
      .select()
      .single();
    if (error) { console.error('createQuest failed:', error.message, error.code); return null; }
    if (data) setQuests(prev => [...prev, data]);
    return data;
  };

  const updateQuest = async (id, updates) => {
    const { data, error } = await supabase
      .from('quests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updateQuest failed:', error.message); return null; }
    setQuests(prev => prev.map(q => q.id === id ? data : q));
    return data;
  };

  return { quests, loading, createQuest, updateQuest, refetch: fetch };
}

// ── Map Pins ──────────────────────────────────────────────────────────────────
export function useMapPins() {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('map_pins')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('created_at');
    setPins(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const createPin = async (pinData) => {
    const { data, error } = await supabase
      .from('map_pins')
      .insert({ ...pinData, game_id: GAME_ID })
      .select()
      .single();
    if (error) { console.error('createPin failed:', error.message, error.details); return null; }
    if (data) setPins(prev => [...prev, data]);
    return data;
  };

  const updatePin = async (id, updates) => {
    const { data, error } = await supabase
      .from('map_pins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updatePin failed:', error.message); return null; }
    if (data) setPins(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePin = async (id) => {
    const { error } = await supabase.from('map_pins').delete().eq('id', id);
    if (error) { console.error('deletePin failed:', error.message); return; }
    setPins(prev => prev.filter(p => p.id !== id));
  };

  return { pins, loading, createPin, updatePin, deletePin, refetch: fetch };
}

// ── Faction Reputation ────────────────────────────────────────────────────────
export function useFactionReputation() {
  const [reps, setReps] = useState({});
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('faction_reputation')
      .select('*')
      .eq('game_id', GAME_ID);
    const map = {};
    (data || []).forEach(r => { map[r.faction] = r; });
    setReps(map);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateRep = async (faction, delta) => {
    const current = reps[faction];
    const newVal = Math.max(-3, Math.min(3, (current?.reputation || 0) + delta));
    if (current) {
      const { data, error } = await supabase
        .from('faction_reputation')
        .update({ reputation: newVal, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      if (error) { console.error('updateRep failed:', error.message); return; }
      setReps(prev => ({ ...prev, [faction]: data }));
    } else {
      const { data, error } = await supabase
        .from('faction_reputation')
        .insert({ game_id: GAME_ID, faction, reputation: newVal })
        .select()
        .single();
      if (error) { console.error('updateRep insert failed:', error.message); return; }
      setReps(prev => ({ ...prev, [faction]: data }));
    }
  };

  return { reps, loading, updateRep, refetch: fetch };
}

// ── Encounter Log ─────────────────────────────────────────────────────────────
export function useEncounterLog() {
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('encounter_log')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('created_at', { ascending: false });
    setLog(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addEntry = async (entry) => {
    const { data, error } = await supabase
      .from('encounter_log')
      .insert({ ...entry, game_id: GAME_ID })
      .select()
      .single();
    if (error) { console.error('addEntry failed:', error.message); return null; }
    setLog(prev => [data, ...prev]);
    return data;
  };

  return { log, loading, addEntry, refetch: fetch };
}

// ── Group Inventory ───────────────────────────────────────────────────────────
export function useGroupInventory() {
  const [inventory, setInventory] = useState({ copper: 0, items: [] });
  const [inventoryId, setInventoryId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('group_inventory')
      .select('*')
      .eq('game_id', GAME_ID)
      .maybeSingle();
    if (data) {
      setInventory({ copper: data.copper, items: data.items || [] });
      setInventoryId(data.id);
    } else {
      // Create default inventory record
      const { data: created } = await supabase
        .from('group_inventory')
        .insert({ game_id: GAME_ID, copper: 0, items: [] })
        .select()
        .single();
      if (created) {
        setInventoryId(created.id);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateInventory = async (updates) => {
    const newState = { ...inventory, ...updates };
    setInventory(newState);
    if (inventoryId) {
      await supabase
        .from('group_inventory')
        .update({ ...newState, updated_at: new Date().toISOString() })
        .eq('id', inventoryId);
    }
  };

  return { inventory, loading, updateInventory };
}

// ── Session Log ───────────────────────────────────────────────────────────────
export function useSessionLog() {
  const [sessionLog, setSessionLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('game_id', GAME_ID)
      .eq('is_active', false)
      .order('session_number', { ascending: false });
    setSessionLog(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { sessionLog, loading, refetch: fetch };
}

// ── Game passwords ─────────────────────────────────────────────────────────────
export function useGamePasswords() {
  const [playerPassword, setPlayerPassword] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('games')
      .select('player_password')
      .eq('id', GAME_ID)
      .single();
    setPlayerPassword(data?.player_password || '');
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const savePlayerPassword = async (pw) => {
    await supabase
      .from('games')
      .update({ player_password: pw })
      .eq('id', GAME_ID);
    setPlayerPassword(pw);
  };

  return { playerPassword, loading, savePlayerPassword };
}
