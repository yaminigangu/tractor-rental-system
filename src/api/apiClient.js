// Client-side API connector linking React frontend with PostgreSQL Backend Server
const API_BASE = 'http://localhost:5000/api';

let isBackendOnline = null;
let lastCheckTime = 0;

/**
 * Checks if the backend PostgreSQL server is running
 */
export async function checkBackendHealth() {
  const now = Date.now();
  // Cache check for 10 seconds to avoid spamming
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
// FARMERS
// =====================================================================
export async function apiGetFarmers() {
  try {
    const res = await fetch(`${API_BASE}/farmers`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
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
  } catch {
    // Backend offline
  }
  return null;
}

export async function apiDeleteFarmer(mobile) {
  try {
    const res = await fetch(`${API_BASE}/farmers/${encodeURIComponent(mobile)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
  return null;
}

// =====================================================================
// VEHICLE OWNERS
// =====================================================================
export async function apiGetOwners() {
  try {
    const res = await fetch(`${API_BASE}/owners`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
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
  } catch {
    // Backend offline
  }
  return null;
}

export async function apiDeleteOwner(mobile) {
  try {
    const res = await fetch(`${API_BASE}/owners/${encodeURIComponent(mobile)}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
  return null;
}

// =====================================================================
// BOOKINGS
// =====================================================================
export async function apiGetBookings() {
  try {
    const res = await fetch(`${API_BASE}/bookings`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
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
  } catch {
    // Backend offline
  }
  return null;
}

export async function apiUpdateBookingStatus(id, status) {
  try {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline
  }
  return null;
}

