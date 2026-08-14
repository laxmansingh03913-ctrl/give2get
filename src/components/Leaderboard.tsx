import React, { useState } from 'react';
import { Search, Mail, Star, Sparkles, Award, X, Send } from 'lucide-react';

interface DeveloperProfile {
  id: string;
  name: string;
  avatar: string;
  title: string;
  tags: string[];
  reviewsGiven: number;
  reviewsReceived: number;
  avgScore: number;
  hiringStatus: 'Open to Hire' | 'Passive' | 'Unavailable';
}

export default function Leaderboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [hiredDev, setHiredDev] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'critics'>('rating');

  // Recruiter Contact Modal state
  const [selectedDev, setSelectedDev] = useState<DeveloperProfile | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);

  const mockDevelopers: DeveloperProfile[] = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'SC',
      title: 'Fullstack Dev | Next.js & Go specialist',
      tags: ['React', 'Next.js', 'Go', 'PostgreSQL'],
      reviewsGiven: 8,
      reviewsReceived: 12,
      avgScore: 4.8,
      hiringStatus: 'Open to Hire'
    },
    {
      id: '2',
      name: 'Marcus Brody',
      avatar: 'MB',
      title: 'UI/UX Engineer & Creative Developer',
      tags: ['CSS', 'Three.js', 'Framer Motion', 'React'],
      reviewsGiven: 14,
      reviewsReceived: 9,
      avgScore: 4.7,
      hiringStatus: 'Open to Hire'
    },
    {
      id: '3',
      name: 'Aiden Vance',
      avatar: 'AV',
      title: 'Systems & Backend Programmer',
      tags: ['Rust', 'Docker', 'Kubernetes', 'gRPC'],
      reviewsGiven: 6,
      reviewsReceived: 10,
      avgScore: 4.9,
      hiringStatus: 'Passive'
    },
    {
      id: '4',
      name: 'Priya Patel',
      avatar: 'PP',
      title: 'Senior Frontend Engineer | Web Performance',
      tags: ['TypeScript', 'Vite', 'React', 'Webpack'],
      reviewsGiven: 12,
      reviewsReceived: 15,
      avgScore: 4.6,
      hiringStatus: 'Unavailable'
    }
  ];

  // Sort developers based on active tab
  const sortedDevs = [...mockDevelopers].sort((a, b) => {
    if (sortBy === 'critics') {
      return b.reviewsGiven - a.reviewsGiven;
    } else {
      return b.avgScore - a.avgScore;
    }
  });

  const filteredDevs = sortedDevs.filter(dev => 
    dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dev.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenContact = (dev: DeveloperProfile) => {
    setSelectedDev(dev);
    setRecruiterName('');
    setRecruiterEmail('');
    setCompanyName('');
    setContactMessage(`Hi ${dev.name.split(' ')[0]},\n\nI saw your excellent reviews and projects on Give2Get. I'd love to chat about potential opportunities at my company.`);
    setContactError('');
    setIsSendingInquiry(false);
    setIsContactModalOpen(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterName || !recruiterEmail || !contactMessage) {
      setContactError('Please fill in your name, email, and message.');
      return;
    }

    setIsSendingInquiry(true);

    setTimeout(() => {
      setIsSendingInquiry(false);
      setIsContactModalOpen(false);
      setHiredDev(selectedDev ? selectedDev.name : '');
      setTimeout(() => setHiredDev(null), 3500);
      setSelectedDev(null);
    }, 1500);
  };

  return (
    <div style={{ paddingTop: '4px' }}>
      {/* Header */}
      <div className="view-header" style={{ marginBottom: '16px' }}>
        <div className="view-title">
          <h1>Top Reviewed Developers</h1>
          <p>Developers ranked by their peer review score and feedback contributions.</p>
        </div>
      </div>

      {/* Rewards Banner */}
      <div 
        className="glass-panel" 
        style={{ 
          marginBottom: '24px', 
          padding: '24px', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(20, 184, 166, 0.15) 100%)', 
          border: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span 
              className="badge" 
              style={{ marginBottom: '8px', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '10px' }}
            >
              <Award size={12} style={{ marginRight: '6px' }} /> $100 August Pool Active
            </span>
            <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '6px' }}>August Dev Leaderboard & Pool</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', maxWidth: '600px' }}>
              Rewarding top-quality reviewers! The top 3 contributors share a $100 monthly cash pool, sponsored by recruiters looking for active collaboration. Resets in 16 days.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '12px 18px', textAlign: 'center', minWidth: '90px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'gold' }}>$50</div>
              <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>1st Place</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 18px', textAlign: 'center', minWidth: '90px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: 'silver' }}>$30</div>
              <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>2nd Place</div>
            </div>
            <div className="glass-panel" style={{ padding: '12px 18px', textAlign: 'center', minWidth: '90px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#cd7f32' }}>$20</div>
              <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>3rd Place</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <Search 
          size={18} 
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} 
        />
        <input 
          type="text" 
          className="form-input" 
          placeholder="Search by name, title, or skill tag (e.g. React, Rust...)"
          style={{ paddingLeft: '48px', borderRadius: 'var(--radius)' }}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sorting Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600, marginRight: '8px' }}>SORT BY:</span>
        <button 
          className={`btn btn-secondary ${sortBy === 'rating' ? 'active' : ''}`}
          onClick={() => setSortBy('rating')}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }}
        >
          Top Rated (Highest Avg Score)
        </button>
        <button 
          className={`btn btn-secondary ${sortBy === 'critics' ? 'active' : ''}`}
          onClick={() => setSortBy('critics')}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px' }}
        >
          Top Critics (Most Reviews Given)
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel" style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)' }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank & Developer</th>
              <th>Skills</th>
              <th style={{ textAlign: 'center' }}>Contributions</th>
              <th style={{ textAlign: 'center' }}>Peer Rating</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDevs.map((dev, index) => (
              <tr key={dev.id} className="leaderboard-row">
                <td>
                  <div className="user-profile-cell">
                    <div style={{ fontStyle: 'italic', fontWeight: 800, color: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'hsl(var(--text-muted))', width: '20px' }}>
                      #{index + 1}
                    </div>
                    <div className="user-avatar">{dev.avatar}</div>
                    <div className="user-details">
                      <span className="user-name">{dev.name}</span>
                      <span className="user-title">{dev.title}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '240px' }}>
                    {dev.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="project-tag" style={{ fontSize: '10px' }}>{tag}</span>
                    ))}
                    {dev.tags.length > 3 && (
                      <span className="project-tag" style={{ fontSize: '10px', background: 'transparent' }}>+{dev.tags.length - 3}</span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{dev.reviewsGiven} Given</div>
                  <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{dev.reviewsReceived} Received</div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'gold', fontWeight: 'bold' }}>
                    <Star size={14} fill="currentColor" /> {dev.avgScore}
                  </div>
                </td>
                <td>
                  {dev.hiringStatus === 'Open to Hire' && (
                    <span className="badge badge-success">Open to Hire</span>
                  )}
                  {dev.hiringStatus === 'Passive' && (
                    <span className="badge badge-indigo">Passive</span>
                  )}
                  {dev.hiringStatus === 'Unavailable' && (
                    <span className="badge badge-warning" style={{ background: 'rgba(245, 158, 11, 0.05)', color: '#f59e0b' }}>Unavailable</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {dev.hiringStatus !== 'Unavailable' ? (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleOpenContact(dev)}
                      style={{ padding: '8px 14px', fontSize: '12px' }}
                    >
                      <Mail size={12} /> Contact
                    </button>
                  ) : (
                    <button 
                      className="btn btn-disabled" 
                      disabled
                      style={{ padding: '8px 14px', fontSize: '12px', opacity: 0.35, cursor: 'not-allowed' }}
                    >
                      Unavailable
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filteredDevs.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-muted))' }}>
                  No developers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Info Card */}
      <div className="glass-panel" style={{ marginTop: '24px', padding: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ background: 'hsla(var(--primary) / 0.1)', color: 'hsl(var(--primary))', padding: '12px', borderRadius: '50%' }}>
          <Award size={24} />
        </div>
        <div>
          <h3 style={{ color: 'white', fontSize: '16px', marginBottom: '4px' }}>Want to top this leaderboard?</h3>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>
            Contribute detailed, constructive reviews on peer projects. High-quality feedback is voted on by authors, boosting your community score and placing you directly in front of leading engineering recruiters.
          </p>
        </div>
      </div>

      {/* Recruiter Contact Modal */}
      {isContactModalOpen && selectedDev && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <button className="modal-close" onClick={() => setIsContactModalOpen(false)}>
              <X size={20} />
            </button>
            
            {isSendingInquiry ? (
              <div className="verifying-overlay">
                <div className="verify-spinner" style={{ width: '40px', height: '40px', marginBottom: '20px' }}></div>
                <h3 style={{ color: 'white' }}>Sending Inquiry...</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>Forwarding details securely to {selectedDev.name}...</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit}>
                <div className="contact-header" style={{ marginBottom: '20px' }}>
                  <div className="contact-avatar">{selectedDev.avatar}</div>
                  <div>
                    <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '2px' }}>Contact {selectedDev.name}</h2>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>{selectedDev.title}</p>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. Sarah Jenkins"
                    value={recruiterName}
                    onChange={e => setRecruiterName(e.target.value)}
                    required 
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Work Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      placeholder="s.jenkins@company.com"
                      value={recruiterEmail}
                      onChange={e => setRecruiterEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. Vercel Inc."
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea 
                    className="form-textarea" 
                    rows={4}
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    required
                  />
                </div>

                {contactError && (
                  <div style={{ color: 'hsl(var(--error))', fontSize: '12px', marginBottom: '16px', fontWeight: '500' }}>
                    {contactError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsContactModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Send size={14} /> Send Message
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {hiredDev && (
        <div className="toast" style={{ border: '1px solid hsl(var(--success))' }}>
          <Sparkles size={16} style={{ color: 'hsl(var(--success))' }} />
          <span>Inquiry successfully delivered to <strong>{hiredDev}</strong>! They will contact you shortly.</span>
        </div>
      )}
    </div>
  );
}
