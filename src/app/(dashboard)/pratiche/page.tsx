import { auth } from "@/src/lib/auth/config";
import { db, pratiche } from "@/src/lib/db";
import { eq, desc, and, like, sql, SQL } from "drizzle-orm";
import Link from "next/link";
import { ClassificationBadge, StatoBadge } from "@/src/components/ui/badge";
import { NuovaPraticaButton } from "@/src/components/pratiche/nuova-pratica-button";
import {
  ChevronRight,
  Search,
  Filter,
  X,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import countriesData from "@/data/countries.json";

const COUNTRY_MAP = Object.fromEntries(
  (countriesData.countries as { iso: string; name_it: string }[]).map((c) => [
    c.iso,
    c.name_it,
  ])
);

interface PageProps {
  searchParams: Promise<{
    stato?: string;
    classificazione?: string;
    paese?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function PratichePage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) return null;

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const limit = 20;
  const offset = (page - 1) * limit;

  const baseCondition = eq(pratiche.autoscuolaId, session.user.autoscuolaId);
  const conditions: SQL[] = [baseCondition];
  if (params.stato) conditions.push(eq(pratiche.stato, params.stato));
  if (params.classificazione)
    conditions.push(eq(pratiche.classificazione, params.classificazione));
  if (params.paese) conditions.push(eq(pratiche.paeseRilascio, params.paese));
  if (params.q)
    conditions.push(like(pratiche.candidatoCognome, `%${params.q}%`));

  const where = and(...conditions);

  // Fetch data + stats in parallel
  const [results, total, stats] = await Promise.all([
    db.query.pratiche.findMany({
      where,
      orderBy: [desc(pratiche.createdAt)],
      limit,
      offset,
      columns: {
        id: true,
        stato: true,
        classificazione: true,
        candidatoNome: true,
        candidatoCognome: true,
        paeseRilascio: true,
        categoriaPatente: true,
        telegramToken: true,
        createdAt: true,
      },
    }),
    db.$count(pratiche, where),
    db
      .select({
        stato: pratiche.stato,
        count: sql<number>`count(*)::int`,
      })
      .from(pratiche)
      .where(baseCondition)
      .groupBy(pratiche.stato),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasFilters = !!(params.q || params.stato || params.classificazione || params.paese);

  const statCounts = {
    totale: stats.reduce((s, r) => s + r.count, 0),
    attesa: stats.find((s) => s.stato === "attesa_candidato")?.count ?? 0,
    completate: stats.find((s) => s.stato === "completata")?.count ?? 0,
    review:
      (stats.find((s) => s.stato === "valutazione")?.count ?? 0) +
      (stats.find((s) => s.stato === "intake_in_corso")?.count ?? 0),
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pratiche
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Gestisci le pratiche di conversione patente
          </p>
        </div>
        <NuovaPraticaButton />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Totale pratiche"
          value={statCounts.totale}
          icon={<FolderOpen className="w-5 h-5" />}
          color="brand"
        />
        <StatCard
          label="In attesa"
          value={statCounts.attesa}
          icon={<Clock className="w-5 h-5" />}
          color="slate"
        />
        <StatCard
          label="Completate"
          value={statCounts.completate}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="emerald"
        />
        <StatCard
          label="In lavorazione"
          value={statCounts.review}
          icon={<AlertCircle className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-4">
        <form className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="q"
              defaultValue={params.q}
              placeholder="Cerca per cognome..."
              className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200 w-52"
            />
          </div>
          <select
            name="stato"
            defaultValue={params.stato}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200"
          >
            <option value="">Tutti gli stati</option>
            <option value="attesa_candidato">In attesa</option>
            <option value="intake_in_corso">Intake</option>
            <option value="valutazione">Valutazione</option>
            <option value="completata">Completata</option>
            <option value="archiviata">Archiviata</option>
          </select>
          <select
            name="classificazione"
            defaultValue={params.classificazione}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all duration-200"
          >
            <option value="">Tutte le classificazioni</option>
            <option value="LIKELY_CONVERTIBLE">Convertibile</option>
            <option value="NOT_CONVERTIBLE_EXAMS">Esami richiesti</option>
            <option value="NEEDS_REVIEW">Da verificare</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-all duration-150 shadow-soft-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            Filtra
          </button>
          {hasFilters && (
            <Link
              href="/pratiche"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-500 hover:text-slate-700 rounded-lg text-sm hover:bg-slate-100 transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      {results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-2xl mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-700 font-semibold">Nessuna pratica trovata</p>
          <p className="text-slate-400 text-sm mt-1">
            {hasFilters
              ? "Prova a modificare i filtri di ricerca"
              : "Crea una nuova pratica per iniziare"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Candidato
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Paese / Cat.
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Classificazione
                </th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-slate-50/60 transition-colors duration-100"
                >
                  <td className="px-5 py-3.5">
                    {p.candidatoNome || p.candidatoCognome ? (
                      <div>
                        <span className="font-medium text-slate-900">
                          {p.candidatoNome} {p.candidatoCognome}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[13px]">
                        In attesa del candidato
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.paeseRilascio ? (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-700">
                          {COUNTRY_MAP[p.paeseRilascio] ?? p.paeseRilascio}
                        </span>
                        {p.categoriaPatente && (
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-medium">
                            {p.categoriaPatente}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatoBadge stato={p.stato} />
                  </td>
                  <td className="px-5 py-3.5">
                    {p.classificazione ? (
                      <ClassificationBadge classification={p.classificazione} />
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/pratiche/${p.id}`}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-all duration-150 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Pagina {page} di {totalPages}
          </span>
          <div className="flex gap-1.5">
            {page > 1 && (
              <Link
                href={`/pratiche?page=${page - 1}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all duration-150"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Precedente
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/pratiche?page=${page + 1}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all duration-150"
              >
                Successiva
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "brand" | "slate" | "emerald" | "amber";
}) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600",
    slate: "bg-slate-100 text-slate-500",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft-xs p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="text-[12px] text-slate-500 mt-1">{label}</p>
      </div>
    </div>
  );
}
