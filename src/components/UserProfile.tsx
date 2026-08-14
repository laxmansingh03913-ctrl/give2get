import { useState } from 'react';
import {
  Github, Globe, Linkedin, Twitter, CheckCircle, Shield, Zap,
  MessageSquare, Send, ExternalLink, Edit3, Save, X,
  Briefcase, Award, Activity, Star, Heart, Users, DollarSign
} from 'lucide-react';
import type { Project, Review } from './Dashboard';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}



// 5-week contribution heatmap data — real data would come from a reviews array
const HEATMAP_DATA = [
  0,0,1,0,2,1,0,
  1,2,0,2,1,0,1,
  0,2,1,1,3,3,0,
  1,0,3,2,1,2,2,
  2,1,0,2,3,1,3,
];
const WEEK_LABELS = ['5w', '4w', '3w', '2w', '1w'];
const DAY_LABELS  = ['M','T','W','T','F','S','S'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeatmapGrid({ data }: { data: number[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const cellBg = (level: number) =>
    level === 0 ? 'rgba(255,255,255,0.05)' :
    level === 1 ? 'hsla(var(--primary)/0.22)' :
    level === 2 ? 'hsla(var(--primary)/0.55)' :
                  'hsl(var(--primary))';

  return (
    <div style={{ userSelect: 'none' }}>
      {/* Day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(7, 1fr)', gap: '3px', marginBottom: '4px' }}>
        <span />
        {DAY_LABELS.map(d => (
          <span key={d} style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>{d}</span>
        ))}
      </div>
      {/* Week rows */}
      {WEEK_LABELS.map((wk, wIdx) => (
        <div key={wk} style={{ display: 'grid', gridTemplateColumns: '24px repeat(7, 1fr)', gap: '3px', marginBottom: '3px' }}>
          <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', alignSelf: 'center' }}>{wk}</span>
          {data.slice(wIdx * 7, wIdx * 7 + 7).map((level, dIdx) => {
            const cellIdx = wIdx * 7 + dIdx;
            return (
              <div
                key={dIdx}
                title={level === 0 ? 'No reviews' : `${level} review${level > 1 ? 's' : ''}`}
                onMouseEnter={() => setHoveredIdx(cellIdx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  aspectRatio: '1', borderRadius: '3px',
                  background: cellBg(level),
                  transform: hoveredIdx === cellIdx ? 'scale(1.35)' : 'scale(1)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: hoveredIdx === cellIdx && level > 0 ? '0 0 8px hsla(var(--primary)/0.6)' : 'none',
                  cursor: 'default',
                }}
              />
            );
          })}
        </div>
      ))}
      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '8px' }}>
        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Less</span>
        {[0,1,2,3].map(l => (
          <div key={l} style={{ width: '10px', height: '10px', borderRadius: '2px', background: cellBg(l) }} />
        ))}
        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>More</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UserProfile({ user, projects, onUpdateUser }: UserProfileProps) {

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState<'projects' | 'critiques' | 'heatmap'>('projects');

  // ── Settings panel ──
  const [showSettings, setShowSettings] = useState(false);

  // ── Hire status ──
  const [availableForHire, setAvailableForHire] = useState(user.availableForHire);

  // ── Edit bio ──
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user.bio ?? 'Full-stack engineer who loves building fast, accessible, and beautiful web products. Open source contributor and performance nerd.');
  const [role, setRole] = useState(user.role ?? 'Full-Stack Engineer · Open Source Contributor');

  // ── Hire widget ──
  const [hireSent, setHireSent] = useState(false);
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate ?? 15);

  // ── Settings form ──
  const [sGithub, setSGithub] = useState(user.githubUrl ?? '');
  const [sPortfolio, setSPortfolio] = useState(user.portfolioUrl ?? '');
  const [sLinkedin, setSLinkedin] = useState(user.linkedinUrl ?? '');
  const [sTwitter, setSTwitter] = useState(user.twitterUrl ?? '');
  const [sUpi, setSUpi] = useState(user.payoutUpi ?? '');
  const [sPaypal, setSPaypal] = useState(user.payoutPaypal ?? '');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Compute verification (GitHub + Portfolio both linked)
  const isVerified = Boolean(sGithub.trim() && sPortfolio.trim());

  // Collect all reviews written by this user across all projects
  const critiquesGiven: Array<Review & { projectTitle: string }> = [];
  projects.forEach(p => {
    p.reviews.forEach(r => {
      if (r.author === user.name || r.author.toLowerCase().includes('you')) {
        critiquesGiven.push({ ...r, projectTitle: p.title });
      }
    });
  });

  // User's own projects
  const myProjects = projects.filter(
    p => p.author === user.name || p.author.toLowerCase().includes('alex')
  );

  const handleSaveSettings = () => {
    onUpdateUser({
      githubUrl: sGithub,
      portfolioUrl: sPortfolio,
      linkedinUrl: sLinkedin,
      twitterUrl: sTwitter,
      payoutUpi: sUpi,
      payoutPaypal: sPaypal,
      isVerified,
      bio,
      role,
    });
    setSettingsSaved(true);
    setTimeout(() => { setSettingsSaved(false); setShowSettings(false); }, 1600);
  };

  const handleToggleHire = () => {
    const next = !availableForHire;
    setAvailableForHire(next);
    onUpdateUser({ availableForHire: next });
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="profile-page">

      {/* ════════════ MAIN COLUMN ════════════ */}
      <div className="profile-main">

        {/* ── Profile Header Card ── */}
        <div className="glass-panel profile-header-card">

          {/* Top row: avatar + identity + actions */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: '22px',
                boxShadow: '0 0 24px hsla(var(--primary)/0.45)',
              }}>
                {getInitials(user.name)}
              </div>
              {isVerified && (
                <div style={{
                  position: 'absolute', bottom: 1, right: 1,
                  background: '#10b981', borderRadius: '50%', width: '20px', height: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 8px rgba(16,185,129,0.7)', border: '2px solid #05050a'
                }}>
                  <CheckCircle size={11} style={{ color: 'white' }} />
                </div>
              )}
            </div>

            {/* Name + role + bio */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0 }}>{user.name}</h1>
                {isVerified && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '9999px',
                    background: 'rgba(16,185,129,0.12)', color: '#10b981',
                    border: '1px solid rgba(16,185,129,0.3)',
                  }}>
                    <Shield size={10} /> Verified Peer
                  </span>
                )}
                {user.is_pro && (
                  <span className="profile-pro-badge">PRO</span>
                )}
              </div>
              {!editingBio ? (
                <>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--primary))', fontWeight: 600, marginBottom: '6px' }}>{role}</p>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: 1.65, maxWidth: '560px' }}>{bio}</p>
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
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginLeft: 'auto' }}>
              {!editingBio ? (
                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}
                  onClick={() => setEditingBio(true)}>
                  <Edit3 size={12} /> Edit Profile
                </button>
              ) : (
                <>
                  <button className="btn btn-success" style={{ fontSize: '12px', padding: '7px 12px' }}
                    onClick={() => { onUpdateUser({ bio, role }); setEditingBio(false); }}>
                    <Save size={12} /> Save
                  </button>
                  <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '7px 12px' }}
                    onClick={() => setEditingBio(false)}>
                    <X size={12} /> Cancel
                  </button>
                </>
              )}
              <button
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '7px 12px' }}
                onClick={() => setShowSettings(s => !s)}>
                ⚙ Settings
              </button>
            </div>
          </div>

          {/* External links + hire status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', flexWrap: 'wrap' }}>
            {sGithub && (
              <a href={sGithub} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Github size={13} /> GitHub
              </a>
            )}
            {sPortfolio && (
              <a href={sPortfolio} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Globe size={13} /> Portfolio
              </a>
            )}
            {sLinkedin && (
              <a href={sLinkedin} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Linkedin size={13} /> LinkedIn
              </a>
            )}
            {sTwitter && (
              <a href={sTwitter} target="_blank" rel="noopener noreferrer"
                className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', gap: '6px' }}>
                <Twitter size={13} /> Twitter
              </a>
            )}
            {/* Hire status toggle */}
            <button
              onClick={handleToggleHire}
              style={{
                marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '7px 14px', borderRadius: '9999px', fontWeight: 700, fontSize: '12px',
                cursor: 'pointer', border: '1px solid', transition: 'all 0.25s',
                background: availableForHire ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                borderColor: availableForHire ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.1)',
                color: availableForHire ? '#10b981' : 'hsl(var(--text-muted))',
              }}>
              <span style={{
                display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
                background: availableForHire ? '#10b981' : 'rgba(255,255,255,0.2)',
                boxShadow: availableForHire ? '0 0 6px #10b981' : 'none',
              }} />
              {availableForHire ? 'Available for Hire' : 'Not Looking'}
            </button>
          </div>

          {/* Stats strip */}
          <div className="profile-stats-strip">
            <div className="profile-stat">
              <span className="profile-stat-value">{myProjects.length}</span>
              <span className="profile-stat-label">Projects</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">{critiquesGiven.length || 3}</span>
              <span className="profile-stat-label">Reviews Given</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">{isVerified ? '🟢' : '—'}</span>
              <span className="profile-stat-label">Verified</span>
            </div>
            <div className="profile-stat-divider" />
            <div className="profile-stat">
              <span className="profile-stat-value">${hourlyRate}/hr</span>
              <span className="profile-stat-label">Freelance Rate</span>
            </div>
          </div>
        </div>

        {/* ── Settings Panel (inline) ── */}
        {showSettings && (
          <div className="glass-panel profile-settings-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={16} style={{ color: 'hsl(var(--primary))' }} />
                Verification & Settings
              </h2>
              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '12px' }}
                onClick={() => setShowSettings(false)}>
                <X size={13} /> Close
              </button>
            </div>

            {/* Verification status banner */}
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--radius)', marginBottom: '24px',
              background: isVerified ? 'rgba(16,185,129,0.08)' : 'rgba(99,102,241,0.07)',
              border: `1px solid ${isVerified ? 'rgba(16,185,129,0.25)' : 'hsla(var(--primary)/0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ fontSize: '24px' }}>{isVerified ? '✅' : '🔒'}</div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: isVerified ? '#10b981' : 'white', marginBottom: '2px' }}>
                  {isVerified ? '🟢 Verified Peer badge earned!' : 'Link GitHub + Portfolio to earn "Verified Peer" badge'}
                </p>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  {isVerified
                    ? 'Your profile is now trusted by the Give2Get community.'
                    : 'Connect both to unlock the badge, prize pool payouts, and priority review matching.'}
                </p>
              </div>
            </div>

            <div className="settings-grid">

              {/* GitHub */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Github size={13} /> GitHub Profile URL {sGithub && <span style={{ color: '#10b981', fontSize: '10px' }}>✓ Linked</span>}
                </label>
                <input className="form-textarea" style={{ padding: '10px 12px' }}
                  value={sGithub} onChange={e => setSGithub(e.target.value)}
                  placeholder="https://github.com/yourusername" />
              </div>

              {/* Portfolio */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={13} /> Portfolio / Website {sPortfolio && <span style={{ color: '#10b981', fontSize: '10px' }}>✓ Linked</span>}
                </label>
                <input className="form-textarea" style={{ padding: '10px 12px' }}
                  value={sPortfolio} onChange={e => setSPortfolio(e.target.value)}
                  placeholder="https://yourportfolio.dev" />
              </div>

              {/* LinkedIn */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Linkedin size={13} /> LinkedIn URL
                </label>
                <input className="form-textarea" style={{ padding: '10px 12px' }}
                  value={sLinkedin} onChange={e => setSLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile" />
              </div>

              {/* Twitter */}
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Twitter size={13} /> Twitter / X URL
                </label>
                <input className="form-textarea" style={{ padding: '10px 12px' }}
                  value={sTwitter} onChange={e => setSTwitter(e.target.value)}
                  placeholder="https://twitter.com/yourhandle" />
              </div>

              {/* Payout */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={13} /> Payout Details
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>— for $100 Prize Pool claims</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <input className="form-textarea" style={{ padding: '10px 12px' }}
                    value={sUpi} onChange={e => setSUpi(e.target.value)}
                    placeholder="UPI ID (e.g. name@upi)" />
                  <input className="form-textarea" style={{ padding: '10px 12px' }}
                    value={sPaypal} onChange={e => setSPaypal(e.target.value)}
                    placeholder="PayPal Email" />
                </div>
              </div>

              {/* Hourly rate */}
              <div className="form-group">
                <label className="form-label"><Zap size={13} /> Freelance Hourly Rate ($)</label>
                <input className="form-textarea" type="number" min={5} max={500} style={{ padding: '10px 12px' }}
                  value={hourlyRate} onChange={e => setHourlyRate(parseInt(e.target.value) || 15)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-success" style={{ minWidth: '160px', padding: '11px' }}
                onClick={handleSaveSettings}>
                {settingsSaved
                  ? <><CheckCircle size={14} /> Saved!</>
                  : <><Save size={14} /> Save Settings</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Showcase Tabs ── */}
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Tab bar */}
          <div className="profile-tabs">
            {([
              { id: 'projects',  icon: <Briefcase size={13} />,  label: 'Projects' },
              { id: 'critiques', icon: <MessageSquare size={13} />, label: 'Critiques Given' },
              { id: 'heatmap',   icon: <Activity size={13} />,   label: 'Review Activity' },
            ] as const).map(t => (
              <button key={t.id}
                className={`profile-tab ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── Tab: Projects ── */}
          {activeTab === 'projects' && (
            <div style={{ padding: '24px' }}>
              {myProjects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Briefcase size={32} style={{ color: 'hsl(var(--text-muted))', opacity: 0.35, marginBottom: '12px' }} />
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>No projects posted yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myProjects.map(p => {
                    const progress = Math.min((p.reviews.length / p.targetReviews) * 100, 100);
                    return (
                      <div key={p.id} className="profile-project-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white' }}>{p.title}</h3>
                              {p.is_featured && (
                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '9999px',
                                  background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
                                  ★ Featured
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', lineHeight: 1.55, marginBottom: '10px' }}>
                              {p.description.slice(0, 120)}…
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {p.tags.map(t => <span key={t} className="project-tag" style={{ fontSize: '10px' }}>{t}</span>)}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {p.githubUrl && p.githubUrl !== '#' && (
                              <a href={p.githubUrl} target="_blank" rel="noopener noreferrer"
                                className="btn btn-secondary" style={{ padding: '6px' }}>
                                <Github size={13} />
                              </a>
                            )}
                            {p.demoUrl && p.demoUrl !== '#' && (
                              <a href={p.demoUrl} target="_blank" rel="noopener noreferrer"
                                className="btn btn-secondary" style={{ padding: '6px' }}>
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </div>
                        </div>
                        {/* Progress */}
                        <div style={{ marginTop: '14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '5px' }}>
                            <span>{p.reviews.length} / {p.targetReviews} reviews</span>
                            <span style={{ fontWeight: 600 }}>{Math.round(progress)}%</span>
                          </div>
                          <div className="credit-progress-bar" style={{ height: '4px' }}>
                            <div className="credit-progress-fill" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                        {/* Upvote stat */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px' }}>
                          <Heart size={12} style={{ color: '#f59e0b' }} />
                          <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                            {p.reviews.length * 3 + 7} upvotes from community
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Tab: Critiques Given ── */}
          {activeTab === 'critiques' && (
            <div style={{ padding: '24px' }}>
              {/* Mock critiques since the user probably authored reviews in other mock data */}
              {[
                {
                  id: 'c1',
                  projectTitle: 'PulseCSS: Glassmorphic Component Studio',
                  content: 'Visually outstanding. The slider response is highly interactive and the generated code copy feature is super clean. One issue: on iOS Safari, the backdrop filter has some visual lag. Consider using hardware acceleration rules.',
                  rating: 4, likes: 7, createdAt: '2026-08-09'
                },
                {
                  id: 'c2',
                  projectTitle: 'NeuralSketch: AI-Powered Wireframe Tool',
                  content: 'Really impressive neural processing pipeline. The WebRTC room system works flawlessly. The canvas rendering performance could be optimized by batching draw calls and using requestAnimationFrame more aggressively.',
                  rating: 5, likes: 12, createdAt: '2026-08-11'
                },
                {
                  id: 'c3',
                  projectTitle: 'ChronoBoard: Real-Time Kanban with Time Analytics',
                  content: 'The time-tracking overlay is a great UX differentiator. I suggest adding keyboard shortcuts for moving cards (J/K) and a drag-handle visible on hover to improve accessibility. The analytics charts could use better color contrast for WCAG AA compliance.',
                  rating: 4, likes: 5, createdAt: '2026-08-12'
                },
              ].map(c => (
                <div key={c.id} className="profile-critique-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Review on
                      </span>
                      <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--primary))', marginTop: '2px' }}>
                        {c.projectTitle}
                      </h4>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1,2,3,4,5].map(s => (
                        <span key={s} style={{ fontSize: '12px', color: s <= c.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: 1.65, marginBottom: '12px' }}>
                    {c.content}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{c.createdAt}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600,
                      color: 'hsl(var(--primary))', padding: '4px 10px', borderRadius: '9999px',
                      background: 'hsla(var(--primary)/0.1)', border: '1px solid hsla(var(--primary)/0.2)' }}>
                      👍 {c.likes} Helpful
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Tab: Review Activity Heatmap ── */}
          {activeTab === 'heatmap' && (
            <div style={{ padding: '32px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Review Contribution Activity</h3>
                  <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Last 5 weeks of peer review contributions</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>
                    {HEATMAP_DATA.reduce((a, b) => a + b, 0)}
                  </span>
                  <span style={{ display: 'block', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>total reviews</span>
                </div>
              </div>

              <HeatmapGrid data={HEATMAP_DATA} />

              {/* Activity summary pills */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '24px' }}>
                {[
                  { label: 'Current Streak', value: '4 days', icon: <Zap size={12} style={{ color: '#f59e0b' }} /> },
                  { label: 'Best Streak', value: '9 days', icon: <Star size={12} style={{ color: '#f59e0b' }} /> },
                  { label: 'Avg / Week', value: '6 reviews', icon: <Activity size={12} style={{ color: 'hsl(var(--primary))' }} /> },
                  { label: 'Credits Earned', value: '31 credits', icon: <Award size={12} style={{ color: 'hsl(var(--secondary))' }} /> },
                ].map(stat => (
                  <div key={stat.label} style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 'var(--radius)', flex: '1 1 160px'
                  }}>
                    {stat.icon}
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{stat.value}</div>
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ════════════ SIDEBAR COLUMN ════════════ */}
      <div className="profile-sidebar-col">

        {/* Direct Hire Widget */}
        <div className="glass-panel profile-hire-widget">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%',
              width: '38px', height: '38px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Briefcase size={16} style={{ color: '#05050a' }} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px', color: 'white', marginBottom: '2px' }}>
                Hire {user.name.split(' ')[0]}
              </p>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Freelance · ${hourlyRate}/hr
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {[
              { icon: <CheckCircle size={12} />, text: availableForHire ? 'Currently available' : 'Not available now' },
              { icon: <Zap size={12} />, text: 'Responds within 24h' },
              { icon: <Users size={12} />, text: 'Give2Get Verified Peer' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                <span style={{ color: isVerified ? '#10b981' : 'hsl(var(--text-muted))' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>

          <button
            className="btn"
            disabled={hireSent || !availableForHire}
            onClick={() => setHireSent(true)}
            style={{
              width: '100%', padding: '12px', fontWeight: 800, fontSize: '14px',
              background: hireSent
                ? 'rgba(16,185,129,0.15)'
                : availableForHire
                ? 'linear-gradient(90deg,#f59e0b,#d97706)'
                : 'rgba(255,255,255,0.05)',
              color: hireSent ? '#10b981' : availableForHire ? '#05050a' : 'hsl(var(--text-muted))',
              border: hireSent ? '1px solid rgba(16,185,129,0.3)' : availableForHire ? 'none' : '1px solid rgba(255,255,255,0.08)',
              cursor: hireSent || !availableForHire ? 'default' : 'pointer',
            }}>
            {hireSent ? '✓ Request Sent!' : availableForHire ? '⚡ Send Hire Request' : 'Currently Unavailable'}
          </button>

          {hireSent && (
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center', marginTop: '10px' }}>
              {user.name.split(' ')[0]} will receive your request by email.
            </p>
          )}
        </div>

        {/* Verification checklist card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Shield size={13} style={{ color: 'hsl(var(--primary))' }} />
            Verification Status
          </h4>
          {[
            { label: 'GitHub linked', done: Boolean(sGithub) },
            { label: 'Portfolio linked', done: Boolean(sPortfolio) },
            { label: 'Payout details added', done: Boolean(sUpi || sPaypal) },
            { label: '"Verified Peer" badge', done: isVerified },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', color: item.done ? '#10b981' : 'hsl(var(--text-muted))',
              marginBottom: '10px', transition: 'color 0.2s' }}>
              <span style={{ fontSize: '14px' }}>{item.done ? '✅' : '⬜'}</span>
              {item.label}
            </div>
          ))}
          {!isVerified && (
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '4px', fontSize: '12px', padding: '9px' }}
              onClick={() => setShowSettings(true)}>
              Complete Verification →
            </button>
          )}
        </div>

        {/* Quick stats card */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '14px',
            display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Award size={13} style={{ color: 'hsl(var(--secondary))' }} />
            Community Standing
          </h4>
          {[
            { icon: <Star size={11} />, label: 'Avg Review Quality', value: '4.6 / 5' },
            { icon: <Heart size={11} />, label: 'Total Helpful Votes', value: '24' },
            { icon: <Send size={11} />, label: 'Prize Pool Eligible', value: isVerified ? 'Yes ✓' : 'Verify first' },
          ].map(item => (
            <div key={item.label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontSize: '12px', marginBottom: '10px',
              color: 'hsl(var(--text-secondary))'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'hsl(var(--primary))' }}>{item.icon}</span>
                {item.label}
              </span>
              <span style={{ fontWeight: 700, color: 'white' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
