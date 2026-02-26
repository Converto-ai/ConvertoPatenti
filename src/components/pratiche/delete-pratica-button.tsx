"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, X } from "lucide-react";

export function DeletePraticaButton({ praticaId }: { praticaId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${praticaId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/pratiche");
      }
    } finally {
      setLoading(false);
    }
  };

  if (confirming) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 space-y-2.5">
        <div className="flex items-center gap-2 text-rose-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-[12px] font-medium">Eliminare definitivamente questa pratica?</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-3 py-1.5 text-[12px] font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Eliminazione..." : "Sì, elimina"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            className="px-3 py-1.5 text-[12px] font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all duration-150"
    >
      <Trash2 className="w-4 h-4" />
      Elimina pratica
    </button>
  );
}
