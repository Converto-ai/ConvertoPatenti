"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  Trash2, Plus, History, ChevronLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatPanelProps {
  praticaId?: string;
  praticaNome?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORAGE_KEY = "convertopatenti_chats";
const POS_KEY = "convertopatenti_chat_pos";

// ── Markdown renderer ─────────────────────────────────────────────────────────

function MD({ content, onNav }: { content: string; onNav: (p: string) => void }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ children }) => (
          <div className="overflow-x-auto my-2 rounded-lg border border-gray-200">
            <table className="min-w-full text-xs border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-blue-50 text-blue-800">{children}</thead>,
        th: ({ children }) => <th className="px-3 py-2 text-left font-semibold whitespace-nowrap border-b border-blue-200">{children}</th>,
        td: ({ children }) => <td className="px-3 py-2 border-b border-gray-100 text-gray-700">{children}</td>,
        tr: ({ children }) => <tr className="even:bg-gray-50/60">{children}</tr>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1.5 pl-1 text-gray-700">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1.5 pl-1 text-gray-700">{children}</ol>,
        li: ({ children }) => <li className="leading-snug">{children}</li>,
        h1: ({ children }) => <h1 className="font-bold text-base mt-3 mb-1 text-gray-900">{children}</h1>,
        h2: ({ children }) => <h2 className="font-bold text-sm mt-2 mb-1 text-gray-900">{children}</h2>,
        h3: ({ children }) => <h3 className="font-semibold text-sm mt-1.5 mb-0.5 text-gray-800">{children}</h3>,
        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
        code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
        hr: () => <hr className="my-2 border-gray-200" />,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-300 pl-3 my-1 text-gray-600 italic">{children}</blockquote>
        ),
        a: ({ href, children }) => {
          if (!href) return <span>{children}</span>;
          const isInternal =
            href.startsWith("/") ||
            href.includes("localhost") ||
            href.includes("vercel.app") ||
            href.includes("convertopatenti");
          if (isInternal) {
            const path = href.startsWith("http") ? new URL(href).pathname : href;
            return (
              <button
                onClick={() => onNav(path)}
                className="text-blue-600 underline hover:text-blue-800 font-medium cursor-pointer"
              >
                {children}
              </button>
            );
          }
          return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">{children}</a>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch { return []; }
}

function saveConversations(convs: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs.slice(0, 50)));
}

function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "Nuova conversazione",
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function titleFromMessages(msgs: Message[]): string {
  const first = msgs.find((m) => m.role === "user");
  if (!first) return "Nuova conversazione";
  return first.content.slice(0, 48) + (first.content.length > 48 ? "…" : "");
}

// ── Draggable hook ────────────────────────────────────────────────────────────

interface Pos { x: number; y: number }

function useDraggable(defaultPos: Pos) {
  const [pos, setPos] = useState<Pos>(() => {
    if (typeof window === "undefined") return defaultPos;
    try {
      const saved = localStorage.getItem(POS_KEY);
      return saved ? JSON.parse(saved) : defaultPos;
    } catch { return defaultPos; }
  });
  const dragging = useRef(false);
  const origin = useRef<Pos>({ x: 0, y: 0 });
  const startPos = useRef<Pos>({ x: 0, y: 0 });

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, textarea, input, a")) return;
    dragging.current = true;
    origin.current = { x: e.clientX, y: e.clientY };
    startPos.current = pos;
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - origin.current.x;
      const dy = e.clientY - origin.current.y;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const PW = 600; const PH = 680;
      const nx = Math.min(Math.max(startPos.current.x + dx, 0), W - PW);
      const ny = Math.min(Math.max(startPos.current.y + dy, 0), H - PH);
      setPos({ x: nx, y: ny });
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        setPos((p) => { localStorage.setItem(POS_KEY, JSON.stringify(p)); return p; });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return { pos, onMouseDown };
}

// ── Main component ────────────────────────────────────────────────────────────

