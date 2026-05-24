import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';

export function useExoplanets(maxDist = 500) {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.getExoplanets(maxDist)
      .then(data => setPlanets(data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [maxDist]);

  return { planets, loading, error };
}

export function useHabitable() {
  const [planets, setPlanets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    api.getHabitable()
      .then(data => setPlanets(data.results || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { planets, loading, error };
}

export function useStats() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(data => setStats(data.results || []))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

export function useSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.searchExoplanets(q);
      setResults(data.results || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  return { results, loading, search };
}

export function useApod() {
  const [apod, setApod] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getApod()
      .then(setApod)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return { apod, loading };
}
