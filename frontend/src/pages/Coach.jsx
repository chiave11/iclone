import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Dumbbell, Apple, Brain, Save, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const tabs = [
  { id: "profile", label: "Dati fisici", icon: Save, color: "sky" },
  { id: "fitness", label: "Personal trainer", icon: Dumbbell, color: "mint" },
  { id: "nutrition", label: "Nutrizionista", icon: Apple, color: "amber" },
  { id: "psychology", label: "Psicologo", icon: Brain, color: "lavender" },
];

// very light markdown-ish rendering
const renderPlan = (text) => {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const content = line.replace(/^#+\s*/, "");
      const sizes = ["text-3xl", "text-2xl", "text-xl", "text-lg", "text-base", "text-sm"];
      return <div key={i} className={`font-display font-bold ${sizes[level - 1]} mt-5 mb-2`}>{content}</div>;
    }
    if (/^\*\*(.+)\*\*/.test(line)) {
      return <div key={i} className="font-semibold mt-3">{line.replace(/\*\*/g, "")}</div>;
    }
    if (/^[-*]\s/.test(line)) {
      return <div key={i} className="pl-4 text-[#4a453b]">• {line.replace(/^[-*]\s*/, "")}</div>;
    }
    if (line.trim() === "") return <div key={i} className="h-2" />;
    // inline bold
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <div key={i} className="text-[#4a453b] leading-relaxed">
        {parts.map((p, j) =>
          /^\*\*.+\*\*$/.test(p) ? <strong key={j}>{p.replace(/\*\*/g, "")}</strong> : <span key={j}>{p}</span>
        )}
      </div>
    );
  });
};

