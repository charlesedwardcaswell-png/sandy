import React, { useState, useRef, useCallback } from 'react';
import { PIN_TYPES } from '../data/constants';
import { getPinColor } from '../lib/utils';

const MAP_IMAGE = 'https://i.imgur.com/6fuMHqq.jpeg';

// ── Pin type filter tag ───────────────────────────────────────────────────────
function FilterTag({ label, color, active, onClick }) {
  return (
    <span
      className={`tag ${active ? 'on' : ''}`}
      onClick={onClick}
      style={active ? { borderColor: color, color } : {}}
    >
      <span className="pin-dot" style={{ background: color }} />
      {label}
    </span>
  );
}

// ── Pin form (GM only) ────────────────────────────────────────────────────────
function PinForm({ pin, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: pin?.name || '',
    pin_type: pin?.pin_type || 'streets',
    is_visible_to_players: pin?.is_visible_to_players || false,
    info_tn5: pin?.info_tn5 || '',
    info_tn10: pin?.info_tn10 || '',
    info_tn15: pin?.info_tn15 || '',
    info_tn20: pin?.info_tn20 || '',
    visibility_threshold: pin?.visibility_threshold || 5,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: '.75rem', background: 'var(--bg-dark)', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
        <input placeholder="Pin name *" value={form.name} onChange={e => set('name', e.target.value)} style={{ width: '100%' }} />
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={form.pin_type} onChange={e => set('pin_type', e.target.value)} style={{ flex: 1 }}>
            {PIN_TYPES.map(pt => <option key={pt.id} value={pt.id}>{pt.label}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_visible_to_players} onChange={e => set('is_visible_to_players', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
            Visible to players
          </label>
        </div>

        {/* Tiered info */}
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginTop: '.25rem' }}>
          Tiered Information
        </div>
        {[['info_tn5', 'TN 5 — Basic (common knowledge)'], ['info_tn10', 'TN 10 — Informed (local knowledge)'], ['info_tn15', 'TN 15 — Specialist (insider access)'], ['info_tn20', 'TN 20+ — Hidden (secrets)']].map(([key, label]) => (
          <div key={key}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
            <textarea
              rows={2}
              value={form[key]}
              onChange={e => set(key, e.target.value)}
              placeholder={`${label.split(' —')[1].trim()}...`}
              style={{ width: '100%', resize: 'vertical', fontSize: 10 }}
            />
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Players can see up to TN:</span>
          <select value={form.visibility_threshold} onChange={e => set('visibility_threshold', +e.target.value)} style={{ width: 70 }}>
            <option value={0}>None</option>
            <option value={5}>TN 5</option>
            <option value={10}>TN 10</option>
            <option value={15}>TN 15</option>
            <option value={20}>TN 20</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '.4rem', marginTop: '.25rem' }}>
          <button className="btn btn-p btn-sm" disabled={!form.name} onClick={() => onSave(form)}>
            {pin?.id ? 'Save Changes' : 'Place Pin'}
          </button>
          <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Pin popup (shown on click) ────────────────────────────────────────────────
function PinPopup({ pin, isGM, isPCView, onEdit, onDelete, onToggleVisibility, onUpdateNotes }) {
  const color = getPinColor(pin.pin_type);
  const typeLabel = PIN_TYPES.find(t => t.id === pin.pin_type)?.label || pin.pin_type;
  const [notes, setNotes] = useState(pin.player_notes || '');
  const [notesChanged, setNotesChanged] = useState(false);

  const visibleTiers = [
    { key: 'info_tn5', label: 'TN 5', val: pin.info_tn5, threshold: 5 },
    { key: 'info_tn10', label: 'TN 10', val: pin.info_tn10, threshold: 10 },
    { key: 'info_tn15', label: 'TN 15', val: pin.info_tn15, threshold: 15 },
    { key: 'info_tn20', label: 'TN 20+', val: pin.info_tn20, threshold: 20 },
  ].filter(t => {
    if (isGM && !isPCView) return t.val; // GM sees all filled tiers
    return t.val && t.threshold <= (pin.visibility_threshold || 5); // Players see up to threshold
  });

  return (
    <div style={{
      position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(26,18,8,.97)', border: `1px solid ${color}`,
      borderRadius: 6, padding: '10px 12px', minWidth: 200, maxWidth: 280,
      zIndex: 30, boxShadow: '0 4px 20px rgba(0,0,0,.8)',
    }}>
      {/* Name + type */}
      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 3, fontSize: 13 }}>{pin.name}</div>
      <div style={{ fontSize: 9, color, marginBottom: 6, textTransform: 'capitalize' }}>● {typeLabel}</div>

      {/* Tiered info */}
      {visibleTiers.map(t => (
        <div key={t.key} style={{ marginBottom: 5 }}>
          {isGM && !isPCView && (
            <div style={{ fontSize: 8, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
              {t.label}{t.threshold > (pin.visibility_threshold || 5) ? ' 🔒' : ''}
            </div>
          )}
          <div style={{ fontSize: 10, color: t.threshold > (pin.visibility_threshold || 5) && isGM && !isPCView ? 'var(--text-muted)' : 'var(--text-secondary)', fontStyle: 'italic' }}>
            {t.val}
          </div>
        </div>
      ))}

      {visibleTiers.length === 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 5 }}>No information available.</div>
      )}

      {/* GM threshold control */}
      {isGM && !isPCView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, padding: '4px 0', borderTop: '1px solid rgba(107,78,40,.3)', borderBottom: '1px solid rgba(107,78,40,.3)', marginTop: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Reveal up to:</span>
          <select
            value={pin.visibility_threshold || 5}
            onChange={e => onUpdateNotes(pin.id, { visibility_threshold: +e.target.value })}
            style={{ fontSize: 9, padding: '1px 3px', flex: 1 }}
          >
            <option value={0}>None</option>
            <option value={5}>TN 5</option>
            <option value={10}>TN 10</option>
            <option value={15}>TN 15</option>
            <option value={20}>TN 20</option>
          </select>
          <span style={{ fontSize: 9, color: pin.is_visible_to_players ? 'var(--green)' : 'var(--text-muted)' }}>
            {pin.is_visible_to_players ? '● visible' : '○ hidden'}
          </span>
        </div>
      )}

      {/* Player notes */}
      <div style={{ marginBottom: 5 }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 2 }}>Party Notes</div>
        <textarea
          rows={2}
          value={notes}
          onChange={e => { setNotes(e.target.value); setNotesChanged(true); }}
          placeholder="What does the party know about this place?"
          style={{ width: '100%', resize: 'vertical', fontSize: 10, minWidth: 160 }}
        />
        {notesChanged && (
          <button className="btn btn-sm btn-p" style={{ fontSize: 9, marginTop: 2 }}
            onClick={() => { onUpdateNotes(pin.id, { player_notes: notes }); setNotesChanged(false); }}>
            Save Notes
          </button>
        )}
      </div>

      {/* GM actions */}
      {isGM && !isPCView && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <button className="btn btn-sm" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => onEdit(pin)}>Edit</button>
          <button className="btn btn-sm" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => onToggleVisibility(pin)}>
            {pin.is_visible_to_players ? 'Hide' : 'Reveal'}
          </button>
          <button className="btn btn-sm btn-d" style={{ fontSize: 9, padding: '1px 6px' }} onClick={() => onDelete(pin.id)}>Delete</button>
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
  const [editingPin, setEditingPin] = useState(null); // pin being edited
  const [newPinPos, setNewPinPos] = useState(null);   // {x,y} percent for new pin
  const mapRef = useRef(null);

  // Filter pins for current layer and visibility
  const visiblePins = (pins || []).filter(p => {
    if (p.map_layer !== layer) return false;
    if (!isGM && !p.is_visible_to_players) return false;
    if (filter && p.pin_type !== filter) return false;
    return true;
  });

  const handleMapClick = useCallback((e) => {
    if (!placing || !isGM || editingPin) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = +((e.clientX - rect.left) / rect.width * 100).toFixed(2);
    const y = +((e.clientY - rect.top) / rect.height * 100).toFixed(2);
    setNewPinPos({ x, y });
    setSelected(null);
  }, [placing, isGM, editingPin]);

  const handlePinClick = (e, pinId) => {
    e.stopPropagation();
    if (placing) return;
    setSelected(selected === pinId ? null : pinId);
    setNewPinPos(null);
    setEditingPin(null);
  };

  const handleCreatePin = async (form) => {
    await onCreatePin({
      ...form,
      map_layer: layer,
      x_position: newPinPos.x,
      y_position: newPinPos.y,
    });
    setNewPinPos(null);
    setPlacing(false);
  };

  const handleEditPin = async (form) => {
    await onUpdatePin(editingPin.id, form);
    setEditingPin(null);
    setSelected(null);
  };

  const handleDelete = async (id) => {
    await onDeletePin(id);
    setSelected(null);
  };

  const handleToggleVisibility = async (pin) => {
    await onUpdatePin(pin.id, { is_visible_to_players: !pin.is_visible_to_players });
  };

  const handleUpdateNotes = async (id, updates) => {
    await onUpdatePin(id, updates);
  };

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '.6rem', flexWrap: 'wrap' }}>
        {/* Layer toggle */}
        <div className="layer-tog">
          <button className={`layer-btn ${layer === 'surface' ? 'active' : ''}`} onClick={() => { setLayer('surface'); setSelected(null); }}>Surface</button>
          <button className={`layer-btn ${layer === 'underground' ? 'active' : ''}`} onClick={() => { setLayer('underground'); setSelected(null); }}>Underground</button>
        </div>

        {/* Place pin button (GM) */}
        {isGM && !isPCView && (
          <button
            className={`btn btn-sm ${placing ? 'btn-p' : ''}`}
            onClick={() => { setPlacing(!placing); setSelected(null); setNewPinPos(null); setEditingPin(null); }}
          >
            <i className={`ti ${placing ? 'ti-x' : 'ti-map-pin'}`} style={{ fontSize: 11 }} />
            {placing ? 'Cancel Placing' : 'Place Pin'}
          </button>
        )}

        {/* Pin count */}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {visiblePins.length} pin{visiblePins.length !== 1 ? 's' : ''}
          {filter ? ` · ${PIN_TYPES.find(t => t.id === filter)?.label}` : ''}
        </span>
      </div>

      {/* Placing instruction */}
      {placing && !newPinPos && (
        <div style={{ padding: '.4rem .75rem', background: 'rgba(200,150,42,.1)', border: '1px solid var(--gold-dim)', borderRadius: 4, marginBottom: '.5rem', fontSize: 11, color: 'var(--gold)' }}>
          <i className="ti ti-map-pin" style={{ marginRight: 4 }} />
          Click anywhere on the map to place a pin
        </div>
      )}

      {/* Filter tags */}
      <div style={{ display: 'flex', gap: '.3rem', flexWrap: 'wrap', marginBottom: '.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>Filter:</span>
        <FilterTag label="All" color="var(--gold)" active={!filter} onClick={() => setFilter(null)} />
        {PIN_TYPES.map(pt => (
          <FilterTag key={pt.id} label={pt.label} color={pt.color} active={filter === pt.id} onClick={() => setFilter(filter === pt.id ? null : pt.id)} />
        ))}
      </div>

      {/* Map container */}
      <div
        className="map-con"
        ref={mapRef}
        onClick={handleMapClick}
        style={{ cursor: placing && !newPinPos ? 'crosshair' : 'default' }}
      >
        {/* Map image */}
        {layer === 'surface' && (
          <img
            src={MAP_IMAGE}
            alt="Medinaat al-Salaam"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .9 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Underground placeholder */}
        {layer === 'underground' && (
          <div style={{ position: 'absolute', inset: 0, background: '#0e0c08', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.75rem' }}>
            <i className="ti ti-map" style={{ fontSize: 36, color: 'var(--text-muted)', opacity: .3 }} />
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Underground map — art pending</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Sewer network · Caves · Underground palaces · Building basements</div>
          </div>
        )}

        {/* Ring overlays (surface only) */}
        {layer === 'surface' && (
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <defs>
              <filter id="txtshadow">
                <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor="#000" floodOpacity=".9" />
              </filter>
            </defs>
            {/* Outer City */}
            <ellipse cx="50" cy="50" rx="46" ry="46" fill="none" stroke="#e8b840" strokeWidth=".7" strokeDasharray="2,1.5" opacity=".65" />
            <text x="50" y="5.5" textAnchor="middle" fill="#e8b840" fontSize="3.2" fontFamily="Georgia,serif" filter="url(#txtshadow)" opacity=".95">Outer City</text>
            <text x="50" y="8.8" textAnchor="middle" fill="#c8962a" fontSize="2" filter="url(#txtshadow)" opacity=".8">markets · foreigners · common quarters</text>
            {/* Merchant District */}
            <ellipse cx="50" cy="50" rx="35" ry="35" fill="none" stroke="#e8b840" strokeWidth=".6" strokeDasharray="1.5,1.5" opacity=".6" />
            <text x="50" y="16.2" textAnchor="middle" fill="#e8b840" fontSize="3" fontFamily="Georgia,serif" filter="url(#txtshadow)" opacity=".95">Merchant District</text>
            <text x="50" y="19.4" textAnchor="middle" fill="#c8962a" fontSize="2" filter="url(#txtshadow)" opacity=".8">Dahab · guilds · Ra'Shari camps</text>
            {/* Faction Quarter */}
            <ellipse cx="50" cy="50" rx="26" ry="26" fill="none" stroke="#e8b840" strokeWidth=".6" strokeDasharray="1.5,1.5" opacity=".6" />
            <text x="50" y="25.2" textAnchor="middle" fill="#e8b840" fontSize="2.8" fontFamily="Georgia,serif" filter="url(#txtshadow)" opacity=".95">Faction Quarter</text>
            <text x="50" y="28.2" textAnchor="middle" fill="#c8962a" fontSize="2" filter="url(#txtshadow)" opacity=".8">Qabal stronghold · Order halls</text>
            {/* Noble District */}
            <ellipse cx="50" cy="50" rx="18" ry="18" fill="none" stroke="#e8b840" strokeWidth=".6" strokeDasharray="1,1" opacity=".6" />
            <text x="50" y="33.3" textAnchor="middle" fill="#e8b840" fontSize="2.6" fontFamily="Georgia,serif" filter="url(#txtshadow)" opacity=".95">Noble District</text>
            <text x="50" y="36" textAnchor="middle" fill="#c8962a" fontSize="2" filter="url(#txtshadow)" opacity=".8">estates · City Guard HQ</text>
            {/* Palace */}
            <ellipse cx="50" cy="50" rx="10" ry="10" fill="rgba(200,150,42,.06)" stroke="#e8b840" strokeWidth=".9" opacity=".85" />
            <text x="50" y="48.8" textAnchor="middle" fill="#e8b840" fontSize="3.6" fontFamily="Georgia,serif" fontWeight="bold" filter="url(#txtshadow)" opacity="1">Palace</text>
            <text x="50" y="52.5" textAnchor="middle" fill="#c8962a" fontSize="2.2" filter="url(#txtshadow)" opacity=".9">Caliph's seat</text>
          </svg>
        )}

        {/* Pins */}
        {visiblePins.map(p => {
          const color = getPinColor(p.pin_type);
          const isSelected = selected === p.id;
          return (
            <div
              key={p.id}
              onClick={e => handlePinClick(e, p.id)}
              style={{ position: 'absolute', left: `${p.x_position}%`, top: `${p.y_position}%`, transform: 'translate(-50%,-50%)', cursor: 'pointer', zIndex: isSelected ? 20 : 10 }}
            >
              {/* Pin dot */}
              <div style={{
                width: isSelected ? 16 : 12, height: isSelected ? 16 : 12,
                borderRadius: '50%', background: color,
                border: `2px solid rgba(0,0,0,.7)`,
                boxShadow: `0 0 ${isSelected ? 12 : 6}px ${color}cc`,
                transition: 'all .15s',
                position: 'relative',
              }}>
                {/* Hidden indicator (GM) */}
                {isGM && !isPCView && !p.is_visible_to_players && (
                  <div style={{ position: 'absolute', top: -6, right: -6, width: 10, height: 10, borderRadius: '50%', background: 'var(--red)', border: '1px solid rgba(0,0,0,.5)', fontSize: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>×</div>
                )}
              </div>

              {/* Pin label */}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(26,18,8,.85)', borderRadius: 3, padding: '1px 5px',
                fontSize: 9, color, whiteSpace: 'nowrap', marginTop: 2,
                border: `1px solid ${color}44`, pointerEvents: 'none',
              }}>
                {p.name}
              </div>

              {/* Popup */}
              {isSelected && (
                <PinPopup
                  pin={p}
                  isGM={isGM}
                  isPCView={isPCView}
                  onEdit={(pin) => { setEditingPin(pin); setSelected(null); }}
                  onDelete={handleDelete}
                  onToggleVisibility={handleToggleVisibility}
                  onUpdateNotes={handleUpdateNotes}
                />
              )}
            </div>
          );
        })}

        {/* New pin placement marker */}
        {newPinPos && (
          <div style={{ position: 'absolute', left: `${newPinPos.x}%`, top: `${newPinPos.y}%`, transform: 'translate(-50%,-50%)', zIndex: 25 }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--gold)', border: '2px solid rgba(0,0,0,.7)', boxShadow: '0 0 12px var(--gold)cc', animation: 'pin-pulse 1s infinite' }} />
            <style>{`@keyframes pin-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }`}</style>
          </div>
        )}
      </div>

      {/* New pin form */}
      {newPinPos && !editingPin && (
        <div className="card" style={{ marginTop: '.75rem' }}>
          <div className="card-title">New Pin at {newPinPos.x.toFixed(1)}%, {newPinPos.y.toFixed(1)}%</div>
          <PinForm onSave={handleCreatePin} onCancel={() => { setNewPinPos(null); setPlacing(false); }} />
        </div>
      )}

      {/* Edit pin form */}
      {editingPin && (
        <div className="card" style={{ marginTop: '.75rem' }}>
          <div className="card-title">Editing: {editingPin.name}</div>
          <PinForm pin={editingPin} onSave={handleEditPin} onCancel={() => setEditingPin(null)} />
        </div>
      )}
    </div>
  );
}
