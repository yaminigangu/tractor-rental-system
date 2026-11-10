const BASE_URL = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('=== TESTING PROFILE & ACCOUNT SETTINGS API ===\n');
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
    const timestamp = Date.now().toString().slice(-6);
    const testOwnerMobile = `944${timestamp}1`;
    const testOwnerEmail = `owner${timestamp}@test.com`;

    // 1. Register a test vehicle owner
    console.log('--- 1. Registering test Vehicle Owner ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Srinivasulu Test',
        mobile: testOwnerMobile,
        email: testOwnerEmail,
        password: 'password123',
        role: 'VEHICLE_OWNER',
        village: 'Hasanparthy',
        district: 'Hanumakonda'
      })
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, `Vehicle owner registered (Status: ${regRes.status})`);
    const ownerToken = regData.token;
    assert(Boolean(ownerToken), 'Owner issued JWT token');

    // 2. Fetch Profile via GET /api/auth/profile
    console.log('\n--- 2. Fetching Profile from Database ---');
    const profRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${ownerToken}`
      }
    });
    const profData = await profRes.json();
    assert(profRes.status === 200, `Profile fetched successfully (Status: ${profRes.status})`);
    assert(profData.profile.name === 'Srinivasulu Test', `Profile name matches database: "${profData.profile?.name}"`);
    assert(profData.profile.role === 'VEHICLE_OWNER', `Profile role matches: ${profData.profile?.role}`);
    assert(profData.profile.mobile === testOwnerMobile, `Profile mobile matches: ${profData.profile?.mobile}`);
    assert(profData.profile.district === 'Hanumakonda', `Profile district matches: ${profData.profile?.district}`);

    // 3. Update Profile via PUT /api/auth/profile
    console.log('\n--- 3. Updating Profile Information in Database ---');
    const updateRes = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'Srinivasulu Updated',
        email: testOwnerEmail,
        mobile: testOwnerMobile,
        district: 'Warangal Urban',
        mandal: 'Kazipet',
        address: 'H.No 4-12, Station Road'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, `Profile update succeeded (Status: ${updateRes.status})`);
    assert(updateData.user.name === 'Srinivasulu Updated', `Updated name persisted: "${updateData.user?.name}"`);
    assert(updateData.user.district === 'Warangal Urban', `Updated district persisted: "${updateData.user?.district}"`);

    // Verify it persists by re-fetching
    const refetchRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${ownerToken}` }
    });
    const refetchData = await refetchRes.json();
    assert(refetchData.profile.name === 'Srinivasulu Updated', `Re-fetched profile reflects updated name`);
    assert(refetchData.profile.district === 'Warangal Urban', `Re-fetched profile reflects updated district`);
    assert(refetchData.profile.mandal === 'Kazipet', `Re-fetched profile reflects updated mandal`);

    // 4. Change Password via POST /api/auth/change-password
    console.log('\n--- 4. Changing Password with Current Password Verification ---');
    // Wrong current password should fail
    const wrongPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        currentPassword: 'wrongPassword!',
        newPassword: 'newSecurePassword456',
        confirmPassword: 'newSecurePassword456'
      })
    });
    assert(wrongPassRes.status === 400, `Rejects incorrect current password (Status: ${wrongPassRes.status})`);

    // Correct current password succeeds
    const correctPassRes = await fetch(`${BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        currentPassword: 'password123',
        newPassword: 'newSecurePassword456',
        confirmPassword: 'newSecurePassword456'
      })
    });
    const passData = await correctPassRes.json();
    assert(correctPassRes.status === 200, `Password changed successfully (Status: ${correctPassRes.status})`);

    // 5. Test logging in with the new password
    console.log('\n--- 5. Verifying Login with New Password ---');
    const oldLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testOwnerMobile,
        password: 'password123',
        role: 'VEHICLE_OWNER'
      })
    });
    assert(oldLoginRes.status === 401, `Old password is no longer accepted (Status: 401)`);

    const newLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testOwnerMobile,
        password: 'newSecurePassword456',
        role: 'VEHICLE_OWNER'
      })
    });
    assert(newLoginRes.status === 200, `Login with new password succeeded (Status: 200)`);

    console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
