import { useState, useEffect, useCallback } from 'react';
import matchRequestService from '../services/matchRequestService';

export function useMatchRequests() {
  const [requestsMap, setRequestsMap] = useState({});
  const [loading, setLoading] = useState(true);

  const loadRequests = useCallback(async () => {
    try {
      const data = await matchRequestService.getSentRequests();
      setRequestsMap(data);
    } catch (e) {
      console.warn('Error loading match requests', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const sendRequest = async (candidate) => {
    try {
      const result = await matchRequestService.sendMatchRequest(candidate);
      if (result.success) {
        setRequestsMap((prev) => ({
          ...prev,
          [candidate.id]: result.request,
        }));
      }
      return result;
    } catch (err) {
      console.error('Failed to send request', err);
      return { success: false, message: err.message };
    }
  };

  const isRequested = (candidateId) => {
    return !!requestsMap[candidateId];
  };

  return {
    requestsMap,
    loading,
    sendRequest,
    isRequested,
    refreshRequests: loadRequests,
  };
}

export default useMatchRequests;
