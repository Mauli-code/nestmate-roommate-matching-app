import { request } from './client';

export function getOrCreateConversation(otherUserId, token) {
  return request(`/api/chat/conversations/${encodeURIComponent(otherUserId)}`, { method: 'POST', token });
}

export function fetchConversations(token) {
  return request('/api/chat/conversations', { method: 'GET', token });
}

export function fetchMessages(conversationId, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: 'GET', token },
  );
}

export function sendMessage(conversationId, content, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: 'POST', token, body: { content } },
  );
}

export function markMessagesRead(conversationId, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
    { method: 'PATCH', token },
  );
}
