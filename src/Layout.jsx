import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Shirt, Home, Plus, FolderOpen, LogIn, LogOut, ChevronLeft, Settings, MessageCircle, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";

const TABS = [
  { name: "Home", icon: Home, label: "Sammlung", page: "Home" },
  { name: "Messages", icon: MessageCircle, label: "Nachrichten", page: "Messages", authRequired: true },
  { name: "MyCollection", icon: FolderOpen, label: "Meine Objekte", page: "MyCollection", authRequired: true },
  { name: "AddJersey", icon: Plus, label: "Objekt hinzufügen", page: "AddJersey", authRequired: true },
];

const CHILD_PAGES = ["Share"];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: pendingUser, refetch: refetchPendingUser } = useQuery({
    queryKey: ["pendingUser", user?.email],
    queryFn: async () => {
      const pendingUsers = await base44.entities.PendingUser.filter({ email: user.email });
      return pendingUsers[0] || null;
    },
    enabled: !!user,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true,
  });

  const { data: unreadMessages = [] } = useQuery({
    queryKey: ["unreadMessages", user?.email],
    queryFn: () => user ? base44.entities.Message.filter({ receiver_email: user.email, read: false }) : [],
    enabled: !!user && pendingUser !== undefined && pendingUser?.accept_messages !== false,
  });

  // Share page should have no layout at all
  if (currentPageName === "Share") {
    return children;
  }

  const isChildPage = CHILD_PAGES.includes(currentPageName);
  const showBottomNav = !isChildPage;
  
  // Determine if messages should be shown - check both PendingUser and User.data
  const showMessages = user && (
    pendingUser !== undefined
      ? (pendingUser?.accept_messages !== false)  // Use pendingUser if loaded
      : (user.data?.accept_messages !== false && user.accept_messages !== false)  // Fallback to user.data
  );
  
  const visibleTabs = TABS.filter(tab => {
    if (!tab.authRequired) return true;
    if (!user) return false;
    // Hide Messages tab if user has explicitly disabled accept_messages
    if (tab.name === "Messages" && !showMessages) return false;
    return true;
  });

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
              <div className="w-20" />
            </>
          ) : (
            <>
              {/* Navigation Links */}
              <div className="flex items-center gap-1">
                {visibleTabs.map(tab => {
                  const isActive = currentPageName === tab.name;
                  const unreadCount = tab.name === "Messages" ? unreadMessages.length : 0;
                  return (
                    <Link
                      key={tab.name}
                      to={createPageUrl(tab.page)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm relative ${isActive ? 'text-cyan-400 bg-cyan-500/10' : 'text-white/50 hover:text-white/70 hover:bg-white/5'}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Right Menu */}
              {user ? (
                <div className="flex items-center gap-2">
                  {(user.role === 'admin' || user.data?.role === 'admin') && (
                    <Link to={createPageUrl("AdminPanel")}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                      >
                        <Settings className="w-3.5 h-3.5 mr-1.5" />
                        <span className="hidden sm:inline">Admin</span>
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
                      <span className="hidden sm:inline">Profil</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={() => base44.auth.logout()}
                    size="sm"
                    variant="ghost"
                    className="text-white/70 hover:text-white hover:bg-white/5 text-xs h-8 px-3"
                  >
                    <LogOut className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden sm:inline">Abmelden</span>
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
                </div>
              )}
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      {!isChildPage && (
        <footer className="border-t border-white/5 bg-slate-950/95 backdrop-blur-xl mt-auto safe-bottom">
          <div className="max-w-7xl mx-auto px-4 py-6 pb-8">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
              <Link to={createPageUrl("Impressum")} className="hover:text-white/70 transition-colors">
                Impressum
              </Link>
              <Link to={createPageUrl("AGB")} className="hover:text-white/70 transition-colors">
                AGB
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}