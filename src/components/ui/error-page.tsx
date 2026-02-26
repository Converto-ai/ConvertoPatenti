"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[50vh] animate-fade-in">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-50 rounded-2xl mb-5">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Si è verificato un errore
        </h2>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all duration-150 shadow-soft-sm hover:shadow-soft active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4" />
          Riprova
        </button>
      </div>
    </div>
  );
}
