import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Save, Mail, Shield, Server } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function EditSiteContent() {
  const [user, setUser] = useState(null);
  const [impressumText, setImpressumText] = useState("");
  const [agbText, setAgbText] = useState("");
  
  const [resendConfig, setResendConfig] = useState({
      apiKey: '', from: ''
  });
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  
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
          // Load Resend settings
          base44.auth.getResendSettings().then(config => {
              if (config && Object.keys(config).length > 0) {
                  setResendConfig(prev => ({...prev, ...config}));
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
  
  const saveResendMutation = useMutation({
    mutationFn: async (config) => base44.auth.saveResendSettings(config),
    onSuccess: () => toast({ title: "Gespeichert", description: "Email-Einstellungen aktualisiert." }),
    onError: (err) => toast({ variant: "destructive", title: "Fehler", description: err.message })
  });

  const handleTestResend = async () => {
    setIsTesting(true);
    try {
      const res = await base44.auth.testResendSettings(resendConfig, testEmail);
      toast({ title: "Erfolg", description: res.message });
    } catch (err) {
      toast({ variant: "destructive", title: "Fehler", description: err.message });
    } finally {
      setIsTesting(false);
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
                    Email Konfiguration
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
              <h2 className="text-xl font-bold text-white">Email API (Resend)</h2>
              <p className="text-white/40 text-sm">Konfiguriere hier den Email-Versand über Resend.com.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <Label className="text-white mb-2 block">API Key (re_...)</Label>
              <Input 
                value={resendConfig.apiKey} 
                onChange={e => setResendConfig({...resendConfig, apiKey: e.target.value})}
                placeholder="re_12345678..."
                className="bg-slate-900/50 border-white/10 text-white font-mono"
                type="password"
              />
            </div>
            <div>
              <Label className="text-white mb-2 block">Absender (From)</Label>
              <Input 
                value={resendConfig.from} 
                onChange={e => setResendConfig({...resendConfig, from: e.target.value})}
                placeholder="onboarding@resend.dev"
                className="bg-slate-900/50 border-white/10 text-white"
              />
              <p className="text-xs text-white/30 mt-1">Muss bei Resend verifiziert sein. Zum Testen: onboarding@resend.dev</p>
            </div>
          </div>

          <div className="flex gap-4 border-t border-white/10 pt-6">
            <Button
              onClick={() => saveResendMutation.mutate(resendConfig)}
              disabled={saveResendMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saveResendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Einstellungen speichern
            </Button>
            
            <Button
              onClick={handleTestResend}
              disabled={isTesting}
              variant="secondary"
            >
              {isTesting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Test-Email senden
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
      </div>
    </div>
  );
}