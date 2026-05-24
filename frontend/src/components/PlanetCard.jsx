import './PlanetCard.css';

const DISCOVERY_ICONS = {
  'Transit':         '🌑',
  'Radial Velocity': '〰️',
  'Imaging':         '📷',
  'Microlensing':    '🔭',
  'Astrometry':      '📐',
};

const TEMP_LABEL = (t) => {
  if (!t) return { label: 'Unknown', color: '#8fa8cc' };
  if (t < 150)  return { label: 'Frozen 🥶', color: '#a8d4ff' };
  if (t < 273)  return { label: 'Very Cold', color: '#7ec8e3' };
  if (t < 320)  return { label: '🌿 Habitable Zone!', color: '#06d6a0' };
  if (t < 500)  return { label: 'Warm', color: '#ffd166' };
  if (t < 1000) return { label: 'Hot 🔥', color: '#f4a261' };
  return          { label: 'Scorching ☄️', color: '#ff6b6b' };
};

const SIZE_LABEL = (r) => {
  if (!r) return 'Unknown';
  if (r < 0.5)  return 'Tiny (sub-Earth)';
  if (r < 1.25) return 'Earth-sized 🌍';
  if (r < 2)    return 'Super-Earth';
  if (r < 6)    return 'Mini-Neptune';
  if (r < 15)   return 'Neptune-like';
  return          'Gas Giant 🪐';
};

export default function PlanetCard({ planet, onClose }) {
  if (!planet) return null;

  const temp     = TEMP_LABEL(planet.pl_eqt);
  const icon     = DISCOVERY_ICONS[planet.discoverymethod] || '🔭';
  const distLy   = planet.sy_dist ? (planet.sy_dist * 3.262).toFixed(1) : null;

  return (
    <div className="planet-card-overlay" onClick={onClose}>
      <div className="planet-card" onClick={e => e.stopPropagation()}>
        <button className="card-close" onClick={onClose}>✕</button>

        <div className="card-header">
          <div className="card-planet-viz">
            <div className="card-planet-orb" style={{
              '--planet-hue': planet.pl_rade
                ? `hsl(${180 + planet.pl_rade * 20}, 70%, ${40 + Math.min(planet.pl_rade * 5, 30)}%)`
                : 'var(--teal-glow)',
            }} />
            <div className="card-planet-ring" />
          </div>
          <div>
            <h2 className="card-name">{planet.pl_name}</h2>
            <p className="card-host">orbiting <span>{planet.hostname}</span></p>
            <p className="card-method">{icon} Discovered by {planet.discoverymethod || 'unknown method'}</p>
          </div>
        </div>

        <div className="card-stats">
          <StatPill label="Distance" value={distLy ? `${distLy} ly` : '—'} icon="📏" />
          <StatPill label="Size" value={SIZE_LABEL(planet.pl_rade)} icon="🪐" />
          <StatPill label="Temperature" value={temp.label} icon="🌡️" color={temp.color} />
          <StatPill label="Year Length" value={planet.pl_orbper ? `${parseFloat(planet.pl_orbper).toFixed(1)} days` : '—'} icon="🔄" />
          <StatPill label="Radius" value={planet.pl_rade ? `${parseFloat(planet.pl_rade).toFixed(2)} R⊕` : '—'} icon="📐" />
          <StatPill label="Mass" value={planet.pl_bmasse ? `${parseFloat(planet.pl_bmasse).toFixed(2)} M⊕` : '—'} icon="⚖️" />
          <StatPill label="Discovered" value={planet.disc_year || '—'} icon="🗓️" />
          <StatPill label="Distance (pc)" value={planet.sy_dist ? `${parseFloat(planet.sy_dist).toFixed(2)} pc` : '—'} icon="🌠" />
        </div>

        {planet.pl_eqt && planet.pl_rade && (
          <div className="card-fun-fact">
            <span>✨ Fun fact: </span>
            {planet.pl_eqt > 200 && planet.pl_eqt < 320 && planet.pl_rade < 2
              ? `${planet.pl_name} is in the habitable zone and Earth-sized — it could potentially support liquid water! 🌊`
              : planet.pl_rade > 10
              ? `${planet.pl_name} is a massive gas giant — over ${Math.round(planet.pl_rade / 11.2)} Jupiter radii!`
              : planet.pl_eqt > 1000
              ? `At ${Math.round(planet.pl_eqt)}K, ${planet.pl_name} is hotter than most stars' surfaces!`
              : `${planet.pl_name} completes one orbit every ${parseFloat(planet.pl_orbper || 0).toFixed(0)} Earth days.`}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ label, value, icon, color }) {
  return (
    <div className="stat-pill">
      <span className="stat-icon">{icon}</span>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value" style={color ? { color } : {}}>{value}</p>
      </div>
    </div>
  );
}
