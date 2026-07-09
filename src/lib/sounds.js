// ── Basic synthesized sound cues - no external audio files needed ─────────────
// Respects a localStorage mute flag ('sandy_sound_enabled', default on).
import diceRollUrl from '../assets/sounds/dice-roll.mp3';
import loginUrl from '../assets/sounds/login.mp3';
import tileClickUrl from '../assets/sounds/tile-click.mp3';

let ctx = null;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

// ── File-based sound effects - real audio files, lazily loaded (created once, reused) so nothing
// plays or even fetches until its context is actually reached. Each still respects the same mute
// flag as the synthesized cues above.
const audioCache = {};
function getAudio(url) {
  if (!audioCache[url]) audioCache[url] = new Audio(url);
  return audioCache[url];
}
function playFile(url) {
  if (!isSoundEnabled()) return;
  try {
    const a = getAudio(url);
    a.currentTime = 0;
    a.play().catch(() => { /* ignore - e.g. blocked before any user gesture yet */ });
  } catch { /* never break gameplay over a sound cue */ }
}

// Dice starting to roll - the physical rolling sound, separate from playSuccess/playFailure
// (which are the tonal result cues that fire once the roll resolves).
export function playDiceRoll() { playFile(diceRollUrl); }

// Login screen - plays on the actual login action (button click), not on mount: most browsers
// block audio before any user gesture has happened on the page, so a mount-triggered sound would
// silently fail. Login/role selection is the first real click, so it's the right place.
export function playLogin() { playFile(loginUrl); }

// Stance and action buttons (PCTurnPanel) - a short click for tactile feedback.
export function playTileClick() { playFile(tileClickUrl); }

export function isSoundEnabled() {
  const v = localStorage.getItem('sandy_sound_enabled');
  return v === null ? true : v === 'true';
}

export function setSoundEnabled(on) {
  localStorage.setItem('sandy_sound_enabled', on ? 'true' : 'false');
}

function tone(c, { freq, start, dur, type = 'sine', gain = 0.18, freqEnd }) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  if (freqEnd !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), c.currentTime + start + dur);
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.02);
}

function noiseBurst(c, { start, dur, gain = 0.15, filterFreq = 1200, filterType = 'bandpass' }) {
  const bufferSize = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  noise.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  noise.start(c.currentTime + start);
}

async function play(fn) {
  if (!isSoundEnabled()) return;
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === 'suspended') await c.resume();
    fn(c);
  } catch { /* ignore audio errors - never break gameplay over a sound cue */ }
}

// Dice roll success - a bright "tin ding"
export function playSuccess() {
  play(c => {
    tone(c, { freq: 1318, start: 0, dur: 0.35, type: 'sine', gain: 0.16 });
    tone(c, { freq: 1976, start: 0.04, dur: 0.3, type: 'sine', gain: 0.1 });
  });
}

// Dice roll failure - a low rattling thud
export function playFailure() {
  play(c => {
    tone(c, { freq: 160, freqEnd: 70, start: 0, dur: 0.3, type: 'sawtooth', gain: 0.14 });
    noiseBurst(c, { start: 0, dur: 0.22, gain: 0.1, filterFreq: 300, filterType: 'lowpass' });
  });
}

// Your turn - a rising whoosh
export function playYourTurn() {
  play(c => {
    noiseBurst(c, { start: 0, dur: 0.4, gain: 0.08, filterFreq: 600, filterType: 'bandpass' });
    tone(c, { freq: 220, freqEnd: 660, start: 0, dur: 0.4, type: 'sine', gain: 0.1 });
  });
}

// Damage taken - a short slash/hiss
export function playDamage() {
  play(c => {
    noiseBurst(c, { start: 0, dur: 0.18, gain: 0.18, filterFreq: 2200, filterType: 'highpass' });
    tone(c, { freq: 500, freqEnd: 120, start: 0, dur: 0.15, type: 'triangle', gain: 0.1 });
  });
}

// Generic dice click - used when toggling a die to keep/unkeep
export function playClick() {
  play(c => {
    tone(c, { freq: 900, start: 0, dur: 0.05, type: 'square', gain: 0.07 });
  });
}

// Die explosion - clicked to trigger a pending 10-explosion. A quick percussive "pop": a short
// filtered noise burst plus a fast upward pitch swoop, distinct from the generic click above.
export function playExplosionPop() {
  play(c => {
    noiseBurst(c, { start: 0, dur: 0.1, gain: 0.16, filterFreq: 1800, filterType: 'bandpass' });
    tone(c, { freq: 500, freqEnd: 1100, start: 0, dur: 0.12, type: 'sine', gain: 0.14 });
  });
}
