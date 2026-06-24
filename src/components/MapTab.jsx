import React, { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GAME_ID } from '../data/constants';

const DEFAULT_MAP = 'https://i.imgur.com/6fuMHqq.jpeg';

// ── Pin types — icon-based ────────────────────────────────────────────────────
const PIN_STYLE = { icon: 'ti-map-pin', color: '#c8962a' };

function getPinType(id) {
  return PIN_STYLE;
}

// ── Pin icon rendered on map ──────────────────────────────────────────────────
function PinIcon({ type, size = 28, selected, hidden }) {
  const pt = getPinType(type);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: pt.color,
      border: `2px solid ${selected ? '#fff' : 'rgba(0,0,0,.6)'}`,
      boxShadow: `0 0 ${selected ? 14 : 6}px ${pt.color}bb, 0 2px 6px rgba(0,0,0,.7)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s', position: 'relative',
      transform: selected ? 'scale(1.2)' : 'scale(1)',
    }}>
      <i className={`ti ${pt.icon}`} style={{ fontSize: size * 0.45, color: '#fff', lineHeight: 1 }} />
      {hidden && (
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 10, height: 10, borderRadius: '50%',
          background: '#c84030', border: '1px solid rgba(0,0,0,.5)',
          fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>×</div>
      )}
    </div>
  );
}

// ── Quick pin creation form (inline, minimal) ─────────────────────────────────
function QuickPinForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [visible, setVisible] = useState(true);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '.75rem', minWidth: 220,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)', marginBottom: '.5rem' }}>New Pin</div>
      <input
        autoFocus
        placeholder="Pin name *"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave({ name: name.trim(), pin_type: 'pin', is_visible_to_players: visible }); if (e.key === 'Escape') onCancel(); }}
        style={{ width: '100%', marginBottom: '.5rem' }}
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)', marginBottom: '.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
        Visible to players
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-p btn-sm" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), pin_type: 'pin', is_visible_to_players: visible })}>Place</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function PinEditor({ pin, onSave, onClose }) {
  const [form, setForm] = useState({
    name:                  pin.name || '',
    is_visible_to_players: !!pin.is_visible_to_players,
    info_tn5:              pin.info_tn5  || '', // player-visible description
    info_tn20:             pin.info_tn20 || '', // GM-only notes
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const saveField = (k, v) => {
    const updated = { ...form, [k]: v };
    setForm(updated);
    onSave(updated);
  };

  const handleClose = () => { onSave(form); onClose(); };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal" style={{ maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="modal-title" style={{ margin: 0 }}>
            <i className="ti ti-map-pin" style={{ marginRight: 6 }} />Edit Pin
          </div>
          <button className="btn btn-sm" onClick={handleClose}>✕ Done</button>
        </div>

        {/* Name */}
        <div className="modal-section">
          <span className="modal-label">Name</span>
          <input value={form.name} onChange={e => set('name', e.target.value)}
            onBlur={e => saveField('name', e.target.value)}
            style={{ width: '100%' }} autoFocus />
        </div>



        {/* Visibility toggle */}
        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.is_visible_to_players}
              onChange={e => saveField('is_visible_to_players', e.target.checked)}
              style={{ accentColor: 'var(--gold)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Visible to players</span>
          </label>
        </div>

        {/* Player-visible description */}
        <div className="modal-section">
          <span className="modal-label">Description <span style={{ color: 'var(--green)', fontSize: 10, fontWeight: 400 }}>(shown to players)</span></span>
          <textarea rows={3} value={form.info_tn5}
            onChange={e => set('info_tn5', e.target.value)}
            onBlur={e => saveField('info_tn5', e.target.value)}
            placeholder="What players can see or learn about this location…"
            style={{ width: '100%', resize: 'vertical', fontSize: 12, boxSizing: 'border-box' }} />
        </div>

        {/* GM notes */}
        <div className="modal-section">
          <span className="modal-label">GM Notes <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 400 }}>(private)</span></span>
          <textarea rows={3} value={form.info_tn20}
            onChange={e => set('info_tn20', e.target.value)}
            onBlur={e => saveField('info_tn20', e.target.value)}
            placeholder="Hidden context, secrets, encounter hooks…"
            style={{ width: '100%', resize: 'vertical', fontSize: 12, boxSizing: 'border-box' }} />
        </div>
      </div>
    </div>
  );
}

// ── Pin popup (click on placed pin) ──────────────────────────────────────────
function PinPopup({ pin, isGM, isPCView, onEdit, onDelete, onUpdatePin, onClose, onMove }) {
  const pt = getPinType(pin.pin_type);
  const [notes, setNotes] = useState(pin.player_notes || '');
  const [notesChanged, setNotesChanged] = useState(false);
  const gmView = isGM && !isPCView;

  // Smart positioning — keep popup inside map, clear of the pin itself
  const showBelow = (pin.y_position || 50) < 35;   // flip below when pin is in top third
  const shiftRight = (pin.x_position || 50) < 15;  // shift right if near left edge
  const shiftLeft  = (pin.x_position || 50) > 85;  // shift left if near right edge

  const vertStyle = showBelow
    ? { top: 32, bottom: 'auto' }
    : { bottom: 32, top: 'auto' };
  const horizStyle = shiftRight
    ? { left: 0, transform: 'none' }
    : shiftLeft
      ? { left: 'auto', right: 0, transform: 'none' }
      : { left: '50%', transform: 'translateX(-50%)' };

  // Description shown to players; GM notes shown only to GM

  return (
    <div style={{
      position: 'absolute', ...vertStyle, ...horizStyle,
      background: 'rgba(24,16,6,.97)', border: `1px solid ${pt.color}`,
      borderRadius: 7, padding: '10px 12px', minWidth: 190, maxWidth: 270,
      zIndex: 30, boxShadow: '0 4px 24px rgba(0,0,0,.85)',
    }} onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <i className={`ti ${pt.icon}`} style={{ fontSize: 15, color: pt.color }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 15, flex: 1 }}>{pin.name}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
      </div>
      <div style={{ fontSize: 11, color: pt.color, marginBottom: 6 }}>{pt.label}</div>

      {/* Description + GM notes */}
      {pin.info_tn5 && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 5, lineHeight: 1.4 }}>{pin.info_tn5}</div>
      )}
      {gmView && pin.info_tn20 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, lineHeight: 1.4, padding: '3px 6px', background: 'rgba(107,78,40,.1)', borderRadius: 3, borderLeft: '2px solid var(--gold-dim)' }}>
          {pin.info_tn20}
        </div>
      )}
      {!pin.info_tn5 && !pin.info_tn20 && <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 5 }}>No description yet.</div>}



      {/* Party notes */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Party notes:</div>
      <textarea rows={2} value={notes} onChange={e => { setNotes(e.target.value); setNotesChanged(true); }}
        placeholder="What does the party know?" style={{ width: '100%', resize: 'vertical', fontSize: 12, marginBottom: notesChanged ? 4 : 0 }} />
      {notesChanged && <button className="btn btn-sm btn-p" style={{ fontSize: 11, marginBottom: 4 }}
        onClick={() => { onUpdatePin(pin.id, { player_notes: notes }); setNotesChanged(false); }}>Save Notes</button>}

      {/* GM actions */}
      {gmView && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => onEdit(pin)}>Edit</button>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => { onMove(pin.id); onClose(); }}>Move</button>
          <button className="btn btn-sm" style={{ fontSize: 11 }} onClick={() => onUpdatePin(pin.id, { is_visible_to_players: !pin.is_visible_to_players })}>
            {pin.is_visible_to_players ? 'Hide' : 'Reveal'}
          </button>
          <button className="btn btn-sm btn-d" style={{ fontSize: 11 }} onClick={() => onDelete(pin.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Main Map Tab ──────────────────────────────────────────────────────────────
export default function MapTab({ isGM, isPCView, pins, onCreatePin, onUpdatePin, onDeletePin, timeOfDay }) {
  const NIGHT_TIMES = ['Evening', 'Night'];
  const isNight = NIGHT_TIMES.includes(timeOfDay);
  const [layer, setLayer] = useState('surface');
  const [selected, setSelected] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [moving, setMoving] = useState(null);
  const movingRef = useRef(null);
  const setMovingWithRef = (id) => { setMoving(id); movingRef.current = id; };
  const [newPinPos, setNewPinPos] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const [imgAspect, setImgAspect] = useState(null);
  const [mapImageDay, setMapImageDay] = useState(DEFAULT_MAP);
  const [mapImageNight, setMapImageNight] = useState('');
  const mapImage = (isNight && mapImageNight) ? mapImageNight : mapImageDay;
  const mapRef = useRef(null);
  // Drag state
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragPos, setDragPos] = useState(null);
  const gmView = isGM && !isPCView;

  // Load map URLs from games settings
  useEffect(() => {
    supabase.from('games').select('settings').eq('id', GAME_ID).single().then(({ data }) => {
      if (data?.settings?.map_url) setMapImageDay(data.settings.map_url);
      if (data?.settings?.map_url_night) setMapImageNight(data.settings.map_url_night);
    });
  }, []);

  const safePins = (pins || []).filter(Boolean);
  const visiblePins = safePins.filter(p => {
    if (p.map_layer !== layer) return false;
    if (!gmView && !p.is_visible_to_players) return false;
    return true;
  });

  const handleMapClick = useCallback((e) => {
    const rect = mapRef.current.getBoundingClientRect();
    const x = +((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = +((e.clientY - rect.top) / rect.height * 100).toFixed(2);

    if (movingRef.current && gmView) {
      onUpdatePin(movingRef.current, { x_position: x, y_position: y });
      setMovingWithRef(null);
      return;
    }

    if (placing && gmView) {
      setNewPinPos({ x, y });
      setSelected(null);
    }
  }, [placing, gmView, onUpdatePin]);

  const handlePinClick = (e, pinId) => {
    e.stopPropagation();
    if (placing) return;
    if (draggingId) return; // suppress click after drag
    setSelected(selected === pinId ? null : pinId);
    setNewPinPos(null);
  };

  const getPct = (e) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: +((e.clientX - rect.left) / rect.width * 100).toFixed(2),
      y: +((e.clientY - rect.top) / rect.height * 100).toFixed(2),
    };
  };

  const handlePinPointerDown = (e, pinId) => {
    if (!gmView || placing) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pinId, startSelected: selected, moved: false };
    setDraggingId(pinId);
    // Don't clear selection yet — wait until we know it's actually a drag
  };

  const handlePinPointerMove = (e) => {
    if (!dragRef.current) return;
    dragRef.current.moved = true;
    const pos = getPct(e);
    if (pos) setDragPos(pos);
  };

  const handlePinPointerUp = (e, pinId) => {
    if (!dragRef.current) return;
    if (dragRef.current.moved && dragPos) {
      // Real drag — save position, close popup
      onUpdatePin(pinId, { x_position: dragPos.x, y_position: dragPos.y });
      setSelected(null);
    } else {
      // Tap/click — toggle popup
      setSelected(prev => prev === pinId ? null : pinId);
    }
    dragRef.current = null;
    setDraggingId(null);
    setDragPos(null);
  };

  const handleCreate = async (form) => {
    await onCreatePin({
      ...form,
      map_layer: layer,
      x_position: newPinPos.x,
      y_position: newPinPos.y,
      info_tn5: '', info_tn10: '', info_tn15: '', info_tn20: '',
      visibility_threshold: 5,
      player_notes: '',
    });
    setNewPinPos(null);
    setPlacing(false);
  };

  const handleDelete = async (id) => {
    await onDeletePin(id);
    setSelected(null);
  };

  return (
    <div>
      {editingPin && (
        <PinEditor
          key={editingPin.id}
          pin={editingPin}
          onSave={form => onUpdatePin(editingPin.id, form)}
          onClose={() => setEditingPin(null)}
        />
      )}

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem', flexWrap: 'wrap' }}>
        <div className="layer-tog">
          <button className={`layer-btn ${layer === 'surface' ? 'active' : ''}`} onClick={() => { setLayer('surface'); setSelected(null); }}>Surface</button>
          <button className={`layer-btn ${layer === 'underground' ? 'active' : ''}`} onClick={() => { setLayer('underground'); setSelected(null); }}>Underground</button>
        </div>
        {gmView && (
          <button className={`btn btn-sm ${placing ? 'btn-p' : ''}`}
            onClick={() => { setPlacing(!placing); setSelected(null); setNewPinPos(null); }}>
            <i className={`ti ${placing ? 'ti-x' : 'ti-map-pin'}`} style={{ fontSize: 13 }} />
            {placing ? 'Cancel' : 'Place Pin'}
          </button>
        )}
        {isNight && (
          <span style={{ fontSize: 11, color: '#8080c8', border: '1px solid #4040a8', borderRadius: 3, padding: '1px 6px' }}>
            🌙 {timeOfDay} — {mapImageNight ? 'Night map' : 'No night map set'}
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {visiblePins.length} pin{visiblePins.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Imgur album URL warning */}
      {isNight && mapImageNight && mapImageNight.includes('imgur.com/a/') && (
        <div style={{ padding: '.35rem .75rem', background: 'rgba(200,64,48,.1)', border: '1px solid rgba(200,64,48,.4)', borderRadius: 4, marginBottom: '.5rem', fontSize: 12, color: 'var(--red)' }}>
          ⚠ Night map URL looks like an Imgur album link — needs a direct image URL (e.g. https://i.imgur.com/XXXXX.jpg). Right-click the image in the album → Copy image address.
        </div>
      )}

      {placing && !newPinPos && (
        <div style={{ padding: '.35rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '.5rem', fontSize: 13, color: 'var(--gold)' }}>
          <i className="ti ti-map-pin" style={{ marginRight: 4 }} />Click anywhere on the map to place a pin
        </div>
      )}
      {moving && (
        <div style={{ padding: '.35rem .75rem', background: 'rgba(74,138,200,.1)', border: '1px solid #4a8ac8', borderRadius: 4, marginBottom: '.5rem', fontSize: 13, color: '#80b8e8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="ti ti-arrows-move" style={{ marginRight: 4 }} />Click new location to move pin
          <button className="btn btn-sm" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={() => setMovingWithRef(null)}>Cancel</button>
        </div>
      )}

      {/* Map container — aspect ratio locked to image, NO max-height (it breaks ring/pin alignment) */}
      <div style={{
        position: 'relative', width: '100%',
        aspectRatio: imgAspect ? `${imgAspect}` : '4/3',
        overflow: 'hidden', borderRadius: 6,
        background: '#1a1208',
      }}>
        <div
          className="map-con"
          ref={mapRef}
          onClick={handleMapClick}
          onPointerMove={gmView ? e => handlePinPointerMove(e) : undefined}
          onPointerUp={gmView ? e => { if (dragRef.current) handlePinPointerUp(e, dragRef.current.pinId); } : undefined}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            cursor: moving ? 'crosshair' : placing && !newPinPos ? 'crosshair' : draggingId ? 'grabbing' : 'default',
          }}
        >
        {/* Image — objectFit:contain so no cropping, pins always match their placed position */}
        {layer === 'surface' && (
          <img src={mapImage} alt="Medinaat al-Salaam"
            onLoad={e => setImgAspect(e.target.naturalWidth / e.target.naturalHeight)}
            onError={e => { e.target.style.display = 'none'; }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}

        {/* Underground — darkened version */}
        {layer === 'underground' && (
          <img src={mapImage} alt="Underground"
            onLoad={e => setImgAspect(e.target.naturalWidth / e.target.naturalHeight)}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0.25) saturate(0.4)' }}
          />
        )}

        {/* Ring overlays — viewBox 100×100, preserveAspectRatio:none maps 1:1 to container pixels
             ry = % of container height, rx = ry/imgAspect → perfect circles on screen */}
        {layer === 'surface' && imgAspect && (() => {
          const ring = (ry, label) => {
            const rx = +(ry / imgAspect).toFixed(2);
            return <g key={ry}>
              <ellipse cx={50} cy={50} rx={rx} ry={ry} fill="none" stroke="#e8b840" strokeWidth=".4" strokeDasharray="1.5,1" opacity=".65" />
              <text x={50} y={+(50 - ry - 1).toFixed(1)} textAnchor="middle" fill="#e8b840" fontSize="2.2" fontFamily="Georgia,serif" filter="url(#ts)" opacity=".9">{label}</text>
            </g>;
          };
          const palRy = 9;
          const palRx = +(palRy / imgAspect).toFixed(2);
          return (
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <defs><filter id="ts"><feDropShadow dx="0" dy="0" stdDeviation=".8" floodColor="#000" floodOpacity=".9" /></filter></defs>
              {ring(44, 'Outer City')}
              {ring(34, 'Merchant District')}
              {ring(25, 'Faction Quarter')}
              {ring(17, 'Noble District')}
              <ellipse cx={50} cy={50} rx={palRx} ry={palRy} fill="rgba(200,150,42,.06)" stroke="#e8b840" strokeWidth=".7" opacity=".85" />
              <text x={50} y={51} textAnchor="middle" fill="#e8b840" fontSize="2.5" fontFamily="Georgia,serif" fontWeight="bold" filter="url(#ts)">Palace</text>
            </svg>
          );
        })()}

        {/* Placed pins */}
        {visiblePins.map(p => {
          const isSelected = selected === p.id;
          const isDragging = draggingId === p.id;
          const displayX = isDragging && dragPos ? dragPos.x : p.x_position;
          const displayY = isDragging && dragPos ? dragPos.y : p.y_position;
          return (
            <div key={p.id}
              onClick={gmView ? undefined : e => handlePinClick(e, p.id)}
              onPointerDown={gmView ? e => handlePinPointerDown(e, p.id) : undefined}
              style={{
                position: 'absolute', left: `${displayX}%`, top: `${displayY}%`,
                transform: 'translate(-50%,-50%)',
                cursor: gmView ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                zIndex: isDragging ? 30 : isSelected ? 20 : 10,
                opacity: isDragging ? 0.85 : 1,
                transition: isDragging ? 'none' : 'left .1s, top .1s',
                userSelect: 'none',
              }}>
              <PinIcon type={p.pin_type} size={isSelected || isDragging ? 24 : 18} selected={isSelected || isDragging} hidden={gmView && !p.is_visible_to_players} />
              {/* Label — hide while dragging */}
              {!isDragging && <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(20,12,4,.88)', borderRadius: 3, padding: '1px 5px',
                fontSize: 11, color: getPinType(p.pin_type).color, whiteSpace: 'nowrap', marginTop: 2,
                border: `1px solid ${getPinType(p.pin_type).color}33`, pointerEvents: 'none',
              }}>{p.name}</div>}
              {/* Popup */}
              {isSelected && !isDragging && (
                <PinPopup
                  pin={p} isGM={isGM} isPCView={isPCView}
                  onEdit={pin => { setEditingPin(pin); setSelected(null); }}
                  onDelete={handleDelete}
                  onUpdatePin={onUpdatePin}
                  onClose={() => setSelected(null)}
                  onMove={(id) => { setMovingWithRef(id); setSelected(null); }}
                />
              )}
            </div>
          );
        })}

        {/* New pin placement marker + quick form */}
        {newPinPos && (
          <div style={{ position: 'absolute', left: `${newPinPos.x}%`, top: `${newPinPos.y}%`, transform: 'translate(-50%,-50%)', zIndex: 40 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gold)', border: '2px solid #fff', boxShadow: '0 0 12px var(--gold)', marginBottom: 6 }} />
            <div style={{ position: 'absolute', top: 28, left: '50%', transform: 'translateX(-50%)' }}>
              <QuickPinForm onSave={handleCreate} onCancel={() => { setNewPinPos(null); setPlacing(false); }} />
            </div>
          </div>
        )}
      </div>
      </div>{/* end aspect-ratio wrapper */}

      {/* Pin Legend — right of map, sorted by type */}
      {visiblePins.length > 0 && (
        <div style={{ marginTop: '.75rem', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '.5rem .75rem', maxHeight: 260, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 600 }}>
            Pins — click to locate
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {[...visiblePins].sort((a, b) => {
              const ta = a.name || '';
              const tb = b.name || '';
              return ta.localeCompare(tb) || a.name.localeCompare(b.name);
            }).map(p => {
              const pt = getPinType(p.pin_type);
              const isHighlighted = selected === p.id;
              return (
                <button key={p.id} onClick={() => setSelected(isHighlighted ? null : p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 7px',
                    background: isHighlighted ? `${pt.color}22` : 'var(--bg-deep)',
                    border: `1px solid ${isHighlighted ? pt.color : pt.color + '44'}`,
                    borderRadius: 12, cursor: 'pointer', fontSize: 12,
                    color: isHighlighted ? pt.color : 'var(--text-secondary)',
                    fontWeight: isHighlighted ? 600 : 400,
                    transition: 'all .15s',
                  }}>
                  <i className={`ti ${pt.icon}`} style={{ fontSize: 11, color: pt.color }} />
                  {p.name}
                  {gmView && !p.is_visible_to_players && <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>○</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
