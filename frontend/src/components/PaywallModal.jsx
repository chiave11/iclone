import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Crown, Zap, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaywallModal = () => {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      setInfo(e.detail || null);
      setOpen(true);
    };
    window.addEventListener("iclone:paywall", handler);
    return () => window.removeEventListener("iclone:paywall", handler);
  }, []);

  const goPro = () => {
    setOpen(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="rounded-3xl max-w-md border-0 overflow-hidden p-0">
        <div className="relative bg-gradient-to-br from-[#FFE3E3] via-[#FFF3BF] to-[#E5DBFF] p-7">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/40 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 bg-[#1b1b1f] text-white px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Crown className="w-3.5 h-3.5" /> Limite raggiunto
            </div>
            <DialogHeader>
              <DialogTitle className="font-display text-2xl font-bold text-left">
                {info?.code === "chat_limit_reached" && "Hai esaurito i messaggi di oggi"}
                {info?.code === "coach_limit_reached" && "Hai gi\u00e0 generato un piano Coach questo mese"}
                {!info?.code && "Serve il piano Pro"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-[#4a453b] mt-2">
              {info?.message || "Passa a iClone Pro per sbloccare chat e piani illimitati."}
            </p>
          </div>
        </div>
        <div className="p-6">
          <ul className="space-y-2 text-sm mb-5">
            <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#845EF7]" /> Chat illimitata (tutte le modalit\u00e0)</li>
            <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#845EF7]" /> Piani Coach senza limiti</li>
            <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#845EF7]" /> Psicologo premium con Claude</li>
          </ul>
          <div className="flex gap-2">
            <Button onClick={goPro} className="flex-1 bg-[#1b1b1f] hover:bg-black text-white rounded-full h-11">
              <Crown className="w-4 h-4 mr-2" /> Vedi piani
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)} className="text-[#6b6659] rounded-full">
              Non ora
            </Button>
          </div>
          <div className="text-center text-[11px] text-[#6b6659] mt-3">
            In alternativa puoi comprare crediti one-off.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaywallModal;
