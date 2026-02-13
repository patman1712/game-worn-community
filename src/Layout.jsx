import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Shirt, Home, Plus, FolderOpen, LogIn, LogOut, ChevronLeft, Settings, MessageCircle, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { name: "Home", icon: Home, label: "Sammlung", page: "Home" },
  { name: "Messages", icon: MessageCircle, label: "Nachrichten", page: "Messages", authRequired: true },
  { name: "MyCollection", icon: FolderOpen, label: "Meine Trikots", page: "MyCollection", authRequired: true },
  { name: "AddJersey", icon: Plus, label: "Trikot hinzufügen", page: "AddJersey", authRequired: true },
];

const CHILD_PAGES = [];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const isChildPage = CHILD_PAGES.includes(currentPageName);
  const showBottomNav = !isChildPage;
  const visibleTabs = TABS.filter(tab => !tab.authRequired || user);

  return (
    <div className="min-h-screen bg-slate-950">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
        }
        
        body { 
          background: #0a0e1a;
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
        }
        
        button, a[role="tab"], [role="button"] {
          -webkit-user-select: none;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        * { 
          scrollbar-width: thin; 
          scrollbar-color: rgba(255,255,255,0.1) transparent; 
        }

        /* Disable pull-to-refresh on body */
        body {
          overscroll-behavior-y: contain;
        }

        @supports (padding-top: env(safe-area-inset-top)) {
          .safe-top {
            padding-top: env(safe-area-inset-top);
          }
          .safe-bottom {
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
      `}</style>

      {/* Ambient gradient bg */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      {/* Mobile-optimized Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/95 border-b border-white/5 safe-top">
        <div className="h-14 flex items-center justify-between px-4">
          {isChildPage ? (
            <>
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 text-white/70 active:text-white -ml-2 p-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Zurück</span>
              </button>
              <div className="absolute left-1/2 -translate-x-1/2">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/24b61a404_ChatGPTImage13Feb202616_24_03.png" 
                  alt="Jersey Collectors" 
                  className="h-10 w-auto object-contain drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]"
                />
              </div>
              <div className="w-20" />
            </>
          ) : (
            <>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698e4ef5392203adc7a32dee/24b61a404_ChatGPTImage13Feb202616_24_03.png" 
                alt="Jersey Collectors" 
                className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]"
              />
              {user ? (
                <div className="flex items-center gap-2">
                  {user.role === 'admin' && (
                    <Link to={createPageUrl("AdminPanel")}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link to={createPageUrl("Settings")}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                    >
                      <UserCog className="w-3.5 h-3.5 mr-1.5" />
                      Profil
                    </Button>
                  </Link>
                  <Button
                    onClick={() => base44.auth.logout()}
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    Abmelden
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1.5" />
                    Anmelden
                  </Button>
                  <Link to={createPageUrl("Register")}>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs h-8 px-3"
                    >
                      Registrieren
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Content with bottom padding for tab bar */}
      <main className="relative" style={{ paddingBottom: showBottomNav ? 'calc(4rem + env(safe-area-inset-bottom))' : 0 }}>
        {children}
      </main>

      {/* Bottom Tab Navigation */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 safe-bottom">
          <div className={`grid h-16 ${visibleTabs.length === 4 ? 'grid-cols-4' : visibleTabs.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {visibleTabs.map(tab => {
              const isActive = currentPageName === tab.name;
              return (
                <Link
                  key={tab.name}
                  to={createPageUrl(tab.page)}
                  className="flex flex-col items-center justify-center gap-1 active:bg-white/5 transition-colors"
                >
                  <tab.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-cyan-400' : 'text-white/40'}`} />
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-cyan-400' : 'text-white/40'}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}