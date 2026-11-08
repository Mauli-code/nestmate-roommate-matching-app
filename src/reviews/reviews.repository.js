const reviews = new Map();

async function create(review) {
  reviews.set(review.id, { ...review });
  return reviews.get(review.id);
}

async function findById(id) {
  return reviews.get(id) || null;
}

async function findForTarget(targetType, targetId) {
  return [...reviews.values()].filter(
    (review) => review.targetType === targetType && review.targetId === targetId,
  );
}

async function findByReviewerAndInteraction(reviewerId, interactionKey) {
  return [...reviews.values()].find(
    (review) =>
      review.reviewerId === reviewerId &&
      review.interactionKey === interactionKey,
  ) || null;
}

async function save(review) {
  reviews.set(review.id, { ...review });
  return reviews.get(review.id);
}

async function remove(id) {
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
