import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Check, Loader2, Sparkles, AlertCircle, X } from "lucide-react";

const MAX_POLLS = 8;

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [status, setStatus] = useState("polling"); // polling | paid | failed | expired
  const [attempts, setAttempts] = useState(0);

  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }
    let cancelled = false;
    const poll = async (attempt) => {
      if (cancelled) return;
      try {
        const { data } = await api.get(`/payments/status/${sessionId}`);
        setAttempts(attempt + 1);
        if (data.payment_status === "paid") {
          setStatus("paid");
          await refresh();
          return;
        }
        if (["expired", "failed", "refunded"].includes(data.payment_status)) {
          setStatus(data.payment_status);
          return;
        }
        if (attempt >= MAX_POLLS) {
          setStatus("timeout");
          return;
        }
        setTimeout(() => poll(attempt + 1), 2000);
      } catch {
        if (attempt >= MAX_POLLS) {
          setStatus("failed");
          return;
        }
        setTimeout(() => poll(attempt + 1), 2000);
      }
    };
    poll(0);
    return () => { cancelled = true; };
  }, [sessionId, refresh]);

  const renderBody = () => {
    if (status === "polling" || status === "timeout") {
      return (
        <>
          <Loader2 className="w-12 h-12 text-[#845EF7] animate-spin mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold mb-2">Elaboro il pagamento...</h1>
          <p className="text-[#6b6659] mb-6">Un attimo, sto confermando con la banca. ({attempts}/{MAX_POLLS})</p>
          {status === "timeout" && (
            <p className="text-sm text-[#6b6659]">Sta impiegando più del previsto. Il pagamento potrebbe comunque andare a buon fine, controlla tra qualche minuto.</p>
          )}
        </>
      );
    }
    if (status === "paid") {
      return (
        <>
          <div className="w-16 h-16 rounded-full bg-[#D3F9D8] flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-[#2B8A3E]" />
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Benvenuto in iClone Pro! ✨</h1>
          <p className="text-[#6b6659] mb-6">Il tuo pagamento è andato a buon fine. Hai sbloccato tutto, puoi iniziare subito.</p>
          <Button onClick={() => navigate("/")} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full px-8 h-12">
            <Sparkles className="w-4 h-4 mr-2" /> Vai alla dashboard
          </Button>
        </>
      );
    }
    return (
      <>
        <div className="w-16 h-16 rounded-full bg-[#FFE3E3] flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-[#C92A2A]" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Pagamento non completato</h1>
        <p className="text-[#6b6659] mb-6">
          {status === "expired" && "La sessione è scaduta prima del completamento."}
          {status === "failed" && "Qualcosa è andato storto durante il pagamento."}
          {status === "refunded" && "Il pagamento è stato rimborsato."}
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate("/pricing")} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
            Riprova
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-full">Torna alla dashboard</Button>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF7F0]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#ece4d3] p-10 text-center pop-in">
        {renderBody()}
      </div>
    </div>
  );
};

export default PaymentSuccess;
