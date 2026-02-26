"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export function GenerateDocsButton({ praticaId }: { praticaId: string }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [msg, setMsg] = useState("");
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    setStatus("idle");
    try {
      const res = await fetch(`/api/cases/${praticaId}/documents`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMsg(data.error ?? "Errore generazione");
      } else {
        setStatus("ok");
        setMsg(`${data.generated?.length ?? 0} document${(data.generated?.length ?? 0) === 1 ? "o" : "i"} generati`);
        router.refresh();
      }
    } catch {
      setStatus("error");
      setMsg("Errore di rete");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-soft-xs"
      >
        {loading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        {loading ? "Generazione..." : "Genera documenti"}
      </button>
      {status === "ok" && (
        <div className="flex items-center gap-1.5 text-[12px] text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {msg}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-1.5 text-[12px] text-rose-600">
          <AlertCircle className="w-3.5 h-3.5" />
          {msg}
        </div>
      )}
    </div>
  );
}
