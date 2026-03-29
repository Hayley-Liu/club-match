import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export default function ToastContainer() {
  const toasts = useStore(s => s.toasts);
  const removeToast = useStore(s => s.removeToast);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg text-white font-medium text-sm pointer-events-auto animate-slide-in-up ${
            toast.type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
            toast.type === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
            'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> :
           toast.type === 'error' ? <XCircle size={18} /> :
           <Info size={18} />}
          {toast.message}
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 opacity-80 hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
