export default function StatCard({ title, value, icon, color = '#2e7d32', subtitle }) {
  return (
    <div className="stat-card" style={{ borderLeft: `5px solid ${color}` }}>
      {icon && (
        <div className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
      )}
      <div>
        <h3>{value}</h3>
        <p>{title}</p>
        {subtitle && <small style={{ color: '#94a3b8', fontSize: '12px' }}>{subtitle}</small>}
      </div>
    </div>
  );
}
