import React from "react";
import { api } from '@/api/apiClient';
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function Impressum() {
  const { data: content, isLoading } = useQuery({
    queryKey: ["siteContent", "impressum"],
    queryFn: async () => {
      const result = await api.entities.SiteContent.filter({ content_type: "impressum" });
      return result[0]?.content || "Noch kein Impressum vorhanden.";
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-white mb-8">Impressum</h1>
        <div className="bg-slate-800/50 rounded-xl p-6 border border-white/10">
          <div className="text-white/70 whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
}