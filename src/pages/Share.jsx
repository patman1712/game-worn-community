import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Award, Star, Calendar, Shield, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

export default function Share() {
  const params = new URLSearchParams(window.location.search);
  const itemId = params.get("id");
  const [activeImage, setActiveImage] = useState(0);

  const { data: item, isLoading } = useQuery({
    queryKey: ["shareItem", itemId],
    queryFn: async () => {
      try {
        const jerseyList = await base44.entities.Jersey.filter({ id: itemId });
        if (jerseyList.length > 0) return jerseyList[0];
        
        const itemList = await base44.entities.CollectionItem.filter({ id: itemId });
        if (itemList.length > 0) return itemList[0];
        
        return null;
      } catch (error) {
        console.error("Error loading item:", error);
        return null;
      }
    },
    enabled: !!itemId,
  });

  // Update meta tags for social sharing
  useEffect(() => {
    if (item) {
      const title = item.player_name && item.team 
        ? `${item.player_name} - ${item.team}` 
        : item.team || item.title || "Sportartikel";
      
      const description = item.description || 
        `${item.league || ''} ${item.season || ''} ${item.jersey_type || ''}`.trim() ||
        "Sportartikel aus meiner Sammlung";

      // Update page title
      document.title = title;

      // Remove existing meta tags
      const existingMetas = document.querySelectorAll('meta[property^="og:"], meta[name="twitter:"]');
      existingMetas.forEach(meta => meta.remove());

      // Add Open Graph tags
      const metaTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: item.image_url },
        { property: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: item.image_url },
      ];

      metaTags.forEach(({ property, name, content }) => {
        const meta = document.createElement('meta');
        if (property) meta.setAttribute('property', property);
        if (name) meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      });
    }
  }, [item]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <p className="text-white/40">Objekt nicht gefunden.</p>
      </div>
    );
  }

  const allImages = [item.image_url, ...(item.additional_images || [])].filter((url, index, array) => array.indexOf(url) === index);

  return (
    <div className="min-h-screen bg-slate-950">
      <style>{`
        body { background: #0a0e1a; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-800 border border-white/5">
              <img
                src={allImages[activeImage]}
                alt={item.title || item.team}
                className="w-full h-full object-contain"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage(i => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setActiveImage(i => (i + 1) % allImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {allImages.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${activeImage === i ? 'border-cyan-500' : 'border-white/10 opacity-50 hover:opacity-80'}`}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">
                {item.team || item.title || "Sportartikel"}
              </h1>
              <div className="flex items-center gap-2 flex-wrap">
                {item.sport_type && (
                  <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs">
                    {item.sport_type === 'icehockey' ? 'Eishockey' :
                     item.sport_type === 'soccer' ? 'Fussball' :
                     item.sport_type === 'football' ? 'Football' :
                     item.sport_type === 'basketball' ? 'Basketball' :
                     item.sport_type === 'baseball' ? 'Baseball' : item.sport_type}
                  </Badge>
                )}
                {item.league && (
                  <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs">
                    {item.league}
                  </Badge>
                )}
                {item.jersey_type && (
                  <Badge className="bg-white/10 text-white/60 border border-white/10 text-xs">
                    {item.jersey_type}
                  </Badge>
                )}
                {item.is_game_worn && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> {item.sport_type === 'soccer' ? 'Matchworn' : 'Game-Worn'}
                  </Badge>
                )}
                {item.is_game_issued && (
                  <Badge className="bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> {item.sport_type === 'soccer' ? 'Player Edition' : 'Game-Issued'}
                  </Badge>
                )}
                {item.is_authentic && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Authentic
                  </Badge>
                )}
                {item.is_fan_jersey && (
                  <Badge className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs">
                    <Award className="w-3 h-3 mr-1" /> Fantrikot
                  </Badge>
                )}
                {item.is_signed && (
                  <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                    <Star className="w-3 h-3 mr-1" /> Signiert
                  </Badge>
                )}
                {item.captain_patch && item.captain_patch !== "Keine" && (
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                    {item.captain_patch} Patch
                  </Badge>
                )}
                {item.has_loa && (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                    LOA
                  </Badge>
                )}
                {item.is_photomatch && (
                  <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                    📸 Photomatch
                  </Badge>
                )}
              </div>
            </div>

            {/* Player info */}
            {item.player_name && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-white/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {item.player_number || "#"}
                </div>
                <div>
                  <p className="text-white font-semibold">{item.player_name}</p>
                  <p className="text-white/40 text-sm">{item.season || ""}</p>
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {item.season && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Calendar className="w-3 h-3" /> Saison
                  </div>
                  <p className="text-white text-sm font-medium">{item.season}</p>
                </div>
              )}
              {item.condition && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    <Shield className="w-3 h-3" /> Zustand
                  </div>
                  <p className="text-white text-sm font-medium">{item.condition}</p>
                </div>
              )}
              {item.size && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    Größe
                  </div>
                  <p className="text-white text-sm font-medium">{item.size}</p>
                </div>
              )}
              {item.brand && (
                <div className="p-3 rounded-xl bg-slate-800/30 border border-white/5">
                  <div className="flex items-center gap-2 text-white/30 text-xs mb-1">
                    Marke
                  </div>
                  <p className="text-white text-sm font-medium">{item.brand}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="text-white/60 text-sm font-medium mb-2">Beschreibung</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Owner */}
            <div className="pt-4 border-t border-white/5">
              <p className="text-white/40 text-sm">
                Aus der Sammlung von <span className="text-white font-medium">{item.owner_name || "Unbekannt"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}