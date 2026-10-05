import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Home, MessageCircle, Calendar as CalIcon, StickyNote, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";

const navItems = [
  { to: "/", label: "Oggi", icon: Home, end: true },
  { to: "/chat", label: "Chat col clone", icon: MessageCircle },
  { to: "/calendar", label: "Calendario", icon: CalIcon },
  { to: "/notes", label: "Note", icon: StickyNote },
];

const Layout = () => {
  const { profile, resetAll } = useApp();
  const location = useLocation();

  const initials = (profile.name || "Io").trim().slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#FBF7F0] text-[#1b1b1f] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:flex-col w-72 border-r border-[#ece4d3] bg-[#FBF7F0] p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 mb-10">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] shadow-md floaty" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#845EF7]" />
          </div>
          <div>
            <div className="font-display text-xl font-bold leading-none">Clone</div>
            <div className="text-xs text-[#6b6659] mt-1">il tuo segretario personale</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors ${
                  isActive
                    ? "bg-[#1b1b1f] text-[#FBF7F0]"
                    : "text-[#1b1b1f] hover:bg-[#f2ead9]"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="bg-white rounded-2xl p-4 border border-[#ece4d3]">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 bg-gradient-to-br from-[#FF6B6B] to-[#845EF7]">
                <AvatarFallback className="bg-transparent text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-semibold truncate">{profile.name || "Tu"}</div>
                <div className="text-xs text-[#6b6659] truncate">
                  tono {profile.tone}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-xs text-[#6b6659] hover:text-[#1b1b1f]"
              onClick={() => {
                if (confirm("Resettare tutto e rifare l'onboarding?")) resetAll();
              }}
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset onboarding
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 bg-[#FBF7F0]/90 backdrop-blur border-b border-[#ece4d3] z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7]" />
            <span className="font-display font-bold text-lg">Clone</span>
          </div>
          <Avatar className="w-9 h-9 bg-gradient-to-br from-[#FF6B6B] to-[#845EF7]">
            <AvatarFallback className="bg-transparent text-white text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 pt-16 md:pt-0 pb-24 md:pb-0">
        <div key={location.pathname} className="pop-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#ece4d3] z-30">
        <div className="grid grid-cols-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 text-xs ${
                  isActive ? "text-[#FF6B6B]" : "text-[#6b6659]"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
