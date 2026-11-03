import { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { translations } from '../translations';
import { getAccurateTractorPhoto, getTractorDisplayName } from './FindTractor';
import { getRegisteredFarmers, getRegisteredOwners, deleteRegisteredFarmer, deleteRegisteredOwner, syncUserDataWithPostgres } from '../data/userData';
import { checkBackendHealth } from '../api/apiClient';

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
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'fleet', or 'database'
  const [farmersList, setFarmersList] = useState(() => getRegisteredFarmers());
  const [ownersList, setOwnersList] = useState(() => getRegisteredOwners());
  const [dbSearch, setDbSearch] = useState('');
  const [dbSubTab, setDbSubTab] = useState('farmers'); // 'farmers' or 'owners'
  const [dbNotice, setDbNotice] = useState('');
  const [pgStatus, setPgStatus] = useState(null);

  useEffect(() => {
    checkBackendHealth().then((status) => setPgStatus(status));
  }, [activeTab]);

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
          <button
            className={`filter-pill ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('database');
              setFarmersList(getRegisteredFarmers());
              setOwnersList(getRegisteredOwners());
            }}
          >
            👥 {isTe ? 'వినియోగదారుల డేటాబేస్' : 'Registered Users Database'} ({farmersList.length + ownersList.length})
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

      {activeTab === 'bookings' && (
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
      )}

      {activeTab === 'fleet' && (
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

      {/* ====================================================
          TAB 3: REGISTERED USERS DATABASE INSPECTOR
         ==================================================== */}
      {activeTab === 'database' && (
        <div className="page-anim">
          {/* Header & Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ color: 'var(--primary-900)', margin: 0 }}>
                  {isTe ? 'అగ్రిరెంట్ వినియోగదారుల డేటాబేస్' : 'AgriRent Database'}
                </h4>
                {pgStatus === true ? (
                  <span className="badge bg-success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }}></span>
                    PostgreSQL Live (tractor_rental_db)
                  </span>
                ) : (
                  <span className="badge bg-warning" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: '#f59e0b', color: '#fff' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
                    Browser Storage Mode
                  </span>
                )}
              </div>
              <small style={{ color: 'var(--text-muted)' }}>
                {pgStatus === true
                  ? 'Connected to local PostgreSQL database on port 5432. All updates sync directly to PostgreSQL.'
                  : 'PostgreSQL Server offline. Start backend with `npm run server` to link PostgreSQL directly.'}
              </small>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={async () => {
                  setDbNotice(isTe ? 'PostgreSQL తో సమన్వయం చేస్తోంది...' : 'Syncing with PostgreSQL...');
                  const res = await syncUserDataWithPostgres();
                  setFarmersList(getRegisteredFarmers());
                  setOwnersList(getRegisteredOwners());
                  const health = await checkBackendHealth();
                  setPgStatus(health);
                  if (res.success && health) {
                    setDbNotice(`✓ Synced with PostgreSQL: ${res.farmersCount} Farmers, ${res.ownersCount} Owners.`);
                  } else {
                    setDbNotice('ℹ️ Synced with local storage. Start backend with "npm run server" for PostgreSQL live connection.');
                  }
                  setTimeout(() => setDbNotice(''), 4000);
                }}
              >
                ⚡ {isTe ? 'PostgreSQL సమన్వయం' : 'Sync PostgreSQL'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => {
                  setFarmersList(getRegisteredFarmers());
                  setOwnersList(getRegisteredOwners());
                  setDbNotice(isTe ? '✓ డేటాబేస్ రిఫ్రెష్ చేయబడింది!' : '✓ Database refreshed!');
                  setTimeout(() => setDbNotice(''), 3000);
                }}
              >
                🔄 {isTe ? 'రిఫ్రెష్' : 'Refresh'}
              </button>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '13px', padding: '6px 12px' }}
                onClick={() => {
                  const dump = {
                    farmers: getRegisteredFarmers(),
                    owners: getRegisteredOwners(),
                    exportedAt: new Date().toISOString()
                  };
                  navigator.clipboard?.writeText(JSON.stringify(dump, null, 2));
                  setDbNotice(isTe ? '✓ డేటాబేస్ JSON కాపీ చేయబడింది!' : '✓ Full Database JSON copied to clipboard!');
                  setTimeout(() => setDbNotice(''), 3000);
                }}
              >
                📋 {isTe ? 'JSON కాపీ చేయండి' : 'Copy JSON'}
              </button>
            </div>
          </div>

          {dbNotice && (
            <div style={{ padding: '8px 14px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', color: '#1b5e20', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
              {dbNotice}
            </div>
          )}

          {/* Quick Search Tool */}
          <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              type="text"
              placeholder={isTe ? "మొబైల్ నంబర్ లేదా పేరుతో శోధించండి (ఉదా: 1234567890, Kondal, Ramesh)..." : "Search database by phone number or name (e.g. 1234567890, Kondal, Ramesh)..."}
              value={dbSearch}
              onChange={(e) => setDbSearch(e.target.value)}
              style={{ flex: 1, minWidth: '240px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
            />
            {dbSearch && (
              <button
                className="btn"
                style={{ padding: '4px 10px', fontSize: '12px', background: '#64748b', color: '#fff' }}
                onClick={() => setDbSearch('')}
              >
                ✕ {isTe ? 'క్లియర్' : 'Clear'}
              </button>
            )}
          </div>

          {/* Sub-tabs: Farmers vs Owners */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
              className={`role-btn ${dbSubTab === 'farmers' ? 'active' : ''}`}
              onClick={() => setDbSubTab('farmers')}
              style={{ fontSize: '13px', padding: '7px 16px' }}
            >
              🌾 {isTe ? 'రైతులు' : 'Registered Farmers'} ({farmersList.length})
            </button>
            <button
              className={`role-btn ${dbSubTab === 'owners' ? 'active' : ''}`}
              onClick={() => setDbSubTab('owners')}
              style={{ fontSize: '13px', padding: '7px 16px' }}
            >
              🚜 {isTe ? 'వాహన యజమానులు' : 'Registered Vehicle Owners'} ({ownersList.length})
            </button>
          </div>

          {/* Table 1: Farmers */}
          {dbSubTab === 'farmers' && (
            <div className="table-card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{isTe ? 'రైతు పేరు' : 'Farmer Name'}</th>
                      <th>{isTe ? 'మొబైల్ నంబర్' : 'Mobile Number'}</th>
                      <th>{isTe ? 'గ్రామం & జిల్లా' : 'Village & District'}</th>
                      <th>{isTe ? 'భూమి (ఎకరాలు)' : 'Land Area'}</th>
                      <th>{isTe ? 'స్థితి' : 'Status'}</th>
                      <th>{isTe ? 'నమోదు తేదీ' : 'Registered At'}</th>
                      <th>{isTe ? 'చర్య' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmersList
                      .filter(f => {
                        if (!dbSearch) return true;
                        const q = dbSearch.toLowerCase();
                        return (
                          (f.name || '').toLowerCase().includes(q) ||
                          (f.mobile || '').includes(q) ||
                          (f.village || '').toLowerCase().includes(q)
                        );
                      })
                      .map((f, idx) => (
                        <tr key={f.mobile || idx} style={dbSearch && (f.mobile || '').includes(dbSearch) ? { background: '#fef3c7' } : {}}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>
                            <strong>{f.name || 'Unnamed Farmer'}</strong>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-700)', fontFamily: 'monospace', fontSize: '14px' }}>
                              +91 {f.mobile}
                            </strong>
                          </td>
                          <td>
                            {f.village || 'N/A'}{f.district ? `, ${f.district}` : ''}
                          </td>
                          <td>
                            {f.landArea ? `${f.landArea} ${isTe ? 'ఎకరాలు' : 'Acres'}` : 'N/A'}
                          </td>
                          <td>
                            <span className="badge bg-success" style={{ fontSize: '11px' }}>
                              ✓ {f.isVerified ? 'Verified' : 'Active'}
                            </span>
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {f.registeredAt || 'Seed Data'}
                          </td>
                          <td>
                            <button
                              className="btn btn-call"
                              style={{ background: '#d32f2f', padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                if (window.confirm(isTe ? `రైతు ${f.name} (+91 ${f.mobile}) ఖాతాను శాశ్వతంగా తొలగించాలా?` : `Permanently delete farmer ${f.name} (+91 ${f.mobile})?`)) {
                                  deleteRegisteredFarmer(f.mobile);
                                  setFarmersList(getRegisteredFarmers());
                                  setDbNotice(isTe ? `రైతు ${f.name} తొలగించబడ్డారు.` : `Farmer ${f.name} deleted.`);
                                  setTimeout(() => setDbNotice(''), 3000);
                                }
                              }}
                            >
                              🗑️ {isTe ? 'తొలగించు' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    {farmersList.filter(f => {
                      if (!dbSearch) return true;
                      const q = dbSearch.toLowerCase();
                      return (
                        (f.name || '').toLowerCase().includes(q) ||
                        (f.mobile || '').includes(q) ||
                        (f.village || '').toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center" style={{ padding: '30px' }}>
                          {isTe ? `"${dbSearch}" తో సరిపోలే రైతులు ఎవరూ లేరు.` : `No registered farmers match "${dbSearch}".`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Table 2: Owners */}
          {dbSubTab === 'owners' && (
            <div className="table-card">
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{isTe ? 'యజమాని పేరు' : 'Owner / Captain'}</th>
                      <th>{isTe ? 'మొబైల్ నంబర్' : 'Mobile Number'}</th>
                      <th>{isTe ? 'వాహనం & మోడల్' : 'Vehicle & Model'}</th>
                      <th>{isTe ? 'RC నంబర్' : 'RC Number'}</th>
                      <th>{isTe ? 'గ్రామం' : 'Village'}</th>
                      <th>{isTe ? 'ధర / గంటకు' : 'Hourly Rate'}</th>
                      <th>{isTe ? 'చర్య' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownersList
                      .filter(o => {
                        if (!dbSearch) return true;
                        const q = dbSearch.toLowerCase();
                        return (
                          (o.fullName || o.owner || '').toLowerCase().includes(q) ||
                          (o.mobile || '').includes(q) ||
                          (o.tractorModel || o.vehicleType || '').toLowerCase().includes(q) ||
                          (o.rcNumber || o.vehicleNumber || '').toLowerCase().includes(q)
                        );
                      })
                      .map((o, idx) => (
                        <tr key={o.mobile || idx} style={dbSearch && (o.mobile || '').includes(dbSearch) ? { background: '#fef3c7' } : {}}>
                          <td><strong>{idx + 1}</strong></td>
                          <td>
                            <strong>{o.fullName || o.owner || 'Unnamed Owner'}</strong>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--primary-700)', fontFamily: 'monospace', fontSize: '14px' }}>
                              +91 {o.mobile}
                            </strong>
                          </td>
                          <td>
                            <strong>{o.tractorModel || o.vehicleType || 'Tractor'}</strong>
                          </td>
                          <td>
                            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                              {o.rcNumber || o.vehicleNumber || 'TS 04 AB 1234'}
                            </code>
                          </td>
                          <td>{o.village || 'N/A'}</td>
                          <td><strong>₹{o.pricing || 1200}</strong> / hr</td>
                          <td>
                            <button
                              className="btn btn-call"
                              style={{ background: '#d32f2f', padding: '4px 8px', fontSize: '11px' }}
                              onClick={() => {
                                if (window.confirm(isTe ? `యజమాని ${o.fullName || o.owner} (+91 ${o.mobile}) ఖాతాను శాశ్వతంగా తొలగించాలా?` : `Permanently delete vehicle owner ${o.fullName || o.owner} (+91 ${o.mobile})?`)) {
                                  deleteRegisteredOwner(o.mobile);
                                  setOwnersList(getRegisteredOwners());
                                  setDbNotice(isTe ? `యజమాని ఖాతా తొలగించబడింది.` : `Owner account deleted.`);
                                  setTimeout(() => setDbNotice(''), 3000);
                                }
                              }}
                            >
                              🗑️ {isTe ? 'తొలగించు' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    {ownersList.filter(o => {
                      if (!dbSearch) return true;
                      const q = dbSearch.toLowerCase();
                      return (
                        (o.fullName || o.owner || '').toLowerCase().includes(q) ||
                        (o.mobile || '').includes(q) ||
                        (o.tractorModel || o.vehicleType || '').toLowerCase().includes(q) ||
                        (o.rcNumber || o.vehicleNumber || '').toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan="8" className="text-center" style={{ padding: '30px' }}>
                          {isTe ? `"${dbSearch}" తో సరిపోలే యజమానులు ఎవరూ లేరు.` : `No registered vehicle owners match "${dbSearch}".`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
