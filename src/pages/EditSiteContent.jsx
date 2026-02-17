import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Mail, Shield, CheckCircle, Server } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EditSiteContent() {
  const [user, setUser] = useState(null);
  const [impressumText, setImpressumText] = useState("");
  const [agbText, setAgbText] = useState("");
  
  // SMTP State
  const [smtpConfig, setSmtpConfig] = useState({
    host: '', port: 587, user: '', pass: '', secure: false, from: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || (u.role !== 'admin' && u.data?.role !== 'admin')) {
        window.location.href = createPageUrl("Home");
      }
      setUser(u);
      if (u) {
          setTestEmail(u.email);
          // Load SMTP settings
          base44.auth.getSmtpSettings().then(config => {
              if (config && Object.keys(config).length > 0) {
                  setSmtpConfig(prev => ({...prev, ...config}));
              }
          });
      }
    }).catch(() => {
      window.location.href = createPageUrl("Home");
    });
  }, []);

  const { data: contents, isLoading } = useQuery({
    queryKey: ["allSiteContent"],
    queryFn: () => base44.entities.SiteContent.list(),
    enabled: !!user,
  });

  useEffect(() => {
    if (contents) {
      const impressum = contents.find(c => c.content_type === "impressum");
      const agb = contents.find(c => c.content_type === "agb");
      setImpressumText(impressum?.content || "");
      setAgbText(agb?.content || "");
    }
  }, [contents]);

  const saveContentMutation = useMutation({
    mutationFn: async ({ type, text }) => {
      const existing = contents?.find(c => c.content_type === type);
      if (existing) {
        return base44.entities.SiteContent.update(existing.id, { content: text });
      } else {
        return base44.entities.SiteContent.create({ content_type: type, content: text });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allSiteContent"] });
      toast({ title: "Gespeichert", description: "Inhalt wurde aktualisiert." });
    },
  });
  
  const saveSmtpMutation = useMutation({
      mutationFn: async (config) => {
          return base44.auth.saveSmtpSettings(config);
      },
      onSuccess: () => {
          toast({ title: "Gespeichert", description: "Email-Einstellungen wurden aktualisiert." });
      },
      onError: (err) => {
          toast({ variant: "destructive", title: "Fehler", description: err.message });
      }
  });

  const handleTestEmail = async () => {
      setIsTestingSmtp(true);
      try {
          const res = await base44.auth.testSmtpSettings(smtpConfig, testEmail);
          // Assuming response structure: { data: { message, details } } because of how base44.functions.invoke or request works?
          // No, request returns JSON directly. So res is { message, details }
          toast({ 
              title: "Erfolg", 
              description: `${res.message}. ${res.details || ''}` 
          });
      } catch (err) {
          toast({ variant: "destructive", title: "Fehler", description: err.message });
      } finally {
          setIsTestingSmtp(false);
      }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link
          to={createPageUrl("AdminPanel")}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Admin-Panel
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">System Einstellungen</h1>

        <Tabs defaultValue="legal" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border border-white/10 mb-8">
                <TabsTrigger value="legal" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                    <Shield className="w-4 h-4 mr-2" />
                    Rechtliches & Inhalt
                </TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Server (SMTP)
                </TabsTrigger>
            </TabsList>

            <TabsContent value="legal" className="space-y-8">
                {/* Impressum */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                    <Label className="text-white text-lg font-semibold mb-4 block">Impressum</Label>
                    <Textarea
                    value={impressumText}
                    onChange={(e) => setImpressumText(e.target.value)}
                    rows={12}
                    className="bg-slate-900/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 resize-none mb-4"
                    placeholder="Impressum-Text eingeben..."
                    />
                    <Button
                    onClick={() => saveContentMutation.mutate({ type: "impressum", text: impressumText })}
                    disabled={saveContentMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                    >
                    {saveContentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Impressum speichern
                    </Button>
                </div>

                {/* Datenschutz */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                    <Label className="text-white text-lg font-semibold mb-4 block">Datenschutz</Label>
                    <Textarea
                    value={agbText}
                    onChange={(e) => setAgbText(e.target.value)}
                    rows={12}
                    className="bg-slate-900/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 resize-none mb-4"
                    placeholder="Datenschutz-Text eingeben..."
                    />
                    <Button
                    onClick={() => saveContentMutation.mutate({ type: "agb", text: agbText })}
                    disabled={saveContentMutation.isPending}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
                    >
                    {saveContentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Datenschutz speichern
                    </Button>
                </div>
            </TabsContent>

            <TabsContent value="email">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            <Server className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">SMTP Konfiguration</h2>
                            <p className="text-white/40 text-sm">Hier konfigurierst du den Email-Versand (z.B. für Passwort Reset).</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <Label className="text-white mb-2 block">SMTP Host</Label>
                            <Input 
                                value={smtpConfig.host} 
                                onChange={e => setSmtpConfig({...smtpConfig, host: e.target.value})}
                                placeholder="smtp.example.com"
                                className="bg-slate-900/50 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-white mb-2 block">Port</Label>
                            <Input 
                                type="number"
                                value={smtpConfig.port} 
                                onChange={e => setSmtpConfig({...smtpConfig, port: parseInt(e.target.value) || 587})}
                                placeholder="587"
                                className="bg-slate-900/50 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-white mb-2 block">Benutzername (User)</Label>
                            <Input 
                                value={smtpConfig.user} 
                                onChange={e => setSmtpConfig({...smtpConfig, user: e.target.value})}
                                placeholder="user@example.com"
                                className="bg-slate-900/50 border-white/10 text-white"
                            />
                        </div>
                        <div>
                            <Label className="text-white mb-2 block">Passwort</Label>
                            <Input 
                                type="password"
                                value={smtpConfig.pass} 
                                onChange={e => setSmtpConfig({...smtpConfig, pass: e.target.value})}
                                placeholder="••••••••"
                                className="bg-slate-900/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Label className="text-white mb-2 block">Absender Adresse (From)</Label>
                            <Input 
                                value={smtpConfig.from} 
                                onChange={e => setSmtpConfig({...smtpConfig, from: e.target.value})}
                                placeholder='"Game-Worn Community" <noreply@example.com>'
                                className="bg-slate-900/50 border-white/10 text-white"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch 
                                id="secure"
                                checked={smtpConfig.secure}
                                onCheckedChange={checked => setSmtpConfig({...smtpConfig, secure: checked})}
                            />
                            <Label htmlFor="secure" className="text-white">SSL/TLS nutzen (Secure)</Label>
                        </div>
                    </div>

                    <div className="flex gap-4 border-t border-white/10 pt-6">
                        <Button
                            onClick={() => saveSmtpMutation.mutate(smtpConfig)}
                            disabled={saveSmtpMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {saveSmtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Einstellungen speichern
                        </Button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-white font-semibold mb-4">Verbindung testen</h3>
                        <div className="flex gap-4">
                            <Input 
                                value={testEmail}
                                onChange={e => setTestEmail(e.target.value)}
                                placeholder="test@example.com"
                                className="bg-slate-900/50 border-white/10 text-white max-w-sm"
                            />
                            <Button
                                onClick={handleTestEmail}
                                disabled={isTestingSmtp}
                                variant="secondary"
                            >
                                {isTestingSmtp ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                Test-Email senden
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}