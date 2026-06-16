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

  const startSession = async (sessionNumber) => {
    const { data } = await supabase
      .from('sessions')
      .insert({ game_id: GAME_ID, session_number: sessionNumber, is_active: true })
      .select()
      .single();
    setSession(data);
    return data;
  };

  const endSession = async (sessionId, recap = '') => {
    await supabase
      .from('sessions')
      .update({ is_active: false, closed_at: new Date().toISOString(), recap })
      .eq('id', sessionId);
    setSession(null);
  };

  return { session, loading, startSession, endSession, refetch: fetch };
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
    const { data } = await supabase
      .from('characters')
      .insert({ ...charData, game_id: GAME_ID })
      .select()
      .single();
    setCharacters(prev => [...prev, data]);
    return data;
  };

  const updateCharacter = async (id, updates) => {
    const { data } = await supabase
      .from('characters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
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
    const { data } = await supabase
      .from('npcs')
      .insert({ ...npcData, game_id: GAME_ID })
      .select()
      .single();
    setNpcs(prev => [...prev, data]);
    return data;
  };

  const updateNPC = async (id, updates) => {
    const { data } = await supabase
      .from('npcs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
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
    const { data } = await supabase
      .from('quests')
      .insert({ ...questData, game_id: GAME_ID, session_id: sessionId })
      .select()
      .single();
    setQuests(prev => [...prev, data]);
    return data;
  };

  const updateQuest = async (id, updates) => {
    const { data } = await supabase
      .from('quests')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
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
    const { data } = await supabase
      .from('map_pins')
      .insert({ ...pinData, game_id: GAME_ID })
      .select()
      .single();
    setPins(prev => [...prev, data]);
    return data;
  };

  const updatePin = async (id, updates) => {
    const { data } = await supabase
      .from('map_pins')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    setPins(prev => prev.map(p => p.id === id ? data : p));
    return data;
  };

  const deletePin = async (id) => {
    await supabase.from('map_pins').delete().eq('id', id);
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
      const { data } = await supabase
        .from('faction_reputation')
        .update({ reputation: newVal, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      setReps(prev => ({ ...prev, [faction]: data }));
    } else {
      const { data } = await supabase
        .from('faction_reputation')
        .insert({ game_id: GAME_ID, faction, reputation: newVal })
        .select()
        .single();
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
    const { data } = await supabase
      .from('encounter_log')
      .insert({ ...entry, game_id: GAME_ID })
      .select()
      .single();
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
