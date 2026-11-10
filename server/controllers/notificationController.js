import { query } from '../db.js';

/**
 * Internal helper to create an in-app notification in PostgreSQL
 */
export async function createInAppNotification({
  userId = null,
  userMobile,
  userRole = 'farmer',
  title,
  message,
  type = 'booking',
  bookingId = null
}) {
  try {
    const cleanMobile = String(userMobile || '').replace(/\D/g, '');
    if (!cleanMobile || !title) return null;

    const res = await query(
      `INSERT INTO notifications (user_id, user_mobile, user_role, title, message, type, booking_id, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)
       RETURNING id, user_mobile as "userMobile", user_role as "userRole",
                 title, message, type, booking_id as "bookingId",
                 is_read as "isRead", created_at as "createdAt"`,
      [userId, cleanMobile.slice(-10), userRole, title, message, type, bookingId ? parseInt(bookingId, 10) : null]
    );

    return res.rows[0];
  } catch (err) {
    console.warn('Failed to insert in-app notification:', err.message);
    return null;
  }
}

/**
 * GET /api/notifications
 * Retrieve notifications for current authenticated user
 */
export async function getNotifications(req, res, next) {
  try {
    const user = req.user;
    const queryMobile = req.query.mobile ? String(req.query.mobile).replace(/\D/g, '') : '';
    const mobile = (user?.mobile ? String(user.mobile).replace(/\D/g, '') : queryMobile).slice(-10);

    if (!mobile) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifRes = await query(
      `SELECT id, user_id as "userId", user_mobile as "userMobile",
              user_role as "userRole", title, message, type,
              booking_id as "bookingId", is_read as "isRead",
              created_at as "createdAt"
       FROM notifications
       WHERE user_mobile = $1 OR user_mobile LIKE $2
       ORDER BY id DESC
       LIMIT 50`,
      [mobile, `%${mobile}`]
    );

    const unreadRes = await query(
      `SELECT COUNT(*)::int as count
       FROM notifications
       WHERE (user_mobile = $1 OR user_mobile LIKE $2) AND is_read = FALSE`,
      [mobile, `%${mobile}`]
    );

    res.json({
      success: true,
      notifications: notifRes.rows,
      unreadCount: unreadRes.rows[0]?.count || 0
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1',
      [parseInt(id, 10)]
    );
    res.json({ success: true, id: parseInt(id, 10) });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsRead(req, res, next) {
  try {
    const user = req.user;
    const queryMobile = req.body.mobile ? String(req.body.mobile).replace(/\D/g, '') : '';
    const mobile = (user?.mobile ? String(user.mobile).replace(/\D/g, '') : queryMobile).slice(-10);

    if (mobile) {
      await query(
        `UPDATE notifications SET is_read = TRUE
         WHERE (user_mobile = $1 OR user_mobile LIKE $2) AND is_read = FALSE`,
        [mobile, `%${mobile}`]
      );
    }

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    next(err);
  }
}