export function ChatPanel({ praticaId: praticaIdProp, praticaNome }: ChatPanelProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Always-fresh refs — fix stale closure: sendMessage reads these instead of state
  const conversationsRef = useRef<Conversation[]>([]);
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Default position: bottom-right
  const defaultPos = typeof window !== "undefined"
    ? { x: window.innerWidth - 616, y: window.innerHeight - 696 }
    : { x: 100, y: 100 };
  const { pos, onMouseDown } = useDraggable(defaultPos);

  // Auto-detect pratica
  const pathSegments = pathname.split("/").filter(Boolean);
  const praticaFromPath =
    pathSegments[0] === "pratiche" && pathSegments[1] && UUID_RE.test(pathSegments[1])
      ? pathSegments[1] : null;
  const praticaId = praticaIdProp ?? praticaFromPath ?? undefined;
  const onPraticaPage = Boolean(praticaId);

  // Active conversation
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  // Load from localStorage on mount
  useEffect(() => {
    const saved = loadConversations();
    setConversations(saved);
    if (saved.length > 0) setActiveId(saved[0].id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && !showHistory) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, showHistory]);

  const handleNavigate = useCallback((path: string) => {
    router.push(path);
    setOpen(false);
  }, [router]);

  // Create new conversation
  const startNew = useCallback(() => {
    const conv = newConversation();
    setConversations((prev) => {
      const next = [conv, ...prev];
      saveConversations(next);
      return next;
    });
    setActiveId(conv.id);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Switch conversation
  const switchTo = useCallback((id: string) => {
    setActiveId(id);
    setShowHistory(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Delete conversation
  const deleteConv = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveConversations(next);
      if (activeId === id) {
        setActiveId(next[0]?.id ?? null);
        setShowHistory(false);
      }
      return next;
    });
  }, [activeId]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    // Read always-fresh state via refs to avoid stale closure
    let convId = activeIdRef.current;
    if (!convId) {
      const conv = newConversation();
      setConversations((prev) => {
        const next = [conv, ...prev];
        saveConversations(next);
        return next;
      });
      convId = conv.id;
      setActiveId(convId);
      activeIdRef.current = convId;
    }

    // Get the messages for THIS conversation from the ref (always fresh)
    const currentConv = conversationsRef.current.find((c) => c.id === convId);
    const currentMessages = currentConv?.messages ?? [];

    const contextPrefix =
      currentMessages.length === 0 && praticaId
        ? `[Contesto: sto visualizzando la pratica con ID ${praticaId}]\n\n`
        : "";
    const enrichedMsg: Message = { role: "user", content: contextPrefix + text };
    const newMessages = [...currentMessages, enrichedMsg];

    const userVisible: Message = { role: "user", content: text };
    const placeholder: Message = { role: "assistant", content: "" };

    const updateConv = (updater: (msgs: Message[]) => Message[]) => {
      setConversations((prev) => {
        const next = prev.map((c) => {
          if (c.id !== convId) return c;
          const updated = { ...c, messages: updater(c.messages), updatedAt: new Date().toISOString() };
          updated.title = titleFromMessages(updated.messages);
          return updated;
        });
        saveConversations(next);
        return next;
      });
    };

    updateConv((msgs) => [...msgs, userVisible, placeholder]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`Errore ${res.status}`);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              updateConv((msgs) => {
                const copy = [...msgs];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + event.text };
                return copy;
              });
            }
            if (event.type === "error") {
              updateConv((msgs) => {
                const copy = [...msgs];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: `⚠️ ${event.error}` };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      updateConv((msgs) => {
        const copy = [...msgs];
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: "⚠️ Errore di connessione. Riprova." };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, praticaId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickActions = onPraticaPage
    ? ["Dimmi tutto su questa pratica", "Cosa manca per completarla?", "Qual è la classificazione e perché?", "Segna come completata"]
    : ["Quante pratiche ho in attesa?", "Mostrami le pratiche in valutazione", "Cerca le pratiche bloccate", "Cerca candidati marocchini"];

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  };

  if (!open) {
    return (
      <button
        onClick={() => { setOpen(true); if (!activeId) startNew(); }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full shadow-lg px-4 py-3 font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="text-sm">Assistente</span>
      </button>
    );
  }

  return (
    <div
      className="fixed z-50 flex flex-col rounded-2xl shadow-2xl border border-gray-200 bg-white overflow-hidden"
      style={{ left: pos.x, top: pos.y, width: 600, height: 680 }}
    >
      {/* ── Header (drag handle) ── */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Assistente ConvertoPatenti</p>
          <p className="text-xs text-blue-200 truncate">
            {showHistory ? "Cronologia conversazioni" : onPraticaPage ? "Contesto: pratica corrente" : active?.title ?? "Nuova conversazione"}
          </p>
        </div>
        <button onClick={() => { startNew(); setShowHistory(false); }} className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Nuova chat"><Plus className="w-4 h-4" /></button>
        <button onClick={() => setShowHistory((v) => !v)} className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${showHistory ? "text-white bg-white/20" : "text-blue-200 hover:text-white"}`} title="Storico chat"><History className="w-4 h-4" /></button>
        <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="Chiudi"><X className="w-4 h-4" /></button>
      </div>

      {/* ── History panel ── */}
      {showHistory ? (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {conversations.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-12">Nessuna conversazione salvata</p>
          ) : (
            <div className="p-3 space-y-1.5">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => switchTo(c.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-start justify-between gap-2 group ${c.id === activeId ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm text-gray-800 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmtDate(c.updatedAt)} · {c.messages.length} messaggi</p>
                  </div>
                  <span
                    onClick={(e) => deleteConv(c.id, e)}
                    className="text-gray-300 hover:text-red-400 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 cursor-pointer"
                    title="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4 pt-2">
                <div className="text-center space-y-1">
                  <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="font-medium text-gray-800 text-sm">Ciao! Come posso aiutarti?</p>
                  <p className="text-xs text-gray-400">Gestisco pratiche, candidati, documenti e stati.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((q) => (
                    <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="text-left text-xs bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl px-3 py-2.5 text-gray-600 hover:text-blue-700 transition-colors leading-snug">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mt-1">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm"}`}>
                  {msg.role === "assistant" && msg.content === "" ? (
                    <div className="flex items-center gap-1 py-0.5">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  ) : msg.role === "assistant" ? (
                    <MD content={msg.content} onNav={handleNavigate} />
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center mt-1">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── Input ── */}
          <div className="border-t border-gray-100 p-3 flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi un messaggio… (Invio per inviare)"
                rows={2}
                disabled={loading}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
