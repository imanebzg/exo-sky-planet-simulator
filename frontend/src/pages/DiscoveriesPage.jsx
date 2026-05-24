import { useMemo } from 'react';
import StarField from '../components/StarField';
import LoadingNebula from '../components/LoadingNebula';
import { useStats } from '../hooks/useData';
import './DiscoveriesPage.css';

const METHOD_COLORS = {
  'Transit':                 '#00e5ff',
  'Radial Velocity':         '#ffd166',
  'Imaging':                 '#06d6a0',
  'Microlensing':            '#f4a261',
  'Astrometry':              '#c77dff',
  'Transit Timing Variations':'#ff6b6b',
  'Eclipse Timing Variations':'#ff9f43',
};

export default function DiscoveriesPage() {
  const { stats, loading } = useStats();

  const { byYear, methods, maxCount } = useMemo(() => {
    const byYear = {};
    const methodSet = new Set();
    stats.forEach(row => {
      const year = row.disc_year;
      const method = row.discoverymethod;
      const count = parseInt(row.count) || 0;
      if (!year || year < 1992 || year > 2030) return;
      if (!byYear[year]) byYear[year] = {};
      byYear[year][method] = (byYear[year][method] || 0) + count;
      methodSet.add(method);
    });
    const methods = [...methodSet].sort();
    let maxCount = 0;
    Object.values(byYear).forEach(m => {
      const total = Object.values(m).reduce((s, v) => s + v, 0);
      if (total > maxCount) maxCount = total;
    });
    return { byYear, methods, maxCount };
  }, [stats]);

  const years = Object.keys(byYear).sort();

  return (
    <div className="discoveries-page">
      <StarField density={120} />

      <div className="discoveries-inner">
        <header className="discoveries-header">
          <h1 className="disc-title">How We Found <span>5,700+ Worlds</span></h1>
          <p className="disc-sub">
            From the first confirmed exoplanet in 1992 to thousands discovered by Kepler, TESS, and beyond.
            Each bar is a year. Each color is how we found them.
          </p>
        </header>

        {loading ? (
          <LoadingNebula message="Assembling the timeline..." />
        ) : (
          <>
            {/* Legend */}
            <div className="disc-legend">
              {methods.map(m => (
                <div key={m} className="disc-legend-item">
                  <span className="disc-legend-dot" style={{ background: METHOD_COLORS[m] || '#8fa8cc' }} />
                  <span>{m}</span>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="disc-chart-wrap">
              <div className="disc-chart">
                {years.map(year => {
                  const total = Object.values(byYear[year]).reduce((s, v) => s + v, 0);
                  const heightPct = maxCount > 0 ? (total / maxCount) * 100 : 0;
                  return (
                    <div key={year} className="disc-bar-col" title={`${year}: ${total} planets`}>
                      <div className="disc-bar-total">{total > 0 ? total : ''}</div>
                      <div className="disc-bar-stack" style={{ height: `${heightPct}%` }}>
                        {methods.map(m => {
                          const count = byYear[year][m] || 0;
                          if (!count) return null;
                          const pct = (count / total) * 100;
                          return (
                            <div
                              key={m}
                              className="disc-bar-segment"
                              style={{
                                height: `${pct}%`,
                                background: METHOD_COLORS[m] || '#8fa8cc',
                                opacity: 0.85,
                              }}
                              title={`${m}: ${count}`}
                            />
                          );
                        })}
                      </div>
                      <div className="disc-bar-year">{year % 5 === 0 ? year : ''}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestones */}
            <div className="milestones">
              <h2 className="milestones-title">🏆 Key Moments</h2>
              <div className="milestones-grid">
                {[
                  { year: 1992, text: 'First confirmed exoplanets discovered around a pulsar by Wolszczan & Frail.' },
                  { year: 1995, text: '51 Pegasi b : first exoplanet found around a Sun-like star.' },
                  { year: 2009, text: 'NASA launches the Kepler Space Telescope, beginning its planet-hunting mission.' },
                  { year: 2014, text: 'Kepler announces 715 new exoplanets in one day : a record that stood for years.' },
                  { year: 2018, text: 'TESS (Transiting Exoplanet Survey Satellite) begins its all-sky survey.' },
                  { year: 2022, text: 'Total confirmed exoplanets surpasses 5,000.' },
                ].map(m => (
                  <div key={m.year} className="milestone-card">
                    <span className="milestone-year">{m.year}</span>
                    <p className="milestone-text">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
