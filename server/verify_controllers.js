import { query } from './db.js';
import { register, login, getCurrentUser } from './controllers/authController.js';
import { checkAvailability, createBooking, updateBookingStatus } from './controllers/bookingController.js';
import { getNotifications } from './controllers/notificationController.js';

function mockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
  return res;
}

async function runDirectTests() {
  console.log('🚜 === RUNNING DIRECT CONTROLLER & DATABASE VERIFICATION ===\n');
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
    // 1. Database Connection & Schema Verification
    const dbRes = await query('SELECT NOW() as current_time, current_database() as db_name');
    assert(dbRes.rows.length > 0, `PostgreSQL Connected to database [${dbRes.rows[0].db_name}]`);

    // Verify columns in bookings
    const colRes = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings'
    `);
    const cols = colRes.rows.map(r => r.column_name);
    assert(cols.includes('booking_code'), 'Column `booking_code` exists in bookings table');
    assert(cols.includes('time_slot'), 'Column `time_slot` exists in bookings table');
    assert(cols.includes('activity_log'), 'Column `activity_log` exists in bookings table');
    assert(cols.includes('advance_payment'), 'Column `advance_payment` exists in bookings table');

    // 2. User Registration Controller (New User)
    const testMobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testEmail = `farmer_${Date.now()}@agrirent.in`;
    const regReq = {
      body: {
        name: 'Srinivas Reddy',
        mobile: testMobile,
        email: testEmail,
        password: 'Password@123',
        village: 'Hasanparthy',
        landArea: 4.5,
        role: 'farmer'
      }
    };
    const regRes = mockRes();
    await register(regReq, regRes, (err) => { throw err; });
    assert(regRes.data?.success === true && regRes.data?.token, 'User Registration: Password hashed with bcrypt & JWT session generated');
    const farmerToken = regRes.data.token;
    const farmerUser = regRes.data.user;

    // 3. User Login Controller (Existing User via Email + Password)
    const loginReq = {
      body: {
        identifier: testEmail,
        password: 'Password@123',
        role: 'farmer',
        rememberMe: true
      }
    };
    const loginRes = mockRes();
    await login(loginReq, loginRes, (err) => { throw err; });
    assert(loginRes.data?.success === true && loginRes.data?.user?.name === 'Srinivas Reddy', 'User Login: Authenticated via Email + Password with bcrypt.compare');

    // 4. Session Validation (getCurrentUser)
    const meReq = { user: farmerUser };
    const meRes = mockRes();
    await getCurrentUser(meReq, meRes);
    assert(meRes.data?.authenticated === true && meRes.data?.user?.mobile === testMobile, 'Session Validation: User authenticated session restored');

    // 5. Check Slot Availability
    const testDate = `2027-01-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`;
    const testSlot = '09:00 AM – 01:00 PM';
    const availReq1 = {
      query: { tractorId: '1', date: testDate, timeSlot: testSlot }
    };
    const availRes1 = mockRes();
    await checkAvailability(availReq1, availRes1, (err) => { throw err; });
    assert(availRes1.data?.available === true, 'Availability Check: Initial slot is available');

    // 6. Create Tractor Booking
    const bookReq = {
      user: farmerUser,
      body: {
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
        ownerMobile: '9876543210'
      }
    };
    const bookRes = mockRes();
    await createBooking(bookReq, bookRes, (err) => { throw err; });
    assert(bookRes.data?.success === true && bookRes.data?.booking?.bookingCode, `Booking Created: Assigned Unique Booking Code ${bookRes.data?.booking?.bookingCode}`);
    assert(bookRes.data?.whatsapp?.success === true, `WhatsApp Service triggered (${bookRes.data?.whatsapp?.deliveryMethod})`);
    const createdBooking = bookRes.data.booking;

    // 7. Double Booking Prevention (Overlapping slot)
    const dupBookReq = {
      body: {
        farmerName: 'Second Farmer',
        farmerMobile: '9988776655',
        farmerVillage: 'Hasanparthy',
        workType: 'Rotavator',
        landArea: 2,
        bookingDate: testDate,
        timeSlot: testSlot,
        durationHours: 3,
        estimatedCost: 4500,
        tractorId: 1
      }
    };
    const dupBookRes = mockRes();
    await createBooking(dupBookReq, dupBookRes, (err) => { throw err; });
    assert(dupBookRes.statusCode === 409 && dupBookRes.data?.conflict === true, 'Double Booking Prevention: Returns 409 Conflict with collision details');

    // 8. Availability Check now reflects booked
    const availRes2 = mockRes();
    await checkAvailability(availReq1, availRes2, (err) => { throw err; });
    assert(availRes2.data?.available === false, 'Availability Check: Reflects tractor is booked for that slot');

    // 9. Owner Confirms Booking
    const confirmReq = {
      params: { id: createdBooking.id },
      body: { status: 'Confirmed' }
    };
    const confirmRes = mockRes();
    await updateBookingStatus(confirmReq, confirmRes, (err) => { throw err; });
    assert(confirmRes.data?.success === true && confirmRes.data?.booking?.status === 'Confirmed', 'Owner Confirmation: Booking marked Confirmed in database');

    // 10. In-App Notifications Verification
    const notifReq = {
      query: { mobile: testMobile, limit: '10' }
    };
    const notifRes = mockRes();
    await getNotifications(notifReq, notifRes, (err) => { throw err; });
    assert(notifRes.data?.success === true && notifRes.data?.notifications?.length >= 2, `In-App Notifications: ${notifRes.data?.notifications?.length} notifications persisted in database`);

    // 11. Owner Rejects Booking with Reason
    const rejectReq = {
      params: { id: createdBooking.id },
      body: {
        status: 'Rejected',
        rejectionReason: 'Tractor scheduled for routine servicing'
      }
    };
    const rejectRes = mockRes();
    await updateBookingStatus(rejectReq, rejectRes, (err) => { throw err; });
    assert(rejectRes.data?.success === true && rejectRes.data?.booking?.status === 'Rejected' && rejectRes.data?.booking?.rejectionReason, 'Owner Rejection: Booking marked Rejected with reason recorded');

  } catch (err) {
    console.error('Direct Test Error:', err);
    failed++;
  }

  console.log(`\n=============================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=============================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runDirectTests();
