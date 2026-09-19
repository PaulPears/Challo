import React from 'react';
import { User, Phone, ChevronRight, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DriverCardProps {
  driver: any;
  onInspect: (driver: any) => void;
  onStatusUpdate?: (id: string, action: 'suspend' | 'activate') => void;
}

const DriverCard: React.FC<DriverCardProps> = ({ driver, onInspect, onStatusUpdate }) => {
  const isSuspended = driver.status === 'suspended';

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          borderRadius: '50%', 
          background: isSuspended ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-accent)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          border: `1px solid ${isSuspended ? 'var(--danger)' : 'var(--glass-border)'}`
        }}>
          <User size={24} color={isSuspended ? 'var(--danger)' : 'var(--primary)'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{driver.user?.name || 'Unknown Pilot'}</h4>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '4px 8px', 
              borderRadius: '20px', 
              background: isSuspended ? 'var(--danger)' : 'var(--success)',
              color: 'white',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {driver.status}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
            <Phone size={12} /> {driver.user?.phone_number}
          </p>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        padding: '12px', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>ID</span>
          <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>{driver.user_id}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Vehicle</span>
          <span style={{ fontWeight: 600 }}>{driver.vehicle_model}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Plate Number</span>
          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{driver.vehicle_plate_number}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
        <button className="btn btn-primary" onClick={() => onInspect(driver)} style={{ flex: 2 }}>
          Inspect <ChevronRight size={18} />
        </button>
        {onStatusUpdate && (
          <button 
            className="btn btn-outline" 
            onClick={() => onStatusUpdate(driver.user_id, isSuspended ? 'activate' : 'suspend')}
            style={{ flex: 1, padding: '10px', borderColor: isSuspended ? 'var(--success)' : 'var(--danger)' }}
            title={isSuspended ? 'Unlock Driver' : 'Block Driver'}
          >
            {isSuspended ? <ShieldCheck size={20} color="var(--success)" /> : <ShieldAlert size={20} color="var(--danger)" />}
          </button>
        )}
      </div>
    </div>
  );
};


export default DriverCard;
