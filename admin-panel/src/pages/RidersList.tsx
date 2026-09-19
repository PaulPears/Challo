import { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import { Users, Search, ChevronLeft, ChevronRight, Smartphone, Calendar, UserCheck, Shield } from 'lucide-react';

const RidersList = () => {
  const [riders, setRiders] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 12, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRiders = useCallback(async (query = '', page = 1) => {
    setLoading(true);
    try {
      const resp = await api.get('/admin/riders/search', {
        params: { q: query, page, limit: 12 }
      });
      setRiders(resp.data.items || []);
      setMeta(resp.data.meta || { total: 0, page: 1, limit: 12, totalPages: 0 });
    } catch (err) {
      console.error('Fetch riders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiders(searchQuery, 1);
  }, [fetchRiders, searchQuery]);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users style={{ color: 'var(--primary)' }} />
            Riders & Customers Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Manage registered platform riders, account status, and phone credentials ({meta.total} registered).
          </p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 42px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              fontSize: '0.9rem',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px', width: '36px', height: '36px', border: '3px solid rgba(229,169,21,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading riders...
        </div>
      ) : riders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <Users size={48} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px' }}>No Riders Found</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            {searchQuery ? `No riders match "${searchQuery}".` : 'No registered riders yet.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {riders.map((rider) => (
              <div
                key={rider.id}
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #FFE082, #FFA000)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#1a1a1a',
                      fontWeight: 800,
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 10px rgba(255,160,0,0.3)'
                    }}
                  >
                    {(rider.name || rider.phone_number || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rider.name || 'Anonymous Rider'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Smartphone size={14} />
                      <span>{rider.phone_number}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} />
                    <span>Joined {new Date(rider.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(76, 175, 80, 0.1)', color: '#4CAF50', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    <UserCheck size={12} />
                    <span>Active Rider</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '30px' }}>
              <button
                disabled={meta.page <= 1}
                onClick={() => fetchRiders(searchQuery, meta.page - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: meta.page <= 1 ? 0.5 : 1, color: 'var(--text-main)'
                }}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                disabled={meta.page >= meta.totalPages}
                onClick={() => fetchRiders(searchQuery, meta.page + 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '8px', cursor: meta.page >= meta.totalPages ? 'not-allowed' : 'pointer',
                  opacity: meta.page >= meta.totalPages ? 0.5 : 1, color: 'var(--text-main)'
                }}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RidersList;
