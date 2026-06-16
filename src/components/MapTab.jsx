import React, { useState, useRef, useCallback } from 'react';

const MAP_IMAGE = 'https://i.imgur.com/6fuMHqq.jpeg';

// ── Pin types — icon-based ────────────────────────────────────────────────────
const PIN_TYPES = [
  { id: 'pin',       label: 'Pin',       icon: 'ti-map-pin',      color: '#c8962a' },
  { id: 'event',     label: 'Event',     icon: 'ti-star',         color: '#e8b840' },
  { id: 'base',      label: 'Base',      icon: 'ti-home',         color: '#4a7a8a' },
  { id: 'friendly',  label: 'Friendly',  icon: 'ti-shield-check', color: '#4a8a40' },
  { id: 'enemy',     label: 'Enemy',     icon: 'ti-skull',        color: '#c84030' },
  { id: 'danger',    label: 'Danger',    icon: 'ti-alert-triangle',color: '#c87030' },
  { id: 'question',  label: 'Unknown',   icon: 'ti-question-mark',color: '#8a70c8' },
  { id: 'x',         label: 'Blocked',   icon: 'ti-x',            color: '#802020' },
  { id: 'info',      label: 'Info',      icon: 'ti-info-circle',  color: '#4a8aaa' },
  { id: 'loot',      label: 'Loot',      icon: 'ti-coin',         color: '#a8942a' },
];

function getPinType(id) {
  return PIN_TYPES.find(p => p.id === id) || PIN_TYPES[0];
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
          fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
        }}>×</div>
      )}
    </div>
  );
}

