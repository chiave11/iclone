import React, { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";

// Checks reminders with due_at and upcoming events, fires browser notifications + toasts
const NotificationManager = () => {
  const { user } = useAuth();
  const firedRef = useRef(new Set());

  useEffect(() => {
    if (!user) return;
    if ("Notification" in window && Notification.permission === "default") {
      // request softly
      setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 2500);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fire = (key, title, body) => {
      if (firedRef.current.has(key)) return;
      firedRef.current.add(key);
      toast(title, { description: body });
      try {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        }
      } catch (e) { /* ignore */ }
    };

    const check = async () => {
      try {
        const [{ data: reminders }, { data: events }] = await Promise.all([
          api.get("/reminders"),
          api.get("/events"),
        ]);
        const now = new Date();
        reminders.forEach((r) => {
          if (r.done || !r.due_at) return;
          const due = new Date(r.due_at);
          const diff = due - now;
          if (diff <= 60_000 && diff >= -5 * 60_000) {
            fire(`rem-${r.id}`, "⏰ Promemoria", r.text);
          }
        });
        // Upcoming today events: fire 10 min before based on HH:MM
        events.forEach((e) => {
          if (e.date !== "today" || !e.time) return;
          const [h, m] = e.time.split(":").map(Number);
          const when = new Date();
          when.setHours(h, m, 0, 0);
          const diff = when - now;
          if (diff <= 10 * 60_000 && diff >= -2 * 60_000) {
            fire(`ev-${e.id}-${when.toDateString()}`, `📅 Fra poco: ${e.title}`, `Alle ${e.time}`);
          }
        });
      } catch (e) { /* silent */ }
    };

    check();
    const id = setInterval(check, 45_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user]);

  return null;
};

export default NotificationManager;
