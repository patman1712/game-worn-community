import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-[100]"
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl shadow-black/50">
            <div className="flex items-start gap-4">
              <div className="bg-cyan-500/10 p-3 rounded-xl shrink-0">
                <Cookie className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-2">Cookie-Einstellungen</h3>
                <p className="text-white/60 text-sm mb-4">
                  Wir nutzen Cookies, um dir das beste Erlebnis auf unserer Plattform zu bieten. 
                  Details findest du im{' '}
                  <Link to={createPageUrl("AGB")} className="text-cyan-400 hover:underline">Datenschutz</Link>.
                </p>
                <div className="flex gap-3">
                  <Button 
                    onClick={handleAccept}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                  >
                    Alles klar
                  </Button>
                  <Button 
                    onClick={handleDecline}
                    variant="ghost" 
                    className="flex-1 text-white/50 hover:text-white hover:bg-white/5"
                  >
                    Ablehnen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}