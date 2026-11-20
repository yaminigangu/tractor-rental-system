import { query } from '../db.js';

/**
 * GET /api/stats
 * Aggregate dashboard statistics and system health
 */
export async function getDashboardStats(req, res, next) {
  try {
    const [
      farmersRes,
      ownersRes,
      tractorsRes,
      bookingsRes,
      pendingRes,
      confirmedRes,
      completedRes,
      revenueRes,
      recentBookingsRes
    ] = await Promise.all([
      query('SELECT COUNT(*)::int as count FROM farmers'),
      query('SELECT COUNT(*)::int as count FROM vehicle_owners'),
      query('SELECT COUNT(*)::int as count FROM tractors'),
      query('SELECT COUNT(*)::int as count FROM bookings'),
      query("SELECT COUNT(*)::int as count FROM bookings WHERE status = 'Pending Approval'"),
      query("SELECT COUNT(*)::int as count FROM bookings WHERE status = 'Confirmed'"),
      query("SELECT COUNT(*)::int as count FROM bookings WHERE status = 'Completed'"),
      query("SELECT COALESCE(SUM(estimated_cost), 0)::bigint as total FROM bookings WHERE status != 'Cancelled'"),
      query(`SELECT id, farmer_name as "farmerName", farmer_village as "village",
                    tractor_model as "tractorModel", work_type as "workType",
                    booking_date as "date", estimated_cost as "cost", status
             FROM bookings ORDER BY id DESC LIMIT 5`)
    ]);

    res.json({
      success: true,
      data: {
        totalFarmers: farmersRes.rows[0].count,
        totalOwners: ownersRes.rows[0].count,
        totalTractors: tractorsRes.rows[0].count,
        totalBookings: bookingsRes.rows[0].count,
        pendingBookings: pendingRes.rows[0].count,
        confirmedBookings: confirmedRes.rows[0].count,
        completedBookings: completedRes.rows[0].count,
        totalRevenue: Number(revenueRes.rows[0].total),
        recentBookings: recentBookingsRes.rows
      }
    });
  } catch (err) {
    next(err);
  }
}

