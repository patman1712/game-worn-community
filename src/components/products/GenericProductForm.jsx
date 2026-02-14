import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, RotateCw, GripVertical, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MobileDrawerSelect from "../jerseys/MobileDrawerSelect";
import ImageEditor from "../jerseys/ImageEditor";
import MultiImageUploadDialog from "../jerseys/MultiImageUploadDialog";
import CopyrightDialog from "../jerseys/CopyrightDialog";

const LEAGUES_BY_SPORT = {
  icehockey: ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL", "Sonstige"],
  soccer: ["Bundesliga", "Premier League", "La Liga", "Serie A", "Ligue 1", "Champions League", "Europa League", "Sonstige"],
  football: ["NFL", "NCAA", "CFL", "Sonstige"],
  basketball: ["NBA", "BBL", "EuroLeague", "NCAA", "Sonstige"],
  baseball: ["MLB", "NPB", "KBO", "Sonstige"],
  other: ["Sonstige"]
};

const compressImage = async (file, targetSizeKB = 1000) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        try {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              let width = img.width;
              let height = img.height;

              const maxDimension = 1200;
              if (width > height) {
                if (width > maxDimension) {
                  height = (height * maxDimension) / width;
                  width = maxDimension;
                }
              } else {
                if (height > maxDimension) {
                  width = (width * maxDimension) / height;
                  height = maxDimension;
                }
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, width, height);

              let quality = 0.85;
              const targetSize = targetSizeKB * 1024;
              
              const tryCompress = () => {
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(new Error("Blob creation failed"));
                      return;
                    }
                    if (blob.size > targetSize && quality > 0.3) {
                      quality -= 0.08;
                      tryCompress();
                    } else {
                      const compressedFile = new File([blob], file.name, { type: "image/jpeg" });
                      resolve(compressedFile);
                    }
                  },
                  "image/jpeg",
                  quality
                );
              };

              tryCompress();
            } catch (e) {
              reject(e);
            }
          };
          img.onerror = () => reject(new Error("Image load failed"));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = () => reject(new Error("File read failed"));
    } catch (e) {
      reject(e);
    }
  });
};

