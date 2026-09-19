import { useState } from 'react';
import { DollarSign, Zap, Edit2, Check, Car } from 'lucide-react';

interface FareTier {
  id: string;
  name: string;
  vehicleType: string;
  baseFare: number;
  perKmRate: number;
  minimumFare: number;
  surgeMultiplier: number;
}

const FareManager = () => {
  const [tiers, setTiers] = useState<FareTier[]>([
    { id: '1', name: 'Auto Rickshaw', vehicleType: 'auto', baseFare: 30, perKmRate: 15, minimumFare: 40, surgeMultiplier: 1.0 },
    { id: '2', name: 'Bike Ride', vehicleType: 'bike', baseFare: 20, perKmRate: 10, minimumFare: 25, surgeMultiplier: 1.0 },
    { id: '3', name: 'Bike Lite', vehicleType: 'bike_lite', baseFare: 15, perKmRate: 8, minimumFare: 20, surgeMultiplier: 1.0 },
    { id: '4', name: 'Cab / Sedan', vehicleType: 'cab', baseFare: 80, perKmRate: 22, minimumFare: 100, surgeMultiplier: 1.0 },
    { id: '5', name: 'Ambulance Emergency', vehicleType: 'ambulance', baseFare: 150, perKmRate: 25, minimumFare: 200, surgeMultiplier: 1.0 },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FareTier | null>(null);

  const startEdit = (tier: FareTier) => {
    setEditingId(tier.id);
    setEditForm({ ...tier });
  };

  const saveEdit = () => {
    if (!editForm) return;
    setTiers(tiers.map(t => t.id === editForm.id ? editForm : t));
    setEditingId(null);
    setEditForm(null);
    alert(`Updated pricing for ${editForm.name}`);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1>Pricing & Fare Configuration</h1>
        <p className="subtitle">Configure base fares, per-kilometer rates, and dynamic surges for all Challo vehicle categories</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {tiers.map((tier) => {
          const isEditing = editingId === tier.id;
          const current = isEditing ? editForm! : tier;

          return (
            <div key={tier.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: tier.vehicleType === 'ambulance' ? '4px solid #ef4444' : '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Car size={22} color={tier.vehicleType === 'ambulance' ? '#ef4444' : 'var(--primary)'} />
                  <h3 style={{ margin: 0 }}>{tier.name}</h3>
                </div>
                {tier.vehicleType === 'ambulance' && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', background: '#fee2e2', color: '#dc2626', fontWeight: 800 }}>
                    EMERGENCY
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Base Fare:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={current.baseFare}
                      onChange={(e) => setEditForm({ ...current, baseFare: parseFloat(e.target.value) || 0 })}
                      style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', background: '#222', color: 'white', border: '1px solid var(--glass-border)' }}
                    />
                  ) : (
                    <strong style={{ color: 'white' }}>₹{tier.baseFare}</strong>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Per KM Rate:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={current.perKmRate}
                      onChange={(e) => setEditForm({ ...current, perKmRate: parseFloat(e.target.value) || 0 })}
                      style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', background: '#222', color: 'white', border: '1px solid var(--glass-border)' }}
                    />
                  ) : (
                    <strong style={{ color: 'white' }}>₹{tier.perKmRate} / km</strong>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Minimum Fare:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      value={current.minimumFare}
                      onChange={(e) => setEditForm({ ...current, minimumFare: parseFloat(e.target.value) || 0 })}
                      style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', background: '#222', color: 'white', border: '1px solid var(--glass-border)' }}
                    />
                  ) : (
                    <strong style={{ color: 'white' }}>₹{tier.minimumFare}</strong>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Surge Multiplier:</span>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.1"
                      value={current.surgeMultiplier}
                      onChange={(e) => setEditForm({ ...current, surgeMultiplier: parseFloat(e.target.value) || 1.0 })}
                      style={{ width: '80px', padding: '4px 8px', borderRadius: '6px', background: '#222', color: 'white', border: '1px solid var(--glass-border)' }}
                    />
                  ) : (
                    <span style={{ color: tier.surgeMultiplier > 1 ? '#eab308' : 'var(--success)', fontWeight: 700 }}>
                      {tier.surgeMultiplier}x {tier.surgeMultiplier > 1 ? '🔥 Active' : 'Normal'}
                    </span>
                  )}
                </div>
              </div>

              {isEditing ? (
                <button className="btn btn-primary" onClick={saveEdit} style={{ width: '100%' }}>
                  <Check size={16} /> Save Changes
                </button>
              ) : (
                <button className="btn btn-outline" onClick={() => startEdit(tier)} style={{ width: '100%' }}>
                  <Edit2 size={16} /> Edit Pricing
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FareManager;
