const { accessibleBranchIds } = require('./scope');

// Shared WHERE-clause builder for the responses list (admin panel) and CSV export,
// so both stay in sync on available filters and role scoping.
function buildResponseFilters(req) {
  const where = [];
  const params = [];
  const branchIds = accessibleBranchIds(req.user);

  if (branchIds !== null) {
    if (branchIds.length === 0) {
      where.push('1 = 0');
    } else {
      where.push(`r.branch_id IN (${branchIds.map(() => '?').join(',')})`);
      params.push(...branchIds);
    }
  }

  if (req.query.branch_id) {
    where.push('r.branch_id = ?');
    params.push(Number(req.query.branch_id));
  }
  if (req.query.rating) {
    where.push('r.rating = ?');
    params.push(Number(req.query.rating));
  }
  if (req.query.sentiment) {
    where.push('r.sentiment = ?');
    params.push(String(req.query.sentiment));
  }
  if (req.query.status) {
    where.push('r.status = ?');
    params.push(String(req.query.status));
  }
  if (req.query.category) {
    where.push('r.categories LIKE ?');
    params.push(`%"${req.query.category}"%`);
  }
  if (req.query.date_from) {
    where.push('r.created_at >= ?');
    params.push(String(req.query.date_from));
  }
  if (req.query.date_to) {
    where.push('r.created_at <= ?');
    params.push(String(req.query.date_to));
  }
  if (req.query.q) {
    where.push('(r.comment LIKE ? OR r.customer_name LIKE ? OR r.customer_phone LIKE ? OR r.customer_email LIKE ?)');
    const like = `%${req.query.q}%`;
    params.push(like, like, like, like);
  }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

module.exports = { buildResponseFilters };
