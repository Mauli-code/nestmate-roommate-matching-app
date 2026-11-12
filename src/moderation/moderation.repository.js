const blockedUsersByOwner = new Map();
const reports = [];

async function findBlock(ownerId, blockedUserId) {
  return blockedUsersByOwner.get(ownerId)?.get(blockedUserId) || null;
}

async function saveBlock(block) {
  if (!blockedUsersByOwner.has(block.ownerId)) {
    blockedUsersByOwner.set(block.ownerId, new Map());
  }
  blockedUsersByOwner.get(block.ownerId).set(block.blockedUserId, { ...block });
  return blockedUsersByOwner.get(block.ownerId).get(block.blockedUserId);
}

async function deleteBlock(ownerId, blockedUserId) {
  const blocks = blockedUsersByOwner.get(ownerId);
  if (!blocks) return false;
  const deleted = blocks.delete(blockedUserId);
  if (blocks.size === 0) blockedUsersByOwner.delete(ownerId);
  return deleted;
}

async function findByOwner(ownerId) {
  return [...(blockedUsersByOwner.get(ownerId)?.values() || [])];
}

async function saveReport(report) {
  reports.push({ ...report });
  return report;
}

async function findRecentReport(reporterId, reportedUserId, category, since) {
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
