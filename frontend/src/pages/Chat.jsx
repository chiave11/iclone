import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { Sparkles, Send, Lightbulb } from "lucide-react";

const quickPrompts = [
  "Cosa dovrei fare adesso?",
  "Riassumi la mia giornata",
  "Ricordami di bere acqua",
  "Dammi una spinta motivazionale",
];

const Chat = () => {
  const { chat, sendMessage, profile } = useApp();
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    // show typing when last msg is from user
    const last = chat[chat.length - 1];
    if (last && last.role === "user") {
      setTyping(true);
      const t = setTimeout(() => setTyping(false), 1400);
      return () => clearTimeout(t);
    }
    setTyping(false);
  }, [chat]);

  const handleSend = () => {
    const v = text.trim();
    if (!v) return;
    sendMessage(v);
    setText("");
  };

  const initials = (profile.name || "Io").trim().slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10 flex flex-col h-[calc(100vh-4rem)] md:h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />
          <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#845EF7]" />
        </div>
        <div>
          <div className="font-display text-xl font-bold leading-none">Il tuo clone</div>
          <div className="text-xs text-[#6b6659] mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#51CF66]" /> online · pensa come {profile.name || "te"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto thin-scroll bg-white rounded-3xl border border-[#ece4d3] p-5 space-y-4"
      >
        {chat.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "clone" && (
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "bg-[#1b1b1f] text-white rounded-tr-md"
                  : "bg-[#f2ead9] text-[#1b1b1f] rounded-tl-md"
              }`}
            >
              <div className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</div>
              <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-white/50" : "text-[#6b6659]"}`}>
                {m.time}
              </div>
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 shrink-0 rounded-xl bg-[#1b1b1f] text-white flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            )}
          </div>
        ))}
        {typing && (
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

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mt-4">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => sendMessage(p)}
            className="inline-flex items-center gap-1.5 text-xs md:text-sm bg-white border border-[#ece4d3] hover:border-[#1b1b1f] text-[#1b1b1f] px-3 py-1.5 rounded-full transition-colors"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FFD43B]" />
            {p}
          </button>
        ))}
      </div>

      {/* Composer */}
      <div className="mt-3 bg-white rounded-2xl border border-[#ece4d3] p-2 flex items-end gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Scrivi al tuo clone..."
          className="min-h-[48px] max-h-32 border-0 focus-visible:ring-0 resize-none"
        />
        <Button
          onClick={handleSend}
          disabled={!text.trim()}
          className="bg-[#1b1b1f] hover:bg-black text-white rounded-xl shrink-0 h-10 w-10 p-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Chat;
