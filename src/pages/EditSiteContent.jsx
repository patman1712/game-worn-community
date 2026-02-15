import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function EditSiteContent() {
  const [user, setUser] = useState(null);
  const [impressumText, setImpressumText] = useState("");
  const [agbText, setAgbText] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => {
      if (!u || (u.role !== 'admin' && u.data?.role !== 'admin')) {
        window.location.href = createPageUrl("Home");
      }
      setUser(u);
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

  const saveMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["siteContent"] });
    },
  });

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

        <h1 className="text-3xl font-bold text-white mb-8">Impressum & AGB bearbeiten</h1>

        <div className="space-y-8">
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
              onClick={() => saveMutation.mutate({ type: "impressum", text: impressumText })}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Impressum speichern
            </Button>
          </div>

          {/* AGB */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
            <Label className="text-white text-lg font-semibold mb-4 block">AGB</Label>
            <Textarea
              value={agbText}
              onChange={(e) => setAgbText(e.target.value)}
              rows={12}
              className="bg-slate-900/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 resize-none mb-4"
              placeholder="AGB-Text eingeben..."
            />
            <Button
              onClick={() => saveMutation.mutate({ type: "agb", text: agbText })}
              disabled={saveMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              AGB speichern
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}