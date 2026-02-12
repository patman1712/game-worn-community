import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Trash2, LogOut, Loader2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    // Delete all user's jerseys first
    const jerseys = await base44.entities.Jersey.filter({ owner_email: user.email });
    for (const jersey of jerseys) {
      await base44.entities.Jersey.delete(jersey.id);
    }
    
    // Delete all user's likes
    const likes = await base44.entities.JerseyLike.filter({ user_email: user.email });
    for (const like of likes) {
      await base44.entities.JerseyLike.delete(like.id);
    }

    // Delete the user account (note: this will log them out)
    await base44.entities.User.delete(user.id);
    
    // Logout and redirect
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-1">Einstellungen</h1>
        <p className="text-white/40 text-sm mb-8">Verwalte deinen Account und Einstellungen</p>

        {/* Account Info */}
        <Card className="bg-slate-900/60 border-white/5 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-white/40 text-xs">Name</p>
              <p className="text-white text-sm mt-0.5">{user.full_name || "Nicht angegeben"}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">E-Mail</p>
              <p className="text-white text-sm mt-0.5">{user.email}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Rolle</p>
              <p className="text-white text-sm mt-0.5 capitalize">{user.role}</p>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-slate-900/60 border-white/5 mb-4">
          <CardContent className="pt-6">
            <Button
              onClick={() => base44.auth.logout()}
              variant="outline"
              className="w-full bg-white/5 text-white border-white/10 hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Abmelden
            </Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-950/20 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400 text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Gefahrenzone
            </CardTitle>
            <CardDescription className="text-red-300/60 text-xs">
              Diese Aktion kann nicht rückgängig gemacht werden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Account löschen
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-slate-900 border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Bist du dir absolut sicher?</AlertDialogTitle>
                  <AlertDialogDescription className="text-white/60 space-y-2">
                    <p>
                      Diese Aktion kann <strong>nicht rückgängig</strong> gemacht werden.
                    </p>
                    <p>
                      Dein Account, alle deine Trikots und Likes werden permanent gelöscht.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                    Abbrechen
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Ja, Account löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <p className="text-white/20 text-xs text-center mt-8">
          JerseyVault v1.0
        </p>
      </div>
    </div>
  );
}