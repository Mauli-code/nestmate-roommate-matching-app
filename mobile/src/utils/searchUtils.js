/**
 * Search and Filter Utilities for NestMate Mobile
 * Provides robust, case-insensitive, whitespace-trimmed, multi-attribute search
 * across Roommates and Accommodations.
 */

/**
 * Normalizes a search query string:
 * - Trims leading and trailing whitespace
 * - Converts to lower case
 * - Splits into unique non-empty tokens
 */
export function parseSearchTokens(query) {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter(Boolean);
}

/**
 * Searches and filters a list of roommate candidates.
 *
 * @param {Array} roommates - Candidate profiles
 * @param {string} searchQuery - User search text
 * @param {object} filters - Active filter criteria
 * @param {string} sortBy - Sort order ('compatibility' | 'budget_asc' | 'budget_desc' | 'location')
 * @returns {Array} Filtered and sorted roommate candidates
 */
export function searchRoommates(roommates = [], searchQuery = '', filters = {}, sortBy = 'compatibility') {
  if (!Array.isArray(roommates)) return [];

  const tokens = parseSearchTokens(searchQuery);

  const filtered = roommates.filter((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;

    // 1. Search Query Matching (all tokens must match at least one candidate attribute)
    if (tokens.length > 0) {
      const name = (candidate.name || '').toLowerCase();
      const role = (candidate.role || '').toLowerCase();
      const area = (candidate.preferredArea || candidate.location || '').toLowerCase();
      const bio = (candidate.bio || '').toLowerCase();
      const uni = (candidate.university || '').toLowerCase();
      const tags = Array.isArray(candidate.tags)
        ? candidate.tags.map((t) => String(t).toLowerCase())
        : [];
      const budgetStr = candidate.budget != null ? String(candidate.budget) : '';

      const matchesAllTokens = tokens.every((token) => {
        // Strip leading dollar signs or commas for budget numeric matching
        const cleanToken = token.replace(/[$]/g, '');

        if (name.includes(token)) return true;
        if (role.includes(token)) return true;
        if (area.includes(token)) return true;
        if (bio.includes(token)) return true;
        if (uni.includes(token)) return true;
        if (tags.some((t) => t.includes(token))) return true;
        if (cleanToken && budgetStr === cleanToken) return true;

        return false;
      });

      if (!matchesAllTokens) return false;
    }

    // 2. Filter Criteria
    if (filters && typeof filters === 'object') {
      // Location
      if (filters.location && filters.location !== 'All') {
        const candidateArea = (candidate.preferredArea || candidate.location || '').toLowerCase();
        if (candidateArea !== filters.location.toLowerCase()) {
          return false;
        }
      }

      // Max Budget
      if (filters.maxBudget != null && typeof candidate.budget === 'number') {
        if (candidate.budget > filters.maxBudget) {
          return false;
        }
      }

      // Min Score
      if (typeof filters.minScore === 'number' && filters.minScore > 0) {
        if ((candidate.score || 0) < filters.minScore) {
          return false;
        }
      }

      // Sleep Schedule
      if (filters.sleepSchedule && filters.sleepSchedule !== 'Any') {
        const candidateSleep = (candidate.lifestyle?.sleepSchedule || '').toLowerCase();
        if (candidateSleep !== filters.sleepSchedule.toLowerCase()) {
          return false;
        }
      }

      // Cleanliness
      if (filters.cleanliness && filters.cleanliness !== 'Any') {
        const candidateClean = (candidate.lifestyle?.cleanliness || '').toLowerCase();
        if (candidateClean !== filters.cleanliness.toLowerCase()) {
          return false;
        }
      }

      // Non-smoker only
      if (filters.nonSmokerOnly) {
        if (candidate.lifestyle?.smoking === true) {
          return false;
        }
      }

      // Pets only
      if (filters.petsOnly) {
        if (!candidate.lifestyle?.pets) {
          return false;
        }
      }
    }

    return true;
  });

  // 3. Sorting
  return filtered.sort((a, b) => {
    if (sortBy === 'compatibility') {
      return (b.score || 0) - (a.score || 0);
    }
    if (sortBy === 'budget_asc') {
      return (a.budget || 0) - (b.budget || 0);
    }
    if (sortBy === 'budget_desc') {
      return (b.budget || 0) - (a.budget || 0);
    }
    if (sortBy === 'location') {
      const locA = (a.preferredArea || a.location || '');
      const locB = (b.preferredArea || b.location || '');
      return locA.localeCompare(locB);
    }
    return 0;
  });
}

