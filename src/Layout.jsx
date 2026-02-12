import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Shirt, Home, Plus, FolderOpen, LogIn, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navItems = [
    { name: "Home", icon: Home, label: "Entdecken", page: "Home" },
    ...(user ? [
      { name: "MyCollection", icon: FolderOpen, label: "Meine Sammlung", page: "MyCollection" },
      { name: "AddJersey", icon: Plus, label: "Hinzufügen", page: "AddJersey" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
        }
        body { background: #0a0e1a; }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
      `}</style>

      {/* Ambient gradient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Shirt className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">
              Jersey<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Vault</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  currentPageName === item.name
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="w-px h-6 bg-white/10 mx-2" />
            {user ? (
              <Button
                onClick={() => base44.auth.logout()}
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70 hover:bg-white/5"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden
              </Button>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-white/50 hover:text-white"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.name}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                  currentPageName === item.name
                    ? "bg-white/10 text-white"
                    : "text-white/40"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/5 pt-3 mt-3">
              {user ? (
                <button
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-3 px-4 py-3 text-white/40 text-sm w-full"
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              ) : (
                <button
                  onClick={() => base44.auth.redirectToLogin()}
                  className="flex items-center gap-3 px-4 py-3 text-cyan-400 text-sm w-full"
                >
                  <LogIn className="w-4 h-4" />
                  Anmelden
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="relative">
        {children}
      </main>
    </div>
  );
}