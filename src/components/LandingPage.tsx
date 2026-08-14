import { MessageSquare, Layers, Sparkles, Send, Award } from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="landing-container">
      {/* Navigation */}
      <header className="landing-nav">
        <div className="sidebar-logo">
          <Layers className="logo-glow" size={24} />
          <span>Give2<span className="logo-glow">Get</span></span>
        </div>
        <button className="btn btn-secondary" onClick={onEnter}>
          Explore Feed
        </button>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <span className="badge badge-indigo" style={{ marginBottom: '16px' }}>
          <Sparkles size={12} style={{ marginRight: '6px' }} /> Proof-of-work feedback community
        </span>
        <h1 className="landing-title">
          Give 2 Reviews.<br />
          Unlock 1 Post. <span className="logo-glow">Get Hired.</span>
        </h1>
        <p className="landing-subtitle">
          Give2Get is a credit-backed peer feedback platform for developers. Trade constructive critiques on portfolio projects to unlock your own posts and catch recruiters' attention.
        </p>
        <div className="landing-cta-group">
          <button 
            className="btn btn-primary" 
            onClick={onEnter} 
            style={{ padding: '14px 28px', fontSize: '16px', borderRadius: 'var(--radius)' }}
          >
            Start Exchanging Reviews
          </button>
        </div>
      </section>

      {/* Features/Steps */}
      <section className="features-grid">
        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper">
            <MessageSquare size={22} />
          </div>
          <h3 className="feature-title">1. Review 2 Projects</h3>
          <p className="feature-desc">
            Browse other developers' projects. Rate their UI/UX, tech stack, and code organization. Leave 2 high-quality reviews to earn 2 credits.
          </p>
        </div>

        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper" style={{ borderColor: 'hsla(var(--secondary) / 0.2)', color: 'hsl(var(--secondary))', background: 'hsla(var(--secondary) / 0.1)' }}>
            <Send size={22} />
          </div>
          <h3 className="feature-title">2. Post Your Work</h3>
          <p className="feature-desc">
            Consume 2 credits to submit your own portfolio project. Get detailed feedback from other developers on how to improve your codebase and design.
          </p>
        </div>

        <div className="feature-card glass-panel">
          <div className="feature-icon-wrapper" style={{ borderColor: 'hsla(var(--success) / 0.2)', color: 'hsl(var(--success))', background: 'hsla(var(--success) / 0.1)' }}>
            <Award size={22} />
          </div>
          <h3 className="feature-title">3. Get Noticed & Hired</h3>
          <p className="feature-desc">
            Projects with constructive, highly-rated reviews rise on the Give2Get leaderboard. Recruiters browse top proof-of-work profiles to hire directly.
          </p>
        </div>
      </section>

      {/* Quick stats footer */}
      <footer style={{ marginTop: 'auto', padding: '40px', borderTop: '1px solid rgba(255,255,255,0.03)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'white' }}>1,240+</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reviews Submitted</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'white' }}>420+</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Projects Showcased</div>
          </div>
          <div>
            <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'white' }}>89%</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feedback Quality</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
