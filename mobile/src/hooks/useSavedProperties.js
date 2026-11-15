import { useState, useEffect, useCallback } from 'react';
import { getItem, setItem } from '../storage';

const STORAGE_KEY = '@nestmate_saved_properties';

export function useSavedProperties() {
  const [savedMap, setSavedMap] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await getItem(STORAGE_KEY);
      setSavedMap(data ? JSON.parse(data) : {});
    } catch (e) {
      console.warn('Failed to load saved properties', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSave = async (property) => {
    if (!property || !property.id) return;
    setSavedMap((prev) => {
      const updated = { ...prev };
      if (updated[property.id]) {
        delete updated[property.id];
      } else {
        updated[property.id] = property;
      }
      setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
      return updated;
    });
  };

  const isSaved = (propertyId) => !!savedMap[propertyId];
  const savedList = Object.values(savedMap);

  return { savedMap, savedList, loading, isSaved, toggleSave, reload: load };
}

export default useSavedProperties;
