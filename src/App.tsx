import { useState, useEffect } from 'react';
import { Layers, MessageSquare, Award, LogOut, Sparkles, UserCircle } from 'lucide-react';
import LandingPage from './components/LandingPage';
import Dashboard, { Project, Review } from './components/Dashboard';
import Leaderboard from './components/Leaderboard';
import UserProfile, { UserProfileData } from './components/UserProfile';
import { getSupabaseProjects, createSupabaseProject, createSupabaseReview } from './supabaseService';
import { supabase } from './supabaseClient';

// Preloaded mock projects for community interactivity
const INITIAL_PROJECTS: Project[] = [
  {
    id: 'p1',
    title: 'DevFlow: StackOverflow for AI Agents',
    description: 'A developer forum specifically optimized for LLM agents. Features semantic indexing, API-driven posting, and automatic code verification loops. Built to enable collaborative problem-solving between humans and AI coders.',
    author: 'Alex Rivera',
    authorTitle: 'AI Integration Specialist',
    tags: ['React', 'TypeScript', 'Node.js', 'OpenAI'],
    demoUrl: 'https://devflow-ai.vercel.app',
    githubUrl: 'https://github.com/alexr/devflow-agents',
    reviewsCount: 1,
    targetReviews: 5,
    reviews: [
      {
        id: 'r1',
        author: 'Sarah Chen',
        content: 'Fascinating concept! The auto-code verification using Docker sandbox runs smoothly. I suggest adding support for Python typing checks in the pipeline as well, as some script submissions failed silent compilation.',
        scores: { design: 4, code: 5, performance: 4 },
        createdAt: '2026-08-10T12:00:00Z'
      }
    ]
  },
  {
    id: 'p2',
    title: 'PulseCSS: Glassmorphic Component Studio',
    description: 'An interactive design sandbox to generate complex CSS glassmorphism components. Copy-paste CSS variables directly. Provides real-time rendering of backdrop filters, gradients, and subtle drop-shadow values.',
    author: 'Clara Oswald',
    authorTitle: 'Creative UI Designer',
    tags: ['HTML', 'CSS', 'JavaScript', 'Tailwind'],
    demoUrl: 'https://pulsecss.dev',
    githubUrl: 'https://github.com/clarao/pulse-css-studio',
    reviewsCount: 2,
    targetReviews: 4,
    reviews: [
      {
        id: 'r2',
        author: 'Marcus Brody',
        content: 'Visually outstanding. The slider response is highly interactive and the generated code copy feature is super clean. One issue: on iOS Safari, the backdrop filter has some visual lag. Consider using hardware acceleration rules.',
        scores: { design: 5, code: 4, performance: 3 },
        createdAt: '2026-08-09T18:30:00Z'
      },
      {
        id: 'r3',
        author: 'Priya Patel',
        content: 'Clean code generation! Love how you grouped the custom variables. It would be amazing to support tailwind class export in addition to vanilla CSS.',
        scores: { design: 4, code: 5, performance: 4 },
        createdAt: '2026-08-11T09:15:00Z'
      }
    ]
  },
  {
    id: 'p3',
    title: 'Supabase Local: Offline Database Mock',
    description: 'A lightweight SQLite-backed offline emulator for testing Supabase database functions locally. Emulates row-level security, auth triggers, and real-time websockets. Perfect for testing without connecting to the cloud.',
    author: 'Daniel Craig',
    authorTitle: 'Backend Security Engineer',
    tags: ['Rust', 'SQLite', 'Websockets', 'Docker'],
    demoUrl: '#',
    githubUrl: 'https://github.com/dcraig/supabase-local-mock',
    reviewsCount: 0,
    targetReviews: 6,
    reviews: []
  },
  {
    id: 'p4',
    title: 'NeuralSketch: AI-Powered Wireframe Tool',
    description: 'A browser-native wireframing tool that converts hand-drawn sketches into production-ready Tailwind+React components using a multimodal vision model. Features live component preview, export to Figma tokens, and team collaboration rooms.',
    author: 'Yuki Tanaka',
    authorTitle: 'Product Engineer & AI Enthusiast',
    tags: ['React', 'TensorFlow', 'Canvas API', 'WebRTC'],
    demoUrl: 'https://neuralsketch.app',
    githubUrl: 'https://github.com/yukitan/neural-sketch',
    reviewsCount: 3,
    targetReviews: 5,
    reviews: [
      {
        id: 'r4',
        author: 'Aiden Vance',
        content: 'The vision model integration is seamless. Canvas rendering is buttery smooth. I suggest debouncing the sketch-to-component pipeline trigger to avoid excessive API calls during active drawing sessions.',
        scores: { design: 5, code: 4, performance: 4 },
        createdAt: '2026-08-12T10:00:00Z'
      }
    ]
  },
  {
    id: 'p5',
    title: 'ChronoBoard: Async Team Standup App',
    description: 'A Slack-alternative async standup board for distributed teams. Features voice-note updates, timezone-aware scheduling, and AI-generated weekly digests summarizing blockers and completed tasks. No meetings, just clarity.',
    author: 'Layla Hassan',
    authorTitle: 'Remote-First Product Designer',
    tags: ['Vue.js', 'Node.js', 'OpenAI', 'Postgres'],
    demoUrl: 'https://chronoboard.io',
    githubUrl: 'https://github.com/laylah/chronoboard',
    reviewsCount: 1,
    targetReviews: 4,
    reviews: [
      {
        id: 'r5',
        author: 'Priya Patel',
        content: 'The AI digest feature is genuinely useful. Voice notes transcription accuracy is impressive. Consider adding keyboard shortcuts for power users and a filtering view to see only their own updates.',
        scores: { design: 4, code: 5, performance: 5 },
        createdAt: '2026-08-13T14:30:00Z'
      }
    ]
  },
  {
    id: 'p6',
    title: 'PixelForge: Real-Time CSS Art Editor',
    description: 'Create CSS art directly in the browser with a pixel-grid editor and live box-shadow/clip-path CSS output. Export animations as Lottie JSON or pure CSS keyframes. Built for UI engineers who want fine-grained control over micro-illustrations.',
    author: 'Ethan Nakamura',
    authorTitle: 'Creative Coder & Motion Designer',
    tags: ['JavaScript', 'CSS', 'Lottie', 'SVG'],
    demoUrl: 'https://pixelforge.design',
    githubUrl: 'https://github.com/ethan-n/pixel-forge',
    reviewsCount: 0,
    targetReviews: 3,
    reviews: []
  }
];

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

