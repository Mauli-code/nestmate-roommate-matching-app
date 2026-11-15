/**
 * Match Request Service
 * Handles sending and tracking roommate match requests.
 * Uses centralized AsyncStorage with prepared endpoints for backend integration.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendConnectionRequest } from '../api/connectionRequests';

const STORAGE_KEY = '@nestmate_match_requests';

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
