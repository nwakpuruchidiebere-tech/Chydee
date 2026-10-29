import React from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DestructiveConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  affectedItem?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DestructiveConfirmModal: React.FC<DestructiveConfirmModalProps> = ({
  isOpen,
  title,
  description,
  affectedItem,
  confirmLabel = 'Confirm & Proceed',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`${
        isDark ? 'bg-slate-900 border-slate-700/80 text-white' : 'bg-white border-slate-300 shadow-2xl text-slate-950'
      } border rounded-2xl max-w-md w-full p-6 shadow-2xl relative transition-colors`}>
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-1 rounded-lg transition ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl flex-shrink-0 ${
              isDestructive
                ? isDark
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-rose-100 text-rose-700 border border-rose-300'
                : isDark
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border border-blue-300'
            }`}
          >
            {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>

          <div className="flex-1">
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{title}</h3>
            <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700 font-medium'}`}>{description}</p>

            {affectedItem && (
              <div className={`mt-3 p-2.5 rounded-lg font-mono text-xs break-all border ${
                isDark ? 'bg-slate-800/80 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-900 font-semibold'
              }`}>
                {affectedItem}
              </div>
            )}
          </div>
        </div>

        <div className={`mt-6 flex items-center justify-end gap-3 pt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition border ${
              isDark
                ? 'text-slate-300 hover:text-white hover:bg-slate-800 border-transparent'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border-slate-300'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/40'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
