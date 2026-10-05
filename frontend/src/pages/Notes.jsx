import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "../components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { colorMap } from "../mock/mock";
import { toast } from "sonner";

const colorChoices = ["coral", "mint", "lavender", "amber", "sky"];

const emptyForm = { title: "", content: "", color: "coral" };

const Notes = () => {
  const { notes, addNote, updateNote, removeNote } = useApp();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (n) => {
    setEditing(n.id);
    setForm({ title: n.title, content: n.content, color: n.color });
    setOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) {
      toast.error("Metti un titolo alla nota");
      return;
    }
    if (editing) {
      updateNote(editing, form);
      toast.success("Nota aggiornata");
    } else {
      addNote(form);
      toast.success("Nota salvata ✨");
    }
    setOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl font-bold">Le tue note</h1>
          <p className="text-[#6b6659] mt-1">
            {notes.length} {notes.length === 1 ? "nota" : "note"} nel tuo cervello esterno.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNew}
              className="bg-[#1b1b1f] hover:bg-black text-white rounded-full"
            >
              <Plus className="w-4 h-4 mr-2" /> Nuova nota
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">
                {editing ? "Modifica nota" : "Nuova nota"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Titolo</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Es. Idee progetto"
                  className="mt-1.5 rounded-xl h-11"
                />
              </div>
              <div>
                <Label>Contenuto</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Scrivi qui..."
                  className="mt-1.5 rounded-xl min-h-36"
                />
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
            <DialogFooter>
              <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button onClick={save} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
                {editing ? "Aggiorna" : "Salva nota"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#ece4d3] p-16 text-center">
          <div className="text-5xl mb-3">✍️</div>
          <h3 className="font-display text-2xl font-bold mb-2">Ancora nessuna nota</h3>
          <p className="text-[#6b6659] mb-6">Scrivi il primo pensiero e il clone lo ricorderà per te.</p>
          <Button onClick={openNew} className="bg-[#FF6B6B] hover:bg-[#ff5151] text-white rounded-full">
            <Plus className="w-4 h-4 mr-2" /> Crea prima nota
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((n) => {
            const c = colorMap[n.color] || colorMap.amber;
            return (
              <div
                key={n.id}
                className={`group relative ${c.bgSoft} rounded-3xl p-5 border border-[#ece4d3]/70 hover:shadow-lg transition-shadow`}
              >
                <div className={`w-10 h-1.5 rounded-full ${c.bg} mb-3`} />
                <h3 className="font-display text-xl font-bold text-[#1b1b1f] mb-2 pr-16">
                  {n.title}
                </h3>
                <p className="text-sm text-[#4a453b] whitespace-pre-wrap line-clamp-6">
                  {n.content}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-xs text-[#6b6659]">{n.date}</span>
                </div>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(n)}
                    className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-[#6b6659] hover:text-[#1b1b1f]"
                    aria-label="Modifica"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      removeNote(n.id);
                      toast("Nota eliminata");
                    }}
                    className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center text-[#6b6659] hover:text-[#C92A2A]"
                    aria-label="Elimina"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notes;
