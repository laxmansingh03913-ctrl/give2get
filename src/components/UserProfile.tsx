import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github, Globe, Linkedin, Twitter, CheckCircle, Shield, Zap,
  MessageSquare, Edit3, Save, X,
  Briefcase, Activity, DollarSign
} from 'lucide-react';
import type { Project, Review } from './Dashboard';

export interface UserProfileData {
  name: string;
  avatar: string;
  email: string;
  is_pro: boolean;
  bio?: string;
  role?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  payoutUpi?: string;
  payoutPaypal?: string;
  availableForHire: boolean;
  isVerified: boolean;
  hourlyRate?: number;
}

interface UserProfileProps {
  user: UserProfileData;
  projects: Project[];
  onUpdateUser: (updated: Partial<UserProfileData>) => void;
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Generate 365 cells for the contribution heatmap with simulated review counts
const HEATMAP_365_DATA = Array.from({ length: 364 }, (_, i) => {
  const hash = Math.sin(i) * Math.cos(i / 12) + Math.cos(i / 5) * 0.5;
  const level = hash > 0.8 ? 3 : hash > 0.4 ? 2 : hash > 0.05 ? 1 : 0;
  return level;
});

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''];

export default function UserProfile({ user, projects, onUpdateUser }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'projects' | 'critiques' | 'heatmap'>('projects');
  const [showSettings, setShowSettings] = useState(false);
  const [availableForHire, setAvailableForHire] = useState(user.availableForHire);
  
  // Edit Profile States
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user.bio ?? 'Full-stack engineer who loves building fast, accessible, and beautiful web products. Open source contributor and performance nerd.');
  const [role, setRole] = useState(user.role ?? 'Full-Stack Engineer · Open Source Contributor');
  
  // Gig Booking States
  const [selectedGig, setSelectedGig] = useState<{ title: string; price: number; delivery: string } | null>(null);
  const [bookingStep, setBookingStep] = useState(0); // 0: input VPA/Card, 1: process, 2: success
  const [checkoutMethod, setCheckoutMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [upiId, setUpiId] = useState('');

  // Settings Panel States
  const [sGithub, setSGithub] = useState(user.githubUrl ?? '');
  const [sPortfolio, setSPortfolio] = useState(user.portfolioUrl ?? '');
  const [sLinkedin, setSLinkedin] = useState(user.linkedinUrl ?? '');
  const [sTwitter, setSTwitter] = useState(user.twitterUrl ?? '');
  const [sUpi, setSUpi] = useState(user.payoutUpi ?? '');
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate ?? 15);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const isVerified = Boolean(sGithub.trim() && sPortfolio.trim());

  // Collect user reviews
  const critiquesGiven: Array<Review & { projectTitle: string }> = [];
  projects.forEach(p => {
    p.reviews.forEach(r => {
      if (r.author === user.name || r.author.toLowerCase().includes('you')) {
        critiquesGiven.push({ ...r, projectTitle: p.title });
      }
    });
  });

  const myProjects = projects.filter(
    p => p.author === user.name || p.author.toLowerCase().includes('alex') || p.author.toLowerCase().includes('creator')
  );

  const handleSaveSettings = () => {
    onUpdateUser({
      githubUrl: sGithub,
      portfolioUrl: sPortfolio,
      linkedinUrl: sLinkedin,
      twitterUrl: sTwitter,
      payoutUpi: sUpi,
      payoutPaypal: user.payoutPaypal,
      isVerified,
      bio,
      role,
      hourlyRate
    });
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
    }, 1200);
  };

  const handleToggleHire = () => {
    const next = !availableForHire;
    setAvailableForHire(next);
    onUpdateUser({ availableForHire: next });
  };

  // Gig offerings
  const GIGS = [
    { title: "Full Stack Security Audit & Database Hardening", price: 150, delivery: "3 Days" },
    { title: "Ultra-Premium Framer Motion & CSS Animation Overhaul", price: 99, delivery: "2 Days" },
    { title: "Lighthouse SEO & Speed Optimization Session (Under 1s load time)", price: 120, delivery: "24 Hours" }
  ];

  // Radar chart ratings (1-10 scale)
  const radarRatings = {
    uiSense: 8.8,
    codeArch: 9.4,
    helpfulness: 9.0,
    bugDiscovery: 7.8
  };

  // SVG Radar coordinates centering at (100, 100), scale factor 8px per rating point
  const center = 100;
  const scale = 8;
  const pUI = { x: center, y: center - radarRatings.uiSense * scale };
  const pArch = { x: center + radarRatings.codeArch * scale, y: center };
  const pHelp = { x: center, y: center + radarRatings.helpfulness * scale };
  const pBug = { x: center - radarRatings.bugDiscovery * scale, y: center };

  const polygonPoints = `${pUI.x},${pUI.y} ${pArch.x},${pArch.y} ${pHelp.x},${pHelp.y} ${pBug.x},${pBug.y}`;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingStep(1); // processing
    setTimeout(() => {
      setBookingStep(2); // success
      setTimeout(() => {
        setSelectedGig(null);
        setBookingStep(0);
      }, 1500);
    }, 1800);
  };

  const cellBg = (level: number) => {
    switch (level) {
      case 1: return 'rgba(245, 158, 11, 0.25)';
      case 2: return 'rgba(245, 158, 11, 0.6)';
      case 3: return '#f59e0b';
      default: return 'rgba(245, 158, 11, 0.05)';
    }
  };

  return (
    <div className="profile-page">
      {/* ================= MAIN COLUMN ================= */}
      <div className="profile-main">
        {/* Profile Card */}
        <div className="glass-panel profile-header-card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '84px', height: '84px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: '26px',
                boxShadow: '0 0 24px rgba(99, 102, 241, 0.45)',
              }}>
                {getInitials(user.name)}
              </div>
              {isVerified && (
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  background: '#10b981', borderRadius: '50%', width: '22px', height: '22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(16,185,129,0.7)', border: '2px solid #09090b'
                }}>
                  <CheckCircle size={12} style={{ color: 'white' }} />
                </div>
              )}
            </div>

            {/* Title / Role */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>{user.name}</h1>
                {user.is_pro && <span className="profile-pro-badge">PRO</span>}
              </div>

              {!editingBio ? (
                <>
                  <p style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600, marginBottom: '6px' }}>{role}</p>
                  <p style={{ fontSize: '13px', color: 'rgb(161, 161, 170)', lineHeight: 1.65, maxWidth: '560px' }}>{bio}</p>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '4px' }}>
                  <input
                    className="form-textarea"
                    style={{ padding: '8px 12px', fontSize: '13px', fontWeight: 600 }}
                    value={role}
                    onChange={e => setRole(e.target.value)}
                    placeholder="Role / Tagline"
                  />
                  <textarea
                    className="form-textarea"
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Short bio..."
                    style={{ resize: 'vertical', fontSize: '13px' }}
                  />
                </div>
              )}

              {/* Badges container */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
                <span className="badge-premium badge-critic">
                  <MessageSquare size={12} /> Top 1% Critic
                </span>
                <span className="badge-premium badge-optimizer">
                  <Zap size={12} /> Lighthouse Optimizer
                </span>
                <span className="badge-premium badge-senior">
                  <Shield size={12} /> Verified Senior Peer
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {!editingBio ? (
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} onClick={() => setEditingBio(true)}>
                  <Edit3 size={12} /> Edit Profile
                </button>
              ) : (
                <>
                  <button className="btn btn-success" style={{ fontSize: '12px', padding: '7px 12px' }} onClick={() => { onUpdateUser({ bio, role }); setEditingBio(false); }}>
                    <Save size={12} /> Save
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} onClick={() => setEditingBio(false)}>
                    <X size={12} /> Cancel
                  </button>
                </>
              )}
              <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }} onClick={() => setShowSettings(s => !s)}>
                ⚙ Settings
              </button>
            </div>
          </div>

          {/* Social Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: '20px' }}>
            {sGithub && (
              <a href={sGithub} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Github size={13} /> GitHub
              </a>
            )}
            {sPortfolio && (
              <a href={sPortfolio} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Globe size={13} /> Portfolio
              </a>
            )}
            {sLinkedin && (
              <a href={sLinkedin} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Linkedin size={13} /> LinkedIn
              </a>
            )}
            {sTwitter && (
              <a href={sTwitter} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Twitter size={13} /> Twitter
              </a>
            )}
            <button
              onClick={handleToggleHire}
              style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '7px 14px', borderRadius: '9999px', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', border: '1px solid', transition: 'all 0.25s',
                background: availableForHire ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: availableForHire ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)',
                color: availableForHire ? '#10b981' : 'rgb(161, 161, 170)',
              }}
            >
              <span style={{
                display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                background: availableForHire ? '#10b981' : 'rgba(255,255,255,0.2)',
                boxShadow: availableForHire ? '0 0 6px #10b981' : 'none',
              }} />
              {availableForHire ? 'Available for Hire' : 'Not Looking'}
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="glass-panel profile-settings-panel" style={{ padding: '24px', margin: '16px 0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'white', marginBottom: '16px' }}>Settings & Verification</h2>
            <div className="settings-grid">
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" value={sGithub} onChange={e => setSGithub(e.target.value)} placeholder="https://github.com/username" />
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <input className="form-input" value={sPortfolio} onChange={e => setSPortfolio(e.target.value)} placeholder="https://myportfolio.dev" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" value={sLinkedin} onChange={e => setSLinkedin(e.target.value)} placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="form-group">
                <label className="form-label">Twitter URL</label>
                <input className="form-input" value={sTwitter} onChange={e => setSTwitter(e.target.value)} placeholder="https://twitter.com/username" />
              </div>
              <div className="form-group">
                <label className="form-label">Freelance Hourly Rate ($)</label>
                <input className="form-input" type="number" value={hourlyRate} onChange={e => setHourlyRate(parseInt(e.target.value) || 15)} />
              </div>
              <div className="form-group">
                <label className="form-label">Payout UPI ID</label>
                <input className="form-input" value={sUpi} onChange={e => setSUpi(e.target.value)} placeholder="name@upi" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-success" onClick={handleSaveSettings}>
                {settingsSaved ? 'Saved ✓' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Tab Selection */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', marginTop: '24px' }}>
          <div className="profile-tabs">
            <button className={`profile-tab ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
              <Briefcase size={14} /> Projects Posted
            </button>
            <button className={`profile-tab ${activeTab === 'critiques' ? 'active' : ''}`} onClick={() => setActiveTab('critiques')}>
              <MessageSquare size={14} /> Critiques Given
            </button>
            <button className={`profile-tab ${activeTab === 'heatmap' ? 'active' : ''}`} onClick={() => setActiveTab('heatmap')}>
              <Activity size={14} /> 365-Day Review Activity
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'projects' && (
                <motion.div key="p-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {myProjects.length === 0 ? (
                    <p style={{ color: 'rgb(113, 113, 122)', fontSize: '13px', textAlign: 'center' }}>No projects shared yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {myProjects.map(p => (
                        <div key={p.id} className="profile-project-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgb(39,39,42)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ fontSize: '15px', color: 'white', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {p.title}
                            {p.is_featured && <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '4px' }}>FEATURED</span>}
                          </h4>
                          <p style={{ fontSize: '12px', color: 'rgb(161, 161, 170)', marginBottom: '10px' }}>{p.description}</p>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {p.tags.map(t => <span key={t} className="project-tag" style={{ fontSize: '10px' }}>{t}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'critiques' && (
                <motion.div key="c-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  {critiquesGiven.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {/* Render simulated critiques if database has none yet */}
                      {[
                        { title: 'PulseCSS: Glassmorphic Component Studio', content: 'Design implementation is outstanding. I recommend optimizations on the backdrop blur CSS transition to avoid repaint lag on weaker mobile processors.' },
                        { title: 'DevFlow: StackOverflow for AI Agents', content: 'Excellent integration of verify loops. Consider rendering Docker terminal outputs inside standard JSON codeblocks for cleaner readability.' }
                      ].map((item, idx) => (
                        <div key={idx} className="profile-project-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgb(39,39,42)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ fontSize: '13px', color: '#6366f1', margin: '0 0 6px 0' }}>Critique on {item.title}</h4>
                          <p style={{ fontSize: '12px', color: 'rgb(161, 161, 170)', lineHeight: 1.5 }}>{item.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {critiquesGiven.map(c => (
                        <div key={c.id} className="profile-project-card" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgb(39,39,42)', borderRadius: '12px', padding: '16px' }}>
                          <h4 style={{ fontSize: '13px', color: '#6366f1', margin: '0 0 6px 0' }}>Critique on {c.projectTitle}</h4>
                          <p style={{ fontSize: '12px', color: 'rgb(161, 161, 170)', lineHeight: 1.5 }}>{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'heatmap' && (
                <motion.div key="h-tab" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
                  <div className="heatmap-365">
                    <div style={{ display: 'flex', gap: '14px' }}>
                      {/* Y-axis days */}
                      <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 10px)', gap: '3px', marginRight: '6px' }}>
                        {DAY_LABELS.map((d, i) => (
                          <span key={i} style={{ fontSize: '8px', color: 'rgb(113, 113, 122)', height: '10px', display: 'flex', alignItems: 'center' }}>{d}</span>
                        ))}
                      </div>

                      {/* Weeks grid */}
                      <div className="heatmap-365-grid">
                        {HEATMAP_365_DATA.map((lvl, idx) => (
                          <div
                            key={idx}
                            className="heatmap-365-cell"
                            style={{ backgroundColor: cellBg(lvl) }}
                            title={`Activity level: ${lvl}`}
                          />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: 'rgb(113,113,122)' }}>
                      <span>Heatmap shows contributions from the past 12 months</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <span>Less</span>
                        {[0, 1, 2, 3].map(lvl => (
                          <div key={lvl} style={{ width: '8px', height: '8px', borderRadius: '1.5px', backgroundColor: cellBg(lvl) }} />
                        ))}
                        <span>More</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ================= SIDEBAR COLUMN ================= */}
      <div className="profile-sidebar-col">
        {/* SVG Skill Radar Chart */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'white', alignSelf: 'flex-start', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={14} style={{ color: '#6366f1' }} /> Skill Reputation Matrix
          </h4>

          <div style={{ position: 'relative', width: '200px', height: '200px' }}>
            <svg width="200" height="200">
              {/* Axes lines */}
              <line x1={center} y1="15" x2={center} y2="185" stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />
              <line x1="15" y1={center} x2={185} y2={center} stroke="rgba(0,0,0,0.08)" strokeWidth="1.5" />

              {/* Reference Grid diamonds */}
              {[2, 4, 6, 8, 10].map(val => {
                const dist = val * scale;
                return (
                  <polygon
                    key={val}
                    points={`${center},${center - dist} ${center + dist},${center} ${center},${center + dist} ${center - dist},${center}`}
                    fill="transparent"
                    stroke="rgba(0,0,0,0.05)"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Rating Polygon */}
              <polygon
                points={polygonPoints}
                fill="rgba(245, 158, 11, 0.15)"
                stroke="#f59e0b"
                strokeWidth="2"
                style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.3))' }}
              />

              {/* Points dots */}
              <circle cx={pUI.x} cy={pUI.y} r="3" fill="#f59e0b" />
              <circle cx={pArch.x} cy={pArch.y} r="3" fill="#f59e0b" />
              <circle cx={pHelp.x} cy={pHelp.y} r="3" fill="#f59e0b" />
              <circle cx={pBug.x} cy={pBug.y} r="3" fill="#f59e0b" />
            </svg>

            {/* Labels overlay */}
            <span style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 700, color: 'rgb(161, 161, 170)' }}>UI SENSE ({radarRatings.uiSense})</span>
            <span style={{ position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)', fontSize: '9px', fontWeight: 700, color: 'rgb(161, 161, 170)' }}>ARCH ({radarRatings.codeArch})</span>
            <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 700, color: 'rgb(161, 161, 170)' }}>HELP ({radarRatings.helpfulness})</span>
            <span style={{ position: 'absolute', top: '50%', left: '0', transform: 'translateY(-50%)', fontSize: '9px', fontWeight: 700, color: 'rgb(161, 161, 170)' }}>BUGS ({radarRatings.bugDiscovery})</span>
          </div>
        </div>

        {/* Freelance Micro-Gig Hub */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={14} style={{ color: '#14b8a6' }} /> Freelance Micro-Gigs
          </h4>

          <div className="gigs-grid">
            {GIGS.map((gig, index) => (
              <div key={index} className="gig-card">
                <div>
                  <h5 style={{ fontSize: '13px', color: 'white', fontWeight: 700, margin: '0 0 4px 0' }}>{gig.title}</h5>
                  <span style={{ fontSize: '11px', color: 'rgb(113, 113, 122)' }}>Delivery in {gig.delivery}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span className="gig-price">${gig.price}</span>
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={() => setSelectedGig(gig)}>
                    Book Gig
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Checkout Modal */}
      {selectedGig && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px' }}>
            <button className="modal-close" onClick={() => setSelectedGig(null)}>
              <X size={18} />
            </button>

            {bookingStep === 0 && (
              <form onSubmit={handleCheckoutSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} style={{ color: '#14b8a6', marginLeft: '10px' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', color: 'white', margin: 0 }}>Checkout Offer</h3>
                    <p style={{ fontSize: '11px', color: 'rgb(113,113,122)', margin: 0 }}>Secure payment processing</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgb(39,39,42)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'rgb(161, 161, 170)' }}>Service Selected:</span>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', margin: '4px 0 8px 0' }}>{selectedGig.title}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>Total Fee:</span>
                    <span style={{ fontSize: '14px', color: '#14b8a6', fontWeight: 800 }}>${selectedGig.price}.00</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">CHOOSE METHOD</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button type="button" className={`device-btn ${checkoutMethod === 'card' ? 'active' : ''}`} style={{ justifyContent: 'center' }} onClick={() => setCheckoutMethod('card')}>
                      Card Payment
                    </button>
                    <button type="button" className={`device-btn ${checkoutMethod === 'upi' ? 'active' : ''}`} style={{ justifyContent: 'center' }} onClick={() => setCheckoutMethod('upi')}>
                      UPI VPA
                    </button>
                  </div>

                  {checkoutMethod === 'card' ? (
                    <input
                      type="text"
                      className="form-input"
                      value={cardNumber}
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                      placeholder="Card number (16-digit)"
                      required
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. pay@axisbank"
                      required
                    />
                  )}
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px' }}>
                  Authorize Checkout (${selectedGig.price})
                </button>
              </form>
            )}

            {bookingStep === 1 && (
              <div className="verifying-overlay">
                <div className="verify-spinner" style={{ width: '36px', height: '36px', marginBottom: '16px' }} />
                <h3 style={{ color: 'white', fontSize: '15px' }}>Verifying payment details...</h3>
              </div>
            )}

            {bookingStep === 2 && (
              <div className="verifying-overlay" style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>Booking Confirmed!</h3>
                <p style={{ fontSize: '12px', color: 'rgb(113,113,122)' }}>Developer will respond to your workspace within {selectedGig.delivery}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
