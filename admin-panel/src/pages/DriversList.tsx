import { useEffect, useState, useCallback } from 'react';
import api from '../api/api';
import { Users, Search, ChevronLeft, ChevronRight, X, Smartphone, Check, ShieldAlert, Star } from 'lucide-react';
import DriverCard from '../components/DriverCard';
import SearchBar from '../components/SearchBar';
import ReviewList from '../components/ReviewList';

const DriversList = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [meta, setMeta] = useState<any>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'special'>('all');

  const fetchDrivers = useCallback(async (query = '', page = 1, mode = 'all') => {
    setLoading(true);
    try {
      let endpoint = '/admin/drivers/search';
      if (mode === 'grace') endpoint = '/admin/drivers/grace-period';
      if (mode === 'special') endpoint = '/admin/drivers/special-access';

      const resp = await api.get(endpoint, {
        params: { q: query, page, limit: 12 }
      });
      
      // If special/grace endpoints don't return pagination meta, mock it
      if (mode !== 'all') {
        setDrivers(resp.data);
        setMeta({ total: resp.data.length, page: 1, limit: 50, totalPages: 1 });
      } else {
        setDrivers(resp.data.items);
        setMeta(resp.data.meta);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReviews = async (userId: string) => {
    setLoadingReviews(true);
    try {
      const resp = await api.get(`/admin/drivers/${userId}/reviews`);
      setReviews(resp.data);
    } catch (err) {
      console.error('Reviews fetch error:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleInspect = (driver: any) => {
    setSelectedDriver(driver);
    fetchReviews(driver.user_id);
  };

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDrivers(searchQuery, 1, viewMode);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery, viewMode, fetchDrivers]);

  const handleStatusUpdate = async (userId: string, action: 'suspend' | 'activate') => {
    const confirmMsg = action === 'suspend' 
      ? 'Are you sure you want to BLOCK this driver? They will not be able to accept rides.' 
      : 'Unlock this driver?';
    
    if (!confirm(confirmMsg)) return;

    try {
      await api.patch(`/admin/drivers/${userId}/${action}`);
      // Refresh current page
      fetchDrivers(searchQuery, meta.page, viewMode);
      if (selectedDriver?.user_id === userId) {
        setSelectedDriver({ ...selectedDriver, status: action === 'suspend' ? 'suspended' : 'active' });
      }
    } catch (err) {
      alert('Status update failed');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > meta.totalPages) return;
    fetchDrivers(searchQuery, newPage);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Pilot Management</h1>
          <p className="subtitle">Search, monitor, and control all registered drivers</p>
        </div>
        <div className="glass-card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="var(--primary)" />
          <span style={{ fontWeight: 700 }}>{meta.total}</span> Registered Pilots
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button 
          className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setViewMode('all')}
        >
          All Pilots
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search by ID, Name or Phone..." 
          />
        </div>
        
        {/* Pagination Controls */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '6px', gap: '4px' }}>
          <button 
            className="btn btn-outline" 
            style={{ padding: '6px', borderRadius: '8px' }}
            disabled={meta.page <= 1}
            onClick={() => handlePageChange(meta.page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ padding: '0 12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Page {meta.page} of {meta.totalPages || 1}
          </span>
          <button 
            className="btn btn-outline" 
            style={{ padding: '6px', borderRadius: '8px' }}
            disabled={meta.page >= meta.totalPages}
            onClick={() => handlePageChange(meta.page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Querying pilot database...</div>
        </div>
      ) : (
        <div className="grid-container">
          {drivers.map((driver) => (
            <DriverCard 
              key={driver.user_id} 
              driver={driver} 
              onInspect={handleInspect}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
          
          {drivers.length === 0 && (
            <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
              <Search size={48} style={{ color: 'var(--glass-accent)', marginBottom: '16px' }} />
              <h3 style={{ color: 'var(--text-muted)' }}>No pilots found</h3>
              <p style={{ color: 'var(--text-muted)' }}>Try a different search term or check the user ID.</p>
            </div>
          )}
        </div>
      )}

      {/* Inspection Modal */}
      {selectedDriver && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="glass-card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ background: '#0D0D0E', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Pilot Profile</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive data for <strong>{selectedDriver.user?.name}</strong></p>
              </div>
              <button 
                className="btn btn-outline" 
                style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                onClick={() => setSelectedDriver(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 0.4fr) 1fr', gap: '40px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ overflow: 'hidden', padding: '15px' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Identity Image</p>
                   <img 
                    src={selectedDriver.user?.profile_image || 'https://placehold.co/600x400/111/444?text=No+Photo'} 
                    className="doc-img" 
                    style={{ cursor: 'default' }}
                  />
                </div>
                
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UUID</label>
                    <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedDriver.user_id}</p>
                   </div>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</label>
                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={14} color="var(--primary)" /> {selectedDriver.user?.phone_number}</p>
                   </div>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Rating</label>
                    <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Star size={16} fill="var(--warning)" color="var(--warning)" /> {selectedDriver.driver_rating || '5.0'}
                    </p>
                   </div>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Account Status</label>
                    <p style={{ fontWeight: 700, color: selectedDriver.status === 'active' ? 'var(--success)' : 'var(--danger)' }}>
                      {selectedDriver.status.toUpperCase()}
                    </p>
                   </div>
                </div>
              </div>

              <div>
                <h4 style={{ marginBottom: '20px' }}>Vehicle & Performance</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div className="glass-card" style={{ padding: '15px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle Plate</p>
                    <p style={{ fontWeight: 600 }}>{selectedDriver.vehicle_plate_number}</p>
                  </div>
                  <div className="glass-card" style={{ padding: '15px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Rides</p>
                    <p style={{ fontWeight: 600 }}>{selectedDriver.total_rides || 0}</p>
                  </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '16px', fontSize: '1rem' }}>Rider Feedback (Last 20)</h4>
                  <div className="glass-card" style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                    <ReviewList reviews={reviews} loading={loadingReviews} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                  {selectedDriver.status === 'suspended' ? (
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, backgroundColor: 'var(--success)', height: '50px' }}
                      onClick={() => handleStatusUpdate(selectedDriver.user_id, 'activate')}
                    >
                      <Check size={20} /> Unlock Account
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)', height: '50px' }}
                      onClick={() => handleStatusUpdate(selectedDriver.user_id, 'suspend')}
                    >
                      <ShieldAlert size={20} /> Suspend Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriversList;
