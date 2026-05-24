import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GalaxyMinimap from '../components/GalaxyMinimap';
import PlanetCard from '../components/PlanetCard';
import LoadingNebula from '../components/LoadingNebula';
import { useExoplanets, useSearch } from '../hooks/useData';
import './ExploreMap.css';

const FILTERS = [
  { label: 'All',            value: 'all' },
  { label: '🌊 Habitable',   value: 'habitable' },
  { label: '🔭 Transit',     value: 'Transit' },
  { label: '〰️ Radial Vel.', value: 'Radial Velocity' },
  { label: '📷 Imaging',     value: 'Imaging' },
];

// ── Physics-based planet appearance (temperature → color, radius → size) ──────
const getPlanetVisual = (p) => {
  const t = p.pl_eqt;
  const r = p.pl_rade;
  if (!t || t < 150) {
    return r && r > 2
      ? { base: '#b0d4ff', mid: '#6090c0', dark: '#304870', type: 'ice-giant' }
      : { base: '#c8e8ff', mid: '#8ab4d4', dark: '#4a7090', type: 'icy' };
  }
  if (t < 200) return { base: '#d0e4f8', mid: '#7aaccc', dark: '#3a6888', type: 'cold' };
  if (t < 320) {
    return r && r < 1.6
      ? { base: '#7defc4', mid: '#2ab87a', dark: '#0d6644', type: 'habitable' }
      : { base: '#5ad4b0', mid: '#1a9878', dark: '#0a5244', type: 'habitable' };
  }
  if (t < 600)  return { base: '#f0c87a', mid: '#c8922a', dark: '#7a5010', type: 'warm' };
  if (t < 1000) return { base: '#ff9a4a', mid: '#cc5010', dark: '#882000', type: 'hot' };
  if (t < 2000) return { base: '#ff5020', mid: '#c01800', dark: '#700800', type: 'very-hot' };
  return              { base: '#ffcc00', mid: '#ff6600', dark: '#cc2200', type: 'ultra-hot' };
};

const isGasGiant    = (p) => p.pl_rade && p.pl_rade > 4;
const isNeptuneLike = (p) => p.pl_rade && p.pl_rade > 2 && p.pl_rade <= 4;

// ── Base radius in pixels (at zoom=1) ─────────────────────────────────────────
const BASE_R = 5; // fixed comfortable size for all planets at default zoom

const basePlanetR = (p) => {
  if (!p.pl_rade) return BASE_R;
  if (p.pl_rade > 11) return BASE_R * 2.0;
  if (p.pl_rade > 4)  return BASE_R * 1.6;
  if (p.pl_rade > 2)  return BASE_R * 1.3;
  if (p.pl_rade > 1)  return BASE_R * 1.1;
  return BASE_R;
};

