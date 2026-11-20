const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=== STARTING RBAC & AUTH TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Registration Protection (Normal users cannot register as ADMIN)
    console.log('\n--- 1. Testing Registration Protection ---');
    const adminRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious User',
        mobile: '9900112233',
        email: 'hacker@agrirent.com',
        password: 'password123',
        role: 'ADMIN'
      })
    });
    const adminRegData = await adminRegRes.json();
    assert(adminRegRes.status === 400, `Rejects ADMIN registration with HTTP 400 (Status: ${adminRegRes.status})`);
    assert(adminRegData.error && adminRegData.error.includes('Administrator is not permitted'), `Error message explains admin accounts cannot be self-registered: "${adminRegData.error}"`);

    // 2. Test Farmer Registration & Login
    console.log('\n--- 2. Testing Farmer Registration & Role Assignment ---');
    const farmerMobile = `98480${Math.floor(10000 + Math.random() * 90000)}`;
    const farmerEmail = `farmer_${Date.now()}@example.com`;
    const farmerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ravi Kumar',
        mobile: farmerMobile,
        email: farmerEmail,
        password: 'farmerpassword123',
        role: 'FARMER',
        village: 'Hasanparthy',
        district: 'Hanamkonda'
      })
    });
    const farmerRegData = await farmerRegRes.json();
    assert(farmerRegRes.status === 201, `Farmer registered successfully with HTTP 201`);
    assert(farmerRegData.role === 'FARMER', `Farmer assigned canonical uppercase role 'FARMER'`);
    assert(farmerRegData.token, `Farmer issued JWT session token upon registration`);
    const farmerToken = farmerRegData.token;

    // 3. Test Owner Registration & Role Assignment
    console.log('\n--- 3. Testing Vehicle Owner Registration & Role Assignment ---');
    const ownerMobile = `91234${Math.floor(10000 + Math.random() * 90000)}`;
    const ownerEmail = `owner_${Date.now()}@example.com`;
    const ownerRegRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Srinivasulu Owner',
        mobile: ownerMobile,
        email: ownerEmail,
        password: 'ownerpassword123',
        role: 'VEHICLE_OWNER',
        village: 'Velair',
        district: 'Hanamkonda'
      })
    });
    const ownerRegData = await ownerRegRes.json();
    assert(ownerRegRes.status === 201, `Owner registered successfully with HTTP 201`);
    assert(ownerRegData.role === 'VEHICLE_OWNER', `Owner assigned canonical uppercase role 'VEHICLE_OWNER'`);
    const ownerToken = ownerRegData.token;

    // 4. Test Admin Login against database admins table
    console.log('\n--- 4. Testing Admin Authentication via database admins table ---');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, `Admin authenticated successfully with HTTP 200`);
    assert(adminLoginData.role === 'ADMIN', `Admin assigned canonical uppercase role 'ADMIN'`);
    assert(adminLoginData.token, `Admin issued signed JWT session token`);
    const adminToken = adminLoginData.token;

    // 5. Test Admin API Protection against Non-Admins (Farmer & Owner tokens)
    console.log('\n--- 5. Testing Admin API Protection (HTTP 403 Forbidden) ---');
    
    // 5a. GET /api/stats with Farmer Token
    const statsFarmerRes = await fetch(`${BASE_URL}/stats`, {
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });
    const statsFarmerData = await statsFarmerRes.json();
    assert(statsFarmerRes.status === 403, `GET /api/stats rejects Farmer with HTTP 403 (Status: ${statsFarmerRes.status})`);
    assert(statsFarmerData.error === 'Forbidden: Admin access required', `Returns exact error: "${statsFarmerData.error}"`);

    // 5b. GET /api/farmers with Owner Token
    const farmersOwnerRes = await fetch(`${BASE_URL}/farmers`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const farmersOwnerData = await farmersOwnerRes.json();
    assert(farmersOwnerRes.status === 403, `GET /api/farmers rejects Owner with HTTP 403 (Status: ${farmersOwnerRes.status})`);
    assert(farmersOwnerData.error === 'Forbidden: Admin access required', `Returns exact error: "${farmersOwnerData.error}"`);

    // 5c. GET /api/owners with Farmer Token
    const ownersFarmerRes = await fetch(`${BASE_URL}/owners`, {
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });
    const ownersFarmerData = await ownersFarmerRes.json();
    assert(ownersFarmerRes.status === 403, `GET /api/owners rejects Farmer with HTTP 403 (Status: ${ownersFarmerRes.status})`);
    assert(ownersFarmerData.error === 'Forbidden: Admin access required', `Returns exact error: "${ownersFarmerData.error}"`);

    // 5d. PATCH /api/tractors/1/verification with Owner Token
    const verifyOwnerRes = await fetch(`${BASE_URL}/tractors/1/verification`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${ownerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Approved' })
    });
    const verifyOwnerData = await verifyOwnerRes.json();
    assert(verifyOwnerRes.status === 403, `PATCH /api/tractors/:id/verification rejects Owner with HTTP 403`);
    assert(verifyOwnerData.error === 'Forbidden: Admin access required', `Returns exact error: "${verifyOwnerData.error}"`);

    // 6. Test Admin Access to Protected APIs with Admin Token
    console.log('\n--- 6. Testing Admin Authorized Access with Admin Token ---');
    const statsAdminRes = await fetch(`${BASE_URL}/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(statsAdminRes.status === 200, `GET /api/stats allows Admin with HTTP 200`);

    const farmersAdminRes = await fetch(`${BASE_URL}/farmers`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(farmersAdminRes.status === 200, `GET /api/farmers allows Admin with HTTP 200`);

    const ownersAdminRes = await fetch(`${BASE_URL}/owners`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(ownersAdminRes.status === 200, `GET /api/owners allows Admin with HTTP 200`);

    // 7. Test Data Privacy & Ownership on Bookings
    console.log('\n--- 7. Testing Data Privacy & Isolation on Bookings ---');
    // Create a booking as Farmer
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${farmerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        farmerName: 'Ravi Kumar',
        farmerMobile: farmerMobile,
        workType: 'Ploughing',
        landArea: 2.5,
        tractorModel: 'Swaraj 744 FE XT',
        ownerMobile: '9988776655',
        bookingDate: '2026-11-20',
        timeSlot: '09:00 AM – 01:00 PM'
      })
    });
    const bookingData = await bookingRes.json();
    assert(bookingRes.status === 201, `Booking created with HTTP 201 (Code: ${bookingData.bookingCode})`);
    const bookingId = bookingData.id;

    // Another farmer creates a second account
    const secondFarmerMobile = `98481${Math.floor(10000 + Math.random() * 90000)}`;
    const secondFarmerReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another Farmer',
        mobile: secondFarmerMobile,
        email: `farmer2_${Date.now()}@example.com`,
        password: 'password123',
        role: 'FARMER'
      })
    });
    const secondFarmerData = await secondFarmerReg.json();
    const secondFarmerToken = secondFarmerData.token;

    // Second farmer attempts to view first farmer's booking
    const unauthorizedBookingRes = await fetch(`${BASE_URL}/bookings/${bookingId}`, {
      headers: { 'Authorization': `Bearer ${secondFarmerToken}` }
    });
    assert(unauthorizedBookingRes.status === 403, `Second farmer denied access to first farmer's booking with HTTP 403`);

    // Second farmer attempts to cancel first farmer's booking
    const unauthorizedCancelRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${secondFarmerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Cancelled' })
    });
    assert(unauthorizedCancelRes.status === 403, `Second farmer denied permission to cancel first farmer's booking with HTTP 403`);

    // 8. Test Account Deactivation & Blocking
    console.log('\n--- 8. Testing Account Deactivation & Status Toggling ---');
    const farmerDbId = farmerRegData.user.id;
    const deactivateRes = await fetch(`${BASE_URL}/farmers/${farmerDbId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: false })
    });
    const deactivateData = await deactivateRes.json();
    assert(deactivateRes.status === 200, `Admin toggled farmer account to deactivated`);
    assert(deactivateData.farmer.isActive === false, `Farmer account isActive is now false`);

    // Deactivated farmer attempts to log in
    const blockedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: farmerMobile,
        password: 'farmerpassword123',
        role: 'FARMER'
      })
    });
    const blockedLoginData = await blockedLoginRes.json();
    assert(blockedLoginRes.status === 403, `Deactivated farmer login blocked with HTTP 403 (Status: ${blockedLoginRes.status})`);
    assert(blockedLoginData.error && blockedLoginData.error.includes('deactivated'), `Error mentions account has been deactivated: "${blockedLoginData.error}"`);

    // Re-activate farmer account
    await fetch(`${BASE_URL}/farmers/${farmerDbId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isActive: true })
    });

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
