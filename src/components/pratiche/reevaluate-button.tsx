"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

export function ReevaluateButton({ praticaId }: { praticaId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleReevaluate() {
    setLoading(true);
    await fetch(`/api/cases/${praticaId}/evaluate`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleReevaluate}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 transition-all duration-150 active:scale-[0.98]"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <RefreshCw className="w-3.5 h-3.5" />
      )}
      {loading ? "Rielaborazione..." : "Rielabora"}
    </button>
  );
}
