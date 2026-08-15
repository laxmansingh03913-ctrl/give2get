import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, Folder, Tag, Compass, Award, User, CornerDownLeft } from 'lucide-react';
import type { Project } from './Dashboard';

interface CmdkBarProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onSelectView: (view: 'explore' | 'leaderboard' | 'profile') => void;
  onSelectTag: (tag: string | null) => void;
  tags: string[];
}

export default function CmdkBar({
  isOpen,
  onClose,
  projects,
  onSelectProject,
  onSelectView,
  onSelectTag,
  tags
}: CmdkBarProps) {
  const [search, setSearch] = useState('');

  // Handle Ctrl+K / Cmd+K globally in the parent, but let's make sure ESC and close events are handled
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-dialog" onClick={(e) => e.stopPropagation()}>
        <Command label="Global Command Menu" value={search} onValueChange={setSearch}>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', color: 'rgb(113, 113, 122)' }} />
            <Command.Input
              className="cmdk-input"
              placeholder="Search projects, stacks, profiles, or run commands..."
              style={{ paddingLeft: '48px' }}
              autoFocus
            />
          </div>

          <Command.List className="cmdk-list">
            <Command.Empty style={{ padding: '16px', fontSize: '13px', color: 'rgb(113, 113, 122)', textAlign: 'center' }}>
              No results found.
            </Command.Empty>

            {/* Navigation Actions Group */}
            <Command.Group heading="Navigation">
              <Command.Item
                className="cmdk-item"
                onSelect={() => {
                  onSelectView('explore');
                  onClose();
                }}
              >
                <Compass className="cmdk-item-icon" size={16} />
                <span>Jump to Explore Feed</span>
                <span className="cmdk-shortcut">↵</span>
              </Command.Item>

              <Command.Item
                className="cmdk-item"
                onSelect={() => {
                  onSelectView('leaderboard');
                  onClose();
                }}
              >
                <Award className="cmdk-item-icon" size={16} />
                <span>Jump to Leaderboard</span>
                <span className="cmdk-shortcut">↵</span>
              </Command.Item>

              <Command.Item
                className="cmdk-item"
                onSelect={() => {
                  onSelectView('profile');
                  onClose();
                }}
              >
                <User className="cmdk-item-icon" size={16} />
                <span>Jump to My Profile</span>
                <span className="cmdk-shortcut">↵</span>
              </Command.Item>
            </Command.Group>

            {/* Projects Group */}
            {projects.length > 0 && (
              <Command.Group heading="Projects">
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    className="cmdk-item"
                    value={`${project.title} ${project.description}`}
                    onSelect={() => {
                      onSelectProject(project);
                      onClose();
                    }}
                  >
                    <Folder className="cmdk-item-icon" size={16} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 600 }}>{project.title}</span>
                      <span style={{ fontSize: '11px', color: 'rgb(113, 113, 122)' }}>by {project.author}</span>
                    </div>
                    <span className="cmdk-shortcut">Inspect</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Tech Stacks / Tags Group */}
            {tags.length > 0 && (
              <Command.Group heading="Filter by Stack">
                {tags.map((tag) => (
                  <Command.Item
                    key={tag}
                    className="cmdk-item"
                    onSelect={() => {
                      onSelectTag(tag);
                      onSelectView('explore');
                      onClose();
                    }}
                  >
                    <Tag className="cmdk-item-icon" size={16} />
                    <span>Filter: {tag}</span>
                    <span className="cmdk-shortcut">Tag</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          <div className="cmdk-footer">
            <span>Use ↑↓ to navigate</span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CornerDownLeft size={10} /> enter to select
            </span>
            <span>•</span>
            <span>esc to close</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
