import React from 'react';
import { Trash2 } from 'lucide-react';
import { AppModal } from './ui/AppModal';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes, Delete',
  cancelText = 'Cancel',
}) => {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onCancel}
      size="md"
      title={title || 'Confirm Deletion'}
      subtitle="This record will be permanently deleted"
      icon={Trash2}
      iconColorClass="from-rose-500/25 to-red-600/20 text-rose-400 border-rose-500/30 shadow-rose-950/40"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-xs font-extrabold text-white shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{confirmText}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
          {message}
        </p>
        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 leading-snug flex items-start gap-2">
          <span className="font-bold">⚠️ Warning:</span>
          <span>This action cannot be undone. Associated ledger entries may also be adjusted.</span>
        </div>
      </div>
    </AppModal>
  );
};
