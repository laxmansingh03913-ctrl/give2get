import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, MessageSquare, Award, LogOut, Sparkles, 
  Search, ChevronLeft, ChevronRight, Compass, Target, Box, Zap, X, DollarSign, CheckCircle 
} from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard, { Project, Review } from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import UserProfile, { UserProfileData } from './components/UserProfile';
import ProjectDetailModal from './components/ProjectDetailModal';
import CmdkBar from './components/CmdkBar';
import Footer from './components/Footer';
import { 
  getSupabaseProjects, createSupabaseProject, createSupabaseReview, 
  fetchUserProfile, upsertUserProfile, UserProfileDB 
} from './supabaseService';
import { supabase } from './supabaseClient';

type AppRoute = 'landing' | 'explore' | 'queue' | 'my-reviews' | 'my-projects' | 'leaderboard' | 'bounties' | 'profile';

// Onboarding Authentication Overlay Component
function AuthOverlay({ onLogin, onClose }: { onLogin: (provider: 'google' | 'github') => void; onClose: () => void }) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  const handleLogin = (provider: 'google' | 'github') => {
    setLoadingProvider(provider);
    setTimeout(() => {
      onLogin(provider);
      setLoadingProvider(null);
    }, 1500);
  };

  return (
    <div className="auth-overlay">
      <div className="auth-card glass-panel" style={{ animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <h2 className="auth-title">Join Give2<span className="logo-glow">Get</span></h2>
        <p className="auth-subtitle">Verify your developer identity to start sharing and reviewing projects.</p>
        
        {loadingProvider ? (
          <div className="verifying-overlay">
            <div className="verify-spinner"></div>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '12px' }}>
              Connecting to {loadingProvider === 'google' ? 'Google' : 'GitHub'} Auth...
            </p>
          </div>
        ) : (
          <div className="auth-buttons">
            <button className="btn-auth btn-google" onClick={() => handleLogin('google')}>
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
            <button className="btn-auth btn-github" onClick={() => handleLogin('github')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Sign in with GitHub
            </button>
            <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '8px' }}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Mandatory GitHub connection onboarding modal
function GitHubConnectModal({ onConnect, isLinking, status }: { onConnect: () => void; isLinking: boolean; status: string }) {
  return (
    <div className="auth-overlay" style={{ zIndex: 999999 }}>
      <div className="auth-card glass-panel" style={{ maxWidth: '440px', animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgb(39,39,42)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </div>
        </div>

        <h2 className="auth-title" style={{ textAlign: 'center' }}>Connect GitHub Identity</h2>
        <p className="auth-subtitle" style={{ textAlign: 'center', marginBottom: '24px' }}>
          Give2Get is a community of verified developers. Link your GitHub account to continue.
        </p>

        {isLinking ? (
          <div className="verifying-overlay" style={{ minHeight: '120px' }}>
            <div className="verify-spinner" style={{ width: '28px', height: '28px' }}></div>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginTop: '16px', fontWeight: '500' }}>
              {status}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn-auth btn-github" onClick={onConnect} style={{ justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Link GitHub Account
            </button>
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '6px', padding: '12px', marginTop: '12px', fontSize: '11px', color: 'rgb(113,113,122)', lineHeight: 1.5 }}>
              🔒 <strong>Why link?</strong> Linking verifies your developer standing, unlocks review credits, and activates your developer critique badge in feed lists.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<AppRoute>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Authenticated user state
  const [user, setUser] = useState<{ name: string; avatar: string; email: string; is_pro: boolean } | null>(() => {
    const saved = localStorage.getItem('g2g_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Credit economy state
  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem('g2g_credits');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Live database backed projects store
  const [projects, setProjects] = useState<Project[]>([]);

  // Command Bar & Workbench States
  const [isCmdkOpen, setIsCmdkOpen] = useState(false);
  const [selectedWorkbench, setSelectedWorkbench] = useState<Project | null>(null);

  // Freelance Gig checkout states
  const [selectedBountyGig, setSelectedBountyGig] = useState<{ title: string; price: number; delivery: string, dev: string } | null>(null);
  const [bountyCheckoutStep, setBountyCheckoutStep] = useState(0); // 0: details, 1: process, 2: success

  // Profile database sync states
  const [profileRecord, setProfileRecord] = useState<UserProfileDB | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingStatus, setLinkingStatus] = useState('');

  // User Profile local fallback
  const [profileData, setProfileData] = useState<UserProfileData>(() => {
    const saved = localStorage.getItem('g2g_profile');
    if (saved) return JSON.parse(saved);
    return {
      name: 'Alex Rivera',
      avatar: 'AR',
      email: 'alex.rivera@gmail.com',
      is_pro: false,
      bio: 'Full-stack engineer who loves building fast, accessible, and beautiful web products. Open source contributor and performance nerd.',
      role: 'Full-Stack Engineer · Open Source Contributor',
      githubUrl: '',
      portfolioUrl: '',
      linkedinUrl: '',
      twitterUrl: '',
      payoutUpi: '',
      payoutPaypal: '',
      availableForHire: true,
      isVerified: false,
      hourlyRate: 15,
    };
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cursor following ambient glow state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Hotkey trigger for Raycast command bar (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdkOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (user) {
      localStorage.setItem('g2g_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('g2g_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('g2g_credits', credits.toString());
  }, [credits]);

  useEffect(() => {
    localStorage.setItem('g2g_profile', JSON.stringify(profileData));
  }, [profileData]);

  // Load projects from Supabase on mount
  useEffect(() => {
    async function initSupabase() {
      try {
        const dbProjects = await getSupabaseProjects();
        if (dbProjects) {
          setProjects(dbProjects);
          showNotification("Live database connected!");
        }
      } catch (err) {
        console.error("Supabase load error:", err);
      }
    }
    initSupabase();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfileRecord(null);
      return;
    }
    const email = user.email;

    async function checkProfile() {
      try {
        const prof = await fetchUserProfile(email);
        if (prof) {
          setProfileRecord(prof);
          if (prof.github_username) {
            setProfileData(prev => ({
              ...prev,
              githubUrl: `https://github.com/${prof.github_username}`,
              isVerified: prof.is_verified
            }));
          }
        } else {
          // Initialize empty profile in Supabase
          const newProf = await upsertUserProfile({
            id: email,
            github_username: null,
            avatar_url: null,
            is_verified: false,
            repo_stats: {}
          });
          setProfileRecord(newProf);
        }
      } catch (err) {
        console.error("Error checking user profile in database:", err);
      }
    }
    checkProfile();
  }, [user?.email]);

  // Enable Real-Time subscriptions
  useEffect(() => {
    if (!supabase) return;

    const reviewChannel = supabase
      .channel('realtime-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        async (payload) => {
          console.log('Realtime reviews updates received:', payload);
          if (payload.eventType === 'INSERT') {
            const r = payload.new;
            const mappedReview: Review = {
              id: r.id,
              author: r.author,
              content: r.content,
              scores: {
                design: r.score_design,
                code: r.score_code,
                performance: r.score_performance
              },
              category: r.category || 'ui',
              rating: r.rating || 5,
              helpfulCount: r.helpful_count || 0,
              isResolved: r.is_resolved || false,
              createdAt: r.created_at
            };

            setProjects(prev => prev.map(p => {
              if (p.id === r.project_id) {
                const exists = p.reviews.some(item => item.id === mappedReview.id);
                if (exists) return p;
                return {
                  ...p,
                  reviewsCount: p.reviewsCount + 1,
                  reviews: [mappedReview, ...p.reviews]
                };
              }
              return p;
            }));
            showNotification(`New review submitted on a project!`);
          } else if (payload.eventType === 'UPDATE') {
            const r = payload.new;
            setProjects(prev => prev.map(p => {
              if (p.id === r.project_id) {
                return {
                  ...p,
                  reviews: p.reviews.map(item => item.id === r.id ? {
                    ...item,
                    helpfulCount: r.helpful_count || 0,
                    isResolved: r.is_resolved || false
                  } : item)
                };
              }
              return p;
            }));
          }
        }
      )
      .subscribe();

    const projectChannel = supabase
      .channel('realtime-projects')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        (payload) => {
          console.log('Realtime project updates received:', payload);
          if (payload.eventType === 'INSERT') {
            const p = payload.new;
            const mappedProject: Project = {
              id: p.id,
              title: p.title,
              description: p.description,
              author: p.author,
              authorTitle: p.author_title || '',
              tags: p.tags || [],
              demoUrl: p.demo_url || '',
              githubUrl: p.github_url || '',
              reviewsCount: p.reviews_count || 0,
              targetReviews: p.target_reviews || 5,
              is_featured: p.is_featured || false,
              reviews: []
            };

            setProjects(prev => {
              const exists = prev.some(item => item.id === mappedProject.id);
              if (exists) return prev;
              return [mappedProject, ...prev];
            });
            showNotification(`New project posted: ${p.title}`);
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(reviewChannel);
        supabase.removeChannel(projectChannel);
      }
    };
  }, []);

  // Toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
  };

  const handleAddReview = async (projectId: string, reviewData: Omit<Review, 'id' | 'createdAt'>) => {
    const tempId = `r-temp-${Date.now()}`;
    const tempReview: Review = {
      ...reviewData,
      id: tempId,
      createdAt: new Date().toISOString()
    };

    setProjects(prev =>
      prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            reviewsCount: p.reviewsCount + 1,
            reviews: [tempReview, ...p.reviews]
          };
        }
        return p;
      })
    );

    setCredits(prev => {
      const newCredits = prev + 1;
      showNotification(`Review Submitted! +1 Credit (Total: ${newCredits})`);
      return newCredits;
    });

    try {
      await createSupabaseReview(projectId, reviewData);
    } catch (err) {
      console.error("Supabase review sync error:", err);
      showNotification("Warning: Failed to sync review to database.");
    }
  };

  const handleAddProject = async (
    projectData: Omit<Project, 'id' | 'reviews' | 'reviewsCount' | 'targetReviews'>,
    isPaidFeatured: boolean = false
  ) => {
    if (!isPaidFeatured && credits < 2) return;

    const tempId = `p-temp-${Date.now()}`;
    const tempProject: Project = {
      ...projectData,
      id: tempId,
      reviewsCount: 0,
      targetReviews: 5,
      reviews: [],
      is_featured: isPaidFeatured
    };

    setProjects(prev => [tempProject, ...prev]);

    if (isPaidFeatured) {
      showNotification("Featured Project posted successfully!");
      if (user) {
        setUser({ ...user, is_pro: true });
      }
    } else {
      setCredits(prev => {
        const newCredits = prev - 2;
        showNotification(`Project Posted! -2 Credits (Remaining: ${newCredits})`);
        return newCredits;
      });
    }

    try {
      await createSupabaseProject(projectData, isPaidFeatured);
    } catch (err) {
      console.error("Supabase project sync error:", err);
      showNotification("Warning: Failed to sync project to database.");
    }
  };

  const handleLogin = async (provider: 'google' | 'github') => {
    const isGoogle = provider === 'google';
    const mockUser = {
      name: isGoogle ? 'Alex Rivera' : 'alex-rivera-dev',
      avatar: isGoogle ? 'AR' : 'AL',
      email: isGoogle ? 'alex.rivera@gmail.com' : 'alex@github.com',
      is_pro: false
    };

    setUser(mockUser);
    setProfileData(prev => ({ ...prev, name: mockUser.name, avatar: mockUser.avatar, email: mockUser.email }));

    // If logging in via GitHub directly, automatically upsert linked profile
    if (!isGoogle) {
      try {
        const username = 'alex-rivera-dev';
        const stats = {
          public_repos: 18,
          stars: 96,
          commits_365: 350,
          languages: ['TypeScript', 'JavaScript', 'HTML']
        };
        const updated = await upsertUserProfile({
          id: mockUser.email,
          github_username: username,
          avatar_url: `https://avatars.githubusercontent.com/${username}`,
          is_verified: true,
          repo_stats: stats
        });
        setProfileRecord(updated);
        setProfileData(prev => ({
          ...prev,
          githubUrl: `https://github.com/${username}`,
          isVerified: true
        }));
        showNotification("Logged in and linked GitHub account!");
      } catch (err) {
        console.error("Error setting profile record:", err);
      }
    }

    setView('explore');
    showNotification(`Logged in successfully!`);
  };

  const handleLinkGitHub = async () => {
    if (!user) return;
    setIsLinking(true);
    setLinkingStatus("Verifying session signature...");

    // OAuth Link Identity handshake simulation
    setTimeout(() => {
      setLinkingStatus("Accessing GitHub OAuth handshake...");
      setTimeout(() => {
        setLinkingStatus("Extracting public repository statistics...");
        setTimeout(async () => {
          const username = `${user.name.toLowerCase().replace(/\s+/g, '-')}-dev`;
          const stats = {
            public_repos: 24,
            stars: 142,
            commits_365: 488,
            languages: ['TypeScript', 'JavaScript', 'Rust', 'Go']
          };

          try {
            // Trigger Supabase linkIdentity OAuth redirection log check
            if (supabase) {
              console.log("Triggering linkIdentity connection via Supabase Auth client...");
            }
            
            const updated = await upsertUserProfile({
              id: user.email,
              github_username: username,
              avatar_url: `https://avatars.githubusercontent.com/${username}`,
              is_verified: true,
              repo_stats: stats
            });

            setProfileRecord(updated);
            setProfileData(prev => ({
              ...prev,
              githubUrl: `https://github.com/${username}`,
              isVerified: true
            }));
            
            showNotification("GitHub connected successfully!");
          } catch (err) {
            console.error("Error saving linked profile stats:", err);
            showNotification("Handshake succeeded, profile linking error.");
          } finally {
            setIsLinking(false);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const handleUpdateProfile = (updated: Partial<UserProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updated }));
    if (updated.name || updated.is_pro !== undefined) {
      setUser(prev => prev ? {
        ...prev,
        name: updated.name ?? prev.name,
        is_pro: updated.is_pro ?? prev.is_pro,
      } : prev);
    }
    showNotification('Profile updated!');
  };

  // Gig / Bounty Booking Checkout
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBountyCheckoutStep(1);
    setTimeout(() => {
      setBountyCheckoutStep(2);
      setTimeout(() => {
        setSelectedBountyGig(null);
        setBountyCheckoutStep(0);
        showNotification("Bounty booked successfully!");
      }, 1500);
    }, 1800);
  };

  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('explore')} />;
  }

  if (!user) {
    return (
      <AuthOverlay 
        onLogin={handleLogin} 
        onClose={() => setView('landing')} 
      />
    );
  }

  // Mandatory Onboarding Connection Guard
  const needsOnboarding = profileRecord !== null && !profileRecord.github_username;
  if (needsOnboarding) {
    return (
      <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="dotted-grid" />
        <div className="ambient-glow" style={{ left: '50vw', top: '50vh', transform: 'translate(-50%, -50%)' }} />
        
        <GitHubConnectModal 
          onConnect={handleLinkGitHub} 
          isLinking={isLinking} 
          status={linkingStatus} 
        />

        {/* Notifications Toast */}
        {toastMessage && (
          <div className="toast" style={{ zIndex: 100000 }}>
            <Sparkles size={16} style={{ color: 'hsl(var(--secondary))' }} />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  const creditBarPercent = Math.min((credits / 2) * 100, 100);
  const uniqueTags = Array.from(new Set(projects.flatMap(p => p.tags)));

  // Filter Sub-views Calculations
  const urgentQueue = projects.filter(p => p.reviewsCount < p.targetReviews);
  
  const myCritiques: Array<Review & { projectTitle: string, projectId: string }> = [];
  projects.forEach(p => {
    p.reviews.forEach(r => {
      if (r.author === user.name || r.author.toLowerCase().includes('you')) {
        myCritiques.push({ ...r, projectTitle: p.title, projectId: p.id });
      }
    });
  });

  const myHostedProjects = projects.filter(
    p => p.author === user.name || p.author.toLowerCase().includes('alex') || p.author.toLowerCase().includes('creator')
  );

  const BOUNTY_GIGS = [
    { title: "Full Stack Security Audit & Database Hardening", price: 150, delivery: "3 Days", dev: "Sarah Chen" },
    { title: "Ultra-Premium Framer Motion & CSS Animation Overhaul", price: 99, delivery: "2 Days", dev: "Marcus Brody" },
    { title: "Lighthouse SEO & Speed Optimization Session (Under 1s load time)", price: 120, delivery: "24 Hours", dev: "Priya Patel" }
  ];

  return (
    <div
      className="app-container"
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`
      } as any}
    >
      {/* Background grids */}
      <div className="dotted-grid" />
      <div className="ambient-glow" />

      {/* ── Left Navigation Sidebar (GitHub Style, Collapsible) ── */}
      <motion.aside
        className={`sidebar glass-panel ${sidebarCollapsed ? 'collapsed' : ''}`}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ borderRadius: '0', borderWidth: '0 1px 0 0', zIndex: 10, background: 'rgba(9, 9, 11, 0.85)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Logo & Toggle */}
          <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers className="logo-glow" size={22} style={{ flexShrink: 0 }} />
              {!sidebarCollapsed && <span style={{ fontSize: '18px', fontWeight: '800' }}>Give2<span className="logo-glow">Get</span></span>}
            </div>
          </div>

          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          {/* Navigation Links */}
          <nav className="nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'explore' as const, label: 'Explore Feed', icon: <Compass size={16} /> },
              { id: 'queue' as const, label: 'Review Queue', icon: <Target size={16} /> },
              { id: 'my-reviews' as const, label: 'My Critiques', icon: <MessageSquare size={16} /> },
              { id: 'my-projects' as const, label: 'Hosted Projects', icon: <Box size={16} /> },
              { id: 'leaderboard' as const, label: 'Leaderboard', icon: <Award size={16} /> },
              { id: 'bounties' as const, label: 'Bounties & Gigs', icon: <Zap size={16} /> }
            ].map(item => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? 'active' : ''}`}
                onClick={() => setView(item.id)}
                style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                {!sidebarCollapsed && <span className="sidebar-nav-label" style={{ fontSize: '13px', fontWeight: '600' }}>{item.label}</span>}
              </button>
            ))}
          </nav>

          {/* Sidebar Bottom Pinned User Card */}
          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!sidebarCollapsed ? (
              <div
                className="sidebar-profile"
                style={{ padding: '10px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
                onClick={() => setView('profile')}
              >
                <div className="user-avatar" style={{ flexShrink: 0, width: '28px', height: '28px', fontSize: '11px' }}>{user.avatar}</div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span className="user-name" style={{ fontSize: '12px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{user.name}</span>
                  <span className="sidebar-user-credits">Balance: {credits} credits</span>
                </div>
              </div>
            ) : (
              <div
                className="user-avatar"
                style={{ margin: '0 auto', width: '32px', height: '32px', fontSize: '12px', cursor: 'pointer' }}
                onClick={() => setView('profile')}
                title={`My Profile (${credits} credits)`}
              >
                {user.avatar}
              </div>
            )}

            {/* Sidebar Credits Card */}
            {!sidebarCollapsed && (
              <div className="credit-card" style={{ padding: '12px' }}>
                <div className="credit-header" style={{ fontSize: '10px' }}>Post Queue Gating</div>
                <div className="credit-value-container" style={{ marginBottom: '8px' }}>
                  <span className="credit-value" style={{ fontSize: '20px' }}>{credits}</span>
                  <span className="credit-max" style={{ fontSize: '12px' }}>/ 2</span>
                </div>
                <div className="credit-progress-bar" style={{ height: '4px' }}>
                  <div className="credit-progress-fill" style={{ width: `${creditBarPercent}%` }}></div>
                </div>
              </div>
            )}

            <button 
              className="nav-item"
              onClick={() => {
                setUser(null);
                setProfileRecord(null);
                setView('landing');
                showNotification("Logged out.");
              }}
              style={{ background: 'transparent', border: 'none', width: '100%', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7, padding: sidebarCollapsed ? '12px' : '8px 12px', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}
            >
              <LogOut size={16} />
              {!sidebarCollapsed && <span className="sidebar-nav-label" style={{ fontSize: '13px' }}>Sign Out</span>}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Viewport Pane ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        
        {/* Top Search omnisearch header */}
        <header className="top-search-header">
          <div className="search-input-wrapper" onClick={() => setIsCmdkOpen(true)}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'rgb(113,113,122)' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search critique workspace... (Ctrl+K)"
              readOnly
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-indigo" style={{ textTransform: 'capitalize', fontSize: '10px' }}>
              PRO DEV WORKSPACE
            </span>
          </div>
        </header>

        {/* Filter Chips Bar */}
        <div className="filter-chips-row">
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgb(113,113,122)', marginRight: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tech Filters:
          </span>
          {['React', 'Next.js', 'Supabase', 'Tailwind', 'Python'].map(tag => (
            <button
              key={tag}
              className={`filter-chip ${selectedTagFilter === tag ? 'active' : ''}`}
              onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
          {selectedTagFilter && (
            <button
              className="filter-chip"
              style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.2)' }}
              onClick={() => setSelectedTagFilter(null)}
            >
              Clear ×
            </button>
          )}
        </div>

        {/* Core Routing Views Container */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 0 32px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{ width: '100%' }}
            >
              {/* explore view */}
              {view === 'explore' && (
                <Dashboard 
                  credits={credits} 
                  projects={projects} 
                  onAddReview={handleAddReview} 
                  onAddProject={handleAddProject}
                  onSelectProject={(proj) => setSelectedWorkbench(proj)}
                  selectedTagFilter={selectedTagFilter}
                  onSelectTagFilter={setSelectedTagFilter}
                />
              )}

              {/* queue view */}
              {view === 'queue' && (
                <div>
                  <div className="view-header">
                    <div className="view-title">
                      <h1>Review Queue</h1>
                      <p>Pick urgent projects close to target thresholds to verify and critiques.</p>
                    </div>
                  </div>

                  <div className="grid-container" style={{ marginTop: '20px' }}>
                    {urgentQueue.map(p => {
                      const completed = p.reviews.length;
                      const progress = Math.min((completed / p.targetReviews) * 100, 100);
                      return (
                        <div
                          key={p.id}
                          className="glass-panel project-card"
                          style={{ padding: '24px', cursor: 'pointer' }}
                          onClick={() => setSelectedWorkbench(p)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 className="project-title" style={{ margin: 0 }}>{p.title}</h3>
                            <span style={{ fontSize: '9px', fontWeight: 800, padding: '3px 8px', background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '4px' }}>
                              URGENT
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'rgb(113,113,122)' }}>by {p.author}</span>
                          <p className="project-desc" style={{ marginTop: '10px' }}>{p.description.slice(0, 150)}...</p>

                          <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgb(161,161,170)', marginBottom: '4px' }}>
                              <span>Queue: {completed} / {p.targetReviews} Reviews</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="credit-progress-bar" style={{ height: '4px' }}>
                              <div className="credit-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>

                          <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '8px' }}>
                            Open Workbench
                          </button>
                        </div>
                      );
                    })}
                    {urgentQueue.length === 0 && (
                      <p style={{ color: 'rgb(113,113,122)', fontSize: '13px', textAlign: 'center' }}>No urgent queue items.</p>
                    )}
                  </div>
                </div>
              )}

              {/* my-reviews view */}
              {view === 'my-reviews' && (
                <div>
                  <div className="view-header">
                    <div className="view-title">
                      <h1>My Author Critiques</h1>
                      <p>View critiques you authored across peer codebases.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {myCritiques.map(c => (
                      <div
                        key={c.id}
                        className="glass-panel"
                        style={{ padding: '20px', border: '1px solid rgb(39,39,42)', borderRadius: '12px', cursor: 'pointer' }}
                        onClick={() => {
                          const proj = projects.find(item => item.id === c.projectId);
                          if (proj) setSelectedWorkbench(proj);
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 800 }}>ON CODEBASE: {c.projectTitle}</span>
                          <span style={{ fontSize: '11px', color: 'rgb(113,113,122)' }}>{c.createdAt.split('T')[0]}</span>
                        </div>
                        <p style={{ fontSize: '13px', color: 'rgb(212,212,216)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{c.content}</p>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', fontSize: '12px', color: 'rgb(161,161,170)' }}>
                          <span>👍 {c.helpfulCount || 0} Helpful upvotes</span>
                          <span>•</span>
                          <span>{c.isResolved ? '✓ RESOLVED' : 'OPEN INQUIRY'}</span>
                        </div>
                      </div>
                    ))}
                    {myCritiques.length === 0 && (
                      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'rgb(113,113,122)' }}>
                        <p>No critiques authored yet. Visit the Explore Feed to review projects!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* my-projects view */}
              {view === 'my-projects' && (
                <div>
                  <div className="view-header">
                    <div className="view-title">
                      <h1>My Hosted Projects</h1>
                      <p>Manage codebases you shared with the developer peer group.</p>
                    </div>
                  </div>

                  <div className="grid-container" style={{ marginTop: '20px' }}>
                    {myHostedProjects.map(p => {
                      const progress = Math.min((p.reviews.length / p.targetReviews) * 100, 100);
                      return (
                        <div
                          key={p.id}
                          className="glass-panel project-card"
                          style={{ padding: '24px', cursor: 'pointer' }}
                          onClick={() => setSelectedWorkbench(p)}
                        >
                          <h3 className="project-title">{p.title}</h3>
                          <p className="project-desc">{p.description}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                            {p.tags.map(t => <span key={t} className="project-tag" style={{ fontSize: '10px' }}>{t}</span>)}
                          </div>

                          <div style={{ marginTop: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgb(161,161,170)', marginBottom: '4px' }}>
                              <span>Status: {p.reviews.length} / {p.targetReviews} Reviews</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="credit-progress-bar" style={{ height: '4px' }}>
                              <div className="credit-progress-fill" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {myHostedProjects.length === 0 && (
                      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'rgb(113,113,122)', gridColumn: 'span 3' }}>
                        <p>You have not shared any projects yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* leaderboard view */}
              {view === 'leaderboard' && (
                <Leaderboard />
              )}

              {/* bounties view */}
              {view === 'bounties' && (
                <div>
                  <div className="view-header">
                    <div className="view-title">
                      <h1>Micro-Gigs & Bounties</h1>
                      <p>Book verified senior developers to audit, optimize, or resolve issues on your codebase.</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
                    {BOUNTY_GIGS.map((gig, idx) => (
                      <div
                        key={idx}
                        className="glass-panel"
                        style={{ padding: '24px', border: '1px solid rgb(39,39,42)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <h3 style={{ fontSize: '16px', color: 'white', margin: 0, fontWeight: 800 }}>{gig.title}</h3>
                            <span className="badge badge-mint" style={{ fontSize: '9px' }}>ACTIVE</span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'rgb(161,161,170)' }}>Expert: {gig.dev} • Delivery in {gig.delivery}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>${gig.price}</span>
                          <button className="btn btn-primary" onClick={() => setSelectedBountyGig(gig)}>
                            Book Expert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* profile view */}
              {view === 'profile' && (
                <UserProfile
                  user={profileData}
                  projects={projects}
                  onUpdateUser={handleUpdateProfile}
                />
              )}
            </motion.div>
          </AnimatePresence>
          </div>
          <Footer onNavigate={(tab) => setView(tab)} />
        </div>
      </div>

      {/* Global cmdk Command Bar */}
      <CmdkBar
        isOpen={isCmdkOpen}
        onClose={() => setIsCmdkOpen(false)}
        projects={projects}
        onSelectProject={(proj) => setSelectedWorkbench(proj)}
        onSelectView={(v) => setView(v)}
        onSelectTag={(tag) => setSelectedTagFilter(tag)}
        tags={uniqueTags}
      />

      {/* Full-Screen Project Workbench Modal */}
      <AnimatePresence>
        {selectedWorkbench && (
          <ProjectDetailModal
            project={selectedWorkbench}
            onClose={() => setSelectedWorkbench(null)}
            onAddReview={handleAddReview}
          />
        )}
      </AnimatePresence>

      {/* Gig Checkout Dialog */}
      {selectedBountyGig && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '440px' }}>
            <button className="modal-close" onClick={() => setSelectedBountyGig(null)}>
              <X size={18} />
            </button>

            {bountyCheckoutStep === 0 && (
              <form onSubmit={handleBookingSubmit}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'rgba(20, 184, 166, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarSign size={20} style={{ color: '#14b8a6' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', color: 'white', margin: 0 }}>Checkout Gig</h3>
                    <p style={{ fontSize: '11px', color: 'rgb(113,113,122)', margin: 0 }}>Secure payment gateway</p>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgb(39,39,42)', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '12px', color: 'rgb(161, 161, 170)' }}>Bounty Title:</span>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', margin: '4px 0 8px 0' }}>{selectedBountyGig.title}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'white', fontWeight: 600 }}>Amount:</span>
                    <span style={{ fontSize: '14px', color: '#14b8a6', fontWeight: 800 }}>${selectedBountyGig.price}.00</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Option</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter Card details or UPI"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px' }}>
                  Confirm Booking (${selectedBountyGig.price})
                </button>
              </form>
            )}

            {bountyCheckoutStep === 1 && (
              <div className="verifying-overlay">
                <div className="verify-spinner" style={{ width: '36px', height: '36px', marginBottom: '16px' }} />
                <h3 style={{ color: 'white', fontSize: '15px' }}>Processing payment session...</h3>
              </div>
            )}

            {bountyCheckoutStep === 2 && (
              <div className="verifying-overlay" style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid #10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 800 }}>Checkout Completed!</h3>
                <p style={{ fontSize: '12px', color: 'rgb(113,113,122)' }}>Developer {selectedBountyGig.dev} will audit your codebase within {selectedBountyGig.delivery}.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Toast */}
      {toastMessage && (
        <div className="toast" style={{ zIndex: 100000 }}>
          <Sparkles size={16} style={{ color: 'hsl(var(--secondary))' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
