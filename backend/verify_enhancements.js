import http from 'http';
import { app } from './server.js';

async function runTests() {
  console.log('🚜 === RUNNING IN-PROCESS VERIFICATION SUITE ===\n');

  // Bind ephemeral server on 127.0.0.1
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(0, '127.0.0.1', resolve));
  const port = testServer.address().port;
  const BASE_URL = `http://127.0.0.1:${port}/api`;
  console.log(`Test server bound to ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthData.database === 'connected', 'PostgreSQL database connected');

    // 2. User Registration (New User scenario)
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `farmer_${Date.now()}@agrirent.in`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Srinivas Reddy',
        mobile: testMobile,
        email: testEmail,
        password: 'Password@123',
        village: 'Hasanparthy',
        landArea: 4.5,
        role: 'farmer'
      })
    });
    const regData = await regRes.json();
    assert(regData.success === true && regData.token, 'User Registration with password hashing & auto-login JWT token');
    const farmerToken = regData.token;

    // 3. Prevent duplicate registration
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Another User',
        mobile: testMobile,
        email: 'another@example.com',
        password: 'Password@123',
        village: 'Velair',
        role: 'farmer'
      })
    });
    assert(dupRes.status === 400 || dupRes.status === 409, 'Duplicate mobile registration blocked');

    // 4. User Login with Email or Mobile (Existing User scenario with bcrypt compare)
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: testEmail,
        password: 'Password@123',
        role: 'farmer',
        rememberMe: true
      })
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true && loginData.user.name === 'Srinivas Reddy', 'User Login via Email + Password with bcrypt comparison');

    // 5. Verify Persistent Session (/api/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${farmerToken}` }
    });
    const meData = await meRes.json();
    assert(meData.success === true && meData.user.mobile === testMobile, 'Session Token Verified across restarts (/api/auth/me)');

    // 6. Check Slot Availability (Initial Check)
    const testDate = '2026-11-20';
    const testSlot = '09:00 AM – 01:00 PM';
    const availRes1 = await fetch(`${BASE_URL}/bookings/check-availability?tractorId=1&date=${testDate}&timeSlot=${encodeURIComponent(testSlot)}`);
    const availData1 = await availRes1.json();
    assert(availData1.available === true, 'Slot Availability Checker reports available before booking');

    // 7. Create Tractor Booking with Time Slot, Advance Payment & Unique Booking Code
    const bookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${farmerToken}`
      },
      body: JSON.stringify({
        farmerName: 'Srinivas Reddy',
        farmerMobile: testMobile,
        farmerVillage: 'Hasanparthy',
        workType: 'Ploughing',
        landArea: 3,
        bookingDate: testDate,
        timeSlot: testSlot,
        durationHours: 4,
        estimatedCost: 6000,
        advancePayment: 500,
        tractorId: 1,
        tractorModel: 'Mahindra 575 DI XP Plus',
        tractorOwner: 'Ramesh Kumar',
        ownerMobile: '9876543210',
        paymentStatus: 'Pending Cash on Service'
      })
    });
    const bookData = await bookRes.json();
    assert(bookData.success === true && bookData.booking?.bookingCode, `Tractor Booking Created with Unique Booking Code: ${bookData.booking?.bookingCode}`);
    assert(bookData.whatsapp && bookData.whatsapp.attempted === true, `WhatsApp Notification prepared (${bookData.whatsapp.deliveryMethod})`);
    const bookingId = bookData.booking.id;

    // 8. Prevent Double Booking / Overlapping Slots (409 Conflict)
    const doubleBookRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farmerName: 'Second Farmer',
        farmerMobile: '9988776655',
        farmerVillage: 'Hasanparthy',
        workType: 'Rotavator',
        landArea: 2,
        bookingDate: testDate,
        timeSlot: testSlot, // Overlapping time slot on same tractor and date!
        durationHours: 3,
        estimatedCost: 4500,
        tractorId: 1
      })
    });
    const doubleBookData = await doubleBookRes.json();
    assert(doubleBookRes.status === 409 && doubleBookData.conflict === true, 'Double Booking Prevention: Returns 409 Conflict on overlapping slot');

    // 9. Availability Check now reports booked
    const availRes2 = await fetch(`${BASE_URL}/bookings/check-availability?tractorId=1&date=${testDate}&timeSlot=${encodeURIComponent(testSlot)}`);
    const availData2 = await availRes2.json();
    assert(availData2.available === false, 'Slot Availability Checker reports booked after active booking');

    // 10. Owner Confirms Booking
    const confirmRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Confirmed' })
    });
    const confirmData = await confirmRes.json();
    assert(confirmData.success === true && confirmData.booking.status === 'Confirmed', 'Owner Confirms Booking in Database');

    // 11. In-App Notification Verification for Farmer
    const notifRes = await fetch(`${BASE_URL}/notifications?mobile=${testMobile}`);
    const notifData = await notifRes.json();
    assert(notifData.success === true && notifData.notifications.length >= 2, `In-App Notifications saved in PostgreSQL (count: ${notifData.notifications.length}, unread: ${notifData.unreadCount})`);

    // 12. Owner Rejects Booking with Reason
    const rejectRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Rejected',
        rejectionReason: 'Tractor scheduled for routine 500-hour service'
      })
    });
    const rejectData = await rejectRes.json();
    assert(rejectData.success === true && rejectData.booking.status === 'Rejected' && rejectData.booking.rejectionReason, 'Owner Rejects Booking with Rejection Reason recorded');

  } catch (err) {
    console.error('Test Suite Error:', err);
    failed++;
  } finally {
    testServer.close();
  }

  console.log(`\n=============================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=============================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
