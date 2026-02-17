import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ChevronLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await base44.auth.forgotPassword(email);
      setMessage(response.message);
    } catch (err) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

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
            className="h-32 w-auto object-contain mx-auto mb-6 drop-shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
          />
          
          <h2 className="text-2xl font-bold text-white mb-2">Passwort vergessen?</h2>
          <p className="text-white/40">Gib deine Email-Adresse ein, um dein Passwort zurückzusetzen.</p>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
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
            </div>

            {error && (
              <div className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </div>
            )}
            
            {message && (
              <div className="text-emerald-400 text-sm text-center bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                {message}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || message}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white py-6 shadow-lg shadow-cyan-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Link senden
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}