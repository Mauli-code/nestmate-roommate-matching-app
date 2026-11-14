/**
 * Match Request Service
 * Handles sending and tracking roommate match requests.
 * Uses centralized AsyncStorage with prepared endpoints for backend integration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nestmate_match_requests';
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || null;

export const matchRequestService = {
  /**
   * Get all sent requests
   */
  async getSentRequests() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
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
  async sendMatchRequest(candidate) {
    if (!candidate || !candidate.id) {
      throw new Error('Valid candidate profile is required to send match request');
    }

    const currentRequests = await this.getSentRequests();

    // Duplicate prevention
    if (currentRequests[candidate.id]) {
      return {
        success: false,
        duplicate: true,
        message: `A request to ${candidate.name} has already been sent.`,
        request: currentRequests[candidate.id],
      };
    }

    const newRequest = {
      id: `req-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateAvatar: candidate.avatar,
      candidateRole: candidate.role,
      candidateScore: candidate.score,
      status: 'pending', // 'pending' | 'accepted' | 'rejected'
      sentAt: new Date().toISOString(),
      isMock: true,
    };

    // If a live backend is configured, attempt real API call
    if (API_URL) {
      try {
        const response = await fetch(`${API_URL}/api/match-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId: candidate.id,
          }),
        });

        if (response.ok) {
          const apiData = await response.json();
          newRequest.isMock = false;
          newRequest.id = apiData.id || newRequest.id;
        }
      } catch (err) {
        // Fallback to local mock storage when backend endpoint is not yet implemented
        console.info('Backend API unavailable. Saving match request to local mock storage.');
      }
    }

    // Persist to local storage
    currentRequests[candidate.id] = newRequest;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentRequests));

    return {
      success: true,
      duplicate: false,
      isMock: newRequest.isMock,
      message: `Match request sent to ${candidate.name}!`,
      request: newRequest,
    };
  },
};

export default matchRequestService;
