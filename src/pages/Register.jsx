import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UserPlus, MapPin } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    display_name: "",
    real_name: "",
    location: "",
    show_location: false,
    accept_messages: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password.length < 6) {
      alert("Das Passwort muss mindestens 6 Zeichen lang sein");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await base44.functions.invoke('registerUser', formData);
      setSuccess(true);
    } catch (error) {
      alert("Fehler bei der Registrierung: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="bg-slate-900/60 border-white/5 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-white text-xl">Registrierung erfolgreich!</CardTitle>
            <CardDescription className="text-white/60">
              Deine Registrierung wurde erfolgreich übermittelt. Du erhältst eine E-Mail mit einem Einladungslink, sobald ein Administrator deinen Account freigeschaltet hat. Mit diesem Link kannst du dann dein Passwort setzen und dich anmelden.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => base44.auth.redirectToLogin()}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="bg-slate-900/60 border-white/5 max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-white text-2xl">Registrierung</CardTitle>
          <CardDescription className="text-white/60">
            Erstelle deinen Account für Jersey Collectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-white/70 text-sm">E-Mail *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 mt-1.5"
                placeholder="deine@email.de"
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm">Passwort *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 mt-1.5"
                placeholder="Mindestens 6 Zeichen"
              />
            </div>

            <div>
              <Label className="text-white/70 text-sm">Anzeigename *</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                required
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 mt-1.5"
                placeholder="Wie sollen andere dich sehen?"
              />
              <p className="text-white/30 text-xs mt-1">Dieser Name wird öffentlich angezeigt</p>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Vollständiger Name</Label>
              <Input
                value={formData.real_name}
                onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
                className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 mt-1.5"
                placeholder="Dein voller Name (optional)"
              />
              <p className="text-white/30 text-xs mt-1">Nur für dich sichtbar</p>
            </div>

            <div>
              <Label className="text-white/70 text-sm">Wohnort</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 pl-10"
                  placeholder="z.B. München, Deutschland"
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Switch
                  checked={formData.show_location}
                  onCheckedChange={(v) => setFormData({ ...formData, show_location: v })}
                />
                <Label className="text-white/50 text-xs">Wohnort öffentlich anzeigen</Label>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={formData.accept_messages}
                onCheckedChange={(v) => setFormData({ ...formData, accept_messages: v })}
              />
              <Label className="text-white/50 text-xs">Ich möchte Nachrichten von anderen Usern erhalten</Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird registriert...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Registrieren
                </>
              )}
            </Button>

            <p className="text-white/40 text-xs text-center pt-2">
              Bereits registriert?{" "}
              <button
                type="button"
                onClick={() => base44.auth.redirectToLogin()}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Hier anmelden
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}