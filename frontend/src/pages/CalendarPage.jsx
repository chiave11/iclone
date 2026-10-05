import React, { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Plus, Trash2, Clock, Calendar as CalIcon } from "lucide-react";
import { colorMap } from "../mock/mock";
import { toast } from "sonner";

const dayBuckets = [
  { key: "today", label: "Oggi" },
  { key: "tomorrow", label: "Domani" },
  { key: "friday", label: "Questa settimana" },
];

const colorChoices = ["coral", "mint", "lavender", "amber", "sky"];

const CalendarPage = () => {
  const { events, addEvent, removeEvent } = useApp();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", time: "10:00", date: "today", color: "coral", type: "work",
  });

  const grouped = useMemo(() => {
    const g = {};
    for (const b of dayBuckets) g[b.key] = [];
    for (const e of events) {
      if (g[e.date]) g[e.date].push(e);
    }
    for (const k of Object.keys(g)) g[k].sort((a, b) => a.time.localeCompare(b.time));
    return g;
  }, [events]);

  const save = () => {
    if (!form.title.trim()) {
      toast.error("Dai un titolo all'impegno");
      return;
    }
    addEvent(form);
    toast.success("Impegno aggiunto ✨");
    setForm({ title: "", time: "10:00", date: "today", color: "coral", type: "work" });
    setOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Calendario</h1>
          <p className="text-[#6b6659] mt-1">Tutti i tuoi impegni in un colpo d'occhio.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Nuovo impegno
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Nuovo impegno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Titolo</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Es. Call con Marco"
                  className="mt-1.5 rounded-xl h-11"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ora</Label>
                  <Input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className="mt-1.5 rounded-xl h-11"
                  />
                </div>
                <div>
                  <Label>Quando</Label>
                  <Select value={form.date} onValueChange={(v) => setForm({ ...form, date: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {dayBuckets.map((b) => (
                        <SelectItem key={b.key} value={b.key}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                    <SelectTrigger className="mt-1.5 rounded-xl h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Lavoro</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="health">Salute</SelectItem>
                      <SelectItem value="social">Sociale</SelectItem>
                      <SelectItem value="personal">Personale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Colore</Label>
                  <div className="mt-1.5 flex gap-2">
                    {colorChoices.map((c) => (
                      <button
                        key={c}
                        onClick={() => setForm({ ...form, color: c })}
                        className={`w-9 h-9 rounded-xl ${colorMap[c].bg} ${
                          form.color === c ? "ring-2 ring-offset-2 ring-[#1b1b1f]" : ""
                        }`}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={save} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
                Salva impegno
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {dayBuckets.map((b) => (
          <div key={b.key} className="bg-white rounded-3xl border border-[#ece4d3] p-5 min-h-[320px]">
            <div className="flex items-center gap-2 mb-4">
              <CalIcon className="w-4 h-4 text-[#6b6659]" />
              <h3 className="font-display text-xl font-bold">{b.label}</h3>
              <Badge className="ml-auto bg-[#f2ead9] text-[#1b1b1f] border-0">
                {grouped[b.key].length}
              </Badge>
            </div>
            {grouped[b.key].length === 0 ? (
              <div className="text-sm text-[#9b958a] text-center py-10">
                Nulla in programma.
              </div>
            ) : (
              <div className="space-y-2">
                {grouped[b.key].map((e) => {
                  const c = colorMap[e.color] || colorMap.coral;
                  return (
                    <div
                      key={e.id}
                      className={`group relative p-3 rounded-2xl ${c.bgSoft} border border-transparent hover:border-[#ece4d3] transition-colors`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-1 h-full min-h-10 rounded-full ${c.bg}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[#1b1b1f] truncate">{e.title}</div>
                          <div className="text-xs text-[#6b6659] flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" /> {e.time} · <span className="capitalize">{e.type}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeEvent(e.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[#6b6659] hover:text-[#C92A2A]"
                          aria-label="Elimina"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CalendarPage;
