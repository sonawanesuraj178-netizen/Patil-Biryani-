import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  HelpCircle,
  X,
  Check,
  Bell,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppModal } from '../components/ui/AppModal';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'primary';

export interface ConfirmDialogOptions {
  title: string;
  message: React.ReactNode;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  icon?: React.ComponentType<{ className?: string }>;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertDialogOptions {
  title: string;
  message: React.ReactNode;
  subtitle?: string;
  buttonText?: string;
  variant?: 'info' | 'warning' | 'error' | 'success';
  onDismiss?: () => void;
}

export interface PromptDialogOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
}

interface AppNotificationContextType {
  // Toasts
  showToast: (message: string, type?: ToastType, options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => void;
  toastSuccess: (message: string, title?: string) => void;
  toastError: (message: string, title?: string) => void;
  toastWarning: (message: string, title?: string) => void;
  toastInfo: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;

  // Confirmation Modals (Replaces window.confirm)
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;

  // Alert Modals (Replaces alert)
  alert: (options: string | AlertDialogOptions) => Promise<void>;

  // Prompt Modals (Replaces window.prompt)
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
}

const AppNotificationContext = createContext<AppNotificationContextType | null>(null);

export const useAppNotification = () => {
  const context = useContext(AppNotificationContext);
  if (!context) {
    throw new Error('useAppNotification must be used within an AppNotificationProvider');
  }
  return context;
};

// Global shorthand hook
export const useToast = () => {
  const { showToast, toastSuccess, toastError, toastWarning, toastInfo, dismissToast } = useAppNotification();
  return { showToast, toastSuccess, toastError, toastWarning, toastInfo, dismissToast };
};

export const useAppConfirm = () => {
  const { confirm } = useAppNotification();
  return confirm;
};

export const useAppAlert = () => {
  const { alert } = useAppNotification();
  return alert;
};

export const AppNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Toast notifications state
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmDialogOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
  });

  // Alert modal state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertDialogOptions;
    resolve?: () => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
  });

  // Prompt modal state
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptDialogOptions;
    value: string;
    resolve?: (value: string | null) => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
      onConfirm: () => {},
    },
    value: '',
  });

  // Toast methods
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options?: Partial<Omit<ToastItem, 'id' | 'message' | 'type'>>) => {
      const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
      const duration = options?.duration ?? 3800;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
        action: options?.action,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toastSuccess = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'success', { title });
    },
    [showToast]
  );

  const toastError = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'error', { title: title || 'Action Notice' });
    },
    [showToast]
  );

  const toastWarning = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'warning', { title: title || 'Warning' });
    },
    [showToast]
  );

  const toastInfo = useCallback(
    (message: string, title?: string) => {
      showToast(message, 'info', { title });
    },
    [showToast]
  );

  // App-level Confirm method (Promise-based)
  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmClose = (result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    if (result && confirmState.options.onConfirm) {
      confirmState.options.onConfirm();
    } else if (!result && confirmState.options.onCancel) {
      confirmState.options.onCancel();
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // App-level Alert method (Promise-based)
  const alert = useCallback((options: string | AlertDialogOptions): Promise<void> => {
    const parsedOptions: AlertDialogOptions =
      typeof options === 'string'
        ? {
            title: 'Notice',
            message: options,
            variant: 'info',
          }
        : options;

    return new Promise((resolve) => {
      setAlertState({
        isOpen: true,
        options: parsedOptions,
        resolve,
      });
    });
  }, []);

  const handleAlertClose = () => {
    if (alertState.resolve) {
      alertState.resolve();
    }
    if (alertState.options.onDismiss) {
      alertState.options.onDismiss();
    }
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  // App-level Prompt method (Promise-based)
  const prompt = useCallback((options: PromptDialogOptions): Promise<string | null> => {
    return new Promise((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        value: options.defaultValue || '',
        resolve,
      });
    });
  }, []);

  const handlePromptClose = (confirmResult: boolean) => {
    if (promptState.resolve) {
      promptState.resolve(confirmResult ? promptState.value : null);
    }
    if (confirmResult && promptState.options.onConfirm) {
      promptState.options.onConfirm(promptState.value);
    } else if (!confirmResult && promptState.options.onCancel) {
      promptState.options.onCancel();
    }
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  // Determine icon & colors for Confirm Dialog
  const getConfirmStyle = (variant: ConfirmDialogVariant = 'danger', CustomIcon?: React.ComponentType<{ className?: string }>) => {
    switch (variant) {
      case 'danger':
        return {
          icon: CustomIcon || Trash2,
          iconClass: 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30',
          btnClass: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 active:scale-95',
          borderClass: 'border-rose-500/30',
        };
      case 'warning':
        return {
          icon: CustomIcon || AlertTriangle,
          iconClass: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
          btnClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95',
          borderClass: 'border-amber-500/30',
        };
      case 'success':
        return {
          icon: CustomIcon || CheckCircle2,
          iconClass: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
          btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 active:scale-95',
          borderClass: 'border-emerald-500/30',
        };
      case 'info':
        return {
          icon: CustomIcon || Info,
          iconClass: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
          btnClass: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95',
          borderClass: 'border-cyan-500/30',
        };
      case 'primary':
      default:
        return {
          icon: CustomIcon || HelpCircle,
          iconClass: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
          btnClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95',
          borderClass: 'border-amber-500/30',
        };
    }
  };

  const confirmStyle = getConfirmStyle(confirmState.options.variant, confirmState.options.icon);
  const ConfirmIcon = confirmStyle.icon;

  return (
    <AppNotificationContext.Provider
      value={{
        showToast,
        toastSuccess,
        toastError,
        toastWarning,
        toastInfo,
        dismissToast,
        confirm,
        alert,
        prompt,
      }}
    >
      {children}

      {/* TOAST CONTAINER (Floating Application UI Notification Banners) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => {
            const isSuccess = t.type === 'success';
            const isError = t.type === 'error';
            const isWarning = t.type === 'warning';

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.94 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-2xl bg-slate-900/95 text-slate-100 ${
                  isSuccess
                    ? 'border-emerald-500/40 bg-gradient-to-r from-slate-900/98 to-emerald-950/40 shadow-emerald-950/40'
                    : isError
                    ? 'border-rose-500/40 bg-gradient-to-r from-slate-900/98 to-rose-950/40 shadow-rose-950/40'
                    : isWarning
                    ? 'border-amber-500/40 bg-gradient-to-r from-slate-900/98 to-amber-950/40 shadow-amber-950/40'
                    : 'border-cyan-500/40 bg-gradient-to-r from-slate-900/98 to-slate-900 shadow-slate-950/50'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                    isSuccess
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                      : isError
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : isWarning
                      ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                      : 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                  }`}
                >
                  {isSuccess ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : isError ? (
                    <XCircle className="h-4 w-4" />
                  ) : isWarning ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Info className="h-4 w-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  {t.title && (
                    <div className="text-xs font-bold text-slate-100 tracking-tight leading-snug">
                      {t.title}
                    </div>
                  )}
                  <p className="text-xs text-slate-300 leading-relaxed break-words">{t.message}</p>

                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action?.onClick();
                        dismissToast(t.id);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2"
                    >
                      <span>{t.action.label}</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="shrink-0 p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* GLOBAL CONFIRMATION APPLICATION MODAL */}
      <AppModal
        isOpen={confirmState.isOpen}
        onClose={() => handleConfirmClose(false)}
        size="md"
        icon={ConfirmIcon}
        iconColorClass={confirmStyle.iconClass}
        title={confirmState.options.title || 'Confirm Action'}
        subtitle={confirmState.options.subtitle}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => handleConfirmClose(false)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all hover:text-white"
            >
              {confirmState.options.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handleConfirmClose(true)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${confirmStyle.btnClass}`}
            >
              {confirmState.options.confirmText || 'Confirm'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {typeof confirmState.options.message === 'string' ? (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {confirmState.options.message}
            </p>
          ) : (
            confirmState.options.message
          )}
        </div>
      </AppModal>

      {/* GLOBAL ALERT APPLICATION MODAL */}
      <AppModal
        isOpen={alertState.isOpen}
        onClose={handleAlertClose}
        size="md"
        icon={
          alertState.options.variant === 'error'
            ? XCircle
            : alertState.options.variant === 'warning'
            ? AlertTriangle
            : alertState.options.variant === 'success'
            ? CheckCircle2
            : Info
        }
        iconColorClass={
          alertState.options.variant === 'error'
            ? 'from-rose-500/20 to-red-500/20 text-rose-400 border-rose-500/30'
            : alertState.options.variant === 'warning'
            ? 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
            : alertState.options.variant === 'success'
            ? 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30'
            : 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30'
        }
        title={alertState.options.title || 'Information'}
        subtitle={alertState.options.subtitle}
        footer={
          <button
            type="button"
            onClick={handleAlertClose}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
          >
            {alertState.options.buttonText || 'OK'}
          </button>
        }
      >
        <div className="space-y-2">
          {typeof alertState.options.message === 'string' ? (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {alertState.options.message}
            </p>
          ) : (
            alertState.options.message
          )}
        </div>
      </AppModal>

      {/* GLOBAL PROMPT APPLICATION MODAL */}
      <AppModal
        isOpen={promptState.isOpen}
        onClose={() => handlePromptClose(false)}
        size="md"
        icon={HelpCircle}
        iconColorClass="from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30"
        title={promptState.options.title || 'Input Required'}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => handlePromptClose(false)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-slate-800 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              {promptState.options.cancelText || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={() => handlePromptClose(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/25"
            >
              {promptState.options.confirmText || 'Submit'}
            </button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePromptClose(true);
          }}
          className="space-y-3"
        >
          <p className="text-xs sm:text-sm text-slate-300">{promptState.options.message}</p>
          <input
            autoFocus
            type="text"
            value={promptState.value}
            onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value }))}
            placeholder={promptState.options.placeholder || 'Type here...'}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-white/15 text-slate-100 text-sm focus:outline-none focus:border-cyan-400"
          />
        </form>
      </AppModal>
    </AppNotificationContext.Provider>
  );
};
