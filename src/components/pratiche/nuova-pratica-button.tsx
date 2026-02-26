"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Copy, Check, Loader2 } from "lucide-react";

export function NuovaPraticaButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setLink(data.telegram_link);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (link) {
    return (
      <div className="flex items-center gap-2 animate-fade-in">
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-sm text-emerald-700">
          <Check className="w-4 h-4" />
          Pratica creata
        </div>
        <button
          onClick={copyLink}
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-brand-600 text-white hover:bg-brand-700"
          }`}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copiato!" : "Copia link"}
        </button>
        <button
          onClick={() => setLink(null)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all duration-150"
        >
          <Plus className="w-4 h-4" />
          Altra
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleCreate}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-60 transition-all duration-150 shadow-soft-sm hover:shadow-soft active:scale-[0.98]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Plus className="w-4 h-4" />
      )}
      {loading ? "Creazione..." : "Nuova pratica"}
    </button>
  );
}
