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

export async function apiSubmitCustomTractor(tractorData) {
  try {
    const res = await fetch(`${API_BASE}/tractors/custom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tractorData),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiSubmitCustomTractor network error:', err);
    return { success: false, error: err.message || 'Network error submitting custom tractor' };
  }
}

export async function apiUpdateTractorVerification(id, status, remarks = '') {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/tractors/${id}/verification`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, remarks }),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiUpdateTractorVerification network error:', err);
    return { success: false, error: err.message || 'Network error updating verification' };
  }
}

export async function apiResubmitCustomTractor(id, updates) {
  try {
    const res = await fetch(`${API_BASE}/tractors/${id}/custom`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiResubmitCustomTractor error:', err);
    return { success: false, error: err.message };
  }
}

export async function apiGetOwnerTractors(ownerMobile) {
  try {
    const clean = String(ownerMobile || '').replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/tractors?ownerMobile=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('apiGetOwnerTractors error:', err);
  }
  return [];
}

export async function apiGetAdminTractors(status = 'all') {
  try {
    const res = await fetch(`${API_BASE}/tractors?status=${encodeURIComponent(status)}&includeUnverified=true`, {
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('apiGetAdminTractors error:', err);
  }
  return [];
}

// =====================================================================
// FARMERS
// =====================================================================
export async function apiGetFarmers(filters = {}) {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const url = `${API_BASE}/farmers${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiToggleFarmerStatus(id, isActive) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/farmers/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive }),
      signal: AbortSignal.timeout(4000),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
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
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
    const url = `${API_BASE}/owners${params.toString() ? `?${params.toString()}` : ''}`;

    const res = await fetch(url, { headers, signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiToggleOwnerStatus(id, isActive) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/owners/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive }),
      signal: AbortSignal.timeout(4000),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err.message };
  }
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
// AUTH & SESSIONS
// =====================================================================
export function getStoredAuthToken() {
  try {
    return localStorage.getItem('agri_jwt_token') || sessionStorage.getItem('agri_jwt_token') || null;
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token, rememberMe = true) {
  try {
    if (token) {
      if (rememberMe) {
        localStorage.setItem('agri_jwt_token', token);
        sessionStorage.removeItem('agri_jwt_token');
      } else {
        sessionStorage.setItem('agri_jwt_token', token);
        localStorage.removeItem('agri_jwt_token');
      }
    } else {
      localStorage.removeItem('agri_jwt_token');
      sessionStorage.removeItem('agri_jwt_token');
    }
  } catch {}
}

export async function apiRegisterUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setStoredAuthToken(data.token, true);
    }
    return data;
  } catch (err) {
    console.warn('apiRegisterUser error:', err);
    return { success: false, error: 'Network error connecting to registration service' };
  }
}

export async function apiLoginUser({ identifier, password, role = 'farmer', rememberMe = true }) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role, rememberMe }),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setStoredAuthToken(data.token, rememberMe);
    }
    return data;
  } catch (err) {
    console.warn('apiLoginUser error:', err);
    return { success: false, error: 'Network error connecting to login service' };
  }
}

export async function apiGetCurrentUser() {
  try {
    const token = getStoredAuthToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      return data.user || null;
    }
  } catch {}
  return null;
}

export function apiLogoutUser() {
  setStoredAuthToken(null);
  try {
    localStorage.removeItem('agri_current_farmer');
    localStorage.removeItem('agri_current_owner');
    sessionStorage.removeItem('agri_admin_logged_in');
  } catch {}
}

export async function apiGetSessionToken(user) {
  try {
    if (!user || !user.mobile) return null;
    const res = await fetch(`${API_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: user.mobile,
        name: user.name || user.fullName,
        role: user.role || 'farmer',
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        setStoredAuthToken(data.token);
        return data.token;
      }
    }
  } catch (err) {
    console.warn('Failed to obtain JWT session token:', err);
  }
  return null;
}

export async function apiAdminLogin({ username, password }) {
  try {
    const res = await fetch(`${API_BASE}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    if (res.ok && data.token) {
      setStoredAuthToken(data.token);
    }
    return data;
  } catch (err) {
    console.warn('apiAdminLogin network error:', err);
    return { success: false, error: 'Network error connecting to backend' };
  }
}

// =====================================================================
// BOOKINGS
// =====================================================================
export async function apiGetMyBookings(user = null) {
  try {
    let token = getStoredAuthToken();
    if (!token && user) {
      token = await apiGetSessionToken(user);
    }
    if (!token) return null;

    const res = await fetch(`${API_BASE}/bookings/my`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('apiGetMyBookings failed:', err);
  }
  return null;
}

export async function apiGetOwnerBookings(ownerMobile) {
  try {
    const clean = String(ownerMobile || '').replace(/\D/g, '');
    const res = await fetch(`${API_BASE}/bookings?ownerMobile=${encodeURIComponent(clean)}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('apiGetOwnerBookings error:', err);
  }
  return null;
}

// =====================================================================
// FILE / MEDIA UPLOADS
// =====================================================================
export async function apiUploadImage(file) {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('apiUploadImage failed:', err);
  }
  return null;
}

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
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      headers,
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiCheckAvailability(tractorId, date, timeSlot) {
  try {
    const params = new URLSearchParams({
      tractorId: String(tractorId),
      date: String(date),
      timeSlot: String(timeSlot || '')
    });
    const res = await fetch(`${API_BASE}/bookings/check-availability?${params.toString()}`, {
      signal: AbortSignal.timeout(4000)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiCheckAvailability fallback:', err);
    return { success: true, available: true, error: err.message };
  }
}

export async function apiSaveBooking(booking) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify(booking),
      signal: AbortSignal.timeout(6000),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, ...data, error: data.error || `HTTP ${res.status}` };
    }
    return data;
  } catch (err) {
    console.warn('apiSaveBooking network error:', err);
    return { success: false, error: err.message || 'Network error saving booking' };
  }
}

