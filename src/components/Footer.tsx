import React, { useState } from 'react';
import { 
  Layers, Github, Twitter, MessageCircle, X, Shield, CheckCircle 
} from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: 'explore' | 'queue' | 'leaderboard' | 'bounties') => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | null>(null);

  const handleLinkClick = (e: React.MouseEvent, tab: 'explore' | 'queue' | 'leaderboard' | 'bounties') => {
    e.preventDefault();
    onNavigate(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={{ marginTop: 'auto', paddingTop: '48px', borderTop: '1px solid #e7e5e4', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', width: '100%', flexShrink: 0 }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 32px 24px' }}>
        
        {/* Responsive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          
          {/* Column 1: Brand */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Layers className="logo-glow" size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917' }}>Give2Get</span>
            </div>
            <p style={{ fontSize: '12px', color: '#57534e', lineHeight: 1.6, marginBottom: '20px', maxWidth: '280px' }}>
              Give 2 reviews, get 1 post unlocked. Built for builders with high craft standards.
            </p>
            
            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#8c857b', hover: { color: '#f59e0b' } } as any} title="GitHub">
                <Github size={18} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: '#8c857b', hover: { color: '#f59e0b' } } as any} title="Twitter">
                <Twitter size={18} />
              </a>
              <a href="https://discord.com" target="_blank" rel="noreferrer" style={{ color: '#8c857b', hover: { color: '#f59e0b' } } as any} title="Discord">
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Product</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="#explore" onClick={e => handleLinkClick(e, 'explore')} style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Explore Feed</a>
              <a href="#queue" onClick={e => handleLinkClick(e, 'queue')} style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Review Queue</a>
              <a href="#leaderboard" onClick={e => handleLinkClick(e, 'leaderboard')} style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Leaderboard</a>
              <a href="#bounties" onClick={e => handleLinkClick(e, 'bounties')} style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Micro-Gigs</a>
            </div>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="#docs" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Documentation</a>
              <a href="#credits" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>How Credits Work</a>
              <a href="#markdown" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Markdown Guide</a>
              <a href="#api" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Developer API</a>
            </div>
          </div>

          {/* Column 4: Legal & Trust */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Legal & Trust</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => setActiveModal('terms')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: '#57534e', textAlign: 'left', cursor: 'pointer' }}>Terms of Service</button>
              <button onClick={() => setActiveModal('privacy')} style={{ background: 'none', border: 'none', padding: 0, fontSize: '12px', color: '#57534e', textAlign: 'left', cursor: 'pointer' }}>Privacy Policy</button>
              <a href="#security" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Security Standards</a>
              <a href="#cookies" style={{ fontSize: '12px', color: '#57534e', textDecoration: 'none' }}>Cookie Preferences</a>
            </div>
          </div>

          {/* Column 5: Status */}
          <div>
            <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#1c1917', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>System Status</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>
                <CheckCircle size={10} /> All Systems Operational
              </div>
              <a href="mailto:support@give2get.dev" style={{ fontSize: '12px', color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>Contact Support</a>
            </div>
          </div>

        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e7e5e4', margin: '0 0 24px 0' }} />

        {/* Bottom Sub-Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '11px', color: '#8c857b' }}>
            © 2026 Give2Get. Built for builders with high craft standards.
          </span>
          <span style={{ fontSize: '11px', color: '#8c857b', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Made with passion for developers. <Shield size={12} style={{ color: '#f59e0b' }} />
          </span>
        </div>

      </div>

      {/* ── Boilerplate Legal Modals ── */}
      {activeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(28,25,23,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e7e5e4' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: 0 }}>
                {activeModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8c857b', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content Scroll */}
            <div style={{ padding: '24px', overflowY: 'auto', fontSize: '13px', color: '#57534e', lineHeight: 1.6 }}>
              {activeModal === 'terms' ? (
                <div>
                  <p style={{ fontWeight: 700, color: '#1c1917' }}>Welcome to Give2Get!</p>
                  <p>By accessing or using our developer review platform, you agree to comply with and be bound by these Terms of Service. Please read them carefully.</p>
                  
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>1. Platform Access & Gating</h4>
                  <p>Give2Get implements a strict credit pool contribution mechanism. In order to post a project for community critique, you must first complete at least two deep peer reviews on other hosted repositories to acquire a posting token.</p>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>2. Account Verification & GitHub Requirements</h4>
                  <p>Users must connect a valid GitHub account. We scan public profile metrics to verify identity. Any account presenting spoofed repositories or plagiarized materials will be banned immediately.</p>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>3. Acceptable Code Critique Standards</h4>
                  <p>Reviews must be structural, technical, and respectful. Spam reviews, AI-generated generic feedback, or offensive messages will result in credit forfeiture and profile suspension.</p>
                </div>
              ) : (
                <div>
                  <p style={{ fontWeight: 700, color: '#1c1917' }}>Privacy & Data Collection Policy</p>
                  <p>We care about developer privacy and seek to handle your public GitHub profile and local session data responsibly.</p>
                  
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>1. GitHub OAuth Information</h4>
                  <p>When you authenticate your developer identity, we access your public avatar, repository counts, commit aggregates, and username. We do not inspect private repositories or write changes to your GitHub account.</p>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>2. Cookies & Local Session Storage</h4>
                  <p>We use local storage and secure cookies solely to persist your authentication token and keep you signed in. We do not use third-party analytics trackers or sell data to advertisers.</p>

                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', marginTop: '16px' }}>3. Data Deletion Requests</h4>
                  <p>If you wish to remove your linked profile, connected repos, and critique history, you can trigger a profile reset or contact support at support@give2get.dev.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #e7e5e4', display: 'flex', justifyContent: 'flex-end', background: '#fafaf9' }}>
              <button 
                onClick={() => setActiveModal(null)} 
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Accept & Close
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
}
