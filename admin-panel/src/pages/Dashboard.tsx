import { useEffect, useState } from 'react';
import api from '../api/api';
import { Users, Car, Map, ShieldAlert, Activity, Server, Database } from 'lucide-react';
import ControlPanel from '../components/ControlPanel';

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const resp = await api.get('/admin/stats');
        setStats(resp.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Synchronizing with command center...</div>
    </div>
  );

  const cardData = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: <Users size={24} />, color: '#3B82F6' },
    { label: 'Active Drivers', value: stats?.totalDrivers || 0, icon: <Car size={24} />, color: '#10B981' },
    { label: 'Live Rides', value: stats?.activeRides || 0, icon: <Map size={24} />, color: '#F59E0B' },
    { label: 'Pending Verifications', value: stats?.pendingDrivers || 0, icon: <ShieldAlert size={24} />, color: '#EF4444' },
  ];

  return (
    <div className="animate-fade-in">
      <h1>Dashboard Overview</h1>
      <p className="subtitle">Real-time system health and driver logistics</p>

      <div className="stats-grid">
        {cardData.map((card, i) => (
          <div key={i} className="glass-card stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div style={{ color: card.color, marginBottom: '10px' }}>{card.icon}</div>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Activity color="var(--success)" size={24} />
            <h3 style={{ marginBottom: 0 }}>System Infrastructure</h3>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} color="var(--text-muted)" />
                <span>Backend API</span>
              </div>
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Operational • 45ms</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Database size={18} color="var(--text-muted)" />
                <span>Primary Database</span>
              </div>
              <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>Connected • 99.9% Uptime</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={18} color="var(--warning)" />
                <span>SSL Certificates</span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Expires in 184 days</span>
            </div>
          </div>
        </div>

        <ControlPanel />
      </div>
    </div>
  );
};

export default Dashboard;

