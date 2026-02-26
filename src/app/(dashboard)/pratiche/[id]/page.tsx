import { auth } from "@/src/lib/auth/config";
import { db, pratiche, documentiGenerati } from "@/src/lib/db";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ClassificationBadge, StatoBadge, Badge } from "@/src/components/ui/badge";
import { NoteForm } from "@/src/components/pratiche/note-form";
import { ReevaluateButton } from "@/src/components/pratiche/reevaluate-button";
import { CopyLinkButton } from "@/src/components/pratiche/copy-link-button";
import { GenerateDocsButton } from "@/src/components/pratiche/generate-docs-button";
import { DeletePraticaButton } from "@/src/components/pratiche/delete-pratica-button";
import {
  ChevronRight,
  Calendar,
  User,
  Globe,
  CreditCard,
  MapPin,
  Shield,
  FileDown,
  FileCheck,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  FileText,
} from "lucide-react";
import countriesData from "@/data/countries.json";

const COUNTRY_MAP = Object.fromEntries(
  (countriesData.countries as { iso: string; name_it: string }[]).map((c) => [
    c.iso,
    c.name_it,
  ])
);

function formatDate(d: string | Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function timeAgo(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  return `${days}g fa`;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const STEPS = [
  { key: "attesa_candidato", label: "Attesa" },
  { key: "intake_in_corso", label: "Intake" },
  { key: "valutazione", label: "Valutazione" },
  { key: "completata", label: "Completata" },
];

export default async function PraticaDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const pratica = await db.query.pratiche.findFirst({
    where: and(
      eq(pratiche.id, id),
      eq(pratiche.autoscuolaId, session.user.autoscuolaId)
    ),
    with: {
      autoscuola: { columns: { nome: true } },
      operatore: { columns: { nome: true, cognome: true } },
      documenti: true,
      note: {
        with: {
          operatore: { columns: { nome: true, cognome: true } },
        },
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      },
    },
  });

  if (!pratica) notFound();

  // Documenti generati
  const docsGenerati = await db
    .select()
    .from(documentiGenerati)
    .where(eq(documentiGenerati.praticaId, id))
    .orderBy(desc(documentiGenerati.createdAt));

  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME ?? "ConvertoPatentiBot";
  const telegramLink = `https://t.me/${botUsername}?start=${pratica.telegramToken}`;

  const reasons = (pratica.classificazioneReasons as string[]) ?? [];
  const docsRequired =
    (pratica.documentiRichiestiOutput as {
      doc_id: string;
      nome: string;
      obbligatorio: boolean;
      note?: string;
    }[]) ?? [];
  const missingInfo = (pratica.infoMancanti as string[]) ?? [];

  const currentStepIndex = STEPS.findIndex((s) => s.key === pratica.stato);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-6">
        <Link
          href="/pratiche"
          className="hover:text-slate-600 transition-colors"
        >
          Pratiche
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-700 font-medium">
          {pratica.candidatoNome
            ? `${pratica.candidatoNome} ${pratica.candidatoCognome}`
            : `Pratica ${id.slice(0, 8)}`}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {pratica.candidatoNome
                    ? `${pratica.candidatoNome} ${pratica.candidatoCognome}`
                    : "Candidato non registrato"}
                </h1>
                <div className="flex items-center gap-2 mt-2.5">
                  <StatoBadge stato={pratica.stato} />
                  {pratica.classificazione && (
                    <ClassificationBadge
                      classification={pratica.classificazione}
                    />
                  )}
                </div>
              </div>
              <div className="text-right text-[12px] text-slate-400 space-y-0.5">
                <div className="flex items-center gap-1 justify-end">
                  <Calendar className="w-3 h-3" />
                  Creata {formatDate(pratica.createdAt)}
                </div>
                <div>Aggiornata {formatDate(pratica.updatedAt)}</div>
              </div>
            </div>

            {/* Progress stepper */}
            {pratica.stato !== "archiviata" && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  {STEPS.map((step, i) => {
                    const isCompleted = i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex-1 flex items-center gap-1">
                        <div className="flex-1">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              isCompleted || isCurrent
                                ? "bg-brand-500"
                                : "bg-slate-100"
                            }`}
                          />
                          <p
                            className={`text-[10px] mt-1.5 ${
                              isCurrent
                                ? "text-brand-600 font-semibold"
                                : isCompleted
                                ? "text-slate-500"
                                : "text-slate-300"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Telegram link */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <p className="text-[12px] text-slate-400 mb-2 font-medium uppercase tracking-wider">
                Link candidato
              </p>
              <div className="flex items-center gap-2">
                <code className="text-[12px] bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/80 text-slate-600 flex-1 truncate font-mono">
                  {telegramLink}
                </code>
                <CopyLinkButton text={telegramLink} />
              </div>
            </div>
          </div>

          {/* Dati candidato */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-6">
            <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Dati candidato
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <DataField
                icon={<User className="w-4 h-4" />}
                label="Nome completo"
                value={
                  pratica.candidatoNome || pratica.candidatoCognome
                    ? `${pratica.candidatoNome ?? ""} ${pratica.candidatoCognome ?? ""}`.trim()
                    : null
                }
              />
              <DataField
                icon={<Calendar className="w-4 h-4" />}
                label="Data di nascita"
                value={pratica.candidatoNascita ? formatDate(pratica.candidatoNascita) : null}
              />
              <DataField
                icon={<Globe className="w-4 h-4" />}
                label="Paese rilascio"
                value={
                  pratica.paeseRilascio
                    ? COUNTRY_MAP[pratica.paeseRilascio] ?? pratica.paeseRilascio
                    : null
                }
              />
              <DataField
                icon={<CreditCard className="w-4 h-4" />}
                label="Categoria"
                value={pratica.categoriaPatente}
                mono
              />
              <DataField
                icon={<Calendar className="w-4 h-4" />}
                label="Rilascio patente"
                value={pratica.dataRilascioPatente ? formatDate(pratica.dataRilascioPatente) : null}
              />
              <DataField
                icon={<Clock className="w-4 h-4" />}
                label="Scadenza patente"
                value={pratica.dataScadenzaPatente ? formatDate(pratica.dataScadenzaPatente) : null}
                suffix={
                  pratica.patenteValida === true ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 text-[11px]">
                      <CheckCircle2 className="w-3 h-3" /> valida
                    </span>
                  ) : pratica.patenteValida === false ? (
                    <span className="inline-flex items-center gap-0.5 text-rose-500 text-[11px]">
                      <XCircle className="w-3 h-3" /> scaduta
                    </span>
                  ) : null
                }
              />
              <DataField
                icon={<MapPin className="w-4 h-4" />}
                label="Residenza Italia"
                value={pratica.dataPrimaResidenza ? formatDate(pratica.dataPrimaResidenza) : null}
              />
              <DataField
                icon={<Shield className="w-4 h-4" />}
                label="Tipo soggiorno"
                value={pratica.tipoSoggiorno?.replace(/_/g, " ") ?? null}
                capitalize
              />
            </div>
          </div>

          {/* Classificazione */}
          {pratica.classificazione && (
            <div
              className={`bg-white rounded-xl border shadow-soft-xs p-6 ${
                pratica.classificazione === "LIKELY_CONVERTIBLE"
                  ? "border-l-4 border-l-emerald-500 border-slate-200/80"
                  : pratica.classificazione === "NOT_CONVERTIBLE_EXAMS"
                  ? "border-l-4 border-l-rose-500 border-slate-200/80"
                  : "border-l-4 border-l-amber-500 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider">
                  Classificazione
                </h2>
                <div className="flex items-center gap-3">
                  {pratica.classificazioneVersione && (
                    <span className="text-[11px] text-slate-400">
                      v{pratica.classificazioneVersione}
                    </span>
                  )}
                  <ReevaluateButton praticaId={id} />
                </div>
              </div>

              <ClassificationBadge classification={pratica.classificazione} />

              {reasons.length > 0 && (
                <div className="mt-4 space-y-2">
                  {reasons.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-slate-600"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              )}

              {missingInfo.length > 0 && (
                <div className="mt-4 bg-amber-50 rounded-lg p-3.5 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-[13px] font-semibold text-amber-700">
                      Informazioni mancanti
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {missingInfo.map((m, i) => (
                      <li
                        key={i}
                        className="text-sm text-amber-600 pl-6"
                      >
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Documenti richiesti */}
          {docsRequired.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-6">
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Documenti richiesti
              </h2>
              <div className="space-y-2">
                {docsRequired.map((doc) => (
                  <div
                    key={doc.doc_id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50"
                  >
                    {doc.obbligatorio ? (
                      <FileCheck className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <FileWarning className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {doc.nome}
                      </p>
                      {doc.note && (
                        <p className="text-[12px] text-slate-400 mt-0.5">
                          {doc.note}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={doc.obbligatorio ? "error" : "neutral"}
                      className="text-[10px]"
                    >
                      {doc.obbligatorio ? "Richiesto" : "Opzionale"}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documenti caricati */}
          {pratica.documenti && pratica.documenti.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-6">
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Documenti caricati ({pratica.documenti.length})
              </h2>
              <div className="space-y-2">
                {pratica.documenti.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {doc.nomeOriginale}
                      </p>
                      <p className="text-[12px] text-slate-400">
                        {doc.caricatoDa} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded">
                      {doc.mimeType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Azioni */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-5">
            <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Azioni
            </h3>
            <div className="space-y-2">
              <GenerateDocsButton praticaId={id} />
              <a
                href={`/api/cases/${id}/export-pdf`}
                target="_blank"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 text-slate-700"
              >
                <FileDown className="w-4 h-4" />
                Scheda legacy PDF
              </a>
              <div className="pt-1 border-t border-slate-100">
                <DeletePraticaButton praticaId={id} />
              </div>
            </div>
          </div>

          {/* Documenti generati */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-5">
            <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Documenti generati
            </h3>
            {docsGenerati.length === 0 ? (
              <p className="text-sm text-slate-400">Nessun documento generato.<br/>Premi &ldquo;Genera documenti&rdquo; per crearli.</p>
            ) : (
              <div className="space-y-2">
                {docsGenerati.map((doc) => {
                  const labels: Record<string, string> = {
                    scheda_pratica: "Scheda Pratica",
                    tt2112: "Modulo TT2112",
                    scheda_esami: "Scheda Avvio Esami",
                  };
                  return (
                    <a
                      key={doc.id}
                      href={doc.storageKey}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/80 hover:bg-brand-50 hover:border-brand-200 transition-all group"
                    >
                      <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 group-hover:text-brand-700">
                          {labels[doc.tipoDocumento] ?? doc.tipoDocumento}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-5">
            <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Note operatore
            </h3>

            {pratica.note && pratica.note.length > 0 ? (
              <div className="space-y-3 mb-4">
                {pratica.note.map((nota) => {
                  const op = nota.operatore as { nome: string; cognome: string } | null;
                  const initials = op
                    ? `${op.nome[0]}${op.cognome[0]}`.toUpperCase()
                    : "??";
                  return (
                    <div
                      key={nota.id}
                      className="bg-slate-50/80 rounded-lg p-3"
                    >
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {nota.testo}
                      </p>
                      <div className="flex items-center gap-2 mt-2.5">
                        <div className="w-5 h-5 rounded-md bg-brand-100 flex items-center justify-center text-[9px] font-bold text-brand-600">
                          {initials}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {op?.nome} {op?.cognome} · {timeAgo(nota.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">Nessuna nota</p>
            )}

            <NoteForm praticaId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DataField({
  icon,
  label,
  value,
  mono,
  capitalize,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  mono?: boolean;
  capitalize?: boolean;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50">
      <div className="text-slate-400 mt-0.5 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
          {label}
        </p>
        <p
          className={`text-sm text-slate-800 font-medium mt-0.5 ${
            mono ? "font-mono" : ""
          } ${capitalize ? "capitalize" : ""}`}
        >
          {value ?? <span className="text-slate-300">—</span>}
          {suffix && <span className="ml-1.5">{suffix}</span>}
        </p>
      </div>
    </div>
  );
}
