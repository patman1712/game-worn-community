import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { User, Trash2, LogOut, Loader2, AlertTriangle, MapPin, Mail, Eye, EyeOff, Save } from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    location: "",
    show_email: false,
    show_location: false,
  });

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setProfile({
        display_name: u.display_name || u.full_name || "",
        location: u.location || "",
        show_email: u.show_email || false,
        show_location: u.show_location || false,
      });
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await base44.auth.updateMe(profile);
    const updatedUser = await base44.auth.me();
    setUser(updatedUser);
    setIsSaving(false);
  };

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
        <p className="text-white/40 text-sm mb-8">Verwalte dein Profil und Account</p>

        {/* Profile Edit */}
        <Card className="bg-slate-900/60 border-white/5 mb-4">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Profil bearbeiten
            </CardTitle>
            <CardDescription className="text-white/40 text-xs">
              Bestimme, welche Informationen andere sehen können
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">Anzeigename</Label>
              <Input
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                placeholder="Dein Name"
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 mt-1.5"
              />
            </div>
            
            <div>
              <Label className="text-white/70 text-sm">E-Mail</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  value={user.email}
                  disabled
                  className="bg-slate-800/30 border-white/5 text-white/40 flex-1"
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg">
                  <Switch
                    checked={profile.show_email}
                    onCheckedChange={(v) => setProfile({ ...profile, show_email: v })}
                  />
                  {profile.show_email ? (
                    <Eye className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-white/40" />
                  )}
                </div>
              </div>
              <p className="text-white/30 text-xs mt-1">
                {profile.show_email ? "Öffentlich sichtbar" : "Nur für dich sichtbar"}
              </p>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Wohnort</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={profile.location}
                    onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                    placeholder="z.B. München, Deutschland"
                    className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 pl-10"
                  />
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg">
                  <Switch
                    checked={profile.show_location}
                    onCheckedChange={(v) => setProfile({ ...profile, show_location: v })}
                  />
                  {profile.show_location ? (
                    <Eye className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-white/40" />
                  )}
                </div>
              </div>
              <p className="text-white/30 text-xs mt-1">
                {profile.show_location ? "Öffentlich sichtbar" : "Nur für dich sichtbar"}
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Profil speichern
            </Button>
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