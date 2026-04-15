import React from 'react';
import { Star, MessageSquare, Clock } from 'lucide-react';

interface Review {
  id: string;
  rider_rating: number;
  rider_review: string;
  created_at: string;
  rider: {
    name: string;
    phone_number: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews, loading }) => {
  if (loading) return <div className="animate-pulse" style={{ color: 'var(--text-muted)', padding: '20px' }}>Loading feedback history...</div>;
  
  if (reviews.length === 0) return (
    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.6 }}>
      <MessageSquare size={32} style={{ marginBottom: '10px' }} />
      <p>No feedback recorded for this pilot yet.</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      {reviews.map((review) => (
        <div key={review.id} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{review.rider?.name || 'Anonymous Rider'}</span>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    fill={i < review.rider_rating ? 'var(--warning)' : 'none'} 
                    color={i < review.rider_rating ? 'var(--warning)' : 'var(--text-muted)'} 
                  />
                ))}
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} /> {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: review.rider_review ? 'normal' : 'italic', opacity: review.rider_review ? 1 : 0.6 }}>
            {review.rider_review || 'Rating only, no comment provided.'}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
