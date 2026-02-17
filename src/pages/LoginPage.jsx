import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, ChevronLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { motion } from "framer-motion";
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const user = await base44.auth.login(email, password);
      if (user) {
        window.location.href = '/'; // Redirect to home on success
      } else {
        setError('Login fehlgeschlagen');
      }
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
          <Link to="/" className="inline-flex items-center text-white/50 hover:text-white mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück zur Startseite
          </Link>
          
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/7c3640279_logogamewordcummunity.PNG" 
            alt="Game-Worn Community" 
            className="h-52 w-auto object-contain mx-auto mb-8 drop-shadow-[0_4px_20px_rgba(6,182,212,0.4)]"
          />
          
          <h2 className="text-2xl font-bold text-white mb-2">{t('auth.welcomeBack')}</h2>
          <p className="text-white/40">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="bg-slate-900/50 p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white/70">{t('auth.email')}</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" classname="text-white/70">{t('auth.password')}</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-800/50 border-white/10 text-white mt-1.5 focus:border-cyan-500/50"
                  placeholder="••••••••"
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
                  <LogIn className="w-4 h-4 mr-2" />
                  {t('auth.loginButton')}
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-white/40">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline underline-offset-4">
            {t('auth.registerNow')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
