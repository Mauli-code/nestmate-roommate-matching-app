const { isPostgres, query } = require('../database/connection');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    title: row.title,
    body: row.body,
    message: row.body,
    relatedRequestId: row.related_request_id,
    read: Boolean(row.is_read),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

const notifications = new Map();

async function create(notification) {
  if (isPostgres()) {
    // No UNIQUE constraint exists on the table, so manually check for duplicates first
    if (notification.relatedRequestId) {
      const existing = await query(
        `SELECT * FROM notifications WHERE recipient_id=$1 AND type=$2 AND related_request_id=$3 LIMIT 1`,
        [notification.recipientId, notification.type, notification.relatedRequestId],
      );
      if (existing.rows.length > 0) {
        return mapRow(existing.rows[0]);
      }
    }
    const messageBody = notification.message || notification.body || '';
    const res = await query(
      `INSERT INTO notifications (id, recipient_id, type, title, body, related_request_id, is_read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP)
       RETURNING *`,
      [notification.id, notification.recipientId, notification.type, notification.title, messageBody, notification.relatedRequestId || null],
    );
    return mapRow(res.rows[0]);
  }
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
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM notifications WHERE recipient_id=$1 ORDER BY created_at DESC`,
      [recipientId],
    );
    return res.rows.map(mapRow);
  }
  return [...notifications.values()]
    .filter((notification) => notification.recipientId === recipientId)
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

async function markRead(id, recipientId) {
  if (isPostgres()) {
    const res = await query(
      `UPDATE notifications SET is_read=true WHERE id=$1 AND recipient_id=$2 RETURNING *`,
      [id, recipientId],
    );
    return mapRow(res.rows[0]) || null;
  }
  const notification = notifications.get(id);
  if (!notification || notification.recipientId !== recipientId) return null;
  notification.read = true;
  return notification;
}

async function markAllRead(recipientId) {
  if (isPostgres()) {
    const res = await query(
      `UPDATE notifications SET is_read=true WHERE recipient_id=$1 AND is_read=false`,
      [recipientId],
    );
    return res.rowCount;
  }
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
