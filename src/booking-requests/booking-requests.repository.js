const { isPostgres, query, getClient } = require('../database/connection');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    senderId: row.sender_id,
    ownerId: row.owner_id,
    listingId: row.listing_id,
    requestedMoveInDate: row.move_in_date
      ? new Date(row.move_in_date).toISOString().split('T')[0]
      : undefined,
    message: row.message,
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

const requests = new Map();

async function create(request) {
  if (isPostgres()) {
    const moveInDate = request.requestedMoveInDate || request.moveInDate || new Date().toISOString().split('T')[0];
    const res = await query(
      `INSERT INTO booking_requests (id, sender_id, owner_id, listing_id, move_in_date, message, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [request.id, request.senderId, request.ownerId, request.listingId, moveInDate, request.message, request.status],
    );
    return mapRow(res.rows[0]);
  }
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findPending(userId, listingId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM booking_requests WHERE sender_id=$1 AND listing_id=$2 AND status='pending' LIMIT 1`,
      [userId, listingId],
    );
    return mapRow(res.rows[0]) || null;
  }
  return [...requests.values()].find(
    (request) =>
      request.senderId === userId &&
      request.listingId === listingId &&
      request.status === 'pending',
  ) || null;
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query(`SELECT * FROM booking_requests WHERE id=$1 LIMIT 1`, [id]);
    return mapRow(res.rows[0]) || null;
  }
  return requests.get(id) || null;
}

async function save(request) {
  if (isPostgres()) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM booking_requests WHERE id = $1 FOR UPDATE', [request.id]);
      const res = await client.query(
        `UPDATE booking_requests SET status=$2, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
        [request.id, request.status],
      );
      await client.query('COMMIT');
      return mapRow(res.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  requests.set(request.id, { ...request });
  return requests.get(request.id);
}

async function findReceived(ownerId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM booking_requests WHERE owner_id=$1 ORDER BY created_at DESC`,
      [ownerId],
    );
    return res.rows.map(mapRow);
  }
  return [...requests.values()].filter((request) => request.ownerId === ownerId);
}

async function findSent(senderId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM booking_requests WHERE sender_id=$1 ORDER BY created_at DESC`,
      [senderId],
    );
    return res.rows.map(mapRow);
  }
  return [...requests.values()].filter((request) => request.senderId === senderId);
}

module.exports = {
  create,
  findPending,
  findById,
  save,
  findReceived,
  findSent,
};
