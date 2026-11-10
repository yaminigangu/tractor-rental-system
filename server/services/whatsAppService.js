import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v21.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_BUSINESS_ACCOUNT_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

/**
 * Format Standardized WhatsApp Booking Message
 */
export function formatBookingWhatsAppMessage({
  type = 'new_booking_to_owner',
  booking
}) {
  const code = booking.bookingCode || booking.booking_code || `TRC${String(booking.id).slice(-4)}`;
  const farmerName = booking.farmerName || booking.farmer_name || 'Customer';
  const farmerMobile = booking.farmerMobile || booking.farmer_mobile || '';
  const tractorName = booking.tractorModel || booking.tractor_model || 'Assigned Tractor';
  const ownerName = booking.tractorOwner || booking.tractor_owner || 'Tractor Owner';
  const ownerMobile = booking.ownerMobile || booking.owner_mobile || '';
  const date = booking.bookingDate || booking.booking_date || '';
  const time = booking.timeSlot || booking.time_slot || booking.bookingTime || booking.booking_time || '09:00 AM – 01:00 PM';
  const location = booking.farmerVillage || booking.farmer_village || 'Locality Field';
  const duration = booking.durationHours || booking.duration_hours || 4;
  const totalAmount = (booking.estimatedCost || booking.estimated_cost || 0).toLocaleString();
  const advance = (booking.advancePayment || booking.advance_payment || 0).toLocaleString();
  const status = booking.status || 'Pending Approval';
  const reason = booking.rejectionReason || booking.rejection_reason || 'Tractor unavailable on requested slot';

  if (type === 'new_booking_to_owner') {
    return `🚜 NEW TRACTOR BOOKING REQUEST\n\nBooking ID: ${code}\n\nCustomer: ${farmerName}\nMobile: ${farmerMobile}\nTractor: ${tractorName}\nBooking Date: ${date}\nTime: ${time}\nLocation: ${location}\nDuration: ${duration} Hours\nAdvance Payment: ₹${advance}\nEstimated Amount: ₹${totalAmount}\n\nStatus: ${status}\n\nPlease log in to your Tractor Rental System dashboard to confirm or reject this booking.`;
  }

  if (type === 'booking_confirmed_to_farmer') {
    return `✅ TRACTOR BOOKING CONFIRMED!\n\nBooking ID: ${code}\n\nTractor: ${tractorName}\nOwner: ${ownerName} (+91 ${ownerMobile})\nBooking Date: ${date}\nTime: ${time}\nLocation: ${location}\nDuration: ${duration} Hours\nTotal Amount: ₹${totalAmount}\n\nStatus: Confirmed\n\nYour tractor has been confirmed and will arrive at your field on schedule. Please contact owner if you need any assistance.`;
  }

  if (type === 'booking_rejected_to_farmer') {
    return `❌ TRACTOR BOOKING UPDATE\n\nBooking ID: ${code}\n\nTractor: ${tractorName}\nBooking Date: ${date}\nTime: ${time}\nStatus: Rejected\nReason: ${reason}\n\nYour slot could not be accommodated by the owner. Please choose another tractor or select an alternative date on AgriRent.`;
  }

  if (type === 'booking_cancelled_to_owner') {
    return `⚠️ BOOKING CANCELLED BY CUSTOMER\n\nBooking ID: ${code}\n\nCustomer: ${farmerName} (${farmerMobile})\nTractor: ${tractorName}\nDate: ${date}\nTime: ${time}\n\nStatus: Cancelled\n\nThis time slot has been freed on your tractor schedule.`;
  }

  return `🚜 AgriRent Booking Update: #${code} is now ${status}.`;
}

/**
 * Send WhatsApp Notification:
 * Uses Official WhatsApp Cloud API if credentials exist, else returns manual Click-to-Chat fallback.
 */
export async function sendWhatsAppNotification({
  recipientPhone,
  type = 'new_booking_to_owner',
  booking
}) {
  const cleanPhone = String(recipientPhone || '').replace(/\D/g, '');
  const messageText = formatBookingWhatsAppMessage({ type, booking });
  const fallbackUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(messageText)}`;

  // Check if official Cloud API is configured in environment
  const isCloudApiConfigured = Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID);

  if (isCloudApiConfigured && cleanPhone.length >= 10) {
    try {
      // Format phone with country code (e.g. 919876543210)
      const formattedTo = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

      const endpoint = `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText
          }
        }),
        signal: AbortSignal.timeout(8000)
      });

      const data = await response.json();

      if (response.ok && data.messages && data.messages.length > 0) {
        console.log(`[WhatsApp Cloud API] ✅ Message sent successfully to ${formattedTo}. Message ID: ${data.messages[0].id}`);
        return {
          success: true,
          deliveryMethod: 'whatsapp_cloud_api',
          apiSent: true,
          messageId: data.messages[0].id,
          recipientPhone: formattedTo,
          messageText,
          fallbackUrl
        };
      } else {
        console.warn(`[WhatsApp Cloud API] ⚠️ API request failed:`, data.error?.message || data);
      }
    } catch (apiErr) {
      console.warn(`[WhatsApp Cloud API] ⚠️ Network / dispatch error:`, apiErr.message);
    }
  }

  // Graceful fallback to manual Click-to-Chat URL
  console.log(`[WhatsApp Fallback] 📲 Click-to-chat fallback URL generated for ${cleanPhone.slice(-10)}`);
  return {
    success: true,
    deliveryMethod: 'click_to_chat_fallback',
    apiSent: false,
    messageId: null,
    recipientPhone: cleanPhone.slice(-10),
    messageText,
    fallbackUrl,
    notice: isCloudApiConfigured 
      ? 'WhatsApp Cloud API call did not complete; manual click-to-chat fallback prepared.' 
      : 'WhatsApp Cloud API credentials not configured in .env. Manual click-to-chat fallback prepared.'
  };
}

