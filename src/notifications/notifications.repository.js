const notifications = new Map();

async function create(notification) {
  const duplicate = [...notifications.values()].find(
    (item) =>
      item.recipientId === notification.recipientId &&
      item.type === notification.type &&
      item.relatedRequestId === notification.relatedRequestId,
  );
  if (duplicate) return duplicate;

  notifications.set(notification.id, { ...notification });
  return notifications.get(notification.id);
}

async function findByRecipient(recipientId) {
  return [...notifications.values()]
    .filter((notification) => notification.recipientId === recipientId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

async function markRead(id, recipientId) {
  const notification = notifications.get(id);
  if (!notification || notification.recipientId !== recipientId) return null;
  notification.read = true;
  return notification;
}

async function markAllRead(recipientId) {
  let count = 0;
  for (const notification of notifications.values()) {
    if (notification.recipientId === recipientId && !notification.read) {
      notification.read = true;
      count += 1;
    }
  }
  return count;
}

module.exports = { create, findByRecipient, markRead, markAllRead };
