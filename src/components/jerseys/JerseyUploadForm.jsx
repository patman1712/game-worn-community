import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

const LEAGUES = ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL", "Sonstige"];
const JERSEY_TYPES = ["Home", "Away", "Third", "Special", "All-Star", "Retro", "Practice"];
const CONDITIONS = ["Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Getragen", "Game-Worn"];

export default function JerseyUploadForm({ onSubmit, onCancel, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || {
    title: "",
    team: "",
    league: "",
    season: "",
    player_name: "",
    player_number: "",
    jersey_type: "",
    condition: "",
    description: "",
    image_url: "",
    additional_images: [],
    is_game_worn: false,
    is_signed: false,
  });
  const [uploading, setUploading] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, isMain = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    if (isMain) {
      handleChange("image_url", file_url);
    } else {
      handleChange("additional_images", [...(form.additional_images || []), file_url]);
    }
    setUploading(false);
  };

  const removeAdditionalImage = (index) => {
    handleChange("additional_images", form.additional_images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Main Image Upload */}
      <div>
        <Label className="text-white/70 text-sm mb-2 block">Hauptbild *</Label>
        {form.image_url ? (
          <div className="relative w-full aspect-[3/4] max-w-xs rounded-xl overflow-hidden border border-white/10">
            <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleChange("image_url", "")}
              className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-[3/4] max-w-xs rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-white/30 mb-2" />
                <span className="text-white/40 text-sm">Bild hochladen</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} />
          </label>
        )}
      </div>

      {/* Additional Images */}
      <div>
        <Label className="text-white/70 text-sm mb-2 block">Weitere Bilder</Label>
        <div className="flex gap-3 flex-wrap">
          {form.additional_images?.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAdditionalImage(i)}
                className="absolute top-1 right-1 p-0.5 bg-black/60 rounded-full"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          <label className="w-20 h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
            {uploading ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> : <ImageIcon className="w-5 h-5 text-white/30" />}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
          </label>
        </div>
      </div>

      {/* Info Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Titel *</Label>
          <Input
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="z.B. Gretzky Oilers Retro"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
            required
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Team *</Label>
          <Input
            value={form.team}
            onChange={(e) => handleChange("team", e.target.value)}
            placeholder="z.B. Edmonton Oilers"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
            required
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Liga</Label>
          <Select value={form.league} onValueChange={(v) => handleChange("league", v)}>
            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
              <SelectValue placeholder="Liga wählen" />
            </SelectTrigger>
            <SelectContent>
              {LEAGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Saison</Label>
          <Input
            value={form.season}
            onChange={(e) => handleChange("season", e.target.value)}
            placeholder="z.B. 2023/24"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Spielername</Label>
          <Input
            value={form.player_name}
            onChange={(e) => handleChange("player_name", e.target.value)}
            placeholder="z.B. Wayne Gretzky"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Rückennummer</Label>
          <Input
            value={form.player_number}
            onChange={(e) => handleChange("player_number", e.target.value)}
            placeholder="z.B. 99"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Trikot-Typ</Label>
          <Select value={form.jersey_type} onValueChange={(v) => handleChange("jersey_type", v)}>
            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
              <SelectValue placeholder="Typ wählen" />
            </SelectTrigger>
            <SelectContent>
              {JERSEY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Zustand</Label>
          <Select value={form.condition} onValueChange={(v) => handleChange("condition", v)}>
            <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
              <SelectValue placeholder="Zustand wählen" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex gap-8">
        <div className="flex items-center gap-3">
          <Switch checked={form.is_game_worn} onCheckedChange={(v) => handleChange("is_game_worn", v)} />
          <Label className="text-white/60 text-sm">Game-Worn</Label>
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.is_signed} onCheckedChange={(v) => handleChange("is_signed", v)} />
          <Label className="text-white/60 text-sm">Signiert</Label>
        </div>
      </div>

      {/* Description */}
      <div>
        <Label className="text-white/70 text-sm mb-1.5 block">Beschreibung</Label>
        <Textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Geschichte zum Trikot, besondere Details..."
          rows={4}
          className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || !form.title || !form.team || !form.image_url}
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initialData ? "Aktualisieren" : "Veröffentlichen"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="text-white/50 hover:text-white hover:bg-white/5">
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}