const { isPostgres, query } = require('../database/connection');

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    reviewerId: row.reviewer_id,
    targetType: row.target_type,
    targetId: row.target_type === 'roommate' ? row.target_user_id : row.target_accommodation_id,
    rating: Number(row.rating),
    comment: row.comment,
    interactionKey: row.interaction_key,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

const reviews = new Map();

async function create(review) {
  if (isPostgres()) {
    const targetUserId = review.targetType === 'roommate' ? review.targetId : null;
    const targetAccommodationId = review.targetType === 'accommodation' ? review.targetId : null;
    const res = await query(
      `INSERT INTO reviews (id, reviewer_id, target_type, target_user_id, target_accommodation_id, rating, comment, interaction_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [review.id, review.reviewerId, review.targetType, targetUserId, targetAccommodationId, review.rating, review.comment, review.interactionKey],
    );
    return mapRow(res.rows[0]);
  }
  reviews.set(review.id, { ...review });
  return reviews.get(review.id);
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query(`SELECT * FROM reviews WHERE id=$1 LIMIT 1`, [id]);
    return mapRow(res.rows[0]) || null;
  }
  return reviews.get(id) || null;
}

async function findForTarget(targetType, targetId) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM reviews WHERE target_type=$1 AND (target_user_id=$2 OR target_accommodation_id=$2) ORDER BY created_at DESC`,
      [targetType, targetId],
    );
    return res.rows.map(mapRow);
  }
  return [...reviews.values()].filter(
    (review) => review.targetType === targetType && review.targetId === targetId,
  );
}

async function findByReviewerAndInteraction(reviewerId, interactionKey) {
  if (isPostgres()) {
    const res = await query(
      `SELECT * FROM reviews WHERE reviewer_id=$1 AND interaction_key=$2 LIMIT 1`,
      [reviewerId, interactionKey],
    );
    return mapRow(res.rows[0]) || null;
  }
  return [...reviews.values()].find(
    (review) =>
      review.reviewerId === reviewerId &&
      review.interactionKey === interactionKey,
  ) || null;
}

async function save(review) {
  if (isPostgres()) {
    const res = await query(
      `UPDATE reviews SET rating=$2, comment=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING *`,
      [review.id, review.rating, review.comment],
    );
    return mapRow(res.rows[0]);
  }
  reviews.set(review.id, { ...review });
  return reviews.get(review.id);
}

async function remove(id) {
  if (isPostgres()) {
    await query(`DELETE FROM reviews WHERE id=$1`, [id]);
    return;
  }
  reviews.delete(id);
}

module.exports = {
  create,
  findById,
  findForTarget,
  findByReviewerAndInteraction,
  save,
  remove,
};
