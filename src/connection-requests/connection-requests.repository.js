const { isPostgres, query } = require('../database/connection');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

const requests = new Map();

async function create(request) {
  if (isPostgres()) {
    const res = await query(
      `INSERT INTO connection_requests (id, sender_id, receiver_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [request.id, request.senderId, request.receiverId, request.status],
    );
    return mapRow(res.rows[0]);
  }
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findPending(senderId, receiverId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM connection_requests WHERE sender_id=$1 AND receiver_id=$2 AND status='pending' LIMIT 1`,
      [senderId, receiverId],
    );
    return mapRow(res.rows[0]) || null;
  }
  return [...requests.values()].find(
    (request) =>
      request.senderId === senderId &&
      request.receiverId === receiverId &&
      request.status === 'pending',
  ) || null;
}

async function findBetween(firstUserId, secondUserId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM connection_requests
       WHERE status='accepted'
         AND ((sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1))
       LIMIT 1`,
      [firstUserId, secondUserId],
    );
    return mapRow(res.rows[0]) || null;
  }
  return [...requests.values()].find(
    (request) =>
      request.status === 'accepted' &&
      ((request.senderId === firstUserId && request.receiverId === secondUserId) ||
       (request.senderId === secondUserId && request.receiverId === firstUserId)),
  ) || null;
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query(`SELECT * FROM connection_requests WHERE id=$1 LIMIT 1`, [id]);
    return mapRow(res.rows[0]) || null;
  }
  return requests.get(id) || null;
}

async function save(request) {
  if (isPostgres()) {
    const res = await query(
      `UPDATE connection_requests SET status=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
      [request.id, request.status],
    );
    return mapRow(res.rows[0]);
  }
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findReceived(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM connection_requests WHERE receiver_id=$1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map(mapRow);
  }
  return [...requests.values()].filter((request) => request.receiverId === userId);
}

async function findSent(userId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM connection_requests WHERE sender_id=$1 ORDER BY created_at DESC`,
      [userId],
    );
    return res.rows.map(mapRow);
  }
  return [...requests.values()].filter((request) => request.senderId === userId);
}

module.exports = {
  create,
  findPending,
  findBetween,
  findById,
  save,
  findReceived,
  findSent,
};
