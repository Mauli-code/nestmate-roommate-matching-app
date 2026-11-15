const { isPostgres, query } = require('../database/connection');

// user_blocks table: (owner_id, blocked_user_id, created_at) — composite PK, no id column
function mapBlock(row) {
  if (!row) return null;
  return {
    ownerId: row.owner_id,
    blockedUserId: row.blocked_user_id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

// user_reports table: (id, reporter_id, reported_user_id, category, reason, created_at)
function mapReport(row) {
  if (!row) return null;
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reportedUserId: row.reported_user_id,
    category: row.category,
    reason: row.reason,
    description: row.reason,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
  };
}

const blockedUsersByOwner = new Map();
const reports = [];

async function findBlock(ownerId, blockedUserId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM user_blocks WHERE owner_id=$1 AND blocked_user_id=$2 LIMIT 1`,
      [ownerId, blockedUserId],
    );
    return mapBlock(res.rows[0]) || null;
  }
  return blockedUsersByOwner.get(ownerId)?.get(blockedUserId) || null;
}

async function saveBlock(block) {
  if (isPostgres()) {
    await query(
      `INSERT INTO user_blocks (owner_id, blocked_user_id, created_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (owner_id, blocked_user_id) DO NOTHING`,
      [block.ownerId, block.blockedUserId],
    );
    const res = await query(
      `SELECT * FROM user_blocks WHERE owner_id=$1 AND blocked_user_id=$2 LIMIT 1`,
      [block.ownerId, block.blockedUserId],
    );
    return mapBlock(res.rows[0]);
  }
  if (!blockedUsersByOwner.has(block.ownerId)) {
    blockedUsersByOwner.set(block.ownerId, new Map());
  }
  blockedUsersByOwner.get(block.ownerId).set(block.blockedUserId, { ...block });
  return blockedUsersByOwner.get(block.ownerId).get(block.blockedUserId);
}

async function deleteBlock(ownerId, blockedUserId) {
  if (isPostgres()) {
    const res = await query(
      `DELETE FROM user_blocks WHERE owner_id=$1 AND blocked_user_id=$2`,
      [ownerId, blockedUserId],
    );
    return res.rowCount > 0;
  }
  const blocks = blockedUsersByOwner.get(ownerId);
  if (!blocks) return false;
  const deleted = blocks.delete(blockedUserId);
  if (blocks.size === 0) blockedUsersByOwner.delete(ownerId);
  return deleted;
}

async function findByOwner(ownerId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM user_blocks WHERE owner_id=$1 ORDER BY created_at DESC`,
      [ownerId],
    );
    return res.rows.map(mapBlock);
  }
  return [...(blockedUsersByOwner.get(ownerId)?.values() || [])];
}

async function saveReport(report) {
  if (isPostgres()) {
    const reason = report.reason || report.description || 'No reason provided';
    const res = await query(
      `INSERT INTO user_reports (id, reporter_id, reported_user_id, category, reason, created_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       RETURNING *`,
      [report.id, report.reporterId, report.reportedUserId, report.category, reason],
    );
    return mapReport(res.rows[0]);
  }
  reports.push({ ...report });
  return report;
}

async function findRecentReport(reporterId, reportedUserId, category, since) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM user_reports WHERE reporter_id=$1 AND reported_user_id=$2 AND category=$3 AND created_at >= $4 LIMIT 1`,
      [reporterId, reportedUserId, category, since],
    );
    return mapReport(res.rows[0]) || null;
  }
  return reports.find((report) =>
    report.reporterId === reporterId &&
    report.reportedUserId === reportedUserId &&
    report.category === category &&
    report.createdAt >= since,
  ) || null;
}

module.exports = {
  findBlock,
  saveBlock,
  deleteBlock,
  findByOwner,
  saveReport,
  findRecentReport,
};
