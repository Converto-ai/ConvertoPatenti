"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-200 flex-shrink-0 ${
        copied
          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
          : "bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100"
      }`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          Copiato
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copia
        </>
      )}
    </button>
  );
}
