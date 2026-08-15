import { useState } from 'react';
import { ExternalLink, Github, MessageSquare, Plus, Unlock, Send, X, Sparkles, Lock, DollarSign } from 'lucide-react';


export interface Review {
  id: string;
  author: string;
  content: string;
  scores: {
    design: number;
    code: number;
    performance: number;
  };
  category?: string;
  rating?: number;
  helpfulCount?: number;
  isResolved?: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  author: string;
  authorTitle: string;
  tags: string[];
  demoUrl: string;
  githubUrl: string;
  reviewsCount: number;
  targetReviews: number;
  reviews: Review[];
  is_featured?: boolean;
}

interface DashboardProps {
  credits: number;
  projects: Project[];
  onAddReview: (projectId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
  onAddProject: (project: Omit<Project, 'id' | 'reviews' | 'reviewsCount' | 'targetReviews'>, isPaidFeatured?: boolean) => void;
  onSelectProject: (project: Project) => void;
  selectedTagFilter?: string | null;
  onSelectTagFilter?: (tag: string | null) => void;
}

export default function Dashboard({
  credits,
  projects,
  onAddReview,
  onAddProject,
  onSelectProject,
  selectedTagFilter,
  onSelectTagFilter
}: DashboardProps) {
  // Modal states
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [offerFixProject, setOfferFixProject] = useState<Project | null>(null);

  // Review form states
  const [reviewContent, setReviewContent] = useState('');
  const [scoreDesign, setScoreDesign] = useState(4);
  const [scoreCode, setScoreCode] = useState(4);
  const [scorePerformance, setScorePerformance] = useState(4);
  const [reviewError, setReviewError] = useState('');
  const [overallRating, setOverallRating] = useState(0);      // 0 = unset, 1-5 = star rating
  const [hoverRating, setHoverRating] = useState(0);          // hover highlight state

  // Per-review helpful counts & resolved state (keyed by review id)
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [helpfulVoted, setHelpfulVoted] = useState<Record<string, boolean>>({});
  const [resolvedReviews, setResolvedReviews] = useState<Record<string, boolean>>({});

  // Submit is disabled when char count is too low OR a spam error has been triggered
  const isSubmitDisabled = reviewContent.trim().length < 50 || reviewError.startsWith('Spam filter');

  // Post form states
  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [postDemo, setPostDemo] = useState('');
  const [postGithub, setPostGithub] = useState('');
  const [postTags, setPostTags] = useState('');
  const [postError, setPostError] = useState('');

  // Tag filter state (controlled by parent or local fallback)
  const [localActiveFilter, setLocalActiveFilter] = useState<string | null>(null);
  const activeFilter = selectedTagFilter !== undefined ? selectedTagFilter : localActiveFilter;
  const setActiveFilter = onSelectTagFilter !== undefined ? onSelectTagFilter : setLocalActiveFilter;

  // Unlock and Payment selection states
  const [unlockMethod, setUnlockMethod] = useState<'credits' | 'fasttrack'>('credits');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentOption, setPaymentOption] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentStep, setPaymentStep] = useState(0); // 0: checkout input, 1: processing spinner, 2: success screen

  // Review quality check loading state
  const [isVerifyingReview, setIsVerifyingReview] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0); // 0: not verifying, 1: length scan, 2: spam scan, 3: credit allocation

  // Filter projects based on selected tag
  const filteredProjects = activeFilter
    ? projects.filter(p => p.tags.map(t => t.toLowerCase()).includes(activeFilter.toLowerCase()))
    : projects;

  // Pin Featured projects to the top, while maintaining newest-first order
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return 0;
  });

  // Unique list of all tags for filter pills
  const allTags = Array.from(new Set(projects.flatMap(p => p.tags)));

  // Handlers
  const handleOpenReview = (project: Project) => {
    setSelectedProject(project);
    setReviewContent('');
    setScoreDesign(4);
    setScoreCode(4);
    setScorePerformance(4);
    setReviewError('');
    setOverallRating(0);
    setHoverRating(0);
    setIsReviewModalOpen(true);
    setIsVerifyingReview(false);
    setVerificationStep(0);
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulVoted[reviewId]) return; // already voted
    setHelpfulCounts(prev => ({ ...prev, [reviewId]: (prev[reviewId] ?? 0) + 1 }));
    setHelpfulVoted(prev => ({ ...prev, [reviewId]: true }));
  };

  const handleMarkResolved = (reviewId: string) => {
    setResolvedReviews(prev => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewContent.trim().length < 50) {
      setReviewError('Review content must be at least 50 characters for constructive quality control.');
      return;
    }

    // Quick structural checks to simulate quality check
    const words = reviewContent.toLowerCase().split(/\s+/);
    const constructiveKeywords = ['suggest', 'improve', 'better', 'should', 'could', 'work', 'issue', 'lag', 'design', 'clean', 'code', 'ui', 'ux', 'performance', 'try', 'add', 'use', 'optimize'];
    const hasKeywords = words.some(w => constructiveKeywords.some(keyword => w.includes(keyword)));

    if (words.length < 8 || !hasKeywords) {
      setReviewError('Spam filter warning: Please provide more constructive details, suggestions, or design/code critiques.');
      return;
    }

    if (!selectedProject) return;

    // Trigger AI spam verifier loading stages
    setIsVerifyingReview(true);
    setVerificationStep(1);

    setTimeout(() => {
      setVerificationStep(2);
      setTimeout(() => {
        setVerificationStep(3);
        setTimeout(() => {
          onAddReview(selectedProject.id, {
            author: 'You (Dev Peer)',
            content: reviewContent,
            scores: {
              design: scoreDesign,
              code: scoreCode,
              performance: scorePerformance
            }
          });
          setIsVerifyingReview(false);
          setIsReviewModalOpen(false);
          setSelectedProject(null);
        }, 800);
      }, 800);
    }, 800);
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postDesc) {
      setPostError('Please enter a project title and description.');
      return;
    }

    if (unlockMethod === 'fasttrack') {
      // Trigger Stripe/Razorpay mock billing modal
      setIsPaying(true);
      setPaymentStep(0);
    } else {
      if (credits < 2) {
        setPostError('You need at least 2 credits to post a project. Review other projects first!');
        return;
      }

      const tagList = postTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      onAddProject({
        title: postTitle,
        description: postDesc,
        author: 'You (Creator)',
        authorTitle: 'Frontend Engineer',
        tags: tagList.length > 0 ? tagList : ['React', 'Web'],
        demoUrl: postDemo || '#',
        githubUrl: postGithub || '#'
      }, false);

      // Reset fields
      setPostTitle('');
      setPostDesc('');
      setPostDemo('');
      setPostGithub('');
      setPostTags('');
      setPostError('');
      setIsPostModalOpen(false);
    }
  };

  const handleCardNumberChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (val: string) => {
    const clean = val.replace(/\D/g, '');
    let formatted = clean;
    if (clean.length > 2) {
      formatted = `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
    }
    setCardExpiry(formatted.substring(0, 5));
  };

  const handleExecutePayment = () => {
    if (paymentOption === 'card') {
      if (!cardNumber || !cardExpiry || !cardCVV) {
        alert('Please fill out card checkout fields.');
        return;
      }
    } else {
      if (!upiId || !upiId.includes('@')) {
        alert('Please enter a valid UPI ID (e.g. user@okaxis).');
        return;
      }
    }

    setPaymentStep(1); // processing

    setTimeout(() => {
      setPaymentStep(2); // success
      setTimeout(() => {
        const tagList = postTags
          .split(',')
          .map(t => t.trim())
          .filter(t => t.length > 0);

        onAddProject({
          title: postTitle,
          description: postDesc,
          author: 'You (Creator)',
          authorTitle: 'Frontend Engineer',
          tags: tagList.length > 0 ? tagList : ['React', 'Web'],
          demoUrl: postDemo || '#',
          githubUrl: postGithub || '#'
        }, true); // true = featured project

        // Reset forms
        setPostTitle('');
        setPostDesc('');
        setPostDemo('');
        setPostGithub('');
        setPostTags('');
        setPostError('');
        setIsPaying(false);
        setIsPostModalOpen(false);
      }, 1500);
    }, 2000);
  };

  const getAverageScore = (review: Review) => {
    const { design, code, performance } = review.scores;
    return ((design + code + performance) / 3).toFixed(1);
  };

  return (
    <div>
      {/* Top Header */}
      <div className="view-header">
        <div className="view-title">
          <h1>Explore Peer Projects</h1>
          <p>Review projects to earn credits, or unlock your project posting.</p>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => {
            setUnlockMethod(credits >= 2 ? 'credits' : 'fasttrack');
            setIsPostModalOpen(true);
          }}
          style={{ position: 'relative' }}
        >
          {credits < 2 ? <Lock size={14} /> : <Plus size={16} />}
          Post Project
          {credits < 2 && (
            <span style={{
              fontSize: '9px',
              background: 'rgba(255,255,255,0.15)',
              padding: '2px 5px',
              borderRadius: '4px',
              marginLeft: '2px',
              fontWeight: 700
            }}>Need 2 credits</span>
          )}
        </button>
      </div>

      {/* Filter Pills — horizontally scrollable, no line breaks */}
      <div className="filter-scroll-row" style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600, flexShrink: 0, marginRight: '4px' }}>FILTER BY:</span>
        <button 
          className={`btn btn-secondary ${!activeFilter ? 'active' : ''}`}
          onClick={() => setActiveFilter(null)}
          style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', flexShrink: 0 }}
        >
          All
        </button>
        {allTags.map(tag => (
          <button
            key={tag}
            className={`btn btn-secondary ${activeFilter === tag ? 'active' : ''}`}
            onClick={() => setActiveFilter(tag)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '20px', flexShrink: 0 }}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Main Grid Feed */}
      {sortedProjects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
          <p style={{ marginBottom: '16px' }}>No projects found under this tag.</p>
          <button className="btn btn-secondary" onClick={() => setActiveFilter(null)}>
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid-container">
          {sortedProjects.map((project, idx) => {
            const reviewsDone = project.reviews.length;
            const isTopCard = idx === 0;
            const progressPercentage = Math.min((reviewsDone / project.targetReviews) * 100, 100);

            return (
              <div 
                key={project.id} 
                className={`glass-panel project-card ${project.is_featured || isTopCard ? 'featured' : ''}`} 
                style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onClick={() => onSelectProject(project)}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; }}
              >
                {/* Visual Preview Screenshot / Thumbnail Mockup */}
                <div className="project-thumbnail">
                  <div className="project-thumbnail-pattern"></div>
                  <span className="project-thumbnail-logo">
                    {project.title.split(' ')[0].replace(':', '')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <h3 className="project-title" style={{ marginBottom: 0 }}>{project.title}</h3>
                      {(project.is_featured || isTopCard) && (
                        <span className="featured-badge">
                          <Sparkles size={10} className="sparkle-glow" /> Featured
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>by {project.author}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {project.githubUrl && project.githubUrl !== '#' && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                        <Github size={14} />
                      </a>
                    )}
                    {project.demoUrl && project.demoUrl !== '#' && (
                      <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>

                <p className="project-desc">{project.description}</p>

                <div className="project-tags">
                  {project.tags.map(tag => (
                    <span key={tag} className="project-tag">{tag}</span>
                  ))}
                </div>

                <div className="project-footer">
                  <div className="project-stats" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MessageSquare size={12} /> {reviewsDone} / {project.targetReviews} Reviews
                        </span>
                        <span style={{ fontWeight: '600' }}>{Math.round(progressPercentage)}% Complete</span>
                      </div>
                      <div className="credit-progress-bar" style={{ marginBottom: '12px', height: '4px' }}>
                        <div className="credit-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                        <button 
                          className="btn btn-primary" 
                          onClick={e => { e.stopPropagation(); handleOpenReview(project); }}
                          style={{ padding: '8px' }}
                        >
                          <MessageSquare size={13} /> Review Project
                        </button>
                        <button
                          className="btn btn-offer-fix"
                          onClick={e => { e.stopPropagation(); setOfferFixProject(project); }}
                          style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}
                          title="Offer a paid fix via Fiverr-style micro-gig"
                        >
                          ⚡ Offer Fix ($10)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Submission Modal */}
      {isReviewModalOpen && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <button className="modal-close" onClick={() => setIsReviewModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'white' }}>Reviewing: {selectedProject.title}</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginBottom: '24px' }}>
              Your critique earns you **1 Credit**. Please keep feedback constructive and helpful.
            </p>

            {isVerifyingReview ? (
              <div className="verifying-overlay">
                <div className="verify-spinner" style={{ width: '40px', height: '40px', marginBottom: '20px' }}></div>
                <h3 style={{ color: 'white', marginBottom: '12px' }}>Verifying Review Quality...</h3>
                <div style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ color: verificationStep >= 1 ? 'hsl(var(--success))' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    {verificationStep >= 1 ? '✓' : '○'} Character length check (min 50 chars)
                  </p>
                  <p style={{ color: verificationStep >= 2 ? 'hsl(var(--success))' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    {verificationStep >= 2 ? '✓' : '○'} Constructive NLP spam validation check
                  </p>
                  <p style={{ color: verificationStep >= 3 ? 'hsl(var(--success))' : 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                    {verificationStep >= 3 ? '✓' : '○'} Syncing profile balance (+1 credit)
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit}>
                {/* Ratings Sliders */}
                <div className="rating-grid">
                  <div className="rating-input-card">
                    <div className="rating-input-header">
                      <span>Design & UI</span>
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>{scoreDesign}/5</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" 
                      value={scoreDesign} 
                      onChange={e => setScoreDesign(parseInt(e.target.value))} 
                      className="rating-slider"
                    />
                  </div>

                  <div className="rating-input-card">
                    <div className="rating-input-header">
                      <span>Code Quality / Tech Stack</span>
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>{scoreCode}/5</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" 
                      value={scoreCode} 
                      onChange={e => setScoreCode(parseInt(e.target.value))} 
                      className="rating-slider"
                    />
                  </div>

                  <div className="rating-input-card" style={{ gridColumn: 'span 2' }}>
                    <div className="rating-input-header">
                      <span>Performance / UX feel</span>
                      <span style={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}>{scorePerformance}/5</span>
                    </div>
                    <input 
                      type="range" min="1" max="5" 
                      value={scorePerformance} 
                      onChange={e => setScorePerformance(parseInt(e.target.value))} 
                      className="rating-slider"
                    />
                  </div>
                </div>

                {/* 5-Star Overall Rating Picker */}
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label className="form-label" style={{ marginBottom: '10px' }}>Overall Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          fontSize: '28px',
                          lineHeight: 1,
                          color: (hoverRating || overallRating) >= star ? '#f59e0b' : 'rgba(255,255,255,0.12)',
                          filter: (hoverRating || overallRating) >= star ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none',
                          transform: (hoverRating || overallRating) >= star ? 'scale(1.18)' : 'scale(1)',
                          transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                        }}
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                    {overallRating > 0 && (
                      <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, marginLeft: '6px' }}>
                        {['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding'][overallRating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Review Text */}
                <div className="form-group">
                  <label className="form-label">Written Critique (Constructive feedback)</label>
                  <textarea 
                    className="form-textarea" 
                    rows={5} 
                    placeholder="What works well? What can be optimized? Be specific about bugs, UI alignment, react rendering bugs, or clean architecture..."
                    value={reviewContent}
                    onChange={e => { setReviewContent(e.target.value); if (reviewError) setReviewError(''); }}
                    style={{ resize: 'vertical' }}
                  />
                  <span style={{
                    fontSize: '11px',
                    color: reviewContent.trim().length < 50 ? 'hsl(var(--warning))' : 'hsl(var(--text-muted))',
                    display: 'block',
                    marginTop: '6px',
                    transition: 'color 0.2s'
                  }}>
                    Minimum 50 characters. Current: {reviewContent.trim().length} chars.
                    {reviewContent.trim().length < 50 && ` (${50 - reviewContent.trim().length} more needed)`}
                  </span>
                </div>

                {reviewError && (
                  <div style={{ color: 'hsl(var(--error))', fontSize: '12px', marginBottom: '16px', fontWeight: '500' }}>
                    {reviewError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsReviewModalOpen(false)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitDisabled}
                    style={{
                      opacity: isSubmitDisabled ? 0.38 : 1,
                      cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                      transform: 'none',
                      transition: 'opacity 0.2s, box-shadow 0.2s',
                      boxShadow: isSubmitDisabled ? 'none' : undefined,
                    }}
                    title={isSubmitDisabled ? 'Write at least 50 constructive characters to submit' : ''}
                  >
                    <Send size={14} /> Submit Review (+1 Credit)
                  </button>
                </div>
              </form>
            )}

            {/* Existing Reviews */}
            {!isVerifyingReview && selectedProject.reviews.length > 0 && (
              <div className="reviews-section">
                <h3 style={{ fontSize: '16px', color: 'white', marginBottom: '16px' }}>Previous Reviews</h3>
                {selectedProject.reviews.map(review => (
                  <div key={review.id} className="review-item" style={{ position: 'relative' }}>
                    <div className="review-header">
                      <span className="review-author">{review.author}</span>
                      <div className="review-scores" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {resolvedReviews[review.id] && (
                          <span style={{
                            fontSize: '10px', fontWeight: 700, padding: '3px 8px',
                            background: 'rgba(16,185,129,0.12)', color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.25)', borderRadius: '9999px',
                            letterSpacing: '0.04em', textTransform: 'uppercase'
                          }}>✓ Resolved</span>
                        )}
                        <span className="badge badge-indigo">Avg {getAverageScore(review)}/5</span>
                      </div>
                    </div>
                    <p className="review-text">{review.content}</p>
                    {/* Review action row */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                      <button
                        onClick={() => handleHelpful(review.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontSize: '12px', fontWeight: 600, padding: '5px 10px',
                          borderRadius: '9999px', border: '1px solid',
                          cursor: helpfulVoted[review.id] ? 'default' : 'pointer',
                          background: helpfulVoted[review.id] ? 'rgba(99,102,241,0.14)' : 'rgba(255,255,255,0.03)',
                          borderColor: helpfulVoted[review.id] ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)',
                          color: helpfulVoted[review.id] ? 'hsl(var(--primary))' : 'hsl(var(--text-secondary))',
                          transition: 'all 0.2s',
                        }}
                      >
                        👍 Helpful{(helpfulCounts[review.id] ?? 0) > 0 ? ` (${helpfulCounts[review.id]})` : ''}
                      </button>
                      <button
                        onClick={() => handleMarkResolved(review.id)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          fontSize: '12px', fontWeight: 600, padding: '5px 10px',
                          borderRadius: '9999px', border: '1px solid',
                          cursor: 'pointer',
                          background: resolvedReviews[review.id] ? 'rgba(16,185,129,0.10)' : 'rgba(255,255,255,0.03)',
                          borderColor: resolvedReviews[review.id] ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
                          color: resolvedReviews[review.id] ? '#10b981' : 'hsl(var(--text-secondary))',
                          transition: 'all 0.2s',
                        }}
                      >
                        💡 {resolvedReviews[review.id] ? 'Mark Unresolved' : 'Mark Resolved'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Project Modal */}
      {isPostModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '550px' }}>
            <button className="modal-close" onClick={() => setIsPostModalOpen(false)}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '22px', marginBottom: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Unlock size={20} className="logo-glow" /> Post Your Portfolio Project
            </h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginBottom: '24px' }}>
              Complete the form below and select your gating unlock method.
            </p>

            <form onSubmit={handlePostSubmit}>
              {/* Gating Unlock Method Choice */}
              <div className="form-group">
                <label className="form-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>SELECT UNLOCK METHOD</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <button 
                    type="button"
                    className={`btn btn-secondary ${unlockMethod === 'credits' ? 'active' : ''}`}
                    onClick={() => setUnlockMethod('credits')}
                    disabled={credits < 2}
                    style={{ 
                      padding: '14px 8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '4px',
                      height: 'auto',
                      opacity: credits < 2 ? 0.45 : 1,
                      cursor: credits < 2 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Use 2 Credits</span>
                    <span style={{ fontSize: '11px', opacity: 0.85 }}>Balance: {credits} credits</span>
                  </button>
                  <button 
                    type="button"
                    className={`btn btn-secondary ${unlockMethod === 'fasttrack' ? 'active' : ''}`}
                    onClick={() => setUnlockMethod('fasttrack')}
                    style={{ 
                      padding: '14px 8px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: '4px',
                      height: 'auto',
                      borderColor: unlockMethod === 'fasttrack' ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                      boxShadow: unlockMethod === 'fasttrack' ? '0 0 10px rgba(245,158,11,0.15)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: unlockMethod === 'fasttrack' ? '#f59e0b' : 'white' }}>Fast-Track Pass</span>
                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>₹199 ($3) • Featured</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. GitLens Web Client" 
                  value={postTitle}
                  onChange={e => setPostTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Project Description</label>
                <textarea 
                  className="form-textarea" 
                  rows={4} 
                  placeholder="Summarize your project, the technical challenges you solved, and what specific feedback you're looking for..."
                  value={postDesc}
                  onChange={e => setPostDesc(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Live App URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://app.com" 
                    value={postDemo}
                    onChange={e => setPostDemo(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub Repository URL</label>
                  <input 
                    type="url" 
                    className="form-input" 
                    placeholder="https://github.com/..." 
                    value={postGithub}
                    onChange={e => setPostGithub(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tech Tags (comma separated)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="React, TypeScript, Vite, WebGL" 
                  value={postTags}
                  onChange={e => setPostTags(e.target.value)}
                />
              </div>

              {postError && (
                <div style={{ color: 'hsl(var(--error))', fontSize: '12px', marginBottom: '16px', fontWeight: '500' }}>
                  {postError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPostModalOpen(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{
                    background: unlockMethod === 'fasttrack' ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '',
                    color: unlockMethod === 'fasttrack' ? '#05050a' : 'white',
                    fontWeight: unlockMethod === 'fasttrack' ? '800' : '600'
                  }}
                >
                  {unlockMethod === 'fasttrack' ? 'Pay & Post' : 'Deduct 2 Credits & Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Gateway Checkout Modal Overlay */}
      {isPaying && (
        <div className="modal-overlay" style={{ zIndex: 200 }}>
          <div className="modal-content glass-panel checkout-modal" style={{ padding: '24px', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <button className="modal-close" onClick={() => setIsPaying(false)}>
              <X size={20} />
            </button>
            
            {paymentStep === 0 && (
              <div>
                <div className="contact-header" style={{ marginBottom: '20px' }}>
                  <div className="contact-avatar" style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    <Sparkles size={18} style={{ color: 'white' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '2px' }}>Fast-Track Featured Pass</h2>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Unlock project instantly & pin it as Featured</p>
                  </div>
                </div>

                <div className="price-summary">
                  <span style={{ fontSize: '14px', color: 'hsl(var(--text-secondary))', fontWeight: 500 }}>Total Amount:</span>
                  <span style={{ fontSize: '20px', color: 'white', fontWeight: 800 }}>₹199.00 / $3.00</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>SELECT PAYMENT METHOD</label>
                  <div className="payment-methods">
                    <button 
                      type="button"
                      className={`payment-option ${paymentOption === 'card' ? 'active' : ''}`}
                      onClick={() => setPaymentOption('card')}
                      style={{ height: 'auto', padding: '12px' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Credit/Debit Card</span>
                    </button>
                    <button 
                      type="button"
                      className={`payment-option ${paymentOption === 'upi' ? 'active' : ''}`}
                      onClick={() => setPaymentOption('upi')}
                      style={{ height: 'auto', padding: '12px' }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 'bold' }}>UPI (GPay/PhonePe)</span>
                    </button>
                  </div>
                </div>

                {paymentOption === 'card' ? (
                  <div className="payment-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Card Number</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={e => handleCardNumberChange(e.target.value)}
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Expiry Date</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={e => handleExpiryChange(e.target.value)}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">CVV</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          placeholder="•••"
                          value={cardCVV}
                          onChange={e => setCardCVV(e.target.value.replace(/\D/g, '').substring(0, 3))}
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="payment-details" style={{ padding: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">UPI ID / VPA</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="username@okaxis"
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <button 
                  type="button" 
                  className="btn" 
                  style={{ width: '100%', padding: '14px', background: 'linear-gradient(90deg, #f59e0b, #d97706)', border: 'none', color: '#05050a', fontWeight: '800', marginTop: '16px', borderRadius: 'var(--radius)' }}
                  onClick={handleExecutePayment}
                >
                  Pay Securely (₹199)
                </button>
              </div>
            )}

            {paymentStep === 1 && (
              <div className="verifying-overlay">
                <div className="verify-spinner" style={{ borderColor: 'rgba(245,158,11,0.1)', borderTopColor: '#f59e0b', width: '40px', height: '40px' }}></div>
                <h3 style={{ color: 'white', fontSize: '18px' }}>Processing Transaction...</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>Do not refresh or close this checkout session.</p>
              </div>
            )}

            {paymentStep === 2 && (
              <div className="verifying-overlay">
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '16px', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '800' }}>Payment Successful!</h3>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>Your project is being posted as Featured.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Offer Fix Micro-Gig Modal */}
      {offerFixProject && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '480px', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <button className="modal-close" onClick={() => setOfferFixProject(null)}>
              <X size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'linear-gradient(135deg, #1dbf73, #14a363)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={20} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', color: 'white', marginBottom: '2px' }}>Offer a Paid Fix</h2>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Fiverr-style micro-gig for <strong style={{ color: 'hsl(var(--primary))' }}>{offerFixProject.title}</strong></p>
              </div>
            </div>

            <div style={{ background: 'rgba(29, 191, 115, 0.07)', border: '1px solid rgba(29, 191, 115, 0.2)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>Fix Gig Price</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'white' }}>$10.00</span>
              </div>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', lineHeight: 1.5 }}>
                You'll submit a targeted bug fix or UI improvement for this project within 48h. The project author pays upon accepting your offer.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Describe Your Fix Offer</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. I'll fix the iOS Safari backdrop-filter lag by adding hardware acceleration CSS rules and restructuring the blur layer..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Delivery Time</label>
              <select className="form-textarea" style={{ padding: '10px 12px', cursor: 'pointer' }} defaultValue="48h">
                <option value="24h">Within 24 hours</option>
                <option value="48h">Within 48 hours</option>
                <option value="72h">Within 72 hours</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setOfferFixProject(null)}>Cancel</button>
              <button
                className="btn"
                style={{ background: 'linear-gradient(135deg, #1dbf73, #14a363)', color: 'white', fontWeight: 700, boxShadow: '0 4px 14px rgba(29, 191, 115, 0.35)' }}
                onClick={() => {
                  setOfferFixProject(null);
                }}
              >
                <Send size={14} /> Submit Offer ($10)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
