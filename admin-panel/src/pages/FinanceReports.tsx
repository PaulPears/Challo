import { useState, useEffect } from 'react';
import api from '../api/api';
import { IndianRupee, MapPin, Receipt, Wallet, Activity, CreditCard } from 'lucide-react';

const FinanceReports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: {
      totalRideRevenue: 0,
      rideTaxTotal: 0,
      totalSubscriptionRevenue: 0,
      subscriptionTaxTotal: 0,
      totalSubscriptionsSold: 0
    },
    recentRides: {
      items: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
      }
    }
  });
  
  const [currentPage, setCurrentPage] = useState(1);

  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/finance/reports?page=${page}&limit=10`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to load financial reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < data.recentRides.meta.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const formatDate = (dateStr: string) => {
     if (!dateStr) return 'N/A';
     return new Date(dateStr).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
     });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1>Financial & Tax Reporting</h1>
        <p className="subtitle">Track revenue, subscriptions, and automatically calculated taxes.</p>
      </div>

      {loading && data.recentRides.items.length === 0 ? (
        <div className="animate-pulse" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '20px' }}>
          <div className="glass-card" style={{ height: '300px' }}></div>
        </div>
      ) : (
        <>
          {/* Revenue Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
            <div className="glass-card stat-card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(0,0,0,0))' }}>
              <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)' }}>
                <Activity size={24} />
              </div>
              <div>
                <p className="stat-label">Total Valid Rides Revenue</p>
                <h3 className="stat-value" style={{ color: 'var(--success)' }}>{formatCurrency(data.overview.totalRideRevenue)}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   Ride Tax (5% cut): <strong style={{ color: 'white' }}>{formatCurrency(data.overview.rideTaxTotal)}</strong>
                </p>
              </div>
            </div>

            <div className="glass-card stat-card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(0,0,0,0))' }}>
              <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary)' }}>
                <Wallet size={24} />
              </div>
              <div>
                <p className="stat-label">Subscription Sales</p>
                <h3 className="stat-value" style={{ color: 'var(--primary)' }}>{formatCurrency(data.overview.totalSubscriptionRevenue)}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                   Subscription Tax (18% cut): <strong style={{ color: 'white' }}>{formatCurrency(data.overview.subscriptionTaxTotal)}</strong>
                </p>
              </div>
            </div>

            <div className="glass-card stat-card" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(0,0,0,0))' }}>
              <div className="stat-icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <p className="stat-label">Subscriptions Sold</p>
                <h3 className="stat-value" style={{ color: '#a855f7' }}>{data.overview.totalSubscriptionsSold} <span style={{fontSize: '1rem'}}>pilots</span></h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                   Total active & historical passes
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px' }}>
             <div className="glass-card" style={{ background: 'rgba(20, 20, 24, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
                 <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><IndianRupee size={20} color="var(--success)" /> Platform Earnings (Taxes Only)</h4>
                 <h2 style={{ fontSize: '3rem', fontWeight: 200, color: 'white', marginBottom: '4px' }}>{formatCurrency(data.overview.rideTaxTotal + data.overview.subscriptionTaxTotal)}</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Net Revenue retained by platform</p>
             </div>
             
             <div className="glass-card" style={{ background: 'rgba(20, 20, 24, 0.6)', border: '1px solid rgba(255,255,255,0.05)', padding: '24px' }}>
                 <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Receipt size={20} color="var(--primary)" /> Total Platform Volume</h4>
                 <h2 style={{ fontSize: '3rem', fontWeight: 200, color: 'white', marginBottom: '4px' }}>{formatCurrency(data.overview.totalRideRevenue + data.overview.totalSubscriptionRevenue)}</h2>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gross Merchandise Value (GMV)</p>
             </div>
          </div>

          {/* Ride Tax List Table */}
          <div className="glass-card" style={{ padding: '0px', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MapPin size={20} color="var(--primary)" /> Ride Ledger
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                 <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {data.recentRides.meta.page} of {data.recentRides.meta.totalPages || 1}</span>
                 <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handlePrevPage} disabled={currentPage === 1}>Prev</button>
                 <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleNextPage} disabled={currentPage === data.recentRides.meta.totalPages || data.recentRides.meta.totalPages === 0}>Next</button>
              </div>
            </div>

            <div className="table-responsive" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Time Completed</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Rider / Pilot</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Vehicle</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Fare</th>
                    <th style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600, textTransform: 'uppercase' }}>Platform Tax (5%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentRides.items.map((ride: any) => (
                    <tr key={ride.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '16px 24px', fontSize: '0.9rem' }}>
                        {formatDate(ride.completed_at)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{ride.rider_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>via {ride.driver_name}</div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span className={`status-badge ${ride.vehicle_type}`}>{String(ride.vehicle_type).toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 600 }}>
                        {formatCurrency(ride.final_fare)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '0.95rem', fontWeight: 800, color: 'var(--success)' }}>
                        {formatCurrency(ride.tax_amount)}
                      </td>
                    </tr>
                  ))}
                  {data.recentRides.items.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No completed rides recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinanceReports;
