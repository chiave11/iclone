import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Checkbox } from "../components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import {
  Sun, Coffee, Target, Sparkles, Plus, Clock, MessageCircle,
  CheckCircle2, ArrowRight, Zap, Flame, Heart, Dumbbell, Apple, Brain,
} from "lucide-react";
import { Link } from "react-router-dom";
import { colorMap } from "../mock/mock";

const iconMap = { Sun, Coffee, Target, Zap, Heart, Dumbbell, Apple, Brain };

const greet = () => {
  const h = new Date().getHours();
  if (h < 6) return "Ancora sveglio?";
  if (h < 12) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  if (h < 22) return "Buonasera";
  return "Notte fonda";
};

const Dashboard = () => {
  const { user } = useAuth();
  const { events, reminders, addReminder, toggleReminder, suggestions } = useApp();
  const [newRem, setNewRem] = useState("");

  const todayEvents = useMemo(
    () => events.filter((e) => e.date === "today").sort((a, b) => a.time.localeCompare(b.time)),
    [events]
  );
  const openRem = reminders.filter((r) => !r.done);
  const doneCount = reminders.length - openRem.length;

  const handleAdd = async () => {
    if (!newRem.trim()) return;
    await addReminder(newRem.trim());
    setNewRem("");
  };

  const today = new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });

  const activeSuggestions = suggestions && suggestions.length ? suggestions : [
    { icon: "Sun", text: "Inizia dal task più piccolo per prendere ritmo." },
    { icon: "Target", text: "Blocca un'ora di focus nel pomeriggio." },
    { icon: "Coffee", text: "Pausa a metà mattina, 5 minuti lontano dallo schermo." },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-10 mb-8 border border-[#ece4d3] bg-gradient-to-br from-[#FFE3E3] via-[#FFF3BF] to-[#E5DBFF]">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute right-16 bottom-4 w-24 h-24 rounded-full bg-[#845EF7]/20 blur-xl" />
        <div className="relative">
          <div className="text-sm text-[#6b6659] capitalize mb-2">{today}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            {greet()}, {user?.name || "tu"}.
          </h1>
          <p className="text-[#4a453b] text-lg mt-3 max-w-xl">
            Ho dato un'occhiata alla tua giornata. {todayEvents.length > 0
              ? `Hai ${todayEvents.length} impegni, il primo alle ${todayEvents[0].time}.`
              : "Niente in agenda, giornata libera. Approfittane."}
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/chat">
              <Button className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" /> Parla col clone
              </Button>
            </Link>
            <Link to="/coach">
              <Button variant="outline" className="rounded-full border-[#1b1b1f] text-[#1b1b1f] hover:bg-white/60">
                Vai dai coach <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-[#845EF7]" />
        <span className="text-sm font-semibold text-[#6b6659] uppercase tracking-wider">Il clone suggerisce</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {activeSuggestions.slice(0, 3).map((s, i) => {
          const Icon = iconMap[s.icon] || Sparkles;
          const palettes = ["coral", "amber", "lavender"];
          const c = colorMap[palettes[i % palettes.length]];
          return (
            <div key={i} className="bg-white rounded-2xl p-5 border border-[#ece4d3] hover:shadow-md transition-shadow">
              <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${c.bgSoft} ${c.text} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-[#1b1b1f] font-medium leading-snug">{s.text}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-3xl border border-[#ece4d3] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold">Oggi in agenda</h2>
              <p className="text-sm text-[#6b6659]">{todayEvents.length} impegni</p>
            </div>
            <Link to="/calendar" className="text-sm font-medium text-[#FF6B6B] hover:underline">
              Apri calendario →
            </Link>
          </div>
          {todayEvents.length === 0 ? (
            <div className="text-center py-10 text-[#6b6659]">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-60" />
              Nessun impegno. Giornata tua.
            </div>
          ) : (
            <div className="space-y-2">
              {todayEvents.map((e) => {
                const c = colorMap[e.color] || colorMap.coral;
                return (
                  <div key={e.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-[#faf6ed] transition-colors">
                    <div className={`w-1.5 h-12 rounded-full ${c.bg}`} />
                    <div className="flex-1">
                      <div className="font-semibold">{e.title}</div>
                      <div className="text-sm text-[#6b6659] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {e.time}
                      </div>
                    </div>
                    <Badge className={`${c.bgSoft} ${c.text} border-0 capitalize`}>{e.type}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl border border-[#ece4d3] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-display text-2xl font-bold">Promemoria</h2>
              <p className="text-sm text-[#6b6659]">{openRem.length} aperti · {doneCount} fatti</p>
            </div>
            <Flame className="w-5 h-5 text-[#FF6B6B]" />
          </div>

          <div className="flex gap-2 mb-4">
            <Input value={newRem} onChange={(e) => setNewRem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Aggiungi promemoria..." className="rounded-xl h-10" />
            <Button onClick={handleAdd} size="icon" className="bg-[#1b1b1f] hover:bg-black rounded-xl shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-1 max-h-80 overflow-y-auto thin-scroll pr-1">
            {reminders.map((r) => (
              <label key={r.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#faf6ed] cursor-pointer">
                <Checkbox checked={r.done} onCheckedChange={() => toggleReminder(r.id)}
                  className="data-[state=checked]:bg-[#51CF66] data-[state=checked]:border-[#51CF66]" />
                <span className={`flex-1 text-sm ${r.done ? "line-through text-[#9b958a]" : ""}`}>{r.text}</span>
                {r.priority === "alta" && !r.done && <Zap className="w-3.5 h-3.5 text-[#FF6B6B]" />}
              </label>
            ))}
          </div>
        </div>
      </div>

      {user?.goals && (
        <div className="mt-6 bg-[#1b1b1f] text-white rounded-3xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B6B] flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/60 mb-1">Il tuo obiettivo del mese</div>
            <div className="text-lg">{user.goals}</div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-white/40 ml-auto" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
