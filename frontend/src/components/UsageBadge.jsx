import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { Button } from "../components/ui/button";
import { Crown, Zap, Settings, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const UsageBadge = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get("/usage").then(({ data }) => setUsage(data)).catch(() => {});
  }, [user]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data } = await api.post("/payments/portal", { return_url: window.location.href });
      window.location.href = data.url;
    } catch {
      setPortalLoading(false);
    }
  };

  if (!user) return null;

  if (user.is_pro) {
    return (
      <div className="bg-gradient-to-br from-[#FFE3E3] via-[#FFF3BF] to-[#E5DBFF] rounded-2xl p-4 border border-[#ece4d3] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1b1b1f] text-white flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-semibold text-sm">iClone Pro attivo</div>
            <div className="text-xs text-[#6b6659] capitalize">Piano {user.subscription_plan}</div>
          </div>
          <Button size="sm" variant="outline" onClick={openPortal} disabled={portalLoading}
            className="rounded-full border-[#1b1b1f] text-[#1b1b1f] bg-white/60 hover:bg-white">
            {portalLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Settings className="w-3 h-3" />}
          </Button>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const chatUsed = usage.chat_today;
  const chatMax = usage.chat_daily_limit;
  const chatPct = Math.min(100, (chatUsed / chatMax) * 100);
  const coachUsed = usage.coach_this_month;
  const coachMax = usage.coach_monthly_limit;

  return (
    <div className="bg-white rounded-2xl p-4 border border-[#ece4d3] mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs uppercase tracking-wider font-semibold text-[#6b6659]">Piano Free</div>
        <Link to="/pricing">
          <Button size="sm" className="bg-[#1b1b1f] hover:bg-black text-white rounded-full h-7 text-xs">
            <Crown className="w-3 h-3 mr-1" /> Passa a Pro
          </Button>
        </Link>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#4a453b]">Chat oggi</span>
            <span className="text-[#6b6659] font-medium">{chatUsed}/{chatMax}</span>
          </div>
          <div className="h-1.5 bg-[#f2ead9] rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${chatPct >= 90 ? "bg-[#FF6B6B]" : "bg-[#845EF7]"}`} style={{ width: `${chatPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#4a453b]">Piani Coach questo mese</span>
            <span className="text-[#6b6659] font-medium">{coachUsed}/{coachMax}</span>
          </div>
          <div className="h-1.5 bg-[#f2ead9] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#51CF66]" style={{ width: `${(coachUsed/coachMax)*100}%` }} />
          </div>
        </div>
        {usage.credits_balance > 0 && (
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="inline-flex items-center gap-1 text-[#4a453b]"><Zap className="w-3 h-3 text-[#FFD43B]" /> Crediti extra</span>
            <span className="font-semibold">{usage.credits_balance}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsageBadge;
