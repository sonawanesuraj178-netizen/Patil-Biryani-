import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type ModalSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';

export interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  iconColorClass?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  headerActions?: React.ReactNode;
}

const sizeMap: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw] lg:max-w-[90vw]',
};

export const AppModal: React.FC<AppModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColorClass = 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  size = 'lg',
  children,
  footer,
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  headerActions,
}) => {
  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          {/* Frosted Acrylic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-all"
            onClick={closeOnBackdropClick ? onClose : undefined}
          />

          {/* Desktop Application Style Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 28,
              mass: 0.7,
            }}
            className={`relative w-full ${sizeMap[size]} my-auto flex flex-col rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900/98 via-slate-900/95 to-slate-950/98 shadow-2xl shadow-black/90 backdrop-blur-2xl overflow-hidden z-10 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Gloss Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />

            {/* Application Modal Header */}
            {(title || Icon || showCloseButton || headerActions) && (
              <div
                className={`flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-white/10 bg-slate-950/50 select-none ${headerClassName}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {Icon && (
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr border shadow-inner ${iconColorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    {typeof title === 'string' ? (
                      <h3 className="font-display text-base sm:text-lg font-bold text-slate-100 truncate tracking-tight">
                        {title}
                      </h3>
                    ) : (
                      title
                    )}
                    {subtitle && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{subtitle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="group flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 border border-white/10 text-slate-400 hover:bg-slate-700 hover:text-white hover:border-white/20 transition-all active:scale-95"
                      title="Close (Esc)"
                    >
                      <X className="h-4 w-4 transition-transform group-hover:rotate-90" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body with Custom Scrollbar */}
            <div
              className={`p-5 sm:p-6 overflow-y-auto max-h-[calc(85vh-130px)] custom-scrollbar text-slate-200 ${bodyClassName}`}
            >
              {children}
            </div>

            {/* Application Modal Footer */}
            {footer && (
              <div
                className={`flex flex-wrap items-center justify-end gap-3 px-5 sm:px-6 py-3.5 border-t border-white/10 bg-slate-950/60 ${footerClassName}`}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
