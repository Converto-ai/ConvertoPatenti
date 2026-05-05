import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const SITO_URL = process.env.SITO_MARKETING_URL ?? "https://convertopatenti.it";

export default function PianoScadutoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Piano scaduto</h1>
        <p className="text-gray-500 text-sm leading-relaxed">
          Il tuo abbonamento è scaduto. Per continuare ad accedere al gestionale
          rinnova il piano dal sito.
        </p>
        <a
          href={`${SITO_URL}/prezzi`}
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Rinnova il piano
        </a>
        <p className="text-xs text-gray-400">
          Problemi?{" "}
          <a href={`${SITO_URL}/contatti`} className="underline hover:text-gray-600">
            Contattaci
          </a>
        </p>
      </div>
    </div>
  );
}
