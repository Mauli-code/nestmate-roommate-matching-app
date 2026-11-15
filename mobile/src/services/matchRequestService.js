/**
 * Match Request Service
 * Handles sending and tracking roommate match requests.
 * Uses persistent storage and backend database connection requests API.
 */

import { getItem, setItem } from '../storage';
import { sendConnectionRequest } from '../api/connectionRequests';

const STORAGE_KEY = '@nestmate_match_requests';

export const matchRequestService = {
  /**
   * Get all sent requests
   */
  async getSentRequests() {
    try {
      const data = await getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Failed to load match requests from storage', e);
      return {};
    }
  },

  /**
   * Check if a request has already been sent to this roommate
   */
  async isRequested(candidateId) {
    if (!candidateId) return false;
    const requests = await this.getSentRequests();
    return !!requests[candidateId];
  },

  /**
   * Send a match request to a candidate
   * Prevents duplicate requests.
   */
  async sendMatchRequest(candidate, token) {
    if (!candidate || !candidate.id) {
      throw new Error('Valid candidate profile is required to send match request');
    }

    const currentRequests = await this.getSentRequests();

    // Duplicate prevention
    if (currentRequests[candidate.id]) {
      return {
        success: false,
        duplicate: true,
        message: 'You have already sent a request to this roommate.',
      };
    }

    // Prepare request record
    const newRequest = {
      id: `req-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateRole: candidate.role,
      candidateAvatar: candidate.avatar,
      candidateBudget: candidate.budget,
      candidateScore: candidate.score,
      status: 'pending',
      timestamp: new Date().toISOString(),
      isMock: true,
    };

    // If authenticated token is available, attempt real backend connection request
    if (token) {
      try {
        const apiData = await sendConnectionRequest(candidate.id, token);
        if (apiData && apiData.id) {
          newRequest.isMock = false;
          newRequest.id = apiData.id;
        }
      } catch {
        // Fallback to local storage when candidate is a local mock or network is offline
      }
    }

    currentRequests[candidate.id] = newRequest;
    await setItem(STORAGE_KEY, JSON.stringify(currentRequests));

    return {
      success: true,
      duplicate: false,
      data: newRequest,
    };
  },

  /**
   * Reset/clear requests (useful for tests or demo resets)
   */
  async resetRequests(initialRequests = []) {
    const initialMap = {};
    for (const req of initialRequests) {
      initialMap[req.candidateId] = req;
    }
    await setItem(STORAGE_KEY, JSON.stringify(initialMap));
    return initialMap;
  },
};

export default matchRequestService;