/**
 * Searches and filters a list of accommodation properties.
 *
 * @param {Array} properties - Property listings
 * @param {string} searchQuery - User search text
 * @param {object} filters - Active filter criteria
 * @param {string} sortBy - Sort order ('popular' | 'price_asc' | 'price_desc' | 'newest')
 * @returns {Array} Filtered and sorted properties
 */
export function searchProperties(properties = [], searchQuery = '', filters = {}, sortBy = 'popular') {
  if (!Array.isArray(properties)) return [];

  const tokens = parseSearchTokens(searchQuery);

  const filtered = properties.filter((property) => {
    if (!property || typeof property !== 'object') return false;

    // 1. Search Query Matching (all tokens must match at least one property attribute)
    if (tokens.length > 0) {
      const title = (property.title || '').toLowerCase();
      const location = (property.location || '').toLowerCase();
      const address = (property.fullAddress || '').toLowerCase();
      const type = (property.type || '').toLowerCase();
      const description = (property.description || '').toLowerCase();
      const furnishing = (property.furnishing || '').toLowerCase();
      const amenities = Array.isArray(property.amenities)
        ? property.amenities.map((a) => String(a).toLowerCase())
        : [];
      const rentStr = property.rent != null ? String(property.rent) : '';

      const matchesAllTokens = tokens.every((token) => {
        const cleanToken = token.replace(/[$,]/g, '');

        if (title.includes(token)) return true;
        if (location.includes(token)) return true;
        if (address.includes(token)) return true;
        if (type.includes(token)) return true;
        if (description.includes(token)) return true;
        if (furnishing.includes(token)) return true;
        if (amenities.some((a) => a.includes(token))) return true;
        if (cleanToken && rentStr === cleanToken) return true;

        return false;
      });

      if (!matchesAllTokens) return false;
    }

    // 2. Filter Criteria
    if (filters && typeof filters === 'object') {
      if (filters.type && filters.type !== 'All') {
        if ((property.type || '').toLowerCase() !== filters.type.toLowerCase()) {
          return false;
        }
      }

      if (filters.minRent != null && typeof property.rent === 'number') {
        if (property.rent < filters.minRent) {
          return false;
        }
      }

      if (filters.maxRent != null && typeof property.rent === 'number') {
        if (property.rent > filters.maxRent) {
          return false;
        }
      }

      if (filters.furnishing && filters.furnishing !== 'Any') {
        if ((property.furnishing || '').toLowerCase() !== filters.furnishing.toLowerCase()) {
          return false;
        }
      }

      if (filters.bedrooms && filters.bedrooms !== 'Any') {
        if (filters.bedrooms === '4+') {
          if ((property.bedrooms || 0) < 4) return false;
        } else {
          const targetBeds = parseInt(filters.bedrooms, 10);
          if (!Number.isNaN(targetBeds) && property.bedrooms !== targetBeds) {
            return false;
          }
        }
      }

      if (filters.availability && filters.availability !== 'Any') {
        if ((property.availability || '').toLowerCase() !== filters.availability.toLowerCase()) {
          return false;
        }
      }
    }

    return true;
  });

  // 3. Sorting
  return filtered.sort((a, b) => {
    if (sortBy === 'price_asc') {
      return (a.rent || 0) - (b.rent || 0);
    }
    if (sortBy === 'price_desc') {
      return (b.rent || 0) - (a.rent || 0);
    }
    if (sortBy === 'newest') {
      return (a.postedDaysAgo || 0) - (b.postedDaysAgo || 0);
    }
    // Default: 'popular'
    return (b.popularity || 0) - (a.popularity || 0);
  });
}

/**
 * Searches and filters featured accommodations on Home screen.
 * Supports keyword search and filter pills.
 *
 * @param {Array} accommodations - Recommended accommodations
 * @param {string} searchQuery - Search input
 * @param {string} pill - Active filter pill ('All' | 'Near Campus' | 'Under $1,200' | 'Private Room' | 'Pet Friendly')
 * @returns {Array} Filtered accommodations
 */
