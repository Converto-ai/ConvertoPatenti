"use client";

import { useState, FormEvent, useRef, DragEvent } from "react";
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react";

export function AgentUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState("portale_automobilista");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source_type", sourceType);

    try {
      const res = await fetch("/api/agent/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Errore sconosciuto");
      } else {
        setResult(data.result as Record<string, unknown>);
      }
    } catch {
      setError("Errore di rete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-3 py-8 px-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-brand-400 bg-brand-50/60"
              : file
              ? "border-emerald-300 bg-emerald-50/40"
              : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.html,.htm,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
          {file ? (
            <>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-700">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="absolute top-3 right-3 p-1 rounded-lg hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-brand-600">
                    Clicca per selezionare
                  </span>{" "}
                  o trascina qui
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  PDF, DOCX, HTML, TXT
                </p>
              </div>
            </>
          )}
        </div>

        {/* Source type */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
            Tipo fonte
          </label>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all duration-150"
          >
            <option value="portale_automobilista">
              Portale Automobilista
            </option>
            <option value="circolare_mit">Circolare MIT</option>
            <option value="gazzetta_ufficiale">Gazzetta Ufficiale</option>
            <option value="altro">Altro</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!file || loading}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-all duration-150 shadow-soft-sm hover:shadow-soft active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading
            ? "Estrazione in corso (30-60s)..."
            : "Lancia estrazione AI"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-4 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Estrazione completata — revisione richiesta
            </p>
          </div>
          <details className="group">
            <summary className="text-xs font-medium text-emerald-600 cursor-pointer hover:text-emerald-700 transition-colors">
              Visualizza output JSON
            </summary>
            <pre className="mt-3 text-xs bg-white/80 rounded-lg p-3.5 overflow-auto max-h-96 border border-emerald-100 text-slate-700 font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
