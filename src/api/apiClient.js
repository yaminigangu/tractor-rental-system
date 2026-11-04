// Client-side API connector linking React frontend with Node.js Express REST API Server
const API_BASE = 'http://localhost:5000/api';

let isBackendOnline = null;
let lastCheckTime = 0;

/**
 * Checks if the backend PostgreSQL server is running
 */
export async function checkBackendHealth() {
  const now = Date.now();
  if (isBackendOnline !== null && now - lastCheckTime < 10000) {
    return isBackendOnline;
  }

  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      isBackendOnline = data.database === 'connected';
      lastCheckTime = now;
      return isBackendOnline;
    }
  } catch {
    isBackendOnline = false;
  }
  lastCheckTime = now;
  return false;
}

// =====================================================================
// TRACTORS / FLEET
// =====================================================================
export async function apiGetTractors(filters = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.append(key, val);
      }
    });

    const url = `${API_BASE}/tractors${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline / fallback
  }
  return null;
}

export async function apiGetTractorById(id) {
  try {
    const res = await fetch(`${API_BASE}/tractors/${id}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiSaveTractor(tractor) {
  try {
    const res = await fetch(`${API_BASE}/tractors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tractor),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateTractor(id, updates) {
  try {
    const res = await fetch(`${API_BASE}/tractors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiDeleteTractor(id) {
  try {
    const res = await fetch(`${API_BASE}/tractors/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// =====================================================================
// FARMERS
// =====================================================================
export async function apiGetFarmers(filters = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const url = `${API_BASE}/farmers${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiGetFarmerByMobile(mobile) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiSaveFarmer(farmer) {
  try {
    const res = await fetch(`${API_BASE}/farmers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmer),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateFarmer(mobile, updates) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(clean)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiDeleteFarmer(mobile) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(clean)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// =====================================================================
// VEHICLE OWNERS
// =====================================================================
export async function apiGetOwners(filters = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const url = `${API_BASE}/owners${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiGetOwnerByMobile(mobile) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/owners/${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiSaveOwner(owner) {
  try {
    const res = await fetch(`${API_BASE}/owners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(owner),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateOwner(mobile, updates) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/owners/${encodeURIComponent(clean)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiDeleteOwner(mobile) {
  try {
    const clean = String(mobile).replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/owners/${encodeURIComponent(clean)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// =====================================================================
// BOOKINGS
// =====================================================================
export async function apiGetBookings(filters = {}) {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const url = `${API_BASE}/bookings${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiGetBookingById(id) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiSaveBooking(booking) {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateBooking(id, updates) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateBookingStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiDeleteBooking(id) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// =====================================================================
// DASHBOARD & ANALYTICS STATS
// =====================================================================
export async function apiGetStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}
