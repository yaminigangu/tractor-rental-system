import { useState } from 'react';

export default function BookingsAndMessagesModal({
  isOpen,
  onClose,
  initialTab = 'active',
  bookings = [],
  currentUser,
  language = 'en',
  onUpdateBookingStatus
}) {
  if (!isOpen) return null;

  const isTe = language === 'te';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedBookingId, setSelectedBookingId] = useState(bookings[0]?.id || 1);
  const [messages, setMessages] = useState([
    {
      id: 1,
      booking_id: 1,
      sender_role: 'system',
      sender_name: 'Agrirent Dispatch',
      message_text: 'Tractor confirmed for Hasanparthy. Owner Srinivas Rao is departing.',
      time: '07:15 AM'
    },
    {
      id: 2,
      booking_id: 1,
      sender_role: 'owner',
      sender_name: 'G. Srinivas Rao',
      message_text: 'Namaskaram Ramesh garu, I am bringing the 9-tyne cultivator along with the rotavator.',
      time: '07:20 AM'
    },
    {
      id: 3,
      booking_id: 1,
      sender_role: 'farmer',
      sender_name: 'N. Ramesh Kumar',
      message_text: 'Yes sir, canal road is dry and clear for entry.',
      time: '07:22 AM'
    }
  ]);
  const [newText, setNewText] = useState('');

  const activeBookings = bookings.filter((b) => ['pending', 'accepted', 'Pending Approval', 'Approved'].includes(b.status));

  const handleSend = () => {
    if (!newText.trim()) return;
    const msg = {
      id: Date.now(),
      booking_id: selectedBookingId,
      sender_role: currentUser?.role || 'farmer',
      sender_name: currentUser?.name || 'Farmer Ramesh',
      message_text: newText.trim(),
      time: 'Just now'
    };
    setMessages((prev) => [...prev, msg]);
    setNewText('');
  };

  return (
    <div className="native-modal-overlay" onClick={onClose}>
      <div className="native-modal-card wide-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="native-modal-header">
          <div className="modal-header-left">
            <span className="modal-header-icon">📋</span>
            <div>
              <h2 className="modal-header-title">
                {isTe ? 'అద్దెలు, ట్రాకింగ్ & సందేశాలు' : 'Rentals, Tracking & Chat'}
              </h2>
              <p className="modal-header-sub">
                {isTe ? 'ప్రత్యక్ష స్థితి మరియు రైతు-యజమాని సంభాషణ' : 'Live dispatch status & in-app chat'}
              </p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tab-bar">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            📋 {isTe ? 'క్రియాశీల ఆర్డర్లు' : 'Active Bookings'} ({activeBookings.length})
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 {isTe ? 'లైవ్ చాట్' : 'Live Chat'}
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            📱 WhatsApp
          </button>
        </div>

        {/* Tab 1: Active Bookings */}
        {activeTab === 'active' && (
          <div className="modal-scroll-body">
            {activeBookings.length === 0 ? (
              <div className="empty-state-box">
                <p>{isTe ? 'ప్రస్తుతానికి ఎటువంటి క్రియాశీల బుకింగ్‌లు లేవు' : 'No active bookings at the moment.'}</p>
              </div>
            ) : (
              <div className="bookings-cards-stack">
                {activeBookings.map((b) => (
                  <div key={b.id} className="booking-item-card">
                    <div className="booking-card-top">
                      <div>
                        <span className="booking-code-tag">{b.booking_code || `AGR-${b.id}`}</span>
                        <h4 className="booking-tractor-name">{b.tractor_name || b.tractorModel}</h4>
                      </div>
                      <span className="booking-status-badge accepted">
                        ✓ {b.status}
                      </span>
                    </div>

                    <div className="booking-info-grid">
                      <div><strong>{isTe ? 'రైతు:' : 'Farmer:'}</strong> {b.farmer_name || b.farmerName}</div>
                      <div><strong>{isTe ? 'యజమాని:' : 'Owner:'}</strong> {b.owner_name || b.tractorOwner}</div>
                      <div><strong>{isTe ? 'గ్రామం:' : 'Village:'}</strong> {b.delivery_village || b.farmerVillage}</div>
                      <div><strong>{isTe ? 'పని:' : 'Work:'}</strong> {b.work_type || b.workType}</div>
                      <div><strong>{isTe ? 'తేదీ:' : 'Date:'}</strong> {b.booking_date || b.bookingDate} ({b.time_slot || '07:00 AM'})</div>
                      <div><strong>{isTe ? 'మొత్తం:' : 'Cost:'}</strong> ₹{b.estimated_cost || b.estimatedCost}</div>
                    </div>

                    <div className="booking-item-actions">
                      <button
                        type="button"
                        className="booking-chat-btn"
                        onClick={() => {
                          setSelectedBookingId(b.id);
                          setActiveTab('chat');
                        }}
                      >
                        💬 {isTe ? 'యజమానితో చాట్' : 'Chat with Owner'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Chat */}
        {activeTab === 'chat' && (
          <div className="chat-interface-body">
            <div className="chat-messages-scroll">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`chat-bubble-row ${m.sender_role === (currentUser?.role || 'farmer') ? 'mine' : 'theirs'}`}
                >
                  <div className="chat-bubble">
                    <div className="chat-bubble-sender">{m.sender_name}</div>
                    <div className="chat-bubble-text">{m.message_text}</div>
                    <div className="chat-bubble-time">{m.time}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-text-input"
                placeholder={isTe ? 'సందేశాన్ని టైప్ చేయండి...' : 'Type a message...'}
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button type="button" className="chat-send-btn" onClick={handleSend}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: WhatsApp Alerts */}
        {activeTab === 'whatsapp' && (
          <div className="modal-scroll-body">
            <div className="whatsapp-preview-card">
              <div className="wa-header">
                <span>📱 WhatsApp Business Alert</span>
                <span className="wa-time">Today, 07:10 AM</span>
              </div>
              <div className="wa-bubble">
                🌾 <strong>Agrirent Alert:</strong> Your tractor booking at Hasanparthy has been <strong>ACCEPTED</strong> by G. Srinivas Rao!
                <br /><br />
                🚜 <strong>Tractor:</strong> Mahindra 575 DI (47 HP)<br />
                📅 <strong>Date:</strong> 26 Oct 2026, 07:00 AM<br />
                📍 <strong>Location:</strong> Hasanparthy Rythu Vedika Base
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

