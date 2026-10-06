import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const AuthPage = ({ mode }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        toast.success("Bentornato!");
      } else {
        if (password.length < 6) throw new Error("La password deve avere almeno 6 caratteri");
        await register(email, password, name);
        toast.success("Account creato ✨");
      }
      const next = location.state?.from || "/";
      navigate(next, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || "Errore";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#FBF7F0]">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B6B] via-[#FFB457] to-[#845EF7] floaty" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-[#845EF7]" />
          </div>
          <div className="font-display text-3xl font-bold">iClone</div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ece4d3] p-8 shadow-sm pop-in">
          <h1 className="font-display text-3xl font-bold mb-1">
            {isLogin ? "Bentornato" : "Crea il tuo clone"}
          </h1>
          <p className="text-[#6b6659] mb-6">
            {isLogin ? "Accedi al tuo iClone personale." : "Un segretario AI che impara da te."}
          </p>
          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Come ti chiami?" className="mt-1.5 h-11 rounded-xl" required
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com" className="mt-1.5 h-11 rounded-xl" required autoComplete="email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caratteri" className="mt-1.5 h-11 rounded-xl" required
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
            </div>
            <Button
              type="submit" disabled={loading}
              className="w-full h-12 bg-[#1b1b1f] hover:bg-black text-white rounded-full"
            >
              {loading ? "Attendi..." : isLogin ? "Accedi" : "Crea account"}
            </Button>
          </form>
          <div className="text-center text-sm text-[#6b6659] mt-6">
            {isLogin ? (
              <>Non hai un account? <Link to="/auth/register" className="text-[#FF6B6B] font-semibold hover:underline">Registrati</Link></>
            ) : (
              <>Hai già un account? <Link to="/auth/login" className="text-[#FF6B6B] font-semibold hover:underline">Accedi</Link></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
