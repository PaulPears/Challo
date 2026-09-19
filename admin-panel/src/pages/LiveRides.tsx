import { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { Car, RefreshCw, Clock, MapPin, User, Shield, AlertCircle } from 'lucide-react';

interface RideItem {
  id: string;
  status: string;
  vehicle_type: string;
  pickup_address: string;
  dropoff_address: string;
  final_fare?: number;
  estimated_fare?: number;
  otp?: string;
  created_at: string;
  rider?: { name: string; phone_number: string };
  driver?: { name: string; phone_number: string; vehicle_plate_number: string };
}

const LiveRides = () => {
  const [rides, setRides] = useState<RideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchRides = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch latest rides from backend
      const resp = await api.get('/admin/finance/reports?page=1&limit=50');
      if (resp.data?.recentRides?.items) {
        setRides(resp.data.recentRides.items);
      }
    } catch (err) {
      console.error('Failed to fetch rides:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  // Auto-refresh every 15 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchRides();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchRides]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
        return { bg: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '#22c55e' };
      case 'SEARCHING':
      case 'PENDING':
        return { bg: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '#eab308' };
      case 'COMPLETED':
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '#3b82f6' };
      case 'CANCELLED':
        return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '#ef4444' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '#94a3b8' };
    }
  };

  const filteredRides = statusFilter === 'ALL'
    ? rides
    : rides.filter(r => r.status?.toUpperCase() === statusFilter);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Live Rides Monitoring</h1>
          <p className="subtitle">Real-time trip tracking, passenger assignments, and trip telemetry</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ fontSize: '0.85rem', color: autoRefresh ? 'var(--success)' : 'var(--text-muted)' }}
          >
            <Clock size={16} /> {autoRefresh ? 'Live Sync ON' : 'Live Sync OFF'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => fetchRides()}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['ALL', 'COMPLETED', 'ACCEPTED', 'SEARCHING', 'CANCELLED'].map((filter) => (
          <button
            key={filter}
            className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setStatusFilter(filter)}
            style={{ fontSize: '0.85rem' }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Rides Grid */}
      {filteredRides.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center' }}>
          <Car size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
          <h3>No rides found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {statusFilter === 'ALL' ? 'No trip records exist on this server yet.' : `No trips currently in ${statusFilter} state.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {filteredRides.map((ride) => {
            const badge = getStatusBadge(ride.status);
            return (
              <div key={ride.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    ID: {ride.id?.slice(0, 8)}...
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`
                  }}>
                    {ride.status || 'COMPLETED'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--glass-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Car size={20} color="var(--primary)" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, textTransform: 'capitalize' }}>{ride.vehicle_type || 'Ride'}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                      ₹{Number(ride.final_fare || ride.estimated_fare || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Pickup & Dropoff */}
                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <MapPin size={14} color="#22c55e" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-muted)' }} numberOfLines={1}>
                      {ride.pickup_address || 'Pickup location'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <MapPin size={14} color="#ef4444" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ color: 'white' }} numberOfLines={1}>
                      {ride.dropoff_address || 'Dropoff destination'}
                    </span>
                  </div>
                </div>

                {/* Rider & Driver info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={14} /> Rider: <strong style={{ color: 'white' }}>{ride.rider?.name || (ride as any).rider_name || 'Passenger'}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={14} /> Driver: <strong style={{ color: 'white' }}>{ride.driver?.name || (ride as any).driver_name || 'Pilot'}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveRides;
