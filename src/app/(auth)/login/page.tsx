import { loginAction } from "./actions";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const hasError = !!params.error;

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: brand + features ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-400/10 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">ConvertoPatenti</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative z-10">
          <p className="text-brand-300/80 text-sm font-medium uppercase tracking-widest mb-4">Piattaforma B2B per autoscuole</p>
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
            Conversione patenti<br />
            <span className="text-brand-300">senza errori.</span>
          </h1>
          <p className="text-brand-200/70 text-base leading-relaxed max-w-md">
            Gestisci pratiche di conversione patente estera in modo automatico,
            dalla raccolta dati al modulo TT2112 precompilato.
          </p>

          {/* Feature list */}
          <div className="mt-8 space-y-3.5">
            {[
              "Bot Telegram multilingua per raccolta dati candidato",
              "Rules engine deterministico — nessuna AI per classificazioni",
              "TT2112 precompilato in un click",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-brand-300" />
                </div>
                <span className="text-brand-100/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10">
          <p className="text-brand-400/50 text-xs">
            © {new Date().getFullYear()} ConvertoPatenti · Tutti i diritti riservati
          </p>
        </div>
      </div>

      {/* ── Right panel: login form ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 bg-slate-50 relative">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-3">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">ConvertoPatenti</h2>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] animate-scale-in">
          <div className="bg-white rounded-3xl shadow-soft-xl border border-slate-200/60 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Accedi</h2>
              <p className="text-slate-500 text-sm mt-1.5">Inserisci le credenziali del tuo account autoscuola.</p>
            </div>

            <form action={loginAction} className="space-y-5">
              <div>
                <label className="block text-[13px] font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200"
                  placeholder="nome@autoscuola.it"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[13px] font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              {hasError && (
                <div className="flex items-center gap-2.5 bg-rose-50 text-rose-600 text-sm px-4 py-3 rounded-xl border border-rose-100 animate-fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Email o password non corretti.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-4 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-all duration-200 shadow-soft hover:shadow-soft-md active:scale-[0.98] mt-1"
              >
                Accedi al gestionale
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <p className="text-center text-[12px] text-slate-400 mt-5">
            Problemi di accesso?{" "}
            <span className="text-brand-500 hover:text-brand-600 cursor-pointer transition-colors">
              Contatta il supporto
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
