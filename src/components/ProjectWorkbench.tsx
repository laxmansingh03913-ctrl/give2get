import React, { useState, useEffect } from 'react';
import { 
  Monitor, Tablet, Smartphone, RefreshCw,
  Folder, File, BookOpen, Cpu, Star, Send, X, AlertTriangle, ExternalLink,
  Download, Copy, Check, Github
} from 'lucide-react';
import type { Project, Review } from './Dashboard';

interface ProjectWorkbenchProps {
  project: Project;
  onAddReview: (projectId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleanUrl = url.trim().replace(/\/+$/, '').replace(/\.git$/, '');
    const parts = cleanUrl.split('github.com/');
    if (parts.length > 1) {
      const pathParts = parts[1].split('/');
      if (pathParts.length >= 2) {
        return { owner: pathParts[0], repo: pathParts[1] };
      }
    }
  } catch (e) {}
  return null;
}

function highlightCode(code: string): React.ReactNode {
  const keywords = /\b(const|let|var|function|return|import|export|from|default|class|extends|if|else|for|while|async|await|interface|type|public|private|static)\b/g;
  const strings = /(["'`])(.*?)\1/g;

  const lines = code.split('\n');
  return (
    <div style={{ fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.6', overflowX: 'auto', color: '#1c1917' }}>
      {lines.map((line, idx) => {
        let html = line
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        html = html.replace(strings, '<span style="color: #c27803;">$1$2$1</span>');
        html = html.replace(keywords, '<span style="color: #b45309; font-weight: bold;">$1</span>');
        html = html.replace(/(&lt;\/?[a-zA-Z0-9_\-]+&gt;)/g, '<span style="color: #0f766e;">$1</span>');
        html = html.replace(/(\/\/.*)/g, '<span style="color: #8c857b; font-style: italic;">$1</span>');

        return (
          <div key={idx} style={{ display: 'flex' }}>
            <span style={{ width: '32px', color: '#a8a29e', textAlign: 'right', paddingRight: '8px', userSelect: 'none', borderRight: '1px solid #e7e5e4', marginRight: '8px' }}>
              {idx + 1}
            </span>
            <span dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />
          </div>
        );
      })}
    </div>
  );
}

function parseMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n');
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  return (
    <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#57534e' }}>
      {lines.map((line, idx) => {
        if (line.trim().startsWith('```')) {
          if (inCodeBlock) {
            inCodeBlock = false;
            const codeContent = codeBlockLines.join('\n');
            codeBlockLines = [];
            return (
              <pre key={idx} style={{ background: '#f5f5f4', padding: '12px', borderRadius: '8px', border: '1px solid #e7e5e4', fontSize: '12px', fontFamily: 'monospace', overflowX: 'auto', margin: '12px 0' }}>
                <code>{codeContent}</code>
              </pre>
            );
          } else {
            inCodeBlock = true;
            return null;
          }
        }

        if (inCodeBlock) {
          codeBlockLines.push(line);
          return null;
        }

        const trimmed = line.trim();

        if (trimmed.startsWith('# ')) {
          return <h2 key={idx} style={{ fontSize: '20px', fontWeight: 800, color: '#1c1917', margin: '20px 0 10px 0' }}>{trimmed.slice(2)}</h2>;
        }
        if (trimmed.startsWith('## ')) {
          return <h3 key={idx} style={{ fontSize: '16px', fontWeight: 700, color: '#1c1917', margin: '16px 0 8px 0' }}>{trimmed.slice(3)}</h3>;
        }
        if (trimmed.startsWith('### ')) {
          return <h4 key={idx} style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: '14px 0 6px 0' }}>{trimmed.slice(4)}</h4>;
        }
        if (trimmed.startsWith('- ')) {
          return <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px' }}>{trimmed.slice(2)}</li>;
        }
        if (trimmed.startsWith('* ')) {
          return <li key={idx} style={{ marginLeft: '16px', marginBottom: '4px' }}>{trimmed.slice(2)}</li>;
        }
        if (trimmed === '---') {
          return <hr key={idx} style={{ border: 'none', borderTop: '1px solid #e7e5e4', margin: '20px 0' }} />;
        }
        if (!trimmed) {
          return <div key={idx} style={{ height: '8px' }} />;
        }

        return <p key={idx} style={{ marginBottom: '10px' }}>{line}</p>;
      })}
    </div>
  );
}

export default function ProjectWorkbench({ project, onAddReview, onClose }: ProjectWorkbenchProps) {
  const gitInfo = project.githubUrl ? parseGitHubUrl(project.githubUrl) : null;
  const [activeTab, setActiveTab] = useState<'sandbox' | 'code' | 'readme'>('sandbox');
  const [deviceFrame, setDeviceFrame] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [iframeKey, setIframeKey] = useState(0);

  // Code Inspector states
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [isTreeLoading, setIsTreeLoading] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isFileLoading, setIsFileLoading] = useState(false);

  // README state
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [isReadmeLoading, setIsReadmeLoading] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Review Form States
  const [reviewContent, setReviewContent] = useState('');
  const [scoreDesign, setScoreDesign] = useState(4);
  const [scoreCode, setScoreCode] = useState(4);
  const [scorePerformance, setScorePerformance] = useState(4);
  const [reviewCategory, setReviewCategory] = useState<'ui' | 'perf' | 'bug' | 'idea'>('ui');
  const reviewRating = Math.round((scoreDesign + scoreCode + scorePerformance) / 3);

  const totalChars = reviewContent.trim().length;
  const isSubmitDisabled = totalChars < 50;

  // Load GitHub file tree
  useEffect(() => {
    if (activeTab !== 'code' || !project.githubUrl) return;
    const info = parseGitHubUrl(project.githubUrl);
    if (!info) {
      setTreeError("Invalid GitHub repository link.");
      return;
    }
    const { owner, repo } = info;

    let active = true;
    async function loadTree() {
      setIsTreeLoading(true);
      setTreeError(null);
      try {
        let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`);
        if (!res.ok) {
          res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`);
        }
        if (!res.ok) {
          throw new Error("Could not load repository files. Make sure the repository is public.");
        }
        const data = await res.json();
        if (active) {
          if (!data.tree) {
            throw new Error("Could not load repository files. Make sure the repository is public.");
          }
          const filtered = data.tree.filter((file: any) => {
            if (file.type === 'tree') return true;
            const ext = file.path.split('.').pop() || '';
            return ['ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'md', 'py', 'go', 'rs'].includes(ext);
          });
          const sorted = filtered.sort((a: any, b: any) => {
            if (a.type !== b.type) return a.type === 'tree' ? -1 : 1;
            return a.path.localeCompare(b.path);
          });
          setFileTree(sorted);
        }
      } catch (err: any) {
        console.error(err);
        if (active) {
          setTreeError(err.message || "Could not load repository files. Make sure the repository is public.");
        }
      } finally {
        if (active) setIsTreeLoading(false);
      }
    }
    loadTree();
    return () => { active = false; };
  }, [activeTab, project.githubUrl]);

  // Load README
  useEffect(() => {
    if (activeTab !== 'readme' || !project.githubUrl) return;
    const info = parseGitHubUrl(project.githubUrl);
    if (!info) return;
    const { owner, repo } = info;

    let active = true;
    async function loadReadme() {
      setIsReadmeLoading(true);
      try {
        let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/README.md`);
        if (!res.ok) {
          res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/README.md`);
        }
        if (!res.ok) throw new Error("Failed to load README.");
        const text = await res.text();
        if (active) setReadmeContent(text);
      } catch (err) {
        console.error(err);
        if (active) setReadmeContent("Error loading repository README.md");
      } finally {
        if (active) setIsReadmeLoading(false);
      }
    }
    loadReadme();
    return () => { active = false; };
  }, [activeTab, project.githubUrl]);

  const handleLoadFile = async (path: string) => {
    const info = parseGitHubUrl(project.githubUrl);
    if (!info) return;
    const { owner, repo } = info;

    setSelectedFilePath(path);
    setIsFileLoading(true);
    setFileContent(null);
    try {
      let res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`);
      if (!res.ok) {
        res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/master/${path}`);
      }
      if (!res.ok) throw new Error("Failed to load file contents.");
      const text = await res.text();
      setFileContent(text);
    } catch (err) {
      console.error(err);
      setFileContent("Error loading file content.");
    } finally {
      setIsFileLoading(false);
    }
  };

  const handleCopyCloneCommand = () => {
    if (!project.githubUrl) return;
    navigator.clipboard.writeText(`git clone ${project.githubUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitDisabled) return;

    onAddReview(project.id, {
      author: 'You (Peer Reviewer)',
      content: reviewContent,
      scores: {
        design: scoreDesign,
        code: scoreCode,
        performance: scorePerformance
      },
      category: reviewCategory,
      rating: reviewRating,
      helpfulCount: 0,
      isResolved: false
    });

    setReviewContent('');
  };

  const frameWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: '#fafaf9', overflow: 'hidden' }}>
      
      {/* ── Left Preview/Sandbox Pane (60%) ── */}
      <div style={{ width: '60%', height: '100%', borderRight: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Navigation Tabs bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', borderBottom: '1px solid #e7e5e4', padding: '0 24px', height: '48px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'sandbox' as const, label: 'Live Sandbox', icon: <Monitor size={14} /> },
              { id: 'code' as const, label: 'Code Inspector', icon: <Cpu size={14} /> },
              { id: 'readme' as const, label: 'README & Docs', icon: <BookOpen size={14} /> }
            ].map(tab => (
              <button
                key={tab.id}
                className={`filter-chip ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ padding: '4px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'sandbox' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', background: '#f5f5f4', borderRadius: '6px', padding: '2px', border: '1px solid #e7e5e4' }}>
                <button 
                  onClick={() => setDeviceFrame('desktop')} 
                  style={{ background: deviceFrame === 'desktop' ? '#ffffff' : 'transparent', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#1c1917', cursor: 'pointer' }}
                  title="Desktop viewport"
                >
                  <Monitor size={13} />
                </button>
                <button 
                  onClick={() => setDeviceFrame('tablet')} 
                  style={{ background: deviceFrame === 'tablet' ? '#ffffff' : 'transparent', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#1c1917', cursor: 'pointer' }}
                  title="Tablet viewport"
                >
                  <Tablet size={13} />
                </button>
                <button 
                  onClick={() => setDeviceFrame('mobile')} 
                  style={{ background: deviceFrame === 'mobile' ? '#ffffff' : 'transparent', border: 'none', borderRadius: '4px', padding: '4px 8px', color: '#1c1917', cursor: 'pointer' }}
                  title="Mobile viewport"
                >
                  <Smartphone size={13} />
                </button>
              </div>
              <button 
                onClick={() => setIframeKey(prev => prev + 1)}
                className="btn btn-secondary" 
                style={{ padding: '6px 8px', borderRadius: '6px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Reload iframe Sandbox"
              >
                <RefreshCw size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Tab Viewports Content Area */}
        <div style={{ flex: 1, overflow: 'auto', background: '#fafaf9', padding: activeTab === 'sandbox' ? '0' : '24px' }}>
          
          {/* SANDBOX TAB */}
          {activeTab === 'sandbox' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f5f5f4', padding: '20px' }}>
              {project.demoUrl ? (
                <div style={{ width: frameWidths[deviceFrame], height: '100%', transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', display: 'flex', flexDirection: 'column', background: '#ffffff', borderRadius: '12px', border: '4px solid #e7e5e4', boxShadow: '0 8px 32px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <iframe
                    key={iframeKey}
                    src={project.demoUrl}
                    style={{ border: 'none', width: '100%', height: '100%', background: '#ffffff' }}
                    title="Live project sandbox"
                  />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', maxWidth: '440px', margin: 'auto' }}>
                  <AlertTriangle size={32} style={{ color: '#d97706', marginBottom: '12px' }} />
                  <h3 style={{ fontSize: '15px', color: '#1c1917', marginBottom: '6px' }}>No Live URL Available</h3>
                  <p style={{ fontSize: '12px', color: '#57534e', lineHeight: 1.5 }}>
                    This project does not contain a hosted demo link. Check the Code Inspector tab to review the codebase.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CODE INSPECTOR TAB */}
          {activeTab === 'code' && (
            treeError ? (
              <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', border: '1px solid #e7e5e4', borderRadius: '12px', maxWidth: '440px', margin: '40px auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', boxShadow: 'var(--shadow)' }}>
                <AlertTriangle size={32} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '15px', color: '#1c1917', margin: 0, fontWeight: 800 }}>Repository Files Unavailable</h3>
                <p style={{ fontSize: '12px', color: '#57534e', lineHeight: 1.5, margin: 0 }}>
                  {treeError}
                </p>
                <a 
                  href={project.githubUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 16px', fontSize: '12px', fontWeight: 700 }}
                >
                  Open on GitHub <ExternalLink size={12} />
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', width: '100%', height: '100%', border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden', background: '#ffffff' }}>
                
                {/* File Explorer sidebar */}
                <div style={{ width: '220px', borderRight: '1px solid #e7e5e4', display: 'flex', flexDirection: 'column', background: '#fafaf9', flexShrink: 0 }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid #e7e5e4', fontSize: '10px', fontWeight: 800, color: '#8c857b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Repository Files
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
                    {isTreeLoading ? (
                      <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#8c857b' }}>Loading tree...</div>
                    ) : fileTree.length > 0 ? (
                      fileTree.map(file => (
                        <button
                          key={file.path}
                          onClick={() => file.type === 'blob' && handleLoadFile(file.path)}
                          style={{
                            width: '100%', background: selectedFilePath === file.path ? 'rgba(254, 243, 199, 0.4)' : 'transparent',
                            border: 'none', borderRadius: '6px', padding: '6px 8px', textAlign: 'left',
                            fontSize: '11px', color: '#57534e', cursor: file.type === 'blob' ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}
                        >
                          <Folder size={12} style={{ color: '#d97706', marginRight: '4px', display: file.type === 'tree' ? 'inline' : 'none' }} />
                          <File size={12} style={{ color: '#8c857b', marginRight: '4px', display: file.type === 'blob' ? 'inline' : 'none' }} />
                          <span>{file.path.split('/').pop()}</span>
                        </button>
                      ))
                    ) : (
                      <p style={{ padding: '12px', fontSize: '11px', color: '#8c857b', textAlign: 'center' }}>No repository loaded.</p>
                    )}
                  </div>
                </div>

                {/* Code viewer pane */}
                <div style={{ flex: 1, background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #e7e5e4', background: '#fafaf9', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1c1917' }}>
                      {selectedFilePath ? selectedFilePath.split('/').pop() : 'No file selected'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href={gitInfo ? `https://github.com/${gitInfo.owner}/${gitInfo.repo}/archive/refs/heads/main.zip` : '#'}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', height: '28px', border: '1px solid #e7e5e4' }}
                      >
                        <Download size={11} /> Download ZIP
                      </a>
                      <button
                        onClick={handleCopyCloneCommand}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', height: '28px', border: '1px solid #e7e5e4', background: '#ffffff', cursor: 'pointer' }}
                      >
                        {copied ? <Check size={11} style={{ color: '#10b981' }} /> : <Copy size={11} />}
                        {copied ? 'Copied!' : 'Copy Clone'}
                      </button>
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', height: '28px', border: '1px solid #e7e5e4' }}
                      >
                        <Github size={11} /> GitHub ↗
                      </a>
                    </div>
                  </div>

                  {/* Scrollable code area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px', position: 'relative' }}>
                    {isFileLoading ? (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div className="verify-spinner" style={{ width: '24px', height: '24px' }}></div>
                        <span style={{ fontSize: '11px', color: '#8c857b' }}>Fetching code...</span>
                      </div>
                    ) : fileContent ? (
                      highlightCode(fileContent)
                    ) : (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#8c857b', fontSize: '11px', textAlign: 'center' }}>
                        Select a file from the repository tree to inspect code lines
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          )}

          {/* README TAB */}
          {activeTab === 'readme' && (
            <div className="glass-panel" style={{ padding: '24px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e7e5e4', minHeight: '100%' }}>
              {isReadmeLoading ? (
                <div style={{ padding: '40px', textAlign: 'center', fontSize: '12px', color: '#8c857b' }}>Loading README.md documentation...</div>
              ) : readmeContent ? (
                parseMarkdown(readmeContent)
              ) : (
                <div style={{ color: '#8c857b', fontSize: '12px', textAlign: 'center', padding: '40px' }}>No README.md documentation loaded.</div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── Right Review Workspace Pane (40%) ── */}
      <div style={{ width: '40%', height: '100%', background: '#ffffff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header box */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: 0 }}>Review Workbench</h2>
            <span style={{ fontSize: '11px', color: '#8c857b' }}>Verify quality metrics on peer project</span>
          </div>
          <button className="modal-close" onClick={onClose} style={{ position: 'static' }}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form & Reviews List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {/* 1. Project details summary card */}
          <div className="glass-panel" style={{ padding: '16px', background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '12px', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', marginBottom: '4px' }}>{project.title}</h3>
            <p style={{ fontSize: '11px', color: '#57534e', marginBottom: '12px', lineHeight: 1.4 }}>{project.description}</p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {project.tags.map(tag => (
                <span key={tag} className="project-tag" style={{ fontSize: '10px' }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* 2. Interactive submission form */}
          <form onSubmit={handleReviewSubmit} style={{ borderBottom: '1px solid #e7e5e4', paddingBottom: '24px', marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#8c857b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Submit Peer Critique
            </h4>

            {/* Category selection */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px' }}>Critique Focus Category</label>
              <select 
                className="form-textarea" 
                style={{ padding: '8px 12px', cursor: 'pointer', height: '36px', fontSize: '12px' }} 
                value={reviewCategory}
                onChange={e => setReviewCategory(e.target.value as any)}
              >
                <option value="ui">UI/UX Sense & Polish</option>
                <option value="perf">Performance & DB Querying</option>
                <option value="bug">Bug Report / Code Issue</option>
                <option value="idea">Feature Recommendation</option>
              </select>
            </div>

            {/* Ratings Sliders */}
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Design & UX Score', val: scoreDesign, setVal: setScoreDesign },
                { label: 'Code Architecture Score', val: scoreCode, setVal: setScoreCode },
                { label: 'Performance Score', val: scorePerformance, setVal: setScorePerformance }
              ].map(slider => (
                <div key={slider.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: '#57534e' }}>{slider.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input 
                      type="range" min="1" max="5" 
                      value={slider.val} 
                      onChange={e => slider.setVal(parseInt(e.target.value))}
                      style={{ width: '80px', accentColor: '#f59e0b', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1c1917', width: '12px' }}>{slider.val}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback textbox */}
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '11px' }}>Feedback Details (Min 50 chars)</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={reviewContent}
                onChange={e => setReviewContent(e.target.value)}
                placeholder="Submit structural feedback. Target code optimization, CSS alignments, database constraints, or Lighthouse ratings..."
                style={{ fontSize: '12px' }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                <span style={{ fontSize: '11px', color: totalChars >= 50 ? '#10b981' : '#a8a29e' }}>
                  {totalChars >= 50 ? '✓ Length satisfied' : `Need ${50 - totalChars} more characters`}
                </span>
                <span style={{ fontSize: '10px', color: '#a8a29e' }}>{totalChars} chars</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              disabled={isSubmitDisabled}
            >
              <Send size={12} style={{ marginRight: '4px' }} /> Submit Peer Review (+1 Credit)
            </button>
          </form>

          {/* 3. Listed peer reviews */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 800, color: '#8c857b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              Peer Critiques ({project.reviews.length})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {project.reviews.map(review => (
                <div key={review.id} className="review-item" style={{ background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#1c1917' }}>{review.author}</span>
                      <span style={{ fontSize: '9px', color: '#a8a29e', display: 'block' }}>{review.category?.toUpperCase() || 'GENERAL'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={10} 
                          style={{ 
                            fill: i < (review.rating || 5) ? '#f59e0b' : 'transparent',
                            color: i < (review.rating || 5) ? '#f59e0b' : '#a8a29e'
                          }} 
                        />
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: '12px', color: '#57534e', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>{review.content}</p>
                </div>
              ))}
              {project.reviews.length === 0 && (
                <p style={{ fontSize: '11px', color: '#8c857b', textAlign: 'center', padding: '16px' }}>
                  No reviews submitted yet. Be the first critic!
                </p>
              )}
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