export default function GenericProductForm({ sportType, productType, onSubmit, onCancel, initialData, isSubmitting }) {
  const [form, setForm] = useState(initialData || {
    sport_type: sportType,
    product_type: productType,
    team: "",
    league: "",
    season: "",
    player_name: "",
    player_number: "",
    condition: "",
    description: "",
    image_url: "",
    additional_images: [],
    is_game_worn: false,
    is_game_issued: false,
    is_signed: false,
    has_loa: false,
    is_photomatch: false,
    is_private: false,
    for_sale: false,
    purchase_price: null,
    brand: "",
    size: "",
  });
  
  const [uploading, setUploading] = useState(false);
  const [multiImageDialogOpen, setMultiImageDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [editingImageType, setEditingImageType] = useState(null);
  const [copyrightDialogOpen, setCopyrightDialogOpen] = useState(false);
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [initialImageCount] = useState(initialData?.additional_images?.length || 0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const leagueOptions = LEAGUES_BY_SPORT[sportType] || [];
  const LEAGUE_OPTIONS = leagueOptions.map(l => ({ value: l, label: l }));

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEditedImage = async (file) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (editingImageType === 'main') {
        handleChange("image_url", file_url);
      } else if (typeof editingImageType === 'number') {
        const newImages = form.additional_images.filter((_, i) => i !== editingImageType);
        newImages.unshift(file_url);
        handleChange("additional_images", newImages);
        handleChange("image_url", file_url);
      }
      
      setEditingImage(null);
      setEditingImageType(null);
    } catch (error) {
      console.error("Error uploading rotated image:", error);
      alert("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };

  const removeAdditionalImage = (index) => {
    handleChange("additional_images", form.additional_images.filter((_, i) => i !== index));
  };

  const handleDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const newImages = Array.from(form.additional_images || []);
    const [removed] = newImages.splice(source.index, 1);
    newImages.splice(destination.index, 0, removed);
    handleChange("additional_images", newImages);
    handleChange("image_url", newImages[0]);
  };

  const handleMultiImageUpload = (urls) => {
    const newImages = [...(form.additional_images || []), ...urls];
    handleChange("additional_images", newImages);
    if (newImages.length > 0) {
      handleChange("image_url", newImages[0]);
    }
    if (!copyrightAgreed && urls.length > 0) {
      setCopyrightDialogOpen(true);
    }
  };

  const handleDropFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const compressed = await compressImage(file, 1000);
          const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
          uploadedUrls.push(file_url);
        } catch (fileError) {
          console.error(`Error processing file ${i}:`, fileError);
        }
      }
      
      if (uploadedUrls.length > 0) {
        const newImages = [...(form.additional_images || []), ...uploadedUrls];
        handleChange("additional_images", newImages);
        if (newImages.length > 0) {
          handleChange("image_url", newImages[0]);
        }
        if (!copyrightAgreed) {
          setCopyrightDialogOpen(true);
        }
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Fehler beim Hochladen der Bilder");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-cyan-500/60', 'bg-cyan-500/5');
    
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      handleDropFiles(files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('border-cyan-500/60', 'bg-cyan-500/5');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('border-cyan-500/60', 'bg-cyan-500/5');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentImageCount = form.additional_images?.length || 0;
    if (currentImageCount > 0 && !copyrightAgreed) {
      setCopyrightDialogOpen(true);
      return;
    }
    onSubmit(form);
  };

  const showTeamFields = productType === "jersey" || productType === "jersey";
  const showGameWornFields = productType === "jersey";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images Gallery */}
      <div>
        <Label className="text-white/70 text-sm mb-2 block">Fotos * (Mindestens 1 erforderlich)</Label>
        {form.additional_images && form.additional_images.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal" type="IMAGE">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {form.additional_images.map((url, i) => (
                    <Draggable key={`image-${i}`} draggableId={`image-${i}`} index={i}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-cyan-500/30 transition-colors">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div {...provided.dragHandleProps} className="absolute top-1 left-1 p-1.5 bg-black/60 rounded-full hover:bg-cyan-600/80 transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                            <GripVertical className="w-4 h-4 text-white" />
                          </div>
                          <button type="button" onClick={() => removeAdditionalImage(i)} className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-full hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100">
                            <X className="w-3 h-3 text-white" />
                          </button>
                          <button type="button" onClick={() => { setEditingImage(url); setEditingImageType(i); }} className="absolute bottom-1 left-1 p-1 bg-black/60 rounded-full hover:bg-orange-600/80 transition-colors opacity-0 group-hover:opacity-100">
                            <RotateCw className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button type="button" onClick={() => setMultiImageDialogOpen(true)} className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors">
                    <Upload className="w-6 h-6 text-white/30 mb-1" />
                    <span className="text-[10px] text-white/30">+ Fotos</span>
                  </button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => setMultiImageDialogOpen(true)} className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors">
            {uploading && <Loader2 className="w-8 h-8 text-cyan-400 mb-2 animate-spin" />}
            {!uploading && <Upload className="w-8 h-8 text-white/30 mb-2" />}
            <span className="text-white/40 text-sm">{uploading ? "Wird hochgeladen..." : "Klick hier oder zieh Fotos rein"}</span>
          </div>
        )}
      </div>

      {/* Basic Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {showTeamFields && (
          <>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Team</Label>
              <Input value={form.team} onChange={(e) => handleChange("team", e.target.value)} placeholder="z.B. Edmonton Oilers" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Liga</Label>
              {isMobile ? (
                <MobileDrawerSelect
                  value={form.league}
                  onValueChange={(v) => handleChange("league", v)}
                  options={LEAGUE_OPTIONS}
                  label="Liga wählen"
                  placeholder="Liga wählen"
                />
              ) : (
                <Select value={form.league} onValueChange={(v) => handleChange("league", v)}>
                  <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                    <SelectValue placeholder="Liga wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {leagueOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Saison</Label>
              <Input value={form.season} onChange={(e) => handleChange("season", e.target.value)} placeholder="z.B. 2023/24" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
            </div>
            <div>
              <Label className="text-white/70 text-sm mb-1.5 block">Spielername</Label>
              <Input value={form.player_name} onChange={(e) => handleChange("player_name", e.target.value)} placeholder="z.B. Wayne Gretzky" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
            </div>
          </>
        )}

        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Marke/Hersteller</Label>
          <Input value={form.brand} onChange={(e) => handleChange("brand", e.target.value)} placeholder="z.B. Adidas" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Größe</Label>
          <Input value={form.size} onChange={(e) => handleChange("size", e.target.value)} placeholder="z.B. L, 42, etc." className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Zustand</Label>
          <Input value={form.condition} onChange={(e) => handleChange("condition", e.target.value)} placeholder="z.B. Neu, Gut, etc." className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
        </div>
      </div>

      {/* Toggles */}
      {showGameWornFields && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => handleChange("is_game_worn", !form.is_game_worn)} className={`${form.is_game_worn ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
              Game-Worn
            </Button>
            <Button type="button" onClick={() => handleChange("is_game_issued", !form.is_game_issued)} className={`${form.is_game_issued ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
              Game-Issued
            </Button>
            <Button type="button" onClick={() => handleChange("is_signed", !form.is_signed)} className={`${form.is_signed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
              Signiert
            </Button>
            <Button type="button" onClick={() => handleChange("has_loa", !form.has_loa)} className={`${form.has_loa ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
              Zertifikat (LOA)
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" onClick={() => handleChange("is_private", true)} className={`${form.is_private ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
          Privat
        </Button>
        <Button type="button" onClick={() => handleChange("is_private", false)} className={`${!form.is_private ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
          Öffentlich
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => handleChange("for_sale", true)} className={`${form.for_sale ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
          Zum Verkauf
        </Button>
        <Button type="button" onClick={() => handleChange("for_sale", false)} className={`${!form.for_sale ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}>
          Nicht zum Verkauf
        </Button>
      </div>

      {/* Purchase Price */}
      <div>
        <Label className="text-white/70 text-sm mb-1.5 block">Kaufpreis (optional, nur für dich sichtbar)</Label>
        <Input type="number" step="0.01" value={form.purchase_price || ""} onChange={(e) => handleChange("purchase_price", e.target.value ? parseFloat(e.target.value) : null)} placeholder="z.B. 150.00" className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50" />
      </div>

      {/* Description */}
      <div>
        <Label className="text-white/70 text-sm mb-1.5 block">Beschreibung</Label>
        <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="Geschichte, besondere Details..." rows={4} className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting || !form.image_url} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {initialData ? "Aktualisieren" : "Veröffentlichen"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} className="text-white/50 hover:text-white hover:bg-white/5">
            Abbrechen
          </Button>
        )}
      </div>

      {!copyrightAgreed && !initialData && form.additional_images?.length > 0 && (
        <p className="text-amber-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Bitte bestätige die Urheberrechtsbestätigung, um fortzufahren.
        </p>
      )}

      {editingImage && (
        <ImageEditor imageUrl={editingImage} onSave={handleSaveEditedImage} onCancel={() => { setEditingImage(null); setEditingImageType(null); }} />
      )}

      <MultiImageUploadDialog open={multiImageDialogOpen} onOpenChange={setMultiImageDialogOpen} onImagesUploaded={handleMultiImageUpload} />

      <CopyrightDialog open={copyrightDialogOpen} onConfirm={() => { setCopyrightAgreed(true); setCopyrightDialogOpen(false); if (initialData && (form.additional_images?.length || 0) > initialImageCount) { onSubmit(form); } }} onCancel={() => { if (initialData) { handleChange("additional_images", initialData.additional_images || []); if (initialData.image_url) handleChange("image_url", initialData.image_url); } else { handleChange("additional_images", []); handleChange("image_url", ""); } setCopyrightDialogOpen(false); }} />
    </form>
  );
}