import { useState } from 'react';
import StatCard from '../components/StatCard';
import { translations } from '../translations';
import { getAccurateTractorPhoto, getTractorDisplayName } from './FindTractor';

export default function Dashboard({
  bookings = [],
  setBookings,
  tractors = [],
  setTractors,
  onViewSlip,
  onLogout,
  language = 'en'
}) {
  const [statusFilter, setStatusFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'fleet'

  const t = translations[language] || translations.en;
  const isTe = language === 'te';

  const pendingCount = bookings.filter(b => b.status === 'Pending Approval').length;
  const approvedCount = bookings.filter(b => b.status === 'Approved' || b.status === 'Confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const totalAcres = bookings.reduce((sum, b) => sum + (Number(b.landArea) || 0), 0);

  const handleUpdateStatus = (id, newStatus) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
  };

  const handleToggleTractorAvailability = (id) => {
    setTractors((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextState = t.availability === 'Available' ? 'Busy' : 'Available';
          return { ...t, availability: nextState };
        }
        return t;
      })
    );
  };

  const handleDeleteTractor = (id) => {
    if (window.confirm(isTe ? 'ఈ ట్రాక్టర్‌ను జాబితా నుండి తొలగించాలనుకుంటున్నారా?' : 'Are you sure you want to delete this tractor from the fleet?')) {
      setTractors((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'All') return true;
    return b.status === statusFilter;
  });

  return (
    <div className="page-anim">
      {/* Metric Cards */}
      <div className="dashboard-metrics">
        <StatCard
          title={isTe ? 'మొత్తం పని ఆర్డర్లు' : 'Total Work Bookings'}
          value={bookings.length}
          icon="📋"
          color="#2e7d32"
          subtitle={isTe ? `ధృవీకరించబడినవి: ${approvedCount} • పూర్తయినవి: ${completedCount}` : `Confirmed: ${approvedCount} • Done: ${completedCount}`}
        />
        <StatCard
          title={isTe ? 'పరిశీలించవలసినవి' : 'Pending Verification'}
          value={pendingCount}
          icon="⏳"
          color="#f57c00"
          subtitle={isTe ? 'అడ్మిన్ ఆమోదం కోసం' : 'Awaiting admin approval'}
        />
        <StatCard
          title={isTe ? 'రిజిస్టర్ అయిన ట్రాక్టర్లు' : 'Registered Fleet Tractors'}
          value={tractors.length}
          icon="🚜"
          color="#0288d1"
          subtitle={isTe ? 'మన గ్రామంలోని ట్రాక్టర్లు' : 'Active community units'}
        />
        <StatCard
          title={isTe ? 'సేవలందించిన భూమి' : 'Total Land Serviced'}
          value={`${totalAcres} ${isTe ? 'ఎకరాలు' : 'Acres'}`}
          icon="🌱"
          color="#7b1fa2"
          subtitle={isTe ? 'పని పూర్తయిన విస్తీర్ణం' : 'Community agricultural footprint'}
        />
      </div>

      {/* Tabs & Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`filter-pill ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📋 {isTe ? 'రైతుల బుకింగ్స్ నిర్వహణ' : 'Manage Farmer Bookings'} ({bookings.length})
          </button>
          <button
            className={`filter-pill ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            🚜 {isTe ? 'ట్రాక్టర్ పరికరాల నిర్వహణ' : 'Manage Fleet Machinery'} ({tractors.length})
          </button>
        </div>

        {onLogout && (
          <button
            className="btn btn-call"
            style={{ background: '#d32f2f', padding: '6px 14px', fontSize: '13px' }}
            onClick={onLogout}
            title={t.adminLogoutBtn}
          >
            {t.adminLogoutBtn}
          </button>
        )}
      </div>

      {activeTab === 'bookings' ? (
        <div>
          {/* Status Filter for Bookings */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <h4 style={{ color: 'var(--primary-900)' }}>
              {isTe ? 'పని ఆర్డర్లు & సమన్వయం' : 'Operational Work Intake & Allocations'}
            </h4>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Pending Approval', 'Approved', 'Completed'].map((s) => (
                <button
                  key={s}
                  className={`role-btn ${statusFilter === s ? 'active' : ''}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'All' ? (isTe ? 'అన్నీ' : 'All') : s}
                </button>
              ))}
            </div>
          </div>

          <div className="table-card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{t.colFarmer}</th>
                    <th>{t.colOperation}</th>
                    <th>{t.colSchedule}</th>
                    <th>{t.colTractor}</th>
                    <th>{t.colEstCost}</th>
                    <th>{t.colStatus}</th>
                    <th>{isTe ? 'నిర్వహణ చర్యలు' : 'Operational Control'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center" style={{ padding: '30px' }}>
                        {isTe ? `ఈ స్థితితో ఎలాంటి బుకింగ్స్ లేవు: "${statusFilter}"` : `No work orders matching status "${statusFilter}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id}>
                        <td>
                          <strong>{b.farmerName}</strong>
                          <br />
                          <small style={{ color: 'var(--text-muted)' }}>
                            📞 {b.farmerMobile} | 🏡 {b.farmerVillage}
                          </small>
                        </td>
                        <td>
                          <strong>{b.workType}</strong>
                          <br />
                          <small>{b.landArea} {isTe ? 'ఎకరాలు' : 'Acres'}</small>
                        </td>
                        <td>
                          📅 {b.bookingDate}
                        </td>
                        <td>
                          <strong>{b.tractorModel}</strong>
                          <br />
                          <small style={{ color: 'var(--text-muted)' }}>{b.tractorOwner}</small>
                        </td>
                        <td>
                          <strong style={{ color: '#e65100' }}>₹{(b.estimatedCost || 0).toLocaleString()}</strong>
                        </td>
                        <td>
                          <span className={`badge ${b.status === 'Approved' ? 'bg-success' :
                              b.status === 'Completed' ? 'bg-success' :
                                b.status === 'In Progress' ? 'bg-info' : 'bg-warning'
                            }`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {/* View Slip */}
                            <button
                              className="btn btn-outline-white"
                              style={{ borderColor: '#64748b', color: '#1e293b', padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => onViewSlip && onViewSlip(b)}
                              title="View Work Slip"
                            >
                              🧾 Slip
                            </button>

                            {/* Lifecycle Steps */}
                            {b.status === 'Pending Approval' && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => handleUpdateStatus(b.id, 'Approved')}
                              >
                                ✓ {isTe ? 'ఆమోదించు' : 'Approve'}
                              </button>
                            )}
                            {b.status === 'Approved' && (
                              <button
                                className="btn btn-call"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => handleUpdateStatus(b.id, 'In Progress')}
                              >
                                ⚙️ {isTe ? 'పని ప్రారంభం' : 'Start Work'}
                              </button>
                            )}
                            {b.status === 'In Progress' && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px', background: '#2e7d32' }}
                                onClick={() => handleUpdateStatus(b.id, 'Completed')}
                              >
                                ✓ {isTe ? 'పూర్తయింది' : 'Complete'}
                              </button>
                            )}
                            {b.status !== 'Completed' && (
                              <button
                                className="btn btn-call"
                                style={{ padding: '5px 8px', fontSize: '12px', background: '#e53935' }}
                                onClick={() => handleUpdateStatus(b.id, 'Cancelled')}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Fleet Machinery Management */}
          <h4 style={{ color: 'var(--primary-900)', marginBottom: '14px' }}>
            {isTe ? 'నమోదైన గ్రామ ట్రాక్టర్లు & యంత్రాలు' : 'Registered Community Machinery Inventory'}
          </h4>
          <div className="table-card">
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>{isTe ? 'ట్రాక్టర్' : 'Tractor Unit'}</th>
                    <th>{isTe ? 'యజమాని & ఫోన్' : 'Owner & Phone'}</th>
                    <th>{isTe ? 'గ్రామం' : 'Village Location'}</th>
                    <th>{isTe ? 'పరికరాలు' : 'Equipped Attachments'}</th>
                    <th>{isTe ? 'ధర / గంటకు' : 'Hourly Target'}</th>
                    <th>{isTe ? 'లభ్యత స్థితి' : 'Availability'}</th>
                    <th>{t.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {tractors.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={getAccurateTractorPhoto(t)}
                            alt={getTractorDisplayName(t)}
                            style={{ width: '45px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                            onError={(e) => { e.target.src = '/tractor1.jpeg'; }}
                          />
                          <div>
                            <strong>{getTractorDisplayName(t)}</strong>
                            <br />
                            <small style={{ color: '#b45309' }}>★ {t.rating || 4.8}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{t.owner}</strong>
                        <br />
                        <small style={{ color: 'var(--text-muted)' }}>📞 {t.mobile}</small>
                      </td>
                      <td>📍 {t.location}</td>
                      <td>
                        <small>{t.equipment}</small>
                      </td>
                      <td>
                        <strong>₹{t.pricing}</strong> / Hr
                      </td>
                      <td>
                        <button
                          className={`badge ${t.availability === 'Available' ? 'bg-success' : 'bg-warning'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          onClick={() => handleToggleTractorAvailability(t.id)}
                          title="Click to toggle availability"
                        >
                          ● {t.availability || 'Available'} (Toggle)
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-call"
                          style={{ background: '#d32f2f', padding: '5px 10px', fontSize: '12px' }}
                          onClick={() => handleDeleteTractor(t.id)}
                        >
                          {isTe ? 'తొలగించు' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
