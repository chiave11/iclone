import React, { useEffect, useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "./ui/button";

const DISMISS_KEY = "iclone_pwa_dismissed_at";
const DISMISS_DAYS = 7;

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
};

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const diff = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
      if (diff < DISMISS_DAYS) return;
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS has no beforeinstallprompt - show manual hint after 4s
    if (isIOS()) {
      const t = setTimeout(() => setVisible(true), 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome !== "dismissed") {
        setVisible(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIOSHint(true);
    }
  };

  if (!visible || isStandalone()) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:right-6 md:max-w-sm z-50 pop-in">
      <div className="bg-white rounded-2xl border border-[#ece4d3] shadow-2xl p-4 relative overflow-hidden">
        <button onClick={dismiss} className="absolute top-3 right-3 text-[#9b958a] hover:text-[#1b1b1f]" aria-label="Chiudi">
          <X className="w-4 h-4" />
        </button>
        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] opacity-20 blur-xl" />

        {!showIOSHint ? (
          <div className="relative">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">Installa iClone</div>
                <div className="text-sm text-[#6b6659] mt-0.5">Aggiungilo alla home e usalo come un'app vera.</div>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button onClick={install} className="flex-1 bg-[#1b1b1f] hover:bg-black text-white rounded-full">
                <Download className="w-4 h-4 mr-2" /> Installa
              </Button>
              <Button onClick={dismiss} variant="ghost" className="text-[#6b6659] rounded-full">
                Non ora
              </Button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] flex items-center justify-center shrink-0">
                <Share className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-display font-bold text-lg leading-tight">Installa su iPhone</div>
                <div className="text-sm text-[#6b6659] mt-0.5">Due passaggi veloci:</div>
              </div>
            </div>
            <ol className="text-sm text-[#4a453b] space-y-1.5 pl-1">
              <li>1. Tocca l'icona <Share className="inline w-4 h-4 mb-1" /> <strong>Condividi</strong> nella barra di Safari</li>
              <li>2. Scorri e scegli <strong>"Aggiungi a Home"</strong></li>
              <li>3. Tocca <strong>Aggiungi</strong>, et voilà!</li>
            </ol>
            <Button onClick={dismiss} className="w-full mt-4 bg-[#1b1b1f] hover:bg-black text-white rounded-full">
              Ho capito
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