export async function apiUpdateBooking(id, updates) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates),
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiUpdateBookingStatus(id, status, reason = null, paymentStatus = null) {
  try {
    const token = getStoredAuthToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyPayload = { status };
    if (paymentStatus) bodyPayload.paymentStatus = paymentStatus;
    if (status === 'Rejected' && reason) bodyPayload.rejectionReason = reason;
    if (status === 'Cancelled' && reason) bodyPayload.cancellationReason = reason;

    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(bodyPayload),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiUpdateBookingStatus error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================================
// NOTIFICATIONS
// =====================================================================
export async function apiGetNotifications(limit = 20) {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/notifications?limit=${limit}`, {
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return { success: false, notifications: [], unreadCount: 0 };
}

export async function apiMarkNotificationRead(id) {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiMarkAllNotificationsRead() {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

export async function apiDeleteBooking(id) {
  try {
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      headers,
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
    const token = getStoredAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/stats`, { headers, signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return null;
}

// =====================================================================
// MESSAGE CENTRAL 3RD-PARTY OTP VERIFICATION
// =====================================================================

/**
 * Send OTP to mobile number via Message Central VerifyNow API
 */
export async function apiSendOtp({ mobileNumber, flowType = 'SMS', countryCode = '91', otpLength = 6 }) {
  try {
    const res = await fetch(`${API_BASE}/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, flowType, countryCode, otpLength }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiSendOtp failed, fallback to local simulator:', err);
    return {
      success: true,
      verificationId: `local_v_${Date.now()}`,
      timeout: '60',
      isLive: false,
      message: 'Network offline. Using local OTP simulator.',
    };
  }
}

/**
 * Verify OTP entered by user via Message Central VerifyNow API
 */
export async function apiVerifyOtp({ verificationId, code, countryCode = '91', mobileNumber, role = 'farmer' }) {
  try {
    const res = await fetch(`${API_BASE}/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, code, countryCode, mobileNumber, role }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('apiVerifyOtp error, fallback check:', err);
    // Offline / fallback verification for demo codes
    const validCodes = ['874885', '123456', '354498'];
    if (validCodes.includes(String(code).trim())) {
      return { success: true, verified: true, isLive: false };
    }
    return { success: false, verified: false, error: 'Verification failed. Please retry.' };
  }
}

/**
 * Check whether Message Central is running in Live or Simulator mode
 */
export async function apiGetOtpStatus() {
  try {
    const res = await fetch(`${API_BASE}/otp/status`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) return await res.json();
  } catch {}
  return { isLive: false, mode: 'Offline / Simulator' };
}
