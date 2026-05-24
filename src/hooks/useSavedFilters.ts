import { useState, useCallback, useEffect } from 'react';

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  createdAt: number;
}

const STORAGE_KEY = 'lc_saved_filters';

function readStorage(pageKey: string): SavedFilter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SavedFilter[]>) : {};
    return all[pageKey] || [];
  } catch {
    return [];
  }
}

function writeStorage(pageKey: string, filters: SavedFilter[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, SavedFilter[]>) : {};
    all[pageKey] = filters;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

export function useSavedFilters(pageKey: string, currentFilters: Record<string, unknown>) {
  const [saved, setSaved] = useState<SavedFilter[]>(() => readStorage(pageKey));
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    setSaved(readStorage(pageKey));
  }, [pageKey]);

  const save = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: SavedFilter = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: trimmed,
      filters: JSON.parse(JSON.stringify(currentFilters)),
      createdAt: Date.now(),
    };
    const updated = [...saved.filter(s => s.name !== trimmed), next].slice(-10);
    setSaved(updated);
    writeStorage(pageKey, updated);
    setShowSaveInput(false);
    setSaveName('');
  }, [pageKey, currentFilters, saved]);

  const remove = useCallback((id: string) => {
    const updated = saved.filter(s => s.id !== id);
    setSaved(updated);
    writeStorage(pageKey, updated);
  }, [pageKey, saved]);

  const apply = useCallback((filter: SavedFilter) => filter.filters, []);

  return { saved, save, remove, apply, showSaveInput, setShowSaveInput, saveName, setSaveName };
}
