import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const STORAGE_KEY = 'sichos-tracker-learned';

export type LearnedMap = Record<string, boolean>;

function readLocalStorage(): LearnedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LearnedMap) : {};
  } catch {
    return {};
  }
}

function writeLocalStorage(map: LearnedMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getLocalProgress(): LearnedMap {
  return readLocalStorage();
}

export function hasLocalProgress(): boolean {
  const map = readLocalStorage();
  return Object.values(map).some(Boolean);
}

export async function importLocalProgressToSupabase(user: User): Promise<void> {
  const map = readLocalStorage();
  const ids = Object.entries(map).filter(([, v]) => v).map(([id]) => id);
  if (ids.length === 0) return;

  const rows = ids.map((sichaId) => ({
    user_id: user.id,
    sicha_id: sichaId,
    learned: true,
    learned_at: new Date().toISOString(),
  }));

  await supabase
    .from('user_sicha_progress')
    .upsert(rows, { onConflict: 'user_id,sicha_id' });
}

export function useLearnedState(user: User | null): [LearnedMap, (id: string) => void, boolean] {
  const [learned, setLearned] = useState<LearnedMap>({});
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Load progress
  useEffect(() => {
    if (!user) {
      setLearned(readLocalStorage());
      setLoading(false);
      return;
    }

    setLoading(true);
    supabase
      .from('user_sicha_progress')
      .select('sicha_id, learned')
      .eq('user_id', user.id)
      .eq('learned', true)
      .then(({ data }) => {
        if (!isMounted.current) return;
        const map: LearnedMap = {};
        if (data) {
          for (const row of data) {
            map[row.sicha_id] = true;
          }
        }
        setLearned(map);
        setLoading(false);
      });
  }, [user]);

  // Persist localStorage when logged out
  useEffect(() => {
    if (!user) {
      writeLocalStorage(learned);
    }
  }, [learned, user]);

  const toggle = useCallback((id: string) => {
    setLearned((prev) => {
      const next = { ...prev, [id]: !prev[id] };

      if (user) {
        if (next[id]) {
          supabase
            .from('user_sicha_progress')
            .upsert(
              { user_id: user.id, sicha_id: id, learned: true, learned_at: new Date().toISOString() },
              { onConflict: 'user_id,sicha_id' }
            )
            .then(() => {});
        } else {
          supabase
            .from('user_sicha_progress')
            .delete()
            .eq('user_id', user.id)
            .eq('sicha_id', id)
            .then(() => {});
        }
      }

      return next;
    });
  }, [user]);

  return [learned, toggle, loading];
}
