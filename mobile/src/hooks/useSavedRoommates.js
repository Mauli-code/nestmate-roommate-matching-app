import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nestmate_saved_roommates';

export function useSavedRoommates() {
  const [savedMap, setSavedMap] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
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
    setSavedMap((prev) => {
      const updated = { ...prev };
      if (updated[roommate.id]) {
        delete updated[roommate.id];
      } else {
        updated[roommate.id] = roommate;
      }
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const isSaved = (roommateId) => !!savedMap[roommateId];
  const savedList = Object.values(savedMap);

  return { savedMap, savedList, loading, isSaved, toggleSave, reload: load };
}

export default useSavedRoommates;
