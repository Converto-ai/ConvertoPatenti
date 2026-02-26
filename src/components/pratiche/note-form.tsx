"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";

export function NoteForm({ praticaId }: { praticaId: string }) {
  const router = useRouter();
  const [testo, setTesto] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!testo.trim()) return;
    setLoading(true);

    await fetch(`/api/cases/${praticaId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testo }),
    });

    setTesto("");
    setLoading(false);
    router.refresh();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scrivi una nota..."
          rows={3}
          className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none placeholder:text-slate-400 transition-all duration-150"
        />
        <span className="absolute bottom-2.5 right-3 text-[10px] text-slate-300 select-none">
          ⌘ + Enter
        </span>
      </div>
      <button
        type="submit"
        disabled={loading || !testo.trim()}
        className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-sm bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-40 transition-all duration-150 shadow-soft-sm hover:shadow-soft active:scale-[0.98]"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {loading ? "Salvataggio..." : "Aggiungi nota"}
      </button>
    </form>
  );
}
