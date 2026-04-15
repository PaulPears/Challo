import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, LogOut, Users, Bell, Banknote } from 'lucide-react';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    window.location.href = '/login';
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Verifications', path: '/verification', icon: <ShieldCheck size={20} /> },
    { label: 'Manage Pilots', path: '/drivers', icon: <Users size={20} /> },
    { label: 'Notifications', path: '/notifications', icon: <Bell size={20} /> },
    { label: 'Financials', path: '/finance', icon: <Banknote size={20} /> },
  ];




  return (
    <div className="admin-container">
      <aside className="sidebar">
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '1px' }}>ADMIN Portal</h2>
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