// ── Draw one sphere ───────────────────────────────────────────────────────────
const drawPlanet = (ctx, x, y, r, visual, p, isHov, isSel) => {
  const er = isSel ? r * 1.4 : isHov ? r * 1.2 : r;

  if (isSel) {
    ctx.beginPath();
    ctx.arc(x, y, er + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (isHov || isSel) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, er * 2.2);
    g.addColorStop(0,   visual.base + 'aa');
    g.addColorStop(0.5, visual.base + '33');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(x, y, er * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Sphere gradient — off-center highlight for 3-D look
  const hx = x - er * 0.32, hy = y - er * 0.32;
  const s = ctx.createRadialGradient(hx, hy, 0, x, y, er);
  s.addColorStop(0,    '#ffffff');
  s.addColorStop(0.15, visual.base);
  s.addColorStop(0.55, visual.mid);
  s.addColorStop(0.85, visual.dark);
  s.addColorStop(1,    'rgba(0,0,0,0.9)');
  ctx.beginPath();
  ctx.arc(x, y, er, 0, Math.PI * 2);
  ctx.fillStyle = s;
  ctx.fill();

  // Band texture for gas giants
  if (isGasGiant(p) && er >= 5) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, er, 0, Math.PI * 2);
    ctx.clip();
    [-0.3, 0, 0.3].forEach((off, i) => {
      const bg = ctx.createLinearGradient(x - er, y + off * er, x + er, y + off * er);
      bg.addColorStop(0, 'rgba(0,0,0,0)');
      bg.addColorStop(0.5, `rgba(0,0,0,${0.1 + i * 0.04})`);
      bg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(x - er, y + off * er - er * 0.09, er * 2, er * 0.18);
    });
    ctx.restore();
  }

  // Ring for large gas giants
  if (isGasGiant(p) && er >= 7) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.28);
    const ri = er * 1.3, ro = er * 1.9;
    const rg = ctx.createRadialGradient(0, 0, ri, 0, 0, ro);
    rg.addColorStop(0, visual.mid + '88');
    rg.addColorStop(0.5, visual.base + '44');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(0, 0, ro, 0, Math.PI * 2);
    ctx.arc(0, 0, ri, 0, Math.PI * 2, true);
    ctx.fillStyle = rg;
    ctx.fill();
    ctx.restore();
  }

  // Habitable shimmer
  if (visual.type === 'habitable' && er >= 4) {
    const sh = ctx.createRadialGradient(hx, hy, 0, x, y, er);
    sh.addColorStop(0.4, 'rgba(0,255,180,0)');
    sh.addColorStop(0.9, 'rgba(0,255,180,0.18)');
    sh.addColorStop(1,   'rgba(0,255,180,0)');
    ctx.beginPath();
    ctx.arc(x, y, er, 0, Math.PI * 2);
    ctx.fillStyle = sh;
    ctx.fill();
  }

  // Label
  if (isHov || isSel) {
    const ly = y - er * (isSel ? 1.4 : 1.2) - 7;
    ctx.font = `bold ${Math.max(10, Math.min(13, er * 1.8))}px "Space Mono", monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillText(p.pl_name, x + 1, ly + 1);
    ctx.fillStyle = '#e8f0fe';
    ctx.fillText(p.pl_name, x, ly);
  }
};

// ── Deduplication: keep richest row per planet name ───────────────────────────
const deduplicatePlanets = (arr) => {
  const map = new Map();
  const score = (p) => Object.values(p).filter(v => v != null).length;
  arr.forEach(p => {
    if (!map.has(p.pl_name) || score(p) > score(map.get(p.pl_name)))
      map.set(p.pl_name, p);
  });
  return Array.from(map.values());
};

// ── Deterministic jitter from planet name (same every render) ─────────────────
// Spreads planets that share or cluster around the same RA/Dec.
// Amount is in degrees — small enough to stay in the right region of sky,
// large enough that no two planets visually collide at default zoom.
const JITTER_DEG = 500; // degrees of spread
const nameHash = (str) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return h;
};
const getJitter = (name) => {
  const h = nameHash(name);
  // Two independent pseudo-random values in [-1, 1]
  const jx = ((h & 0xffff) / 0xffff) * 2 - 1;
  const jy = (((h >> 16) & 0xffff) / 0xffff) * 2 - 1;
  return { jx: jx * JITTER_DEG, jy: jy * JITTER_DEG };
};

// ── Coordinate projection ─────────────────────────────────────────────────────
const project = (ra, dec, W, H, zoom, panX, panY) => {
  const nx = (ra / 360) * W;
  const ny = ((90 - dec) / 180) * H;
  const x = (nx - W / 2) * zoom + W / 2 + panX;
  const y = (ny - H / 2) * zoom + H / 2 + panY;
  return { x, y };
};

// ── Initial pan to center on the dense Kepler field (RA≈291°, Dec≈44°) ───────
const getInitialState = (W, H) => {
  // Project the Kepler field center at default zoom
  const kepler = project(291, 44, W, H, 1, 0, 0);
  return {
    zoom: 3.5,  // start zoomed in so planets have breathing room
    pan: {
      x: W / 2 - kepler.x * 3.5,
      y: H / 2 - kepler.y * 3.5,
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ExploreMap() {
  const canvasRef = useRef(null);
  const { planets: rawPlanets, loading } = useExoplanets(2000);
  const { results: searchResults, loading: searching, search } = useSearch();

  const [zoom, setZoom]             = useState(3.5);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [initialized, setInit]      = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart]   = useState(null);
  const [selected, setSelected]     = useState(null);
  const [hovered, setHovered]       = useState(null);
  const [searchQ, setSearchQ]       = useState('');
  const [filter, setFilter]         = useState('all');
  const [showLegend, setShowLegend] = useState(true);
  const searchTimeout = useRef(null);

  const planets = useMemo(() => deduplicatePlanets(rawPlanets), [rawPlanets]);

  // Center on Kepler field once canvas is ready
  useEffect(() => {
    if (initialized || !canvasRef.current) return;
    const W = canvasRef.current.offsetWidth;
    const H = canvasRef.current.offsetHeight;
    if (!W || !H) return;
    const { zoom: z, pan: p } = getInitialState(W, H);
    setZoom(z);
    setPan(p);
    setInit(true);
  }, [canvasRef.current, initialized]);

  const handleSearch = (q) => {
    setSearchQ(q);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => { if (q.trim()) search(q); }, 400);
  };

  const displayPlanets = useMemo(() => {
    let base = searchQ.trim() && searchResults.length
      ? deduplicatePlanets(searchResults)
      : planets;
    if (filter === 'habitable') {
      base = base.filter(p => p.pl_eqt > 200 && p.pl_eqt < 320 && (!p.pl_rade || p.pl_rade < 2));
    } else if (filter !== 'all') {
      base = base.filter(p => p.discoverymethod === filter);
    }
    return base;
  }, [planets, searchResults, searchQ, filter]);

  // Pre-compute jittered projected positions (stable across renders)
  const projectedPlanets = useMemo(() => {
    return displayPlanets.map(p => {
      const { jx, jy } = getJitter(p.pl_name);
      return { ...p, _ra: (p.ra ?? 0) + jx, _dec: (p.dec ?? 0) + jy };
    });
  }, [displayPlanets]);

  // ── Draw ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || loading) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    projectedPlanets.forEach(p => {
      const { x, y } = project(p._ra, p._dec, W, H, zoom, pan.x, pan.y);
      const pad = 30;
      if (x < -pad || x > W + pad || y < -pad || y > H + pad) return;

      const r     = Math.min(basePlanetR(p), 20);
      const visual = getPlanetVisual(p);
      const isHov  = hovered?.pl_name === p.pl_name;
      const isSel  = selected?.pl_name === p.pl_name;
      drawPlanet(ctx, x, y, r, visual, p, isHov, isSel);
    });
  }, [projectedPlanets, zoom, pan, hovered, selected, loading]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return;
      canvasRef.current.width  = canvasRef.current.offsetWidth;
      canvasRef.current.height = canvasRef.current.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // ── Hit-test ──────────────────────────────────────────────────────────────
  const hitTest = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = clientX - rect.left, my = clientY - rect.top;
    const W = canvas.width, H = canvas.height;
    let closest = null, minDist = Math.max(14, BASE_R * 5);
    projectedPlanets.forEach(p => {
      const { x, y } = project(p._ra, p._dec, W, H, zoom, pan.x, pan.y);
      const d = Math.hypot(mx - x, my - y);
      if (d < minDist) { minDist = d; closest = p; }
    });
    return closest;
  }, [projectedPlanets, zoom, pan]);

  // ── Mouse events ──────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    setIsDragging(false);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const onMouseMove = (e) => {
    if (dragStart) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      setIsDragging(true);
    } else {
      setHovered(hitTest(e.clientX, e.clientY));
    }
  };
  const onMouseUp = (e) => {
    if (!isDragging) {
      const hit = hitTest(e.clientX, e.clientY);
      if (hit) setSelected(hit);
    }
    setDragStart(null);
    setIsDragging(false);
  };
  const onWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.9;
    // Zoom toward cursor position
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    setZoom(z => {
      const nz = Math.min(Math.max(z * factor, 0.3), 30);
      const scale = nz / z;
      setPan(p => ({
        x: mx - (mx - p.x) * scale,
        y: my - (my - p.y) * scale,
      }));
      return nz;
    });
  };

  const lastTouch = useRef(null);
  const onTouchStart = (e) => {
    if (e.touches.length === 1) {
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };
  const onTouchMove = (e) => {
    if (e.touches.length === 1 && dragStart) {
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
      setIsDragging(true);
    }
  };
  const onTouchEnd = (e) => {
    if (!isDragging && lastTouch.current) {
      const t = e.changedTouches[0];
      const hit = hitTest(t.clientX, t.clientY);
      if (hit) setSelected(hit);
    }
    setDragStart(null);
    setIsDragging(false);
  };

  const resetView = () => {
    const W = canvasRef.current?.offsetWidth || window.innerWidth;
    const H = canvasRef.current?.offsetHeight || window.innerHeight;
    const { zoom: z, pan: p } = getInitialState(W, H);
    setZoom(z);
    setPan(p);
  };

  return (
    <div className="explore-page">
      <div className="explore-toolbar">
        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search a planet... e.g. Kepler-22 b"
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
          />
          {searching && <span className="search-spinner" />}
          {searchQ && <button className="search-clear" onClick={() => setSearchQ('')}>✕</button>}
        </div>

        <div className="filter-pills">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`filter-pill ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >{f.label}</button>
          ))}
        </div>

        <div className="map-stats">
          <span className="map-stat-badge">🪐 {displayPlanets.length.toLocaleString()} planets</span>
          <span className="map-stat-badge">🔍 {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {loading ? (
        <div className="map-loading-wrap">
          <LoadingNebula message="Loading the galaxy..." />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className={`star-map-canvas ${isDragging ? 'dragging' : ''} ${hovered ? 'hovering' : ''}`}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={() => { setHovered(null); setDragStart(null); }}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
      )}

      <div className="zoom-controls">
        <button onClick={() => setZoom(z => Math.min(z * 1.3, 30))}>＋</button>
        <button onClick={resetView}>⌂</button>
        <button onClick={() => setZoom(z => Math.max(z / 1.3, 0.3))}>－</button>
      </div>

      <div className={`map-legend ${showLegend ? 'open' : ''}`}>
        <button className="legend-toggle" onClick={() => setShowLegend(s => !s)}>
          {showLegend ? '▸ Hide' : '◂ Legend'}
        </button>
        {showLegend && (
          <div className="legend-items">
            <div className="legend-section">Color = temperature</div>
            {[
              ['< 150 K — Frozen',      '#c8e8ff'],
              ['200–320 K — Habitable', '#7defc4'],
              ['320–600 K — Warm',      '#f0c87a'],
              ['600–1000 K — Hot',      '#ff9a4a'],
              ['> 1000 K — Scorching',  '#ff5020'],
            ].map(([label, color]) => (
              <div key={label} className="legend-item">
                <span className="legend-dot" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
                <span>{label}</span>
              </div>
            ))}
            <div className="legend-section" style={{ marginTop: 8 }}>Size = planet radius</div>
          </div>
        )}
      </div>

      {!loading && !selected && (
        <div className="map-hint">
         Click a planet to explore · Scroll to zoom · Drag to pan
        </div>
      )}

      <GalaxyMinimap />
      {selected && <PlanetCard planet={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
