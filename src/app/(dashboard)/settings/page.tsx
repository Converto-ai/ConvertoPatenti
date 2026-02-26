import { auth } from "@/src/lib/auth/config";
import {
  User,
  Mail,
  Building2,
  Shield,
  Database,
  Scale,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Impostazioni
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Gestisci il tuo account e le preferenze
        </p>
      </div>

      {/* Account card */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-soft-xs overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <User className="w-4 h-4 text-brand-500" />
          <h2 className="font-semibold text-slate-900 text-sm">Account</h2>
        </div>
        <div className="p-6">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-lg font-bold shadow-soft-sm">
              {(session.user.name ?? "U")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {session.user.name}
              </p>
              <p className="text-sm text-slate-500">{session.user.email}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="space-y-4">
            <SettingsRow
              icon={<Mail className="w-4 h-4 text-slate-400" />}
              label="Email"
              value={session.user.email ?? "—"}
            />
            <SettingsRow
              icon={<Building2 className="w-4 h-4 text-slate-400" />}
              label="Autoscuola"
              value={session.user.autoscuolaNome ?? "—"}
            />
            <SettingsRow
              icon={<Shield className="w-4 h-4 text-slate-400" />}
              label="Ruolo"
              value={
                <Badge variant={session.user.ruolo === "admin" ? "brand" : "neutral"}>
                  {session.user.ruolo}
                </Badge>
              }
            />
          </div>
        </div>
      </div>

      {/* Dataset link card */}
      <Link
        href="/dataset"
        className="group flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-soft-xs p-5 mb-6 hover:border-brand-200 hover:shadow-soft transition-all duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Database className="w-5 h-5 text-brand-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900 text-sm">
              Dataset normativo
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestisci paesi, accordi e usa l&apos;AI Agent per estrazioni
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
      </Link>

      {/* Legal disclaimer */}
      <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Scale className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 text-sm mb-1">
              Nota legale
            </h3>
            <p className="text-amber-800 text-xs leading-relaxed">
              ConvertoPatenti produce{" "}
              <strong>pre-classificazioni a supporto</strong> basate su dataset
              normativo. L&apos;operatore è responsabile della verifica finale
              di ogni pratica. Le classificazioni non sono decisioni legali
              vincolanti.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <div className="flex items-center gap-3">
        {icon}
        <span className="text-sm text-slate-500">{label}</span>
      </div>
      <div className="text-sm font-medium text-slate-900">{value}</div>
    </div>
  );
}
