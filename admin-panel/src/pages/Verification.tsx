import { useEffect, useState } from 'react';
import api from '../api/api';
import { Check, X, FileText, Smartphone, CreditCard } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import DriverCard from '../components/DriverCard';

const Verification = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPendingDrivers();
  }, []);

  const fetchPendingDrivers = async () => {
    try {
      const resp = await api.get('/admin/drivers/pending');
      setDrivers(resp.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this pilot?')) return;
    try {
      await api.post(`/admin/drivers/${id}/approve`);
      setDrivers(drivers.filter(d => d.user_id !== id));
      setSelectedDriver(null);
    } catch (err) {
      alert('Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this application?')) return;
    try {
      await api.post(`/admin/drivers/${id}/reject`);
      setDrivers(drivers.filter(d => d.user_id !== id));
      setSelectedDriver(null);
    } catch (err) {
      alert('Rejection failed');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    (d.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.user?.phone_number || '').includes(searchQuery)
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
      <div className="animate-pulse" style={{ color: 'var(--text-muted)' }}>Retrieving application logs...</div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Driver Verifications</h1>
          <p className="subtitle">Mandatory manual review of submitted documents</p>
        </div>
        <div className="glass-card" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{drivers.length}</span> Pending Applications
        </div>
      </div>

      <SearchBar 
        value={searchQuery} 
        onChange={setSearchQuery} 
        placeholder="Filter by name or phone..." 
      />

      <div className="grid-container">
        {filteredDrivers.map((driver) => (
          <DriverCard 
            key={driver.user_id} 
            driver={driver} 
            onInspect={setSelectedDriver} 
          />
        ))}
        
        {filteredDrivers.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--glass-accent)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-muted)' }}>No matching applications found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search query or check back later.</p>
          </div>
        )}
      </div>

      {selectedDriver && (
        <div className="modal-overlay" onClick={() => setSelectedDriver(null)}>
          <div className="glass-card modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ background: '#0D0D0E', border: '1px solid var(--primary-glow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Inspecting Documents</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reviewing application for <strong>{selectedDriver.user?.name}</strong></p>
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
              {/* Profile Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ overflow: 'hidden', padding: '15px' }}>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Profile Image</p>
                   <img 
                    src={selectedDriver.user?.profile_image ? selectedDriver.user.profile_image : 'https://placehold.co/600x400/111/444?text=No+Profile'} 
                    className="doc-img" 
                    style={{ cursor: 'default' }}
                  />
                </div>
                
                <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone Number</label>
                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><Smartphone size={14} color="var(--primary)" /> {selectedDriver.user?.phone_number}</p>
                   </div>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>License Number</label>
                    <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14} color="var(--primary)" /> {selectedDriver.license_number}</p>
                   </div>
                   <div>
                    <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Vehicle Plate</label>
                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>{selectedDriver.vehicle_plate_number}</p>
                   </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div>
                <h4 style={{ marginBottom: '20px' }}>Verification Documents</h4>
                <div className="doc-images" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div>
                    <p style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>License Front</p>
                    <img src={selectedDriver.license_image ? selectedDriver.license_image : 'https://placehold.co/600x400/111/444?text=No+License+Front'} className="doc-img" />
                  </div>
                  <div>
                    <p style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>License Back</p>
                    <img src={selectedDriver.license_back_image ? selectedDriver.license_back_image : 'https://placehold.co/600x400/111/444?text=No+License+Back'} className="doc-img" />
                  </div>
                  <div>
                    <p style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Aadhaar Card</p>
                    <img src={selectedDriver.aadhar_image ? selectedDriver.aadhar_image : 'https://placehold.co/600x400/111/444?text=No+Aadhaar'} className="doc-img" />
                  </div>
                  <div>
                    <p style={{ marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>PAN Card</p>
                    <img src={selectedDriver.pan_image ? selectedDriver.pan_image : 'https://placehold.co/600x400/111/444?text=No+PAN'} className="doc-img" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, backgroundColor: 'var(--success)', border: 'none', height: '50px' }}
                    onClick={() => handleApprove(selectedDriver.user_id)}
                  >
                    <Check size={20} /> Approve Entry
                  </button>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1, color: 'var(--danger)', borderColor: 'var(--danger)', height: '50px' }}
                    onClick={() => handleReject(selectedDriver.user_id)}
                  >
                    <X size={20} /> Reject Applicant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verification;

