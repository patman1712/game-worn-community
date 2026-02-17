import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, ChevronLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      setLoading(false);
      return;
    }

    try {
      await base44.auth.register(email, password, {
        display_name: displayName,
        avatar_url: '',
        role: 'user'
      });
      
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Registrierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl text-center relative z-10"
        >
          <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/10">
            <UserPlus className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Registrierung erfolgreich!</h2>
          <p className="text-white/60 mb-8 leading-relaxed">
            Dein Konto wurde erstellt und wartet auf Freischaltung durch einen Administrator.
            Du erhältst eine E-Mail, sobald dein Konto aktiviert wurde.
          </p>
          <Link to="/login">
            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-cyan-900/20">
              Zurück zum Login
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-8 text-center">
          <Link to="/login" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zum Login
          </Link>
          
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/7c3640279_logogamewordcummunity.PNG" 
            alt="Game-Worn Community" 
            className="h-24 w-auto object-contain mx-auto mb-6 drop-shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
          />

          <h2 className="text-2xl font-bold text-white mb-2">Konto erstellen</h2>
          <p className="text-white/40">Werde Teil der Community</p>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="text-white/70">Anzeigename</Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:border-cyan-500/50"
                  placeholder="Dein Name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-white/70">Email Adresse</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:border-cyan-500/50"
                  placeholder="deine@email.com"
                />
              </div>
              <div>
                <Label htmlFor="password" classname="text-white/70">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:border-cyan-500/50"
                  placeholder="Mindestens 6 Zeichen"
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" classname="text-white/70">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:border-cyan-500/50"
                  placeholder="Passwort wiederholen"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-cyan-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrieren
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-white/40">
          Bereits ein Konto?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline underline-offset-4">
            Hier anmelden
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
