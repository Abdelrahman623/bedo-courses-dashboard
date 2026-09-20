import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface SlideOverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
}

export const SlideOver: React.FC<SlideOverProps> = ({
  open, onClose, title, subtitle, children, width = 'w-96',
}) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring' as const, stiffness: 320, damping: 32 }}
            className={`fixed right-0 top-0 h-full z-50 ${width} bg-bg-surface border-l border-white/[0.08] flex flex-col shadow-2xl`}
          >
            <div className="flex items-start justify-between p-5">
              <div>
                {title && <h3 className="font-semibold text-txt-primary">{title}</h3>}
                {subtitle && <p className="text-xs text-txt-muted mt-0.5">{subtitle}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={15} />} />
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
