import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { Bell, Send, Users, User, Info, Smartphone, CheckCircle, AlertCircle, History, Clock } from 'lucide-react';

const NotificationsPage = () => {
  const [target, setTarget] = useState<'all' | 'riders' | 'drivers' | 'id'>('all');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const resp = await api.get('/admin/notifications/history');
      setHistory(resp.data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSend = async () => {
    if (!title || !body) {
      setStatus({ type: 'error', message: 'Please provide both title and message body.' });
      return;
    }
    if (target === 'id' && !userId) {
      setStatus({ type: 'error', message: 'Please provide a valid User ID.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const resp = await api.post('/admin/notifications/send', {
        target: target === 'id' ? userId : target,
        title,
        body
      });
      
      if (resp.data.success) {
        setStatus({ type: 'success', message: `Successfully broadcasted to ${resp.data.count} users!` });
        setTitle('');
        setBody('');
        fetchHistory(); // Refresh history
      } else {
        setStatus({ type: 'error', message: resp.data.message || 'Failed to send notifications.' });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'An error occurred while sending notifications.' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1>Notification Command Center</h1>
        <p className="subtitle">Broadcast system updates or send direct push notifications to pilots and riders</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start', marginBottom: '40px' }}>
        {/* Composition Form */}
        <div className="glass-card" style={{ padding: '40px' }}>
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={20} color="var(--primary)" /> 1. Select Audience
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { id: 'all', label: 'Everyone', icon: <Users size={18} /> },
                { id: 'riders', label: 'All Riders', icon: <User size={18} /> },
                { id: 'drivers', label: 'All Pilots', icon: <Smartphone size={18} /> },
                { id: 'id', label: 'Specific ID', icon: <Info size={18} /> },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTarget(t.id as any)}
                  className={`btn ${target === t.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '15px 10px', height: 'auto', alignItems: 'center' }}
                >
                  {t.icon}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{t.label}</span>
                </button>
              ))}
            </div>

            {target === 'id' && (
              <div className="animate-fade-in" style={{ marginTop: '20px' }}>
                 <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Target User UUID</label>
                 <input 
                  type="text" 
                  className="search-input" 
                  placeholder="Paste user ID here..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  style={{ width: '100%', borderRadius: '12px' }}
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} color="var(--primary)" /> 2. Compose Message
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Headline / Title</label>
                <input 
                  type="text" 
                  className="search-input" 
                  placeholder="e.g. New System Update Available!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', borderRadius: '12px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Message Body</label>
                <textarea 
                  className="search-input" 
                  placeholder="Tell your users something important..."
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  style={{ width: '100%', borderRadius: '12px', resize: 'none', padding: '15px' }}
                />
              </div>
            </div>
          </div>

          {status && (
            <div 
              className="animate-fade-in" 
              style={{ 
                padding: '16px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '24px',
                background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
                color: status.type === 'success' ? 'var(--success)' : 'var(--danger)'
              }}
            >
              {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{status.message}</span>
            </div>
          )}

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', height: '56px', fontSize: '1.1rem' }}
            disabled={loading}
            onClick={handleSend}
          >
            {loading ? 'Processing Broadcast...' : (
              <>
                Deploy Notifications <Send size={20} style={{ marginLeft: '10px' }} />
              </>
            )}
          </button>
        </div>

        {/* Live Preview */}
        <div>
          <h3 style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Push Preview</h3>
          <div className="glass-card" style={{ 
            height: '600px', 
            borderRadius: '40px', 
            border: '8px solid #1a1a1e', 
            position: 'relative',
            background: 'url(https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=2070&auto=format&fit=crop) center/cover',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: '20px'
          }}>
            <div style={{ 
              width: '100px', 
              height: '25px', 
              background: '#000', 
              borderRadius: '0 0 15px 15px', 
              margin: '-20px auto 30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{ width: '40px', height: '4px', background: '#333', borderRadius: '2px' }} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '3rem', fontWeight: 200, color: 'white' }}>11:47</h2>
              <p style={{ fontSize: '0.8rem', color: 'white', opacity: 0.8 }}>Tuesday, April 7</p>
            </div>

            {(title || body) && (
              <div className="animate-fade-in" style={{ 
                background: 'rgba(255, 255, 255, 0.1)', 
                backdropFilter: 'blur(20px)',
                borderRadius: '18px',
                padding: '16px',
                boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={12} color="white" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>RIDE ANDHRA</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'white', opacity: 0.6 }}>now</span>
                </div>
                <h4 style={{ fontSize: '0.9rem', color: 'white', fontWeight: 700, marginBottom: '2px' }}>{title || 'Notification Title'}</h4>
                <p style={{ fontSize: '0.85rem', color: 'white', opacity: 0.8, lineHeight: '1.3' }}>{body || 'Your message preview will appear here as you type in the editor...'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Broadcasting History */}
      <div className="glass-card" style={{ padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="var(--primary)" /> 3. Recent Admin Broadcasts
          </h3>
          <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={fetchHistory}>
            Refresh Logs
          </button>
        </div>

        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }} className="animate-pulse">
            Retrieving historical records...
          </div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DISPATCH TIME</th>
                  <th style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>HEADLINE</th>
                  <th style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PREVIEW</th>
                  <th style={{ padding: '12px 10px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>AUDIENCE</th>
                </tr>
              </thead>
              <tbody>
                {history.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px 10px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="var(--text-muted)" /> {formatDate(log.n_created_at || log.created_at)}
                      </span>
                    </td>
                    <td style={{ padding: '15px 10px', fontSize: '0.85rem', fontWeight: 700 }}>{log.n_title || log.title}</td>
                    <td style={{ padding: '15px 10px', fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.n_message || log.message}
                    </td>
                    <td style={{ padding: '15px 10px' }}>
                      <span style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: 'var(--primary)', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem', 
                        fontWeight: 700,
                        textTransform: 'uppercase'
                      }}>
                        {log.n_type || log.type}
                      </span>
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      No broadcast history found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
