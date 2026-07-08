import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetch = useCallback(async () => {
    // Only the very first load should show the full-page spinner - a background refetch
    // (e.g. after Wipe All Sessions) must not flip this back to true, since App.js swaps its
    // entire render tree for <Loading/> while this is true, unmounting and resetting all UI state.
    if (!hasLoadedOnce.current) setLoading(true);
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('session_number', { ascending: true });
    const all = data || [];
    setAllSessions(all);
    setSession(all.find(s => s.is_active) || null);
    setLoading(false);
    hasLoadedOnce.current = true;
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Real-time subscription - keeps all clients in sync when encounter_data changes
  useEffect(() => {
    const channel = supabase
      .channel('session_sync_' + GAME_ID)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sessions',
        filter: `game_id=eq.${GAME_ID}`,
      }, payload => {
        if (payload.eventType === 'DELETE') {
          setAllSessions(prev => prev.filter(s => s.id !== payload.old?.id));
          setSession(prev => prev?.id === payload.old?.id ? null : prev);
          return;
        }
        const incoming = { ...payload.new };
        if (typeof incoming.encounter_data === 'string') {
          try { incoming.encounter_data = JSON.parse(incoming.encounter_data); } catch {}
        }
        setAllSessions(prev => {
          const exists = prev.find(s => s.id === incoming.id);
          const merged = exists ? { ...exists, ...incoming } : incoming;
          return exists ? prev.map(s => s.id === incoming.id ? merged : s) : [...prev, merged].sort((a,b) => a.session_number - b.session_number);
        });
        // Merge (not replace) so a realtime payload missing unchanged columns - e.g. Supabase only sends
        // changed columns on UPDATE without REPLICA IDENTITY FULL - can't wipe fields like encounter_data
        // client-side just because a DIFFERENT column (event_log, etc.) was what actually changed. This
        // was the root cause of encounters randomly bouncing to the downtime screen mid-session; a refresh
        // "fixed" it because fetch() always pulls the complete row, but the realtime merge didn't.
        if (incoming.is_active) setSession(prev => prev?.id === incoming.id ? { ...prev, ...incoming } : incoming);
        else setSession(prev => prev?.id === incoming.id ? null : prev);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const startSession = async (sessionNumber) => {
    // Close any currently active session first
    const active = allSessions.find(s => s.is_active);
    if (active) await supabase.from('sessions').update({ is_active: false, closed_at: new Date().toISOString() }).eq('id', active.id);
    const { data, error } = await supabase
      .from('sessions')
      .insert({ game_id: GAME_ID, session_number: sessionNumber, is_active: true })
      .select()
      .single();
    if (error) { console.error('startSession failed:', error.message); return null; }
    setSession(data);
    setAllSessions(prev => [...prev.map(s => ({ ...s, is_active: false })), data].sort((a,b) => a.session_number - b.session_number));
    return data;
  };

  const activateSession = async (sessionId) => {
    // Mark a different existing session as active (for pre-prepared sessions)
    const active = allSessions.find(s => s.is_active);
    if (active) await supabase.from('sessions').update({ is_active: false }).eq('id', active.id);
    const { data, error } = await supabase.from('sessions').update({ is_active: true }).eq('id', sessionId).select().single();
    if (error) { console.error('activateSession failed:', error.message); return; }
    setAllSessions(prev => prev.map(s => ({ ...s, is_active: s.id === sessionId })));
    setSession(data);
  };

  const createPrepSession = async (sessionNumber, title = '') => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({ game_id: GAME_ID, session_number: sessionNumber, is_active: false, title: title || `Session ${sessionNumber}`, prepared_encounters: [] })
      .select()
      .single();
    if (error) { console.error('createPrepSession failed:', error.message); return null; }
    setAllSessions(prev => [...prev, data].sort((a,b) => a.session_number - b.session_number));
    return data;
  };

  // Restores an archived session (started and/or closed) back to prepped status - doesn't touch any
  // of its recorded history (recap, encounter_log, etc.), just flips it back to selectable in Session
  // Prep. Refuses to unretire the CURRENTLY active session (that's what "End Session" is for).
  const unretireSession = async (sessionId) => {
    const target = allSessions.find(s => s.id === sessionId);
    if (!target || target.id === session?.id) return;
    const { data, error } = await supabase.from('sessions')
      .update({ is_active: false, closed_at: null })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) { console.error('unretireSession failed:', error.message); return; }
    setAllSessions(prev => prev.map(s => s.id === sessionId ? data : s));
  };

  const endSession = async (sessionId, recap = '') => {
    await supabase
      .from('sessions')
      .update({ is_active: false, closed_at: new Date().toISOString(), recap, encounter_data: null })
      .eq('id', sessionId);
    setSession(null);
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, is_active: false, closed_at: new Date().toISOString() } : s));
  };

  // Merge-patch a session's recap JSON - used for live GM Notes / Player Notes editing on any session
  // (active or archived), separate from the one-time end-of-session recap form.
  const updateSessionRecap = async (sessionId, patch) => {
    const target = allSessions.find(s => s.id === sessionId) || session;
    if (!target) return;
    let current = {};
    try { current = JSON.parse(target.recap || '{}'); } catch { current = {}; }
    const merged = { ...current, ...patch };
    const newRecapStr = JSON.stringify(merged);
    await supabase.from('sessions').update({ recap: newRecapStr }).eq('id', sessionId);
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, recap: newRecapStr } : s));
    if (session?.id === sessionId) setSession(prev => ({ ...prev, recap: newRecapStr }));
  };

  const saveEncounter = async (sessionId, encounterState) => {
    if (!sessionId) return;
    await supabase.from('sessions').update({ encounter_data: encounterState }).eq('id', sessionId);
  };

  const saveEventLog = async (sessionId, events) => {
    if (!sessionId) return;
    await supabase.from('sessions').update({ event_log: events }).eq('id', sessionId);
  };

  const savePreparedEncounters = async (sessionId, prepEncounters) => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ prepared_encounters: prepEncounters }).eq('id', sessionId);
    if (error) { console.error('savePreparedEncounters failed:', error.message); return; }
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, prepared_encounters: prepEncounters } : s));
    if (session?.id === sessionId) setSession(prev => ({ ...prev, prepared_encounters: prepEncounters }));
  };

  const savePreparedQuests = async (sessionId, prepQuests) => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ prepared_quests: prepQuests }).eq('id', sessionId);
    if (error) { console.error('savePreparedQuests failed:', error.message); return; }
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, prepared_quests: prepQuests } : s));
    if (session?.id === sessionId) setSession(prev => ({ ...prev, prepared_quests: prepQuests }));
  };

  // prepared_reveals associates EXISTING quests/npcs/shops/gm-inventory-items with a not-yet-started
  // session by id - nothing is created here. Actually revealing/moving them happens when the session
  // activates (see applySessionReveals in App.js), matching the "reveal, don't materialize" model.
  const savePreparedReveals = async (sessionId, prepReveals) => {
    if (!sessionId) return;
    const { error } = await supabase.from('sessions').update({ prepared_reveals: prepReveals }).eq('id', sessionId);
    if (error) { console.error('savePreparedReveals failed:', error.message); return; }
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, prepared_reveals: prepReveals } : s));
    if (session?.id === sessionId) setSession(prev => ({ ...prev, prepared_reveals: prepReveals }));
  };

  const deleteSession = async (sessionId) => {
    await supabase.from('sessions').delete().eq('id', sessionId);
    setAllSessions(prev => prev.filter(s => s.id !== sessionId));
    if (session?.id === sessionId) setSession(null);
  };

  const renumberSession = async (sessionId, newNumber) => {
    // If newNumber is taken, shift all sessions >= newNumber up by 1 first
    const existing = allSessions.find(s => s.session_number === newNumber && s.id !== sessionId);
    if (existing) {
      // Shift up: all sessions with number >= newNumber (except the one being moved)
      const toShift = allSessions.filter(s => s.session_number >= newNumber && s.id !== sessionId);
      for (const s of toShift) {
        await supabase.from('sessions').update({ session_number: s.session_number + 1 }).eq('id', s.id);
      }
      setAllSessions(prev => prev.map(s =>
        s.session_number >= newNumber && s.id !== sessionId ? { ...s, session_number: s.session_number + 1 } : s
      ));
    }
    await supabase.from('sessions').update({ session_number: newNumber }).eq('id', sessionId);
    setAllSessions(prev => prev.map(s => s.id === sessionId ? { ...s, session_number: newNumber } : s)
      .sort((a, b) => a.session_number - b.session_number));
  };

  return { session, allSessions, loading, startSession, activateSession, createPrepSession, unretireSession, endSession, updateSessionRecap, saveEncounter, saveEventLog, savePreparedEncounters, savePreparedQuests, savePreparedReveals, deleteSession, renumberSession, refetch: fetch };
}

