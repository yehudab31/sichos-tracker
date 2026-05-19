import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type StarsMap = Record<string, boolean>;

export function useSichaStars(user: User | null) {
  const [favorites,  setFavorites]  = useState<StarsMap>({});
  const [bookmarks,  setBookmarks]  = useState<StarsMap>({});

  // Load on mount / user change
  useEffect(() => {
    if (!user) {
      try {
        const f = localStorage.getItem('sichos-favorites');
        const b = localStorage.getItem('sichos-bookmarks');
        setFavorites(f ? JSON.parse(f) : {});
        setBookmarks(b ? JSON.parse(b) : {});
      } catch {}
      return;
    }
    supabase
      .from('user_sicha_stars')
      .select('sicha_id, type')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const f: StarsMap = {};
        const b: StarsMap = {};
        for (const row of data ?? []) {
          if (row.type === 'favorite') f[row.sicha_id] = true;
          if (row.type === 'bookmark') b[row.sicha_id] = true;
        }
        setFavorites(f);
        setBookmarks(b);
      });
  }, [user?.id]);

  async function toggle(sichaId: string, type: 'favorite' | 'bookmark') {
    const current = type === 'favorite' ? favorites : bookmarks;
    const setter  = type === 'favorite' ? setFavorites : setBookmarks;
    const lsKey   = type === 'favorite' ? 'sichos-favorites' : 'sichos-bookmarks';

    const isOn   = !!current[sichaId];
    const updated = { ...current };
    if (isOn) delete updated[sichaId];
    else updated[sichaId] = true;
    setter(updated);

    if (user) {
      if (isOn) {
        await supabase.from('user_sicha_stars')
          .delete()
          .eq('user_id', user.id)
          .eq('sicha_id', sichaId)
          .eq('type', type);
      } else {
        await supabase.from('user_sicha_stars')
          .upsert({ user_id: user.id, sicha_id: sichaId, type });
      }
    } else {
      try { localStorage.setItem(lsKey, JSON.stringify(updated)); } catch {}
    }
  }

  return {
    favorites,
    bookmarks,
    toggleFavorite: (id: string) => toggle(id, 'favorite'),
    toggleBookmark: (id: string) => toggle(id, 'bookmark'),
  };
}
