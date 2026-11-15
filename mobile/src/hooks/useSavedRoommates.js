import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../storage';
import { fetchFavorites, addFavorite, removeFavorite } from '../api/favorites';

const STORAGE_KEY = '@nestmate_saved_roommates';

export function useSavedRoommates() {
  const [savedMap, setSavedMap] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // 1. Try to fetch from persistent PostgreSQL database if authenticated
      const token = await getItem('auth_token');
      if (token) {
        try {
          const apiFavorites = await fetchFavorites(token);
          if (Array.isArray(apiFavorites)) {
            const map = {};
            for (const fav of apiFavorites) {
              const rId = fav.roommateId || fav.id;
              if (rId) map[rId] = fav;
            }
            setSavedMap(map);
            await setItem(STORAGE_KEY, JSON.stringify(map));
            return;
          }
        } catch {
          // Fall back to hardware/secure storage cache
        }
      }

      // 2. Fall back to secure storage
      const data = await getItem(STORAGE_KEY);
      setSavedMap(data ? JSON.parse(data) : {});
    } catch (e) {
      console.warn('Failed to load saved roommates', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async (roommate) => {
    if (!roommate || !roommate.id) return;
    const token = await getItem('auth_token');
    setSavedMap((prev) => {
      const updated = { ...prev };
      const alreadySaved = !!updated[roommate.id];
      if (alreadySaved) {
        delete updated[roommate.id];
        if (token) {
          removeFavorite(roommate.id, token).catch(() => {});
        }
      } else {
        updated[roommate.id] = roommate;
        if (token) {
          addFavorite(roommate.id, token).catch(() => {});
        }
      }
      setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const isSaved = (roommateId) => !!savedMap[roommateId];
  const savedList = Object.values(savedMap);

  return { savedMap, savedList, loading, isSaved, toggleSave, reload: load };
}

export default useSavedRoommates;