const Coach = () => {
  const { user, updateProfile } = useAuth();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({
    weight: user?.weight || "",
    height: user?.height || "",
    age: user?.age || "",
    sex: user?.sex || "",
    fitness_goal: user?.fitness_goal || "",
    activity_level: user?.activity_level || "",
    diet_preference: user?.diet_preference || "",
  });
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState({ fitness: null, nutrition: null });
  const [generating, setGenerating] = useState({ fitness: false, nutrition: false });
  const [extra, setExtra] = useState({ fitness: "", nutrition: "" });

  useEffect(() => {
    const load = async () => {
      const [f, n] = await Promise.all([
        api.get("/coach/plans/fitness").catch(() => ({ data: null })),
        api.get("/coach/plans/nutrition").catch(() => ({ data: null })),
      ]);
      setPlans({ fitness: f.data, nutrition: n.data });
    };
    load();
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload = {
        weight: form.weight ? Number(form.weight) : null,
        height: form.height ? Number(form.height) : null,
        age: form.age ? Number(form.age) : null,
        sex: form.sex || null,
        fitness_goal: form.fitness_goal || null,
        activity_level: form.activity_level || null,
        diet_preference: form.diet_preference || null,
      };
      await updateProfile(payload);
      toast.success("Dati salvati ✨");
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSaving(false);
    }
  };

  const generatePlan = async (kind) => {
    if (!user?.weight || !user?.height) {
      toast.error("Compila prima peso e altezza nella scheda 'Dati fisici'");
      setTab("profile");
      return;
    }
    setGenerating((p) => ({ ...p, [kind]: true }));
    try {
      const { data } = await api.post("/coach/plan", { kind, extra_notes: extra[kind] || null });
      setPlans((p) => ({ ...p, [kind]: data }));
      toast.success(kind === "fitness" ? "Scheda allenamento pronta 💪" : "Piano alimentare pronto 🥗");
    } catch {
      toast.error("Errore nella generazione, riprova");
    } finally {
      setGenerating((p) => ({ ...p, [kind]: false }));
    }
  };

  const needsProfile = !user?.weight || !user?.height;

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold">I tuoi coach</h1>
        <p className="text-[#6b6659] mt-1">Personal trainer, nutrizionista e supporto psicologico. Il tuo iClone ha studiato per te.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto thin-scroll pb-1">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border-2 shrink-0 transition-colors ${active ? "bg-[#1b1b1f] text-white border-[#1b1b1f]" : "bg-white text-[#1b1b1f] border-[#ece4d3] hover:border-[#1b1b1f]"}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "profile" && (
        <div className="bg-white rounded-3xl border border-[#ece4d3] p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold mb-1">Dati fisici</h2>
          <p className="text-[#6b6659] mb-6 text-sm">Il clone usa questi dati per creare schede e consigli su misura. Nessun dato viene condiviso.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Peso (kg)</Label>
              <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="Es. 72" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Altezza (cm)</Label>
              <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                placeholder="Es. 178" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Età</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="Es. 29" className="mt-1.5 h-11 rounded-xl" />
            </div>
            <div>
              <Label>Sesso</Label>
              <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="uomo">Uomo</SelectItem>
                  <SelectItem value="donna">Donna</SelectItem>
                  <SelectItem value="altro">Altro / preferisco non dirlo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Obiettivo</Label>
              <Select value={form.fitness_goal} onValueChange={(v) => setForm({ ...form, fitness_goal: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dimagrire">Dimagrire</SelectItem>
                  <SelectItem value="mantenimento">Mantenimento</SelectItem>
                  <SelectItem value="massa">Mettere massa</SelectItem>
                  <SelectItem value="tonificare">Tonificare</SelectItem>
                  <SelectItem value="resistenza">Migliorare resistenza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Livello di attività</Label>
              <Select value={form.activity_level} onValueChange={(v) => setForm({ ...form, activity_level: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentario">Sedentario</SelectItem>
                  <SelectItem value="leggero">Attività leggera (1-2 volte/sett)</SelectItem>
                  <SelectItem value="moderato">Moderata (3-4 volte/sett)</SelectItem>
                  <SelectItem value="intenso">Intensa (5+ volte/sett)</SelectItem>
                  <SelectItem value="atleta">Atleta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Preferenze alimentari</Label>
              <Input value={form.diet_preference} onChange={(e) => setForm({ ...form, diet_preference: e.target.value })}
                placeholder="Es. onnivoro, vegetariano, intolleranza al lattosio..." className="mt-1.5 h-11 rounded-xl" />
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button onClick={saveProfile} disabled={saving} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full px-6">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Salvo..." : "Salva dati"}
            </Button>
          </div>
        </div>
      )}

      {(tab === "fitness" || tab === "nutrition") && (
        <div className="bg-white rounded-3xl border border-[#ece4d3] p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div>
              <h2 className="font-display text-2xl font-bold">
                {tab === "fitness" ? "Scheda allenamento personale" : "Piano alimentare personale"}
              </h2>
              <p className="text-[#6b6659] text-sm mt-1">
                {tab === "fitness"
                  ? "Il clone costruisce una scheda settimanale basata sui tuoi dati."
                  : "Un piano alimentare settimanale calibrato sull'obiettivo e sul tuo peso."}
              </p>
            </div>
            {needsProfile && (
              <div className="flex items-center gap-2 bg-[#FFF3BF] text-[#8B6F00] px-3 py-2 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4" /> Serve prima peso e altezza
              </div>
            )}
          </div>

          <div className="space-y-3 mb-4">
            <Label>Note extra per il coach (opzionale)</Label>
            <Textarea
              value={extra[tab]}
              onChange={(e) => setExtra({ ...extra, [tab]: e.target.value })}
              placeholder={tab === "fitness"
                ? "Es. ho un ginocchio delicato, mi alleno a casa senza pesi, 3 volte a settimana"
                : "Es. non amo il pesce, pranzo in ufficio, cerco pasti veloci"}
              className="min-h-20 rounded-xl"
            />
          </div>

          <Button onClick={() => generatePlan(tab)} disabled={generating[tab] || needsProfile}
            className={`${tab === "fitness" ? "bg-[#51CF66] hover:bg-[#40c057]" : "bg-[#FFD43B] hover:bg-[#fcc419] text-[#1b1b1f]"} rounded-full px-6`}>
            {generating[tab] ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {plans[tab] ? "Rigenera piano" : "Genera piano"}
          </Button>

          {plans[tab] && (
            <div className="mt-6 border-t border-[#ece4d3] pt-6">
              <div className="prose max-w-none">
                {renderPlan(plans[tab].content)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "psychology" && (
        <div className="bg-white rounded-3xl border border-[#ece4d3] p-6 md:p-8">
          <h2 className="font-display text-2xl font-bold mb-2">Spazio sicuro</h2>
          <p className="text-[#6b6659] mb-4">
            Lo psicologo del tuo iClone ascolta senza giudicare. Parliamo di stress, umore, relazioni, sfoghi della giornata.
            <br />
            <span className="text-sm italic">Non sostituisce un terapeuta reale. In caso di difficoltà serie, rivolgiti a un professionista.</span>
          </p>
          <div className="bg-[#E5DBFF] rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-[#5F3DC4] mt-0.5" />
              <div className="text-sm text-[#3b2a7d]">
                <strong>Come funziona:</strong> entra in chat selezionando la modalità "Psicologo". Il clone userà un modello più empatico (Claude) e ricorderà le vostre conversazioni passate.
              </div>
            </div>
          </div>
          <Link to="/chat">
            <Button className="bg-[#845EF7] hover:bg-[#7048e8] text-white rounded-full px-6">
              <Brain className="w-4 h-4 mr-2" /> Apri chat psicologo
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Coach;