// ── Characters ────────────────────────────────────────────────────────────────
export function useCharacters() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetch = useCallback(async () => {
    if (!hasLoadedOnce.current) setLoading(true);
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('created_at');
    setCharacters(data || []);
    setLoading(false);
    hasLoadedOnce.current = true;
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
      .channel('characters_' + GAME_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: `game_id=eq.${GAME_ID}` },
        payload => {
          if (payload.eventType === 'UPDATE') {
            // Merge, don't replace - Supabase only sends changed columns on UPDATE (without REPLICA
            // IDENTITY FULL), so a payload missing a field means "unchanged," not "cleared." Replacing
            // wholesale was wiping other character fields (equipment, advantages, etc.) any time a targeted
            // update only touched one column - same root cause as the encounter/downtime-screen bug.
            setCharacters(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c));
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

// ── Presence tracking - broadcasts who is online ───────────────────────────────
export function usePresence(username, isGM, onJoin, onLeave) {
  useEffect(() => {
    if (!username) return;
    const channel = supabase.channel('presence_' + GAME_ID, {
      config: { presence: { key: username } }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (key !== username && onJoin) onJoin(key, newPresences[0]);
    });
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (key !== username && onLeave) onLeave(key, leftPresences[0]);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ username, role: isGM ? 'gm' : 'player', joinedAt: Date.now() });
      }
    });

    return () => supabase.removeChannel(channel);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, isGM]);
}

