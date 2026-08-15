import { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Project, Review } from './Dashboard';
import ProjectWorkbench from './ProjectWorkbench';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
  onAddReview: (projectId: string, review: Omit<Review, 'id' | 'createdAt'>) => void;
}

export default function ProjectDetailModal({ project, onClose, onAddReview }: ProjectDetailModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ zIndex: 1000, padding: 0 }}
    >
      <motion.div
        className="modal-content glass-panel"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        style={{
          width: '100vw',
          height: '100vh',
          maxWidth: '100vw',
          margin: 0,
          borderRadius: 0,
          padding: 0,
          border: 'none',
          overflow: 'hidden'
        }}
      >
        <ProjectWorkbench
          project={project}
          onAddReview={onAddReview}
          onClose={onClose}
        />
      </motion.div>
    </motion.div>
  );
}