// ── Quick pin creation form (inline, minimal) ─────────────────────────────────
function QuickPinForm({ onSave, onCancel }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('pin');
  const [visible, setVisible] = useState(true);

  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '.75rem', minWidth: 220,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gold)', marginBottom: '.5rem' }}>New Pin</div>
      <input
        autoFocus
        placeholder="Pin name *"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && name.trim()) onSave({ name: name.trim(), pin_type: type, is_visible_to_players: visible }); if (e.key === 'Escape') onCancel(); }}
        style={{ width: '100%', marginBottom: '.5rem' }}
      />
      {/* Icon type picker */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '.5rem' }}>
        {PIN_TYPES.map(pt => (
          <div
            key={pt.id}
            title={pt.label}
            onClick={() => setType(pt.id)}
            style={{
              width: 28, height: 28, borderRadius: '50%', background: pt.color,
              border: `2px solid ${type === pt.id ? '#fff' : 'transparent'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: type === pt.id ? `0 0 8px ${pt.color}` : 'none',
              transition: 'all .1s',
            }}
          >
            <i className={`ti ${pt.icon}`} style={{ fontSize: 12, color: '#fff' }} />
          </div>
        ))}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)', marginBottom: '.5rem', cursor: 'pointer' }}>
        <input type="checkbox" checked={visible} onChange={e => setVisible(e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
        Visible to players
      </label>
      <div style={{ display: 'flex', gap: 4 }}>
        <button className="btn btn-p btn-sm" disabled={!name.trim()} onClick={() => onSave({ name: name.trim(), pin_type: type, is_visible_to_players: visible })}>Place</button>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Pin detail editor (full tiered info) ──────────────────────────────────────
function PinEditor({ pin, onSave, onClose }) {
  const [form, setForm] = useState({
    name: pin.name || '',
    pin_type: pin.pin_type || 'pin',
    is_visible_to_players: pin.is_visible_to_players || false,
    info_tn5: pin.info_tn5 || '',
    info_tn10: pin.info_tn10 || '',
    info_tn15: pin.info_tn15 || '',
    info_tn20: pin.info_tn20 || '',
    visibility_threshold: pin.visibility_threshold || 5,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-title"><i className="ti ti-map-pin" style={{ marginRight: 6 }} />Edit Pin</div>

        <div className="modal-section">
          <span className="modal-label">Name</span>
          <input value={form.name} onChange={e => set('name', e.target.value)} style={{ width: '100%' }} />
        </div>

        <div className="modal-section">
          <span className="modal-label">Icon</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PIN_TYPES.map(pt => (
              <div key={pt.id} title={pt.label} onClick={() => set('pin_type', pt.id)} style={{
                width: 32, height: 32, borderRadius: '50%', background: pt.color,
                border: `2px solid ${form.pin_type === pt.id ? '#fff' : 'transparent'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: form.pin_type === pt.id ? `0 0 10px ${pt.color}` : 'none',
              }}>
                <i className={`ti ${pt.icon}`} style={{ fontSize: 14, color: '#fff' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
            <input type="checkbox" checked={form.is_visible_to_players} onChange={e => set('is_visible_to_players', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            <span style={{ color: 'var(--text-secondary)' }}>Visible to players</span>
          </label>
        </div>

        <div className="modal-section">
          <span className="modal-label">Tiered Information</span>
          {[['info_tn5','TN 5 — Common knowledge'],['info_tn10','TN 10 — Local knowledge'],['info_tn15','TN 15 — Insider access'],['info_tn20','TN 20+ — Secrets']].map(([key, label]) => (
            <div key={key} style={{ marginBottom: '.4rem' }}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
              <textarea rows={2} value={form[key]} onChange={e => set(key, e.target.value)}
                placeholder={label.split(' — ')[1]} style={{ width: '100%', resize: 'vertical', fontSize: 10 }} />
            </div>
          ))}
        </div>

        <div className="modal-section">
          <span className="modal-label">Players can see up to</span>
          <select value={form.visibility_threshold} onChange={e => set('visibility_threshold', +e.target.value)}>
            <option value={0}>Nothing</option>
            <option value={5}>TN 5</option>
            <option value={10}>TN 10</option>
            <option value={15}>TN 15</option>
            <option value={20}>TN 20+</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn btn-p" disabled={!form.name} onClick={() => { onSave(form); onClose(); }}>Save</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Pin popup (click on placed pin) ──────────────────────────────────────────
function PinPopup({ pin, isGM, isPCView, onEdit, onDelete, onUpdatePin, onClose }) {
  const pt = getPinType(pin.pin_type);
  const [notes, setNotes] = useState(pin.player_notes || '');
  const [notesChanged, setNotesChanged] = useState(false);
  const gmView = isGM && !isPCView;

  const visibleTiers = [
    { key: 'info_tn5', label: 'TN 5', val: pin.info_tn5, threshold: 5 },
    { key: 'info_tn10', label: 'TN 10', val: pin.info_tn10, threshold: 10 },
    { key: 'info_tn15', label: 'TN 15', val: pin.info_tn15, threshold: 15 },
    { key: 'info_tn20', label: 'TN 20+', val: pin.info_tn20, threshold: 20 },
  ].filter(t => gmView ? t.val : t.val && t.threshold <= (pin.visibility_threshold || 5));

  return (
    <div style={{
      position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(24,16,6,.97)', border: `1px solid ${pt.color}`,
      borderRadius: 7, padding: '10px 12px', minWidth: 190, maxWidth: 270,
      zIndex: 30, boxShadow: '0 4px 24px rgba(0,0,0,.85)',
    }} onClick={e => e.stopPropagation()}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <i className={`ti ${pt.icon}`} style={{ fontSize: 13, color: pt.color }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>{pin.name}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
      </div>
      <div style={{ fontSize: 9, color: pt.color, marginBottom: 6 }}>{pt.label}</div>

      {/* Tiered info */}
      {visibleTiers.map(t => (
        <div key={t.key} style={{ marginBottom: 5 }}>
          {gmView && <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
            {t.label}{t.threshold > (pin.visibility_threshold || 5) ? ' 🔒' : ''}
          </div>}
          <div style={{ fontSize: 10, color: t.threshold > (pin.visibility_threshold || 5) && gmView ? 'var(--text-muted)' : 'var(--text-secondary)', fontStyle: 'italic' }}>{t.val}</div>
        </div>
      ))}
      {visibleTiers.length === 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 5 }}>No information yet.</div>}

      {/* GM reveal control */}
      {gmView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0', borderTop: '1px solid rgba(107,78,40,.3)', borderBottom: '1px solid rgba(107,78,40,.3)', margin: '4px 0', fontSize: 9 }}>
          <span style={{ color: 'var(--text-muted)' }}>Show up to:</span>
          <select value={pin.visibility_threshold || 5} onChange={e => onUpdatePin(pin.id, { visibility_threshold: +e.target.value })} style={{ fontSize: 9, padding: '1px 3px', flex: 1 }}>
            <option value={0}>Nothing</option><option value={5}>TN 5</option><option value={10}>TN 10</option><option value={15}>TN 15</option><option value={20}>TN 20+</option>
          </select>
          <span style={{ color: pin.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)' }}>{pin.is_visible_to_players ? '● shown' : '○ hidden'}</span>
        </div>
      )}

      {/* Party notes */}
      <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>Party notes:</div>
      <textarea rows={2} value={notes} onChange={e => { setNotes(e.target.value); setNotesChanged(true); }}
        placeholder="What does the party know?" style={{ width: '100%', resize: 'vertical', fontSize: 10, marginBottom: notesChanged ? 4 : 0 }} />
      {notesChanged && <button className="btn btn-sm btn-p" style={{ fontSize: 9, marginBottom: 4 }}
        onClick={() => { onUpdatePin(pin.id, { player_notes: notes }); setNotesChanged(false); }}>Save Notes</button>}

      {/* GM actions */}
      {gmView && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
          <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => onEdit(pin)}>Edit</button>
          <button className="btn btn-sm" style={{ fontSize: 9 }} onClick={() => onUpdatePin(pin.id, { is_visible_to_players: !pin.is_visible_to_players })}>
            {pin.is_visible_to_players ? 'Hide' : 'Reveal'}
          </button>
          <button className="btn btn-sm btn-d" style={{ fontSize: 9 }} onClick={() => onDelete(pin.id)}>Delete</button>
        </div>
      )}
    </div>
  );
}

// ── Main Map Tab ──────────────────────────────────────────────────────────────
export default function MapTab({ isGM, isPCView, pins, onCreatePin, onUpdatePin, onDeletePin }) {
  const [layer, setLayer] = useState('surface');
  const [filter, setFilter] = useState(null);
  const [selected, setSelected] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [newPinPos, setNewPinPos] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const [imgAspect, setImgAspect] = useState(null);
  const mapRef = useRef(null);
  const gmView = isGM && !isPCView;

  const safePins = (pins || []).filter(Boolean);
  const visiblePins = safePins.filter(p => {
    if (p.map_layer !== layer) return false;
    if (!gmView && !p.is_visible_to_players) return false;
    if (filter && p.pin_type !== filter) return false;
    return true;
  });

  const handleMapClick = useCallback((e) => {
    if (!placing || !gmView) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = +((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = +((e.clientY - rect.top) / rect.height * 100).toFixed(2);
    setNewPinPos({ x, y });
    setSelected(null);
  }, [placing, gmView]);

  const handlePinClick = (e, pinId) => {
    e.stopPropagation();
    if (placing) return;
    setSelected(selected === pinId ? null : pinId);
    setNewPinPos(null);
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
            <i className={`ti ${placing ? 'ti-x' : 'ti-map-pin'}`} style={{ fontSize: 11 }} />
            {placing ? 'Cancel' : 'Place Pin'}
          </button>
        )}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {visiblePins.length} pin{visiblePins.length !== 1 ? 's' : ''}
        </span>
      </div>

      {placing && !newPinPos && (
        <div style={{ padding: '.35rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '.5rem', fontSize: 11, color: 'var(--gold)' }}>
          <i className="ti ti-map-pin" style={{ marginRight: 4 }} />Click anywhere on the map to place a pin
        </div>
      )}

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: '.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Filter:</span>
        <span className={`tag ${!filter ? 'on' : ''}`} onClick={() => setFilter(null)} style={!filter ? { borderColor: 'var(--gold)', color: 'var(--gold)' } : {}}>All</span>
        {PIN_TYPES.map(pt => (
          <span key={pt.id}
            onClick={() => setFilter(filter === pt.id ? null : pt.id)}
            title={pt.label}
            style={{
              width: 22, height: 22, borderRadius: '50%', background: pt.color,
              border: `2px solid ${filter === pt.id ? '#fff' : 'transparent'}`,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', opacity: filter && filter !== pt.id ? .4 : 1,
            }}
          >
            <i className={`ti ${pt.icon}`} style={{ fontSize: 11, color: '#fff' }} />
          </span>
        ))}
      </div>

      {/* Map container */}
      <div
        className="map-con"
        ref={mapRef}
        onClick={handleMapClick}
        style={{
          cursor: placing && !newPinPos ? 'crosshair' : 'default',
          height: 'auto',
          aspectRatio: imgAspect ? `${imgAspect}` : '4/3',
          maxHeight: '70vh',
        }}
      >
        {/* Image */}
        {layer === 'surface' && (
          <img src={MAP_IMAGE} alt="Medinaat al-Salaam"
            onLoad={e => setImgAspect(e.target.naturalWidth / e.target.naturalHeight)}
            onError={e => { e.target.style.display = 'none'; }}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'fill' }}
          />
        )}

        {/* Underground placeholder */}
        {layer === 'underground' && (
          <div style={{ position: 'absolute', inset: 0, background: '#0e0c08', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem' }}>
            <i className="ti ti-map" style={{ fontSize: 36, color: 'var(--text-muted)', opacity: .3 }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Underground map — art pending</div>
          </div>
        )}

        {/* Ring overlays */}
        {layer === 'surface' && imgAspect && (() => {
          const W = 100, H = +(100 / imgAspect).toFixed(4), cx = 50, cy = 50;
          const ring = (rx, label) => {
            const ry = +(rx / imgAspect * 0.9).toFixed(2);
            const ty = +(cy - ry - 1).toFixed(2);
            return <g key={rx}>
              <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#e8b840" strokeWidth=".5" strokeDasharray="2,1.5" opacity=".55" />
              <text x={cx} y={ty} textAnchor="middle" fill="#e8b840" fontSize="2.5" fontFamily="Georgia,serif" filter="url(#ts)" opacity=".9">{label}</text>
            </g>;
          };
          return (
            <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
              style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <defs><filter id="ts"><feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity=".9" /></filter></defs>
              {ring(42, 'Outer City')}
              {ring(32, 'Merchant District')}
              {ring(23, 'Faction Quarter')}
              {ring(15, 'Noble District')}
              <ellipse cx={cx} cy={cy} rx="8" ry={+(8/imgAspect*0.9).toFixed(2)} fill="rgba(200,150,42,.06)" stroke="#e8b840" strokeWidth=".8" opacity=".85" />
              <text x={cx} y={cy + 0.5} textAnchor="middle" fill="#e8b840" fontSize="2.8" fontFamily="Georgia,serif" fontWeight="bold" filter="url(#ts)">Palace</text>
            </svg>
          );
        })()}

        {/* Placed pins */}
        {visiblePins.map(p => {
          const isSelected = selected === p.id;
          return (
            <div key={p.id} onClick={e => handlePinClick(e, p.id)}
              style={{ position: 'absolute', left: `${p.x_position}%`, top: `${p.y_position}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', zIndex: isSelected ? 20 : 10 }}>
              <PinIcon type={p.pin_type} size={isSelected ? 32 : 26} selected={isSelected} hidden={gmView && !p.is_visible_to_players} />
              {/* Label */}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(20,12,4,.88)', borderRadius: 3, padding: '1px 5px',
                fontSize: 9, color: getPinType(p.pin_type).color, whiteSpace: 'nowrap', marginTop: 2,
                border: `1px solid ${getPinType(p.pin_type).color}33`, pointerEvents: 'none',
              }}>{p.name}</div>
              {/* Popup */}
              {isSelected && (
                <PinPopup
                  pin={p} isGM={isGM} isPCView={isPCView}
                  onEdit={pin => { setEditingPin(pin); setSelected(null); }}
                  onDelete={handleDelete}
                  onUpdatePin={onUpdatePin}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          );
        })}

        {/* New pin placement marker + quick form */}
        {newPinPos && (
          <div style={{ position: 'absolute', left: `${newPinPos.x}%`, top: `${newPinPos.y}%`, transform: 'translate(-50%,-50%)', zIndex: 40 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gold)', border: '2px solid #fff', boxShadow: '0 0 12px var(--gold)', marginBottom: 6 }} />
            <div style={{ position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)' }}>
              <QuickPinForm onSave={handleCreate} onCancel={() => { setNewPinPos(null); setPlacing(false); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
