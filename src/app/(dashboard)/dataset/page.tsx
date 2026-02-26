import { auth } from "@/src/lib/auth/config";
import { db, fontiNormative } from "@/src/lib/db";
import { desc } from "drizzle-orm";
import countriesData from "@/data/countries.json";
import { AgentUploadForm } from "@/src/components/dataset/agent-upload-form";
import {
  Globe2,
  Handshake,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";

export default async function DatasetPage() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.ruolo === "admin";

  const [paesList, accordiList, fontiList] = await Promise.all([
    db.query.paesi.findMany({
      orderBy: (p, { asc }) => [asc(p.nomeIt)],
      where: (p, { eq }) => eq(p.attivo, true),
      limit: 100,
    }),
    db.query.accordiBilaterali.findMany({
      orderBy: (a, { asc }) => [asc(a.paeseIso)],
      limit: 50,
    }),
    isAdmin
      ? db.query.fontiNormative.findMany({
          orderBy: [desc(fontiNormative.dataAcquisizione)],
          limit: 20,
        })
      : Promise.resolve([]),
  ]);

  const euCountries = paesList.filter((p) => p.isEuEea);
  const activeAccordi = accordiList.filter((a) => a.inVigore);

  const reviewStatusIcon: Record<string, React.ReactNode> = {
    applied: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    rejected: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Dataset normativo
        </h1>
        <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
          Versione{" "}
          <Badge variant="brand">{countriesData.version}</Badge>
          <span className="text-slate-300">·</span>
          {paesList.length} paesi
          <span className="text-slate-300">·</span>
          {activeAccordi.length} accordi bilaterali
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center">
              <Globe2 className="w-4.5 h-4.5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{paesList.length}</p>
              <p className="text-xs text-slate-500">Paesi totali</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{euCountries.length}</p>
              <p className="text-xs text-slate-500">UE/SEE</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center">
              <Handshake className="w-4.5 h-4.5 text-brand-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeAccordi.length}</p>
              <p className="text-xs text-slate-500">Accordi attivi</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-soft-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Sparkles className="w-4.5 h-4.5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{fontiList.length}</p>
              <p className="text-xs text-slate-500">Estrazioni AI</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* EU/EEA Countries */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe2 className="w-4 h-4 text-sky-500" />
              <h2 className="font-semibold text-slate-900 text-sm">
                Paesi UE/SEE
              </h2>
            </div>
            <Badge variant="info">{euCountries.length}</Badge>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {euCountries.map((p) => (
              <div
                key={p.codiceIso}
                className="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
              >
                <span className="text-sm text-slate-700">{p.nomeIt}</span>
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                  {p.codiceIso}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bilateral agreements */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Handshake className="w-4 h-4 text-brand-500" />
              <h2 className="font-semibold text-slate-900 text-sm">
                Accordi bilaterali attivi
              </h2>
            </div>
            <Badge variant="brand">{activeAccordi.length}</Badge>
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {activeAccordi.map((a) => {
              const paese = paesList.find((p) => p.codiceIso === a.paeseIso);
              return (
                <div
                  key={a.id}
                  className="px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">
                      {paese?.nomeIt ?? a.paeseIso}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {a.categorie?.join(", ") ?? "—"}
                    </span>
                  </div>
                  {a.condizioneTemporale &&
                    a.condizioneTemporale !== "nessuna" && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        <p className="text-xs text-amber-600">
                          {a.condizioneTemporale.replace(/_/g, " ")}
                        </p>
                      </div>
                    )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* AI Agent section (admin only) */}
      {isAdmin && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <h2 className="font-semibold text-slate-900 text-sm">
              AI Agent — Estrazione documenti normativi
            </h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-5 leading-relaxed">
              Carica un documento normativo (DOCX, PDF, HTML) per estrarre
              automaticamente dati aggiornati. L&apos;output richiede revisione
              prima dell&apos;applicazione.
            </p>

            <AgentUploadForm />

            {/* Extraction history */}
            {fontiList.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">
                  Estrazioni recenti
                </h3>
                <div className="space-y-2">
                  {fontiList.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between py-2.5 px-4 bg-slate-50/80 rounded-xl text-sm group hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileIcon />
                        <div>
                          <span className="font-medium text-slate-700">
                            {f.nome}
                          </span>
                          <span className="text-slate-400 ml-2 text-xs">
                            v{f.versione}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {reviewStatusIcon[f.statoReview ?? ""] ?? (
                          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span className="text-xs text-slate-500 capitalize">
                          {f.statoReview ?? "sconosciuto"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FileIcon() {
  return (
    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
      <svg
        className="w-3.5 h-3.5 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    </div>
  );
}