export default function App() {
  const [view, setView] = useState<'landing' | 'explore' | 'leaderboard' | 'profile'>('landing');

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

  // Projects store
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('g2g_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  // Extended profile data (persisted)
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
    localStorage.setItem('g2g_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('g2g_profile', JSON.stringify(profileData));
  }, [profileData]);

  // Load projects from Supabase on mount
  useEffect(() => {
    async function initSupabase() {
      try {
        const dbProjects = await getSupabaseProjects();
        if (dbProjects && dbProjects.length > 0) {
          setProjects(dbProjects);
          showNotification("Connected to Supabase. Loaded live projects!");
        }
      } catch (err) {
        console.warn("Using local fallback projects. (SQL schema setup in Supabase SQL editor is required for database syncing).");
      }
    }
    initSupabase();
  }, []);

  // Listen to Supabase Auth state changes
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const u = session.user;
        const loggedUser = {
          name: u.user_metadata.full_name || u.user_metadata.user_name || u.email?.split('@')[0] || 'Peer Developer',
          avatar: (u.user_metadata.full_name || u.email || 'PD').substring(0, 2).toUpperCase(),
          email: u.email || '',
          is_pro: false
        };
        setUser(loggedUser);
        setProfileData(prev => ({ ...prev, name: loggedUser.name, avatar: loggedUser.avatar, email: loggedUser.email }));
        setView('explore');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-dismiss toast
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

    // Update locally for instant UI response
    setProjects(prevProjects =>
      prevProjects.map(project => {
        if (project.id === projectId) {
          return {
            ...project,
            reviewsCount: project.reviewsCount + 1,
            reviews: [tempReview, ...project.reviews]
          };
        }
        return project;
      })
    );

    setCredits(prev => {
      const newCredits = prev + 1;
      showNotification(`Review Submitted! +1 Credit Earned (Total: ${newCredits})`);
      return newCredits;
    });

    // Sync to Supabase
    try {
      const savedReview = await createSupabaseReview(projectId, reviewData);
      setProjects(prevProjects =>
        prevProjects.map(project => {
          if (project.id === projectId) {
            return {
              ...project,
              reviews: project.reviews.map(r => r.id === tempId ? savedReview : r)
            };
          }
          return project;
        })
      );
    } catch (err) {
      console.error("Supabase sync failed:", err);
      showNotification("Local review saved. Database sync failed (run SQL schema script).");
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
      showNotification("Featured Project Posted successfully!");
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

    // Sync to Supabase
    try {
      const savedProject = await createSupabaseProject(projectData, isPaidFeatured);
      setProjects(prev => prev.map(p => p.id === tempId ? savedProject : p));
    } catch (err) {
      console.error("Supabase sync failed:", err);
      showNotification("Local project saved. Database sync failed (run SQL schema script).");
    }
  };

  const handleLogin = async (provider: 'google' | 'github') => {
    if (!supabase) {
      // Fallback local sign in so it works in environments without Supabase credentials configured
      const isGoogle = provider === 'google';
      const mockUser = {
        name: isGoogle ? 'Alex Rivera' : 'alex-rivera-dev',
        avatar: isGoogle ? 'AR' : 'AL',
        email: isGoogle ? 'alex.rivera@gmail.com' : 'alex@github.com',
        is_pro: false
      };
      setUser(mockUser);
      setProfileData(prev => ({ ...prev, name: mockUser.name, avatar: mockUser.avatar, email: mockUser.email }));
      setView('explore');
      showNotification(`Logged in successfully in offline fallback mode with ${isGoogle ? 'Google' : 'GitHub'}!`);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      console.error("Auth error:", err);
      showNotification(`Auth error: ${err.message}`);
    }
  };

  const handleUpdateProfile = (updated: Partial<UserProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updated }));
    // Sync core user fields if they were updated
    if (updated.name || updated.is_pro !== undefined) {
      setUser(prev => prev ? {
        ...prev,
        name: updated.name ?? prev.name,
        is_pro: updated.is_pro ?? prev.is_pro,
      } : prev);
    }
    showNotification('Profile updated successfully!');
  };

  // If on landing page, display standard landing design
  if (view === 'landing') {
    return <LandingPage onEnter={() => setView('explore')} />;
  }

  // Force onboarding authentication before allowing dashboard access
  if (!user) {
    return (
      <AuthOverlay 
        onLogin={handleLogin} 
        onClose={() => setView('landing')} 
      />
    );
  }

  // Calculate credit bar percentage
  const creditBarPercent = Math.min((credits / 2) * 100, 100);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar glass-panel" style={{ borderRadius: '0', borderWidth: '0 1px 0 0' }}>
        <div className="sidebar-logo">
          <Layers className="logo-glow" size={22} />
          <span>Give2<span className="logo-glow">Get</span></span>
        </div>

        {/* User Profile Info Card — click to open full profile */}
        <div
          className="sidebar-profile"
          style={{ marginBottom: '20px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.01)', display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', cursor: 'pointer', transition: 'background 0.2s' }}
          onClick={() => setView('profile')}
          title="View your profile"
        >
          <div className="user-avatar" style={{ flexShrink: 0, width: '32px', height: '32px', fontSize: '12px' }}>{user.avatar}</div>
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="user-name" style={{ fontSize: '13px', fontWeight: '600', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '110px' }}>{user.name}</span>
              {user.is_pro && <span className="profile-pro-badge" style={{ transform: 'scale(0.85)', transformOrigin: 'left center' }}>PRO</span>}
            </div>
            <span className="user-title" style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</span>
          </div>
        </div>

        {/* Mini Review Heatmap Widget */}
        <div style={{ marginBottom: '20px', padding: '12px', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Review Activity</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px', marginBottom: '6px' }}>
            {[
              0,0,1,0,2,1,0,
              1,0,0,2,1,0,1,
              0,2,1,1,0,3,0,
              1,0,3,2,1,0,2,
              0,1,0,2,3,1,0
            ].map((level, i) => (
              <div
                key={i}
                title={level === 0 ? 'No reviews' : `${level} review${level > 1 ? 's' : ''}`}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: '2px',
                  background: level === 0
                    ? 'rgba(255,255,255,0.04)'
                    : level === 1
                    ? 'hsla(var(--primary) / 0.25)'
                    : level === 2
                    ? 'hsla(var(--primary) / 0.55)'
                    : 'hsl(var(--primary))',
                  transition: 'transform 0.15s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>Less</span>
            {[0,1,2,3].map(l => (
              <div key={l} style={{ width: '8px', height: '8px', borderRadius: '2px', background: l === 0 ? 'rgba(255,255,255,0.04)' : l === 1 ? 'hsla(var(--primary) / 0.25)' : l === 2 ? 'hsla(var(--primary) / 0.55)' : 'hsl(var(--primary))' }} />
            ))}
            <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))' }}>More</span>
          </div>
        </div>

        <nav className="nav-list">
          <li>
            <button 
              className={`nav-item ${view === 'explore' ? 'active' : ''}`}
              onClick={() => setView('explore')}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <MessageSquare size={16} /> Explore Feed
            </button>
          </li>
          <li>
            <button 
              className={`nav-item ${view === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setView('leaderboard')}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <Award size={16} /> Leaderboard
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${view === 'profile' ? 'active' : ''}`}
              onClick={() => setView('profile')}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left' }}
            >
              <UserCircle size={16} /> My Profile
            </button>
          </li>
          <li style={{ marginTop: '24px' }}>
            <button 
              className="nav-item"
              onClick={async () => {
                if (supabase) {
                  await supabase.auth.signOut();
                }
                setUser(null);
                setView('landing');
                showNotification("Logged out successfully.");
              }}
              style={{ background: 'transparent', border: 'none', width: '100%', textAlign: 'left', opacity: 0.7 }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </li>
        </nav>

        {/* Sidebar Credit Panel */}
        <div className="sidebar-credits">
          <div className={`credit-card ${credits >= 2 ? 'pulse-glow' : ''}`}>
            <div className="credit-header">Review Credits</div>
            <div className="credit-value-container">
              <span className="credit-value">{credits}</span>
              <span className="credit-max">/ 2</span>
            </div>
            <div className="credit-progress-bar">
              <div className="credit-progress-fill" style={{ width: `${creditBarPercent}%` }}></div>
            </div>
            <p className="credit-info">
              {credits >= 2 
                ? "You have enough credits to post a project!" 
                : `Give ${2 - credits} more reviews to unlock posting.`}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {view === 'explore' && (
          <Dashboard 
            credits={credits} 
            projects={projects} 
            onAddReview={handleAddReview} 
            onAddProject={handleAddProject} 
          />
        )}
        {view === 'leaderboard' && (
          <Leaderboard />
        )}
        {view === 'profile' && (
          <UserProfile
            user={profileData}
            projects={projects}
            onUpdateUser={handleUpdateProfile}
          />
        )}
      </main>

      {/* App Notifications Toast */}
      {toastMessage && (
        <div className="toast">
          <Sparkles size={16} style={{ color: 'hsl(var(--secondary))' }} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

