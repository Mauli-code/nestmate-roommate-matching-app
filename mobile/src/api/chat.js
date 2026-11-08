const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:3001';

async function request(path, method, token, body) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('The backend could not be reached. Check that it is running.');
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message || `The request failed (${response.status}).`);
  }
  return result;
}

export function getOrCreateConversation(otherUserId, token) {
  return request(`/api/chat/conversations/${encodeURIComponent(otherUserId)}`, 'POST', token);
}

export function fetchConversations(token) {
  return request('/api/chat/conversations', 'GET', token);
}

export function fetchMessages(conversationId, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    'GET',
    token,
  );
}

export function sendMessage(conversationId, content, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    'POST',
    token,
    { content },
  );
}

export function markMessagesRead(conversationId, token) {
  return request(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
    'PATCH',
    token,
  );
}
