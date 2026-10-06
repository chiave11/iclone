import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user) return;
    try {
      const [e, r, n, s] = await Promise.all([
        api.get("/events"),
        api.get("/reminders"),
        api.get("/notes"),
        api.get("/suggestions/daily").catch(() => ({ data: [] })),
      ]);
      setEvents(e.data);
      setReminders(r.data);
      setNotes(n.data);
      setSuggestions(s.data || []);
    } finally {
      setLoaded(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoaded(false);
      loadAll();
    } else {
      setEvents([]); setReminders([]); setNotes([]); setSuggestions([]);
      setLoaded(true);
    }
  }, [user, loadAll]);

  // Reminders
  const addReminder = async (text, priority = "media", due_at = null) => {
    const { data } = await api.post("/reminders", { text, priority, due_at });
    setReminders((p) => [data, ...p]);
  };
  const toggleReminder = async (id) => {
    const r = reminders.find((x) => x.id === id);
    if (!r) return;
    const { data } = await api.patch(`/reminders/${id}`, { done: !r.done });
    setReminders((p) => p.map((x) => (x.id === id ? data : x)));
  };
  const removeReminder = async (id) => {
    await api.delete(`/reminders/${id}`);
    setReminders((p) => p.filter((x) => x.id !== id));
  };

  // Events
  const addEvent = async (ev) => {
    const { data } = await api.post("/events", ev);
    setEvents((p) => [data, ...p]);
  };
  const removeEvent = async (id) => {
    await api.delete(`/events/${id}`);
    setEvents((p) => p.filter((e) => e.id !== id));
  };

  // Notes
  const addNote = async (n) => {
    const { data } = await api.post("/notes", n);
    setNotes((p) => [data, ...p]);
  };
  const updateNote = async (id, patch) => {
    const existing = notes.find((n) => n.id === id);
    const payload = { title: patch.title ?? existing.title, content: patch.content ?? existing.content, color: patch.color ?? existing.color };
    const { data } = await api.patch(`/notes/${id}`, payload);
    setNotes((p) => p.map((n) => (n.id === id ? data : n)));
  };
  const removeNote = async (id) => {
    await api.delete(`/notes/${id}`);
    setNotes((p) => p.filter((n) => n.id !== id));
  };

  return (
    <AppContext.Provider value={{
      events, addEvent, removeEvent,
      reminders, addReminder, toggleReminder, removeReminder,
      notes, addNote, updateNote, removeNote,
      suggestions, loaded, reloadAll: loadAll,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
