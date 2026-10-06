import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { X, ArrowLeft } from "lucide-react";

const PaymentCancel = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF7F0]">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#ece4d3] p-10 text-center pop-in">
        <div className="w-16 h-16 rounded-full bg-[#FFF3BF] flex items-center justify-center mx-auto mb-4">
          <X className="w-8 h-8 text-[#8B6F00]" />
        </div>
        <h1 className="font-display text-3xl font-bold mb-2">Nessun problema</h1>
        <p className="text-[#6b6659] mb-6">
          Il pagamento è stato annullato. Puoi tornare quando vuoi — il tuo iClone ti aspetta.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button onClick={() => navigate("/pricing")} className="bg-[#1b1b1f] hover:bg-black text-white rounded-full">
            Rivedi i piani
          </Button>
          <Button variant="outline" onClick={() => navigate("/")} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
