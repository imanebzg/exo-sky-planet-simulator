import { useState } from 'react';
import StarField from '../components/StarField';
import PlanetCard from '../components/PlanetCard';
import LoadingNebula from '../components/LoadingNebula';
import { useHabitable } from '../hooks/useData';
import './HabitablePage.css';

const LIFE_SCORE = (p) => {
  let score = 0;
  if (p.pl_eqt > 250 && p.pl_eqt < 300) score += 40;
  else if (p.pl_eqt > 200 && p.pl_eqt < 320) score += 20;
  if (p.pl_rade > 0.8 && p.pl_rade < 1.5) score += 35;
  else if (p.pl_rade < 2) score += 15;
  if (p.pl_bmasse && p.pl_bmasse < 3) score += 15;
  if (p.disc_year && p.disc_year > 2010) score += 10;
  return Math.min(score, 100);
};

export default function HabitablePage() {
  const { planets, loading, error } = useHabitable();
  const [selected, setSelected]     = useState(null);
  const [sort, setSort]             = useState('score');

  const sorted = [...planets].sort((a, b) => {
    if (sort === 'score') return LIFE_SCORE(b) - LIFE_SCORE(a);
    if (sort === 'dist')  return (a.sy_dist || 999) - (b.sy_dist || 999);
    if (sort === 'temp')  return (a.pl_eqt || 0) - (b.pl_eqt || 0);
    if (sort === 'size')  return (a.pl_rade || 0) - (b.pl_rade || 0);
    return 0;
  });

  return (
    <div className="habitable-page">
      <StarField density={150} />

      <div className="habitable-inner">
        <header className="habitable-header">
          <h1 className="habitable-title">Worlds That Could<br />Harbor <span>Life</span></h1>
          <p className="habitable-sub">
            These exoplanets sit in their star's habitable zone — temperatures where liquid water
            could exist on the surface. Sound familiar? 🌍
          </p>
        </header>

        {loading ? (
          <LoadingNebula message="Searching for life-friendly worlds..." />
        ) : error ? (
          <div className="error-msg">⚠️ Couldn't load habitable planets. Is the backend running?</div>
        ) : (
          <>
            <div className="sort-bar">
              <span className="sort-label">Sort by:</span>
              {[['score', '⭐ Life Score'], ['dist', '📏 Distance'], ['temp', '🌡️ Temperature'], ['size', '📐 Size']].map(([v, l]) => (
                <button key={v} className={`sort-btn ${sort === v ? 'active' : ''}`} onClick={() => setSort(v)}>
                  {l}
                </button>
              ))}
              <span className="result-count">{planets.length} candidates found</span>
            </div>

            <div className="habitable-grid">
              {sorted.map(p => {
                const score = LIFE_SCORE(p);
                const distLy = p.sy_dist ? (p.sy_dist * 3.262).toFixed(0) : '?';
                return (
                  <div key={p.pl_name} className="hab-card" onClick={() => setSelected(p)}>
                    <div className="hab-planet-orb" style={{
                      background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), hsl(${140 + score}, 60%, 35%))`,
                      boxShadow: `0 0 ${score * 0.5}px hsl(${140 + score}, 80%, 50%)`,
                    }} />
                    <div className="hab-content">
                      <h3 className="hab-name">{p.pl_name}</h3>
                      <p className="hab-host">⭐ {p.hostname}</p>
                      <div className="hab-pills">
                        {p.pl_eqt && <span className="hab-pill">🌡️ {Math.round(p.pl_eqt)} K</span>}
                        {p.pl_rade && <span className="hab-pill">📐 {parseFloat(p.pl_rade).toFixed(2)} R⊕</span>}
                        {p.sy_dist && <span className="hab-pill">📏 {distLy} ly</span>}
                      </div>
                      <div className="life-score-wrap">
                        <div className="life-score-label">
                          <span>Life Score</span>
                          <strong>{score}%</strong>
                        </div>
                        <div className="life-score-bar">
                          <div className="life-score-fill" style={{ width: `${score}%`, background: `hsl(${100 + score}, 70%, 50%)` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {selected && <PlanetCard planet={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
