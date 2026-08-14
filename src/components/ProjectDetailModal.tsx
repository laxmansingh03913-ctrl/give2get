import { useState, useEffect, useRef } from 'react';
import {
  X, ExternalLink, Github, Maximize2, Minimize2, Send,
  MessageSquare, Award, Globe, Users
} from 'lucide-react';
import type { Project, Review } from './Dashboard';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onAddReview: (projectId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAverageScore(review: Review) {
  const { design, code, performance } = review.scores;
  return ((design + code + performance) / 3).toFixed(1);
}

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#6366f1,#14b8a6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
];
function avatarGradient(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

const TABS = [
  {
    id: 'ui' as const,
    label: '🎨 UI / UX',
    fullLabel: 'UI / UX Feedback',
    placeholder: 'Comment on visual design, layout spacing, colour contrast, typography, mobile responsiveness, interaction flows, and accessibility…',
  },
  {
    id: 'perf' as const,
    label: '⚡ Performance',
    fullLabel: 'Performance & Code',
    placeholder: 'Mention render bottlenecks, bundle size, API latency, code architecture, security issues, code quality, or tech-debt…',
  },
  {
    id: 'idea' as const,
    label: '💡 Ideas & Polish',
    fullLabel: 'Feature Ideas & Polish',
    placeholder: 'Suggest missing features, UX wins, accessibility improvements, animations, or creative polish ideas that would delight users…',
  },
];
type TabId = 'ui' | 'perf' | 'idea';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding'];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjectDetailModal({ project, onClose, onAddReview }: ProjectDetailModalProps) {

  // ── Preview state ──
  const [iframeError, setIframeError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasLiveDemo = Boolean(project.demoUrl && project.demoUrl !== '#');

  // ── Review form state ──
  const [activeTab, setActiveTab] = useState<TabId>('ui');
  const [tabContent, setTabContent] = useState<Record<TabId, string>>({ ui: '', perf: '', idea: '' });
  const [overallRating, setOverallRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewError, setReviewError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);

  // ── Per-review interaction state ──
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});
  const [resolvedSet, setResolvedSet] = useState<Record<string, boolean>>({});

  // ── Hire CTA state ──
  const [hireSent, setHireSent] = useState(false);

  const activeText = tabContent[activeTab];
  const totalChars = Object.values(tabContent).join('').trim().length;
  const isSubmitDisabled = totalChars < 50 || overallRating === 0 || reviewError.startsWith('Spam filter');

  // ── Side effects ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Handlers ──
  const handleTabChange = (id: TabId) => {
    setActiveTab(id);
    setReviewError('');
  };

  const handleTextChange = (val: string) => {
    setTabContent(prev => ({ ...prev, [activeTab]: val }));
    if (reviewError) setReviewError('');
  };

  const handleSubmit = () => {
    if (overallRating === 0) { setReviewError('Please select a star rating before submitting.'); return; }
    if (totalChars < 50) { setReviewError('Please write at least 50 characters across the critique tabs.'); return; }

    const combined = [
      tabContent.ui && `🎨 UI/UX: ${tabContent.ui}`,
      tabContent.perf && `⚡ Performance: ${tabContent.perf}`,
      tabContent.idea && `💡 Ideas: ${tabContent.idea}`,
    ].filter(Boolean).join('\n\n');

    const words = combined.toLowerCase().split(/\s+/);
    const constructive = ['suggest','improve','better','should','could','work','issue','lag','design','clean','code','ui','ux','performance','try','add','use','optimize','fix','bug','accessibility','responsive'];
    if (words.length < 8 || !words.some(w => constructive.some(k => w.includes(k)))) {
      setReviewError('Spam filter: Please include specific design/code/UX feedback.');
      return;
    }

    setIsVerifying(true);
    setVerifyStep(1);
    setTimeout(() => setVerifyStep(2), 850);
    setTimeout(() => setVerifyStep(3), 1700);
    setTimeout(() => {
      onAddReview(project.id, {
        author: 'You (Dev Peer)',
        content: combined,
        scores: { design: overallRating, code: overallRating, performance: overallRating },
      });
      setIsVerifying(false);
      setTabContent({ ui: '', perf: '', idea: '' });
      setOverallRating(0);
      setVerifyStep(0);
    }, 2600);
  };

  const handleHelpful = (id: string) => {
    if (helpfulVoted[id]) return;
    setHelpfulCounts(p => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
    setHelpfulVoted(p => ({ ...p, [id]: true }));
  };

  const toggleResolved = (id: string) => setResolvedSet(p => ({ ...p, [id]: !p[id] }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="pdm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`pdm-shell glass-panel ${fullscreen ? 'pdm-fullscreen' : ''}`}>

        {/* Close */}
        <button className="pdm-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* ══════════════════════════ LEFT PANEL ══════════════════════════ */}
        <div className="pdm-left">

          {/* ── Creator + Title ── */}
          <div className="pdm-section">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%', flexShrink: 0,
                background: avatarGradient(project.author),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 800, fontSize: '14px'
              }}>
                {getInitials(project.author)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{project.author}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px',
                    background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)'
                  }}>Open to Hire</span>
                </div>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{project.authorTitle}</span>
              </div>
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: '10px' }}>
              {project.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {project.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {hasLiveDemo && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="btn btn-primary" style={{ fontSize: '13px', padding: '9px 16px' }}>
                  <Globe size={14} /> Live Demo ↗
                </a>
              )}
              {project.githubUrl && project.githubUrl !== '#' && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" style={{ fontSize: '13px', padding: '9px 16px' }}>
                  <Github size={14} /> GitHub Repo
                </a>
              )}
              {!hasLiveDemo && (
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', alignSelf: 'center' }}>No live demo</span>
              )}
            </div>
          </div>

          {/* ── Live Preview ── */}
          <div className="pdm-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live Preview
              </span>
              {hasLiveDemo && (
                <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', gap: '5px' }}
                  onClick={() => setFullscreen(f => !f)}>
                  {fullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
              )}
            </div>

            <div className="pdm-preview-frame">
              {hasLiveDemo && !iframeError ? (
                <>
                  <iframe
                    ref={iframeRef}
                    src={project.demoUrl}
                    title={`${project.title} live preview`}
                    className="pdm-iframe"
                    onError={() => setIframeError(true)}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                  />
                  <div className="pdm-iframe-overlay" onClick={() => window.open(project.demoUrl, '_blank')}>
                    <span style={{ fontSize: '11px', background: 'rgba(0,0,0,0.55)', padding: '4px 12px', borderRadius: '20px', color: 'white' }}>
                      Open in full tab ↗
                    </span>
                  </div>
                </>
              ) : (
                <div className="pdm-preview-fallback">
                  <div className="project-thumbnail-pattern" style={{ opacity: 0.06 }} />
                  <div style={{ textAlign: 'center', zIndex: 1, padding: '20px', position: 'relative' }}>
                    <span className="project-thumbnail-logo" style={{ fontSize: '56px', display: 'block', marginBottom: '14px' }}>
                      {project.title.split(' ')[0].replace(':', '')}
                    </span>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', maxWidth: '260px', lineHeight: 1.5 }}>
                      {hasLiveDemo ? 'Preview blocked by browser security policy.' : 'No live demo URL provided by creator.'}
                    </p>
                    {hasLiveDemo && (
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                        className="btn btn-primary" style={{ marginTop: '16px', fontSize: '12px' }}>
                        <ExternalLink size={12} /> Open Full Preview
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Project story ── */}
          <div className="pdm-section">
            <h3 className="pdm-section-title">What problem does this solve?</h3>
            <p style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', lineHeight: 1.75 }}>
              {project.description}
            </p>
          </div>

          {/* ── Creator's review focus prompt ── */}
          <div className="pdm-section">
            <div className="pdm-focus-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <MessageSquare size={13} style={{ color: 'hsl(var(--primary))' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--primary))', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Creator's Review Focus
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: 1.65 }}>
                {`Looking for feedback on mobile responsiveness, accessibility (WCAG AA), performance of the ${project.tags[0] ?? 'core'} layer, and overall UX coherence across breakpoints.`}
              </p>
            </div>
          </div>

          {/* ── Direct Hire CTA ── */}
          <div className="pdm-section pdm-hire-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%',
                width: '40px', height: '40px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0
              }}>
                <Award size={18} style={{ color: '#05050a' }} />
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', marginBottom: '2px' }}>
                  Want this developer for your team?
                </p>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                  Send a hiring inquiry directly via Give2Get.
                </p>
              </div>
            </div>
            <button
              className="btn"
              onClick={() => setHireSent(true)}
              disabled={hireSent}
              style={{
                width: '100%', padding: '12px', fontWeight: 800, fontSize: '14px',
                background: hireSent ? 'rgba(16,185,129,0.15)' : 'linear-gradient(90deg,#f59e0b,#d97706)',
                color: hireSent ? '#10b981' : '#05050a',
                border: hireSent ? '1px solid rgba(16,185,129,0.3)' : 'none',
                cursor: hireSent ? 'default' : 'pointer',
              }}
            >
              {hireSent ? '✓ Hire Offer Sent!' : '⚡ Send Hire Offer ($15/hr)'}
            </button>
          </div>
        </div>

        {/* ══════════════════════════ RIGHT PANEL ══════════════════════════ */}
        <div className="pdm-right">

          {/* ── Panel header ── */}
          <div className="pdm-section pdm-review-header-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'white', marginBottom: '3px' }}>Leave a Review</h3>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                  Earn <span style={{ color: 'hsl(var(--secondary))', fontWeight: 700 }}>+1 Credit</span> for quality feedback
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  {project.reviews.length}/{project.targetReviews} reviews
                </span>
                <div className="credit-progress-bar" style={{ width: '72px', marginTop: '6px', height: '4px' }}>
                  <div className="credit-progress-fill" style={{
                    width: `${Math.min((project.reviews.length / project.targetReviews) * 100, 100)}%`
                  }} />
                </div>
              </div>
            </div>
          </div>

          {isVerifying ? (
            /* Verification overlay */
            <div className="pdm-section verifying-overlay" style={{ padding: '48px 24px' }}>
              <div className="verify-spinner" style={{ width: '44px', height: '44px', marginBottom: '24px' }} />
              <h3 style={{ color: 'white', marginBottom: '18px', fontSize: '16px' }}>Verifying Review Quality…</h3>
              {['Character depth check (min 50 chars)', 'Constructive NLP spam filter scan', 'Syncing balance (+1 credit)'].map((label, i) => (
                <p key={i} style={{
                  fontSize: '13px', fontWeight: 500, marginBottom: '10px',
                  color: verifyStep > i + 1 ? 'hsl(var(--success))' : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s'
                }}>
                  {verifyStep > i + 1 ? '✓' : '○'} {label}
                </p>
              ))}
            </div>
          ) : (
            <>
              {/* ── Star rating ── */}
              <div className="pdm-section" style={{ paddingBottom: '16px' }}>
                <label className="form-label" style={{ marginBottom: '12px' }}>Overall Rating *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button"
                      onClick={() => setOverallRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '32px', lineHeight: 1, padding: '2px',
                        color: (hoverRating || overallRating) >= s ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        filter: (hoverRating || overallRating) >= s ? 'drop-shadow(0 0 8px rgba(245,158,11,0.55))' : 'none',
                        transform: (hoverRating || overallRating) >= s ? 'scale(1.22)' : 'scale(1)',
                        transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                      }}>★</button>
                  ))}
                  {(hoverRating || overallRating) > 0 && (
                    <span style={{ fontSize: '13px', color: '#f59e0b', fontWeight: 700, marginLeft: '10px' }}>
                      {STAR_LABELS[hoverRating || overallRating]}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Critique tabs ── */}
              <div className="pdm-section" style={{ paddingTop: 0 }}>
                <div className="pdm-tabs">
                  {TABS.map(t => (
                    <button key={t.id} className={`pdm-tab ${activeTab === t.id ? 'active' : ''}`}
                      onClick={() => handleTabChange(t.id)}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <textarea
                  className="form-textarea"
                  rows={5}
                  value={activeText}
                  onChange={e => handleTextChange(e.target.value)}
                  placeholder={TABS.find(t => t.id === activeTab)!.placeholder}
                  style={{ resize: 'vertical', marginTop: '10px' }}
                />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 600, transition: 'color 0.2s',
                    color: totalChars < 50 ? 'hsl(var(--warning))' : '#10b981',
                  }}>
                    {totalChars < 50
                      ? `${50 - totalChars} more characters needed across tabs`
                      : `✓ ${totalChars} chars — ready to submit`}
                  </span>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                    {activeText.length} in this tab
                  </span>
                </div>
              </div>

              {/* Error */}
              {reviewError && (
                <div className="pdm-section" style={{ paddingTop: 0 }}>
                  <div style={{
                    background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.25)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                    fontSize: '12px', color: 'hsl(var(--error))', fontWeight: 500,
                  }}>
                    {reviewError}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="pdm-section" style={{ paddingTop: 0 }}>
                <button className="btn btn-success"
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  style={{
                    width: '100%', padding: '13px', fontSize: '15px', fontWeight: 700,
                    opacity: isSubmitDisabled ? 0.38 : 1,
                    cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s, box-shadow 0.2s',
                    boxShadow: isSubmitDisabled ? 'none' : '0 4px 16px hsla(var(--success)/0.4)',
                  }}
                  title={isSubmitDisabled ? 'Select a star rating and write 50+ characters to submit' : ''}>
                  <Send size={15} /> Submit Review (+1 Credit)
                </button>
              </div>
            </>
          )}

          {/* ── Divider ── */}
          <div style={{ margin: '0 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

          {/* ── Community reviews stream ── */}
          <div className="pdm-section">
            <h3 style={{
              fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <MessageSquare size={15} style={{ color: 'hsl(var(--primary))' }} />
              Community Reviews
              <span style={{
                fontSize: '11px', background: 'hsla(var(--primary)/0.15)', color: 'hsl(var(--primary))',
                border: '1px solid hsla(var(--primary)/0.2)', padding: '1px 7px', borderRadius: '9999px'
              }}>{project.reviews.length}</span>
            </h3>

            {project.reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <Users size={30} style={{ color: 'hsl(var(--text-muted))', opacity: 0.4, marginBottom: '10px' }} />
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                  No reviews yet — be the first!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {project.reviews.map(review => {
                  const avgStars = Math.round(parseFloat(getAverageScore(review)));
                  return (
                    <div key={review.id} className="pdm-review-card">
                      {/* Reviewer row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                        <div style={{
                          width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                          background: avatarGradient(review.author),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 800, fontSize: '12px'
                        }}>
                          {getInitials(review.author)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, color: 'white', fontSize: '13px' }}>{review.author}</span>
                            {resolvedSet[review.id] && (
                              <span style={{
                                fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '9999px',
                                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                                border: '1px solid rgba(16,185,129,0.25)', textTransform: 'uppercase'
                              }}>✓ Resolved</span>
                            )}
                          </div>
                          {/* Star display */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px' }}>
                            {[1,2,3,4,5].map(s => (
                              <span key={s} style={{ fontSize: '12px', color: s <= avgStars ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}>★</span>
                            ))}
                            <span className="badge badge-indigo" style={{ fontSize: '10px', marginLeft: '6px' }}>
                              {getAverageScore(review)}/5
                            </span>
                          </div>
                        </div>
                      </div>

                      <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: 1.65, marginBottom: '12px' }}>
                        {review.content}
                      </p>

                      {/* Action row */}
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleHelpful(review.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: 600, padding: '5px 11px',
                            borderRadius: '9999px', border: '1px solid', transition: 'all 0.2s',
                            cursor: helpfulVoted[review.id] ? 'default' : 'pointer',
                            background: helpfulVoted[review.id] ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)',
                            borderColor: helpfulVoted[review.id] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                            color: helpfulVoted[review.id] ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                          }}>
                          👍 Helpful{(helpfulCounts[review.id] ?? 0) > 0 ? ` (${helpfulCounts[review.id]})` : ''}
                        </button>
                        <button
                          onClick={() => toggleResolved(review.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            fontSize: '12px', fontWeight: 600, padding: '5px 11px',
                            borderRadius: '9999px', border: '1px solid', cursor: 'pointer', transition: 'all 0.2s',
                            background: resolvedSet[review.id] ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                            borderColor: resolvedSet[review.id] ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
                            color: resolvedSet[review.id] ? '#10b981' : 'hsl(var(--text-secondary))',
                          }}>
                          💡 {resolvedSet[review.id] ? 'Unresolved' : 'Mark Resolved'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
