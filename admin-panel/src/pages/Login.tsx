import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

import logoImg from '../assets/logo.png';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const resp = await api.post('/auth/login-admin', { phoneNumber: phone, password });
      const { accessToken } = resp.data;
      
      localStorage.setItem('admin_token', accessToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container" style={{ justifyContent: 'center', alignItems: 'center', background: 'radial-gradient(circle at top right, #1a1a1c, #000)' }}>
      <div className="glass-card animate-fade-in" style={{ padding: '40px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', textAlign: 'center' }}>
        <div style={{ marginBottom: '24px' }}>
          <img 
            src={logoImg} 
            alt="Challo Logo" 
            style={{ width: '80px', height: '80px', borderRadius: '20px', margin: '0 auto 12px auto', display: 'block', boxShadow: '0 8px 24px rgba(229,169,21,0.3)' }} 
          />
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '2px', margin: 0 }}>CHALLO</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>Command Center</p>
        </div>

        {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Mobile Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="91XXXXXXXXXX"
              style={{
                width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)',
                borderRadius: '8px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              className="login-input"
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Secret Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)',
                borderRadius: '8px', color: 'white', fontSize: '1rem', outline: 'none', transition: 'border-color 0.2s'
              }}
              className="login-input"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Enter Dashboard'}
          </button>
        </form>

        <p style={{ marginTop: '20px', color: '#444', fontSize: '0.75rem', textAlign: 'center' }}>
          Restricted access. All login attempts are logged and monitored.
        </p>
      </div>
    </div>
  );
};

export default Login;
