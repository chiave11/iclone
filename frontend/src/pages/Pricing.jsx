import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import {
  Check, Sparkles, Zap, Crown, Loader2, ArrowLeft, Infinity as InfinityIcon,
  MessageCircle, Dumbbell, Brain, Bell, Gift,
} from "lucide-react";
import { toast } from "sonner";

const featuresFree = [
  "15 messaggi chat al giorno",
  "1 piano Coach al mese",
  "Suggerimenti giornalieri base",
  "Calendario + note illimitate",
];
const featuresPro = [
  "Chat illimitata con AI (tutte le modalità)",
  "Piani Coach illimitati (trainer + nutrizionista)",
  "Modalità Psicologo con Claude Sonnet",
  "Suggerimenti AI personalizzati",
  "Notifiche push promemoria",
  "Accesso prioritario a nuove feature",
];

const Pricing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState([]);
  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [cycle, setCycle] = useState("yearly"); // monthly | yearly

  useEffect(() => {
    api.get("/payments/plans").then(({ data }) => {
      setSubs(data.subscriptions);
      setCredits(data.credits);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const checkout = async (lookup_key) => {
    setBuying(lookup_key);
    try {
      const { data } = await api.post("/payments/checkout", {
        lookup_key,
        origin_url: window.location.origin,
      });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Errore nell'avvio del pagamento");
      setBuying(null);
    }
  };

  const monthly = subs.find((s) => s.lookup_key === "iclone_pro_monthly");
  const yearly = subs.find((s) => s.lookup_key === "iclone_pro_yearly");
  const activeSub = cycle === "yearly" ? yearly : monthly;
  const monthlyEquivalent = yearly ? (yearly.amount / 12).toFixed(2) : null;
  const yearlySavings = (monthly && yearly) ? Math.round(((monthly.amount * 12 - yearly.amount) / (monthly.amount * 12)) * 100) : 0;

  const isPro = user?.is_pro;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-[#6b6659] hover:text-[#1b1b1f] mb-6">
        <ArrowLeft className="w-4 h-4" /> Indietro
      </button>

      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-[#FFF3BF] text-[#8B6F00] px-3 py-1 rounded-full text-sm font-medium mb-4">
          <Gift className="w-4 h-4" /> 20% di sconto sul primo mese per i nuovi iscritti
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
          Sblocca il tuo <span className="text-[#FF6B6B]">iClone Pro</span>
        </h1>
        <p className="text-[#6b6659] text-lg mt-3 max-w-xl mx-auto">
          Chat illimitata, piani Coach senza limiti e la modalità Psicologo con Claude. Cancellabile in 1 click.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setCycle("monthly")}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${cycle === "monthly" ? "bg-[#1b1b1f] text-white" : "bg-white text-[#1b1b1f] border border-[#ece4d3]"}`}>
          Mensile
        </button>
        <button
          onClick={() => setCycle("yearly")}
          className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-colors ${cycle === "yearly" ? "bg-[#1b1b1f] text-white" : "bg-white text-[#1b1b1f] border border-[#ece4d3]"}`}>
          Annuale
          {yearlySavings > 0 && (
            <span className="absolute -top-2 -right-2 bg-[#51CF66] text-white text-[10px] px-2 py-0.5 rounded-full">-{yearlySavings}%</span>
          )}
        </button>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
        {/* FREE */}
        <div className="bg-white rounded-3xl border border-[#ece4d3] p-7">
          <div className="text-xs uppercase tracking-wider text-[#6b6659] font-semibold mb-2">Free</div>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="font-display text-4xl font-bold">€0</span>
            <span className="text-[#6b6659]">/ sempre</span>
          </div>
          <ul className="space-y-3 mb-6">
            {featuresFree.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-[#51CF66] mt-0.5 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" disabled className="w-full rounded-full">
            {isPro ? "Piano base" : "Il tuo piano attuale"}
          </Button>
        </div>

        {/* PRO */}
        <div className="relative bg-gradient-to-br from-[#FFE3E3] via-[#FFF3BF] to-[#E5DBFF] rounded-3xl border-2 border-[#1b1b1f] p-7 overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/40 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase tracking-wider text-[#8B6F00] font-bold flex items-center gap-1">
                <Crown className="w-4 h-4" /> Pro
              </div>
              <div className="inline-flex items-center gap-1 bg-[#1b1b1f] text-white px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" /> Più scelto
              </div>
            </div>
            {loading ? (
              <div className="h-16 flex items-center text-[#6b6659]">Carico i prezzi...</div>
            ) : activeSub ? (
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display text-5xl font-bold">
                  €{cycle === "yearly" && monthlyEquivalent ? monthlyEquivalent : activeSub.amount.toFixed(2)}
                </span>
                <span className="text-[#6b6659]">/ mese</span>
              </div>
            ) : null}
            {cycle === "yearly" && yearly && (
              <div className="text-sm text-[#6b6659] mb-5">Fatturato come €{yearly.amount.toFixed(0)} all'anno</div>
            )}
            {cycle === "monthly" && (
              <div className="text-sm text-[#2B8A3E] mb-5 font-medium">Primo mese -20% con il benvenuto</div>
            )}
            <ul className="space-y-3 mb-6">
              {featuresPro.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-[#2B8A3E] mt-0.5 shrink-0" />
                  <span className="text-[#1b1b1f]">{f}</span>
                </li>
              ))}
            </ul>
            {isPro ? (
              <Button disabled className="w-full rounded-full bg-[#51CF66] hover:bg-[#51CF66] text-white">
                <Check className="w-4 h-4 mr-2" /> Sei già Pro
              </Button>
            ) : (
              <Button
                onClick={() => activeSub && checkout(activeSub.lookup_key)}
                disabled={!activeSub || buying === activeSub?.lookup_key}
                className="w-full rounded-full bg-[#1b1b1f] hover:bg-black text-white h-12 text-base"
              >
                {buying === activeSub?.lookup_key ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Attendi...</>
                ) : (
                  <><Crown className="w-4 h-4 mr-2" /> Passa a Pro</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Pay-per-use credits */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">O compra crediti</h2>
        <p className="text-sm text-[#6b6659] mb-4">1 credito = 1 messaggio chat extra. 25 crediti = 1 piano Coach. I crediti non scadono.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {credits.map((c, i) => {
          const palettes = [["from-[#D3F9D8]","text-[#2B8A3E]"],["from-[#D0EBFF]","text-[#1864AB]"],["from-[#FFE3E3]","text-[#C92A2A]"]];
          const [bg, tc] = palettes[i % palettes.length];
          return (
            <div key={c.lookup_key} className={`relative bg-gradient-to-br ${bg} to-white rounded-2xl border border-[#ece4d3] p-5`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`inline-flex items-center gap-1.5 ${tc} font-semibold`}>
                  <Zap className="w-4 h-4" /> {c.credits} crediti
                </div>
                {i === 1 && (
                  <span className="text-[10px] uppercase tracking-wider font-bold bg-[#1b1b1f] text-white px-2 py-0.5 rounded-full">best value</span>
                )}
              </div>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-3xl font-bold">€{c.amount.toFixed(2)}</span>
                <span className="text-xs text-[#6b6659]">= €{(c.amount / c.credits).toFixed(3)}/credito</span>
              </div>
              <Button
                onClick={() => checkout(c.lookup_key)}
                disabled={buying === c.lookup_key}
                variant="outline"
                className="w-full rounded-full border-[#1b1b1f] hover:bg-[#1b1b1f] hover:text-white"
              >
                {buying === c.lookup_key ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Acquista
              </Button>
            </div>
          );
        })}
      </div>

      {/* Features showcase */}
      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: MessageCircle, title: "Chat illimitata", desc: "Senza limiti giornalieri", c: "text-[#FF6B6B] bg-[#FFE3E3]" },
          { icon: Dumbbell, title: "Coach illimitati", desc: "Fitness e nutrizione", c: "text-[#2B8A3E] bg-[#D3F9D8]" },
          { icon: Brain, title: "Psicologo premium", desc: "Powered by Claude", c: "text-[#5F3DC4] bg-[#E5DBFF]" },
          { icon: Bell, title: "Notifiche smart", desc: "Mai più un impegno dimenticato", c: "text-[#8B6F00] bg-[#FFF3BF]" },
        ].map((f, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-[#ece4d3]">
            <div className={`inline-flex w-10 h-10 rounded-xl items-center justify-center ${f.c} mb-3`}>
              <f.icon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm">{f.title}</div>
            <div className="text-xs text-[#6b6659] mt-1">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center text-xs text-[#6b6659]">
        Puoi disdire in qualsiasi momento dal tuo profilo. Nessun rinnovo nascosto, nessuna sorpresa.
        <br />Pagamento sicuro via Stripe. Supportiamo carta, Apple Pay, Google Pay.
      </div>
    </div>
  );
};

export default Pricing;
