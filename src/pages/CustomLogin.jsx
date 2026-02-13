import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function CustomLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Direct Base44 login
      const appId = window.location.hostname.includes('localhost') ? 
        '698e4ef5392203adc7a32dee' : 
        window.location.pathname.split('/')[1];
      
      const response = await fetch(`https://api.base44.com/apps/698e4ef5392203adc7a32dee/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.');
      }

      const data = await response.json();
      
      // Store token
      if (data.access_token) {
        localStorage.setItem('base44_token', data.access_token);
      }
      
      // Redirect to home
      window.location.href = createPageUrl("Home");
    } catch (err) {
      setError(err.message || 'Login fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/24b61a404_ChatGPTImage13Feb202616_24_03.png" 
            alt="Jersey Collection Community" 
            className="w-80 h-auto object-contain drop-shadow-[0_4px_20px_rgba(6,182,212,0.5)]"
          />
        </div>

        <Card className="bg-slate-900/80 backdrop-blur-sm border-white/10 p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-6">Anmelden</h1>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label className="text-white/70 text-sm">E-Mail Adresse</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                required
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm">Passwort</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="mt-1.5 bg-slate-800/50 border-white/10 text-white placeholder:text-white/30"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium py-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  Anmelden
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/50 text-sm">
              Noch kein Konto?{" "}
              <Link to={createPageUrl("Register")} className="text-cyan-400 hover:text-cyan-300 font-medium">
                Jetzt registrieren
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}