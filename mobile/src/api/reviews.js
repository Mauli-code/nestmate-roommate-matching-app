import { request } from './client';

export function fetchRoommateReviews(userId, token) {
  return request(`/api/reviews/roommates/${encodeURIComponent(userId)}`, { method: 'GET', token });
}

export function submitRoommateReview(userId, review, token) {
  return request(`/api/reviews/roommates/${encodeURIComponent(userId)}`, { method: 'POST', token, body: review });
}

export function fetchAccommodationReviews(listingId, token) {
  return request(`/api/reviews/accommodations/${encodeURIComponent(listingId)}`, { method: 'GET', token });
}

export function submitAccommodationReview(listingId, review, token) {
  return request(`/api/reviews/accommodations/${encodeURIComponent(listingId)}`, { method: 'POST', token, body: review });
}
