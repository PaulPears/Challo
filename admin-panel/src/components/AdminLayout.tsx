import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, LogOut, Users, Bell, Banknote, Navigation, Tag, UserCheck } from 'lucide-react';

import logoImg from '../assets/logo.png';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Live Rides', path: '/rides', icon: <Navigation size={20} /> },
    { label: 'Manage Pilots', path: '/drivers', icon: <Users size={20} /> },
    { label: 'Riders & Users', path: '/riders', icon: <UserCheck size={20} /> },
    { label: 'Fare Matrix', path: '/fares', icon: <Tag size={20} /> },
    { label: 'Verifications', path: '/verification', icon: <ShieldCheck size={20} /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
    { label: 'Financials', path: '/finance', icon: <Banknote size={20} /> },
  ];

  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={logoImg} 
            alt="Challo Logo" 
            style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 12px rgba(229,169,21,0.25)' }} 
          />
          <div>
            <h2 style={{ color: 'var(--primary)', letterSpacing: '1.5px', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>CHALLO</h2>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>Command Center</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none', borderRadius: '8px', marginBottom: '8px',
                background: location.pathname === item.path ? 'rgba(254, 112, 9, 0.05)' : 'transparent'
              }}
            >
              {item.icon}
              <span style={{ fontWeight: 600 }}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
            color: '#999', background: 'transparent', border: 'none', width: '100%'
          }}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
