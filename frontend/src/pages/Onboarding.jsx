import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { toneOptions, interestsPool, habitsPool } from "../mock/mock";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const steps = ["Benvenuto", "Nome", "Tono", "Interessi", "Abitudini", "Obiettivi"];

const Onboarding = () => {
  const { profile, setProfile } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [local, setLocal] = useState(profile);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const toggleInList = (key, value) => {
    setLocal((p) => {
      const list = p[key] || [];
      return {
        ...p,
        [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });
  };

  const finish = () => {
    if (!local.name.trim()) {
      toast.error("Dimmi almeno il tuo nome 😉");
      setStep(1);
      return;
    }
    setProfile({ ...local, completedOnboarding: true });
    toast.success("Clone pronto! Entriamo ✨");
    setTimeout(() => navigate("/"), 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF7F0]">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full flex-1 transition-colors ${
                i <= step ? "bg-[#1b1b1f]" : "bg-[#ece4d3]"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#ece4d3] p-8 md:p-12 shadow-sm pop-in">
          {step === 0 && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-[#FFF3BF] text-[#8B6F00] px-3 py-1 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" /> Nuovo clone in creazione
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight mb-4">
                Costruiamo il <span className="text-[#FF6B6B]">tuo clone</span>.
              </h1>
              <p className="text-[#6b6659] text-lg mb-8 max-w-md mx-auto">
                Un segretario personale che pensa come te, ricorda per te e ti dà la spinta giusta ogni giorno.
              </p>
              <Button
                onClick={next}
                className="bg-[#1b1b1f] hover:bg-black text-white rounded-full px-8 h-12"
              >
                Iniziamo <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Come ti chiami?</h2>
              <p className="text-[#6b6659] mb-6">Il tuo clone deve pur sapere chi è.</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={local.name}
                    onChange={(e) => setLocal({ ...local, name: e.target.value })}
                    placeholder="Es. Marco"
                    className="mt-2 h-12 rounded-xl"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="nick">Nickname (opzionale)</Label>
                  <Input
                    id="nick"
                    value={local.nickname}
                    onChange={(e) => setLocal({ ...local, nickname: e.target.value })}
                    placeholder="Come ti chiamano gli amici"
                    className="mt-2 h-12 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Che tono ti piace?</h2>
              <p className="text-[#6b6659] mb-6">Il clone ti parlerà così.</p>
              <div className="grid grid-cols-2 gap-3">
                {toneOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setLocal({ ...local, tone: t.id })}
                    className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                      local.tone === t.id
                        ? "border-[#1b1b1f] bg-[#f2ead9]"
                        : "border-[#ece4d3] hover:border-[#d9ceb6] bg-white"
                    }`}
                  >
                    <div className="text-2xl mb-2">{t.emoji}</div>
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-sm text-[#6b6659]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Cosa ti appassiona?</h2>
              <p className="text-[#6b6659] mb-6">Scegline almeno 3.</p>
              <div className="flex flex-wrap gap-2">
                {interestsPool.map((i) => {
                  const active = local.interests.includes(i);
                  return (
                    <button
                      key={i}
                      onClick={() => toggleInList("interests", i)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#1b1b1f] text-white border-[#1b1b1f]"
                          : "bg-white text-[#1b1b1f] border-[#ece4d3] hover:border-[#1b1b1f]"
                      }`}
                    >
                      {active && <Check className="w-3 h-3 inline mr-1" />}
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Le tue abitudini</h2>
              <p className="text-[#6b6659] mb-6">Cosa ti definisce in una giornata?</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {habitsPool.map((h) => {
                  const active = local.habits.includes(h);
                  return (
                    <button
                      key={h}
                      onClick={() => toggleInList("habits", h)}
                      className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition-colors ${
                        active
                          ? "bg-[#FF6B6B] text-white border-[#FF6B6B]"
                          : "bg-white text-[#1b1b1f] border-[#ece4d3] hover:border-[#FF6B6B]"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
              <div>
                <Label htmlFor="wake">A che ora ti svegli di solito?</Label>
                <Input
                  id="wake"
                  type="time"
                  value={local.wakeUp}
                  onChange={(e) => setLocal({ ...local, wakeUp: e.target.value })}
                  className="mt-2 h-12 rounded-xl w-40"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="font-display text-3xl font-bold mb-2">Un obiettivo per il mese?</h2>
              <p className="text-[#6b6659] mb-6">Il clone te lo ricorderà quando serve.</p>
              <Textarea
                value={local.goals}
                onChange={(e) => setLocal({ ...local, goals: e.target.value })}
                placeholder="Es. Lanciare il nuovo progetto, correre 10km, leggere 2 libri..."
                className="min-h-32 rounded-xl"
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-10">
            {step > 0 ? (
              <Button variant="ghost" onClick={prev} className="text-[#6b6659]">
                <ArrowLeft className="w-4 h-4 mr-2" /> Indietro
              </Button>
            ) : (
              <span />
            )}
            {step < steps.length - 1 ? (
              step > 0 && (
                <Button onClick={next} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full px-6">
                  Avanti <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )
            ) : (
              <Button onClick={finish} className="bg-[#FF6B6B] hover:bg-[#ff5151] text-white rounded-full px-6">
                Crea il mio clone <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
