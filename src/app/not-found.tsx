import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center animate-fade-in">
        <div className="text-8xl font-bold text-slate-100 mb-1 tracking-tighter select-none">
          404
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          Pagina non trovata
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>
        <Link
          href="/pratiche"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-all duration-150 shadow-soft-sm hover:shadow-soft active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Torna alle pratiche
        </Link>
      </div>
    </div>
  );
}
