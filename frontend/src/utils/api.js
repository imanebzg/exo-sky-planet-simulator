const BASE = 'http://localhost:3001/api/v1';

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

const post = async (path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
};

export const api = {
  // Exoplanets
  getExoplanets:        (maxDist = 500)  => get(`/exoplanets?maxDist=${maxDist}`),
  searchExoplanets:     (q)              => get(`/exoplanets/search?q=${encodeURIComponent(q)}`),
  getHabitable:         ()               => get('/exoplanets/habitable'),
  getStats:             ()               => get('/exoplanets/stats'),
  getPlanet:            (name)           => get(`/exoplanets/${encodeURIComponent(name)}`),

  // NASA
  getApod:              (date)           => get(date ? `/nasa/apod?date=${date}` : '/nasa/apod'),
  getRandomApod:        (count = 5)      => get(`/nasa/apod/random?count=${count}`),
  getNeo:               ()               => get('/nasa/neo'),
  searchImages:         (q)              => get(`/nasa/images?q=${encodeURIComponent(q)}`),

  // ML
  classify:             (features)       => post('/ml/classify', features),
  getMLModel:           ()               => get('/ml/model'),
};
