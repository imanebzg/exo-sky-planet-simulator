import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StarField from '../components/StarField';
import LoadingNebula from '../components/LoadingNebula';
import { useApod } from '../hooks/useData';
import { api } from '../utils/api';
import './HomePage.css';

function AnimatedCount({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function HomePage() {
  const { apod, loading: apodLoading } = useApod();
  const [neo, setNeo]       = useState([]);
  const [stats, setStats]   = useState({ total: 0, methods: 0, confirmed: 0 });

  useEffect(() => {
    api.getNeo().then(d => setNeo(d.results?.slice(0, 3) || [])).catch(() => {});
    api.getStats().then(d => {
      const results = d.results || [];
      const total   = results.reduce((s, r) => s + (r.count || 0), 0);
      const methods = new Set(results.map(r => r.discoverymethod)).size;
      setStats({ total, methods, confirmed: total });
    }).catch(() => {});
  }, []);

  return (
    <div className="home-page">
      <StarField density={250} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero">
        <h1 className="hero-title">
          <span className="hero-title-line1">Explore the</span>
          <span className="hero-title-accent glow-text-cyan"> Universe</span>
        </h1>
        <p className="hero-subtitle">
          Thousands of worlds beyond our Solar System<br />
          <em>This is your star chart.</em>
        </p>
        <div className="hero-cta">
          <Link to="/explore" className="btn-primary">
            🌌 Open Star Map
          </Link>
          <Link to="/habitable" className="btn-secondary">
            🌿 Find Habitable Worlds
          </Link>
        </div>

        {/* Orbiting planet decoration */}
        <div className="hero-orrery">
          <div className="orrery-sun" />
          <div className="orrery-orbit orrery-orbit-1">
            <div className="orrery-planet p1" />
          </div>
          <div className="orrery-orbit orrery-orbit-2">
            <div className="orrery-planet p2" />
          </div>
          <div className="orrery-orbit orrery-orbit-3">
            <div className="orrery-planet p3" />
          </div>
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="stats-bar">
        <StatCard icon="🪐" value={<AnimatedCount target={5700} suffix="+" />} label="Confirmed Exoplanets" color="cyan" />
        <StatCard icon="🔭" value={<AnimatedCount target={7} />} label="Detection Methods" color="gold" />
        <StatCard icon="🌿" value={<AnimatedCount target={60} suffix="+" />} label="Habitable Candidates" color="green" />
        <StatCard icon="💫" value={<AnimatedCount target={3000} suffix=" ly" />} label="Avg. Distance" color="violet" />
      </section>

      {/* ── APOD ──────────────────────────────────────────────────────────── */}
      <section className="apod-section">
        <h2 className="section-title">✨ NASA Picture of the Day</h2>
        {apodLoading
          ? <LoadingNebula message="Loading today's cosmic view..." />
          : apod && (
            <div className="apod-card">
              {apod.media_type === 'image' && (
                <div className="apod-img-wrap">
                  <img src={apod.url} alt={apod.title} className="apod-img" />
                </div>
              )}
              <div className="apod-content">
                <h3 className="apod-title">{apod.title}</h3>
                <p className="apod-date">{apod.date}</p>
                <p className="apod-explanation">{apod.explanation?.slice(0, 300)}…</p>
              </div>
            </div>
          )
        }
      </section>

      {/* ── Near-Earth Objects ────────────────────────────────────────────── */}
      {neo.length > 0 && (
        <section className="neo-section">
          <h2 className="section-title">☄️ Asteroids Passing Earth <em>Today</em></h2>
          <div className="neo-grid">
            {neo.map(n => (
              <div key={n.id} className={`neo-card ${n.is_potentially_hazardous ? 'hazardous' : ''}`}>
                <div className="neo-name">{n.name}</div>
                <div className="neo-stats">
                  <span>📏 {parseFloat(n.diameter_km?.estimated_diameter_max || 0).toFixed(2)} km</span>
                  <span>🎯 {parseFloat(n.miss_distance_km || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} km away</span>
                </div>
                {n.is_potentially_hazardous && <div className="neo-hazard">⚠️ Potentially Hazardous</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Call to action ────────────────────────────────────────────────── */}
      <section className="bottom-cta">
        <h2>Ready to explore the cosmos?</h2>
        <p>Each dot on our map is a real world discovered by NASA missions.</p>
        <Link to="/explore" className="btn-primary large">Start Exploring 🚀</Link>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, color }) {
  return (
    <div className={`stat-card stat-card--${color}`}>
      <span className="stat-card-icon">{icon}</span>
      <strong className="stat-card-value">{value}</strong>
      <span className="stat-card-label">{label}</span>
    </div>
  );
}
