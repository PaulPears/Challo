import { useState } from 'react';
import { ShieldPlus, Zap } from 'lucide-react';
import api from '../api/api';

const ControlPanel = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMakeAdmin = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const resp = await api.post('/admin/make-admin', { phoneNumber: phone });
      alert(resp.data.message);
      setPhone('');
    } catch (err) {
      alert('Action failed. Ensure phone number exists.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '30px', marginTop: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <ShieldPlus color="var(--primary)" size={24} />
        <h3 style={{ marginBottom: 0 }}>Administrative Controls</h3>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
            Elevate a user to Admin status. They will gain full access to this panel.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              className="search-input" 
              style={{ paddingLeft: '16px' }} 
              placeholder="User Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button 
              className="btn btn-primary" 
              disabled={loading}
              onClick={handleMakeAdmin}
              style={{ whiteSpace: 'nowrap' }}
            >
              {loading ? 'Processing...' : 'Grant Admin'}
            </button>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '30px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '15px' }}>
            Quick System Overrides
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button className="btn btn-outline" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              <Zap size={16} /> Force Surge
            </button>
            <button className="btn btn-outline" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
              Disable Signups
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '8px' }}>
            * Overrides are currently in development
          </p>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
