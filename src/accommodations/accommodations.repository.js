const { isPostgres, query } = require('../database/connection');

// In-memory cache & fallback for STORAGE_MODE=memory
const listings = new Map();

function mapAccommodationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    city: row.city,
    preferredArea: row.preferred_area,
    type: row.type,
    monthlyRent: Number(row.monthly_rent),
    securityDeposit: Number(row.security_deposit || 0),
    availableRooms: Number(row.available_rooms),
    availableFrom: row.available_from
      ? new Date(row.available_from).toISOString().split('T')[0]
      : '',
    status: row.status,
    photoUrls: Array.isArray(row.photo_urls) ? row.photo_urls : [],
    hasVirtualTour: Boolean(row.has_virtual_tour),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

async function create(listing) {
  if (isPostgres()) {
    const res = await query(
      `
      INSERT INTO accommodations (
        id, owner_id, title, description, city, preferred_area, type,
        monthly_rent, security_deposit, available_rooms, available_from, status,
        photo_urls, has_virtual_tour, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, COALESCE($15, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
      RETURNING *;
    `,
      [
        listing.id,
        listing.ownerId,
        listing.title,
        listing.description,
        listing.city,
        listing.preferredArea,
        listing.type,
        listing.monthlyRent,
        listing.securityDeposit || 0,
        listing.availableRooms || 1,
        listing.availableFrom || new Date().toISOString().split('T')[0],
        listing.status || 'available',
        listing.photoUrls || [],
        Boolean(listing.hasVirtualTour),
        listing.createdAt || null,
      ]
    );
    return mapAccommodationRow(res.rows[0]);
  }

  listings.set(listing.id, { ...listing });
  return listings.get(listing.id);
}

async function findAvailable(filters = {}) {
  if (isPostgres()) {
    const conditions = ["status = 'available'"];
    const params = [];

    if (filters.preferredArea) {
      params.push(filters.preferredArea.trim());
      conditions.push(`LOWER(preferred_area) = LOWER($${params.length})`);
    }
    if (filters.type) {
      const t = String(filters.type).trim();
      if (t === 'flat' || t === 'apartment' || t === 'entire_apartment') {
        conditions.push(`type IN ('flat', 'apartment', 'entire_apartment')`);
      } else if (t === 'shared-room' || t === 'shared_room') {
        conditions.push(`type IN ('shared-room', 'shared_room')`);
      } else {
        params.push(t);
        conditions.push(`type = $${params.length}`);
      }
    }
    if (filters.minRent !== null && filters.minRent !== undefined) {
      params.push(filters.minRent);
      conditions.push(`monthly_rent >= $${params.length}`);
    }
    if (filters.maxRent !== null && filters.maxRent !== undefined) {
      params.push(filters.maxRent);
      conditions.push(`monthly_rent <= $${params.length}`);
    }

    const sql = `SELECT * FROM accommodations WHERE ${conditions.join(
      ' AND '
    )} ORDER BY created_at DESC;`;
    const res = await query(sql, params);
    return res.rows.map(mapAccommodationRow);
  }

  return [...listings.values()].filter((listing) => {
    if (listing.status !== 'available') return false;
    if (
      filters.preferredArea &&
      listing.preferredArea.toLowerCase() !== filters.preferredArea.toLowerCase()
    )
      return false;
    if (filters.type && listing.type !== filters.type) return false;
    if (filters.minRent !== null && filters.minRent !== undefined && listing.monthlyRent < filters.minRent)
      return false;
    if (filters.maxRent !== null && filters.maxRent !== undefined && listing.monthlyRent > filters.maxRent)
      return false;
    return true;
  });
}

async function findById(id) {
  if (isPostgres()) {
    const res = await query('SELECT * FROM accommodations WHERE id = $1 LIMIT 1;', [id]);
    return mapAccommodationRow(res.rows[0]);
  }

  return listings.get(id) || null;
}

async function save(listing) {
  if (isPostgres()) {
    const res = await query(
      `
      UPDATE accommodations SET
        title = $2,
        description = $3,
        city = $4,
        preferred_area = $5,
        type = $6,
        monthly_rent = $7,
        security_deposit = $8,
        available_rooms = $9,
        available_from = $10,
        status = $11,
        photo_urls = $12,
        has_virtual_tour = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *;
    `,
      [
        listing.id,
        listing.title,
        listing.description,
        listing.city,
        listing.preferredArea,
        listing.type,
        listing.monthlyRent,
        listing.securityDeposit || 0,
        listing.availableRooms || 1,
        listing.availableFrom || new Date().toISOString().split('T')[0],
        listing.status || 'available',
        listing.photoUrls || [],
        Boolean(listing.hasVirtualTour),
      ]
    );
    return mapAccommodationRow(res.rows[0]);
  }

  listings.set(listing.id, { ...listing });
  return listings.get(listing.id);
}

async function remove(id) {
  if (isPostgres()) {
    const res = await query('DELETE FROM accommodations WHERE id = $1;', [id]);
    return (res.rowCount || 0) > 0;
  }

  return listings.delete(id);
}

module.exports = {
  create,
  findAvailable,
  findById,
  save,
  remove,
  mapAccommodationRow,
};