// ── Feedback (append-only: Visual / Feature Requests / Broken Things) ──────────
export function useFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('feedback')
      .select('*')
      .eq('game_id', GAME_ID)
      .order('created_at', { ascending: false });
    setFeedback(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const addFeedback = async (type, text, author) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert({ game_id: GAME_ID, type, body: text, author })
      .select()
      .single();
    if (error) { console.error('addFeedback error:', error.message); return null; }
    if (data) setFeedback(prev => [data, ...prev]);
    return data;
  };

  const deleteFeedback = async (id) => {
    const { error } = await supabase.from('feedback').delete().eq('id', id).eq('game_id', GAME_ID);
    if (error) { console.error('deleteFeedback error:', error.message); return false; }
    setFeedback(prev => prev.filter(f => f.id !== id));
    return true;
  };

  // Real-time subscription - so everyone sees new feedback (and deletions) live without refreshing
  useEffect(() => {
    const sub = supabase
      .channel('feedback_' + GAME_ID)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback', filter: `game_id=eq.${GAME_ID}` },
        payload => setFeedback(prev => prev.some(f => f.id === payload.new.id) ? prev : [payload.new, ...prev]))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'feedback', filter: `game_id=eq.${GAME_ID}` },
        payload => setFeedback(prev => prev.filter(f => f.id !== payload.old?.id)))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  return { feedback, addFeedback, deleteFeedback, loading, refetch: fetch };
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

  // Real-time subscription
  useEffect(() => {
    const sub = supabase
      .channel('npcs_' + GAME_ID)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'npcs', filter: `game_id=eq.${GAME_ID}` },
        payload => {
          if (payload.eventType === 'UPDATE') setNpcs(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...payload.new } : n));
          else if (payload.eventType === 'INSERT') setNpcs(prev => [...prev.filter(n => n.id !== payload.new.id), payload.new]);
          else if (payload.eventType === 'DELETE') setNpcs(prev => prev.filter(n => n.id !== payload.old.id));
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  // Polling fallback - re-fetch every 15s so players see new NPCs even if realtime isn't enabled
  useEffect(() => {
    const interval = setInterval(() => fetch(), 15000);
    return () => clearInterval(interval);
  }, [fetch]);

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
    // session_id can be passed explicitly in questData to override the hook's bound sessionId - needed
    // right after activating a different session, since the closure here is still bound to whatever
    // session was active when useQuests(session?.id) last rendered (stale otherwise).
    const { data, error } = await supabase
      .from('quests')
      .insert({ ...questData, game_id: GAME_ID, session_id: questData.session_id ?? sessionId ?? null })
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

  const deleteQuest = async (id) => {
    await supabase.from('quests').delete().eq('id', id);
    setQuests(prev => prev.filter(q => q.id !== id));
  };

  return { quests, loading, createQuest, updateQuest, deleteQuest, refetch: fetch };
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

  // Free-text party notes per faction - casual tracking, editable by any player, not gated like GM notes
  const updateRepNotes = async (faction, notes) => {
    const current = reps[faction];
    if (current) {
      const { data, error } = await supabase
        .from('faction_reputation')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      if (error) { console.error('updateRepNotes failed:', error.message); return; }
      setReps(prev => ({ ...prev, [faction]: data }));
    } else {
      const { data, error } = await supabase
        .from('faction_reputation')
        .insert({ game_id: GAME_ID, faction, reputation: 0, notes })
        .select()
        .single();
      if (error) { console.error('updateRepNotes insert failed:', error.message); return; }
      setReps(prev => ({ ...prev, [faction]: data }));
    }
  };

  return { reps, loading, updateRep, updateRepNotes, refetch: fetch };
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
  // Keep a ref to the latest inventoryId so the realtime callback can access it
  const inventoryIdRef = useRef(null);

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
      inventoryIdRef.current = data.id;
    } else {
      // Create default inventory record
      const { data: created } = await supabase
        .from('group_inventory')
        .insert({ game_id: GAME_ID, copper: 0, items: [] })
        .select()
        .single();
      if (created) {
        setInventoryId(created.id);
        inventoryIdRef.current = created.id;
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription - keeps all clients in sync
  useEffect(() => {
    const sub = supabase
      .channel('group_inventory_' + GAME_ID)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_inventory', filter: `game_id=eq.${GAME_ID}` },
        payload => {
          // Merge, don't replace with a hard [] fallback - a payload missing `items` (because only `copper`
          // changed in that particular UPDATE) was wiping the entire party inventory display until refresh.
          setInventory(prev => ({
            copper: payload.new.copper !== undefined ? payload.new.copper : prev.copper,
            items: payload.new.items !== undefined ? payload.new.items : prev.items,
          }));
        })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const updateInventory = async (updates) => {
    // Always fetch fresh state from DB before writing to avoid overwriting concurrent changes
    const { data: fresh } = await supabase
      .from('group_inventory')
      .select('*')
      .eq('game_id', GAME_ID)
      .maybeSingle();
    const base = fresh || { copper: 0, items: [] };
    const newState = { ...base, ...updates, game_id: GAME_ID };
    // Final safety net - never persist null/undefined entries in the items array, regardless of caller
    const cleanItems = (newState.items || []).filter(Boolean);
    setInventory({ copper: newState.copper, items: cleanItems });
    const id = inventoryIdRef.current || inventoryId;
    if (id) {
      await supabase
        .from('group_inventory')
        .update({ copper: newState.copper, items: cleanItems, updated_at: new Date().toISOString() })
        .eq('id', id);
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
