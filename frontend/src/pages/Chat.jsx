import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Sparkles, Send, Lightbulb, MessageCircle, Dumbbell, Apple, Brain } from "lucide-react";

const modes = [
  { id: "general", label: "Generale", icon: MessageCircle, color: "coral" },
  { id: "fitness", label: "Trainer", icon: Dumbbell, color: "mint" },
  { id: "nutrition", label: "Nutrizionista", icon: Apple, color: "amber" },
  { id: "psychology", label: "Psicologo", icon: Brain, color: "lavender" },
];

const promptsByMode = {
  general: ["Cosa dovrei fare adesso?", "Riassumi la mia giornata", "Ricordami di bere acqua", "Dammi una spinta"],
  fitness: ["Dammi un allenamento da 30 min", "Come miglioro gli addominali?", "Scheda per dimagrire", "Esercizi senza attrezzi"],
  nutrition: ["Cosa mangio stasera?", "Spuntino sano", "Idee pranzo veloce", "Come ridurre lo zucchero"],
  psychology: ["Oggi mi sento sotto pressione", "Non riesco a dormire", "Come gestisco l'ansia?", "Mi va di sfogarmi"],
};

const Chat = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState("general");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef(null);

  const loadHistory = useCallback(async (m) => {
    setLoadingHistory(true);
    try {
      const { data } = await api.get(`/chat/${m}`);
      setMessages(data);
    } catch { setMessages([]); }
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { loadHistory(mode); }, [mode, loadHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const send = async () => {
    const v = text.trim();
    if (!v || sending) return;
    setText("");
    const temp = { id: `temp-${Date.now()}`, role: "user", text: v, created_at: new Date().toISOString() };
    setMessages((p) => [...p, temp]);
    setSending(true);
    try {
      const { data } = await api.post("/chat", { text: v, mode });
      setMessages((p) => [...p.filter((m) => m.id !== temp.id), data.user_message, data.clone_message]);
    } catch (e) {
      setMessages((p) => [...p, { id: `err-${Date.now()}`, role: "clone", text: "Scusa, qualcosa è andato storto. Riprova.", created_at: new Date().toISOString() }]);
    } finally {
      setSending(false);
    }
  };

  const initials = (user?.name || "Io").trim().slice(0, 2).toUpperCase();
  const activeMode = modes.find((m) => m.id === mode);
  const ActiveIcon = activeMode.icon;

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }); }
    catch { return ""; }
  };

  const welcome = {
    general: `Ehi ${user?.name || ""}! Sono il tuo clone. Da cosa partiamo?`,
    fitness: "Pronto a sudare? Chiedimi una scheda, un esercizio, o un consiglio sulla tecnica.",
    nutrition: "Dimmi obiettivo e preferenze, e ti costruisco un pasto o un piano.",
    psychology: "Sono qui. Come ti senti davvero oggi? Puoi dirmi tutto, nessun giudizio.",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#845EF7]" />
        </div>
        <div className="flex-1">
          <div className="font-display text-xl font-bold leading-none flex items-center gap-2">
            iClone <span className="text-sm font-sans font-normal text-[#6b6659]">· {activeMode.label}</span>
          </div>
          <div className="text-xs text-[#6b6659] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#51CF66]" /> online · pensa come {user?.name || "te"}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto thin-scroll pb-1">
        {modes.map((m) => {
          const Icon = m.icon;
          const active = m.id === mode;
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border-2 shrink-0 transition-colors ${active ? "bg-[#1b1b1f] text-white border-[#1b1b1f]" : "bg-white text-[#1b1b1f] border-[#ece4d3] hover:border-[#1b1b1f]"}`}>
              <Icon className="w-4 h-4" /> {m.label}
            </button>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll bg-white rounded-3xl border border-[#ece4d3] p-5 space-y-4">
        {loadingHistory ? (
          <div className="text-center text-[#6b6659] text-sm py-10">Carico la memoria...</div>
        ) : messages.length === 0 ? (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] flex items-center justify-center">
              <ActiveIcon className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#f2ead9] rounded-2xl rounded-tl-md px-4 py-3 max-w-[75%]">
              <div className="text-[15px] leading-relaxed">{welcome[mode]}</div>
            </div>
          </div>
        ) : messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "clone" && <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />}
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${m.role === "user" ? "bg-[#1b1b1f] text-white rounded-tr-md" : "bg-[#f2ead9] text-[#1b1b1f] rounded-tl-md"}`}>
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
              <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-white/50" : "text-[#6b6659]"}`}>{fmtTime(m.created_at)}</div>
            </div>
            {m.role === "user" && <div className="w-8 h-8 shrink-0 rounded-xl bg-[#1b1b1f] text-white flex items-center justify-center text-xs font-semibold">{initials}</div>}
          </div>
        ))}
        {sending && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />
            <div className="bg-[#f2ead9] rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1">
              <span className="typing-dot w-2 h-2 rounded-full bg-[#6b6659]" />
              <span className="typing-dot w-2 h-2 rounded-full bg-[#6b6659]" />
              <span className="typing-dot w-2 h-2 rounded-full bg-[#6b6659]" />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {promptsByMode[mode].map((p) => (
          <button key={p} onClick={() => setText(p)}
            className="inline-flex items-center gap-1.5 text-xs md:text-sm bg-white border border-[#ece4d3] hover:border-[#1b1b1f] text-[#1b1b1f] px-3 py-1.5 rounded-full transition-colors">
            <Lightbulb className="w-3.5 h-3.5 text-[#FFD43B]" />{p}
          </button>
        ))}
      </div>

      <div className="mt-3 bg-white rounded-2xl border border-[#ece4d3] p-2 flex items-end gap-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Scrivi al tuo ${activeMode.label.toLowerCase()}...`}
          className="min-h-[48px] max-h-32 border-0 focus-visible:ring-0 resize-none" />
        <Button onClick={send} disabled={!text.trim() || sending}
          className="bg-[#1b1b1f] hover:bg-black text-white rounded-xl shrink-0 h-10 w-10 p-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