export function searchHomeAccommodations(accommodations = [], searchQuery = '', pill = 'All') {
  if (!Array.isArray(accommodations)) return [];

  const tokens = parseSearchTokens(searchQuery);

  return accommodations.filter((item) => {
    if (!item || typeof item !== 'object') return false;

    // Search query matching
    if (tokens.length > 0) {
      const title = (item.title || '').toLowerCase();
      const location = (item.location || '').toLowerCase();
      const type = (item.type || '').toLowerCase();
      const distance = (item.distance || '').toLowerCase();
      const amenities = Array.isArray(item.amenities)
        ? item.amenities.map((a) => String(a).toLowerCase())
        : [];
      const rentStr = item.rent != null ? String(item.rent) : '';

      const matchesAllTokens = tokens.every((token) => {
        const cleanToken = token.replace(/[$,]/g, '');

        if (title.includes(token)) return true;
        if (location.includes(token)) return true;
        if (type.includes(token)) return true;
        if (distance.includes(token)) return true;
        if (amenities.some((a) => a.includes(token))) return true;
        if (cleanToken && rentStr === cleanToken) return true;

        return false;
      });

      if (!matchesAllTokens) return false;
    }

    // Filter pill matching
    if (pill && pill !== 'All') {
      if (pill === 'Under $1,200') {
        if (item.rent != null && item.rent > 1200) return false;
      } else if (pill === 'Private Room') {
        const type = (item.type || '').toLowerCase();
        if (!type.includes('private') && !type.includes('room') && !type.includes('entire')) {
          return false;
        }
      } else if (pill === 'Near Campus') {
        const distance = (item.distance || '').toLowerCase();
        const loc = (item.location || '').toLowerCase();
        const isNear =
          distance.includes('campus') ||
          distance.includes('nyu') ||
          distance.includes('0.') ||
          loc.includes('manhattan') ||
          loc.includes('village');
        if (!isNear) return false;
      } else if (pill === 'Pet Friendly') {
        const amenities = Array.isArray(item.amenities)
          ? item.amenities.map((a) => String(a).toLowerCase())
          : [];
        const isPet = amenities.some((a) => a.includes('pet')) || /pet/i.test(item.title || '');
        if (!isPet) return false;
      }
    }

    return true;
  });
}

/**
 * Searches and filters top roommates on Home screen.
 * Supports keyword search and filter pills.
 *
 * @param {Array} roommates - Recommended roommates
 * @param {string} searchQuery - Search input
 * @param {string} pill - Active filter pill ('All' | 'Near Campus' | 'Under $1,200' | 'Private Room' | 'Pet Friendly')
 * @returns {Array} Filtered roommates
 */
export function searchHomeRoommates(roommates = [], searchQuery = '', pill = 'All') {
  if (!Array.isArray(roommates)) return [];

  const tokens = parseSearchTokens(searchQuery);

  return roommates.filter((item) => {
    if (!item || typeof item !== 'object') return false;

    // Search query matching
    if (tokens.length > 0) {
      const name = (item.name || '').toLowerCase();
      const role = (item.role || '').toLowerCase();
      const area = (item.preferredArea || item.location || '').toLowerCase();
      const bio = (item.bio || '').toLowerCase();
      const tags = Array.isArray(item.tags)
        ? item.tags.map((t) => String(t).toLowerCase())
        : [];
      const budgetStr = item.budget != null ? String(item.budget) : '';

      const matchesAllTokens = tokens.every((token) => {
        const cleanToken = token.replace(/[$]/g, '');

        if (name.includes(token)) return true;
        if (role.includes(token)) return true;
        if (area.includes(token)) return true;
        if (bio.includes(token)) return true;
        if (tags.some((t) => t.includes(token))) return true;
        if (cleanToken && budgetStr === cleanToken) return true;

        return false;
      });

      if (!matchesAllTokens) return false;
    }

    // Filter pill matching
    if (pill && pill !== 'All') {
      if (pill === 'Under $1,200') {
        if (item.budget != null && item.budget > 1200) return false;
      } else if (pill === 'Pet Friendly') {
        if (!item.lifestyle?.pets && !(item.tags && item.tags.some((t) => /pet|dog|cat/i.test(t)))) {
          return false;
        }
      } else if (pill === 'Near Campus') {
        const area = (item.preferredArea || item.location || '').toLowerCase();
        const role = (item.role || '').toLowerCase();
        const bio = (item.bio || '').toLowerCase();
        const isNear =
          area.includes('central') ||
          role.includes('student') ||
          role.includes('grad') ||
          bio.includes('nyu') ||
          bio.includes('columbia') ||
          bio.includes('campus');
        if (!isNear) return false;
      }
      // 'Private Room' pill doesn't exclude roommates
    }

    return true;
  });
}
