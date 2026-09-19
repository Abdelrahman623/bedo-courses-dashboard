import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  width?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, width = 'max-w-lg', children,
}) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' as const }}
            className={[
              'relative z-10 w-full flex flex-col',
              width,
              'max-h-[88vh] bg-[#121622] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden my-auto',
            ].join(' ')}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] flex-shrink-0 bg-[#161B28]">
                <h2 className="font-semibold text-sm text-white tracking-tight">{title}</h2>
                <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={15} />} />
              </div>
            )}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
