import React, { createContext, useContext, useEffect, useState } from "react";
import {
  defaultProfile,
  mockEvents,
  mockReminders,
  mockNotes,
  initialChat,
  mockReplies,
} from "../mock/mock";

const AppContext = createContext(null);

const STORAGE_KEY = "clone_ai_state_v1";

export const AppProvider = ({ children }) => {
  const [profile, setProfile] = useState(defaultProfile);
  const [events, setEvents] = useState(mockEvents);
  const [reminders, setReminders] = useState(mockReminders);
  const [notes, setNotes] = useState(mockNotes);
  const [chat, setChat] = useState(initialChat);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.profile) setProfile({ ...defaultProfile, ...data.profile });
        if (data.events) setEvents(data.events);
        if (data.reminders) setReminders(data.reminders);
        if (data.notes) setNotes(data.notes);
        if (data.chat) setChat(data.chat);
      }
    } catch (e) {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const data = { profile, events, reminders, notes, chat };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [profile, events, reminders, notes, chat, loaded]);

  const addReminder = (text, priority = "media") => {
    const r = { id: `r-${Date.now()}`, text, done: false, priority };
    setReminders((prev) => [r, ...prev]);
  };
  const toggleReminder = (id) =>
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, done: !r.done } : r)));
  const removeReminder = (id) => setReminders((prev) => prev.filter((r) => r.id !== id));

  const addEvent = (ev) => setEvents((prev) => [{ ...ev, id: `e-${Date.now()}` }, ...prev]);
  const removeEvent = (id) => setEvents((prev) => prev.filter((e) => e.id !== id));

  const addNote = (note) =>
    setNotes((prev) => [{ ...note, id: `n-${Date.now()}`, date: "Oggi" }, ...prev]);
  const updateNote = (id, patch) =>
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  const removeNote = (id) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const sendMessage = (text) => {
    const time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const userMsg = { id: `m-${Date.now()}`, role: "user", text, time };
    setChat((prev) => [...prev, userMsg]);
    // simulated clone reply
    setTimeout(() => {
      const reply = mockReplies[Math.floor(Math.random() * mockReplies.length)];
      const t = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
      setChat((prev) => [...prev, { id: `m-${Date.now() + 1}`, role: "clone", text: reply, time: t }]);
    }, 700 + Math.random() * 800);
  };

  const resetAll = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(defaultProfile);
    setEvents(mockEvents);
    setReminders(mockReminders);
    setNotes(mockNotes);
    setChat(initialChat);
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        events,
        addEvent,
        removeEvent,
        reminders,
        addReminder,
        toggleReminder,
        removeReminder,
        notes,
        addNote,
        updateNote,
        removeNote,
        chat,
        sendMessage,
        resetAll,
        loaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
};
