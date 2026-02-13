import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon, Loader2, RotateCw, Images, Star, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MobileDrawerSelect from "./MobileDrawerSelect";
import ImageEditor from "./ImageEditor";
import MultiImageUploadDialog from "./MultiImageUploadDialog";

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

const LEAGUES = ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL", "Sonstige"];
const JERSEY_TYPES = ["Home", "Away", "Third", "Special", "All-Star", "Retro", "Practice"];
const CONDITIONS = ["Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Getragen", "Game-Worn"];

const LEAGUE_OPTIONS = LEAGUES.map(l => ({ value: l, label: l }));
const TYPE_OPTIONS = JERSEY_TYPES.map(t => ({ value: t, label: t }));
const CONDITION_OPTIONS = CONDITIONS.map(c => ({ value: c, label: c }));

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
    is_game_issued: false,
    is_signed: false,
    is_private: false,
    for_sale: false,
  });
  const [uploading, setUploading] = useState(false);
  const [multiImageDialogOpen, setMultiImageDialogOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [editingImage, setEditingImage] = useState(null);
  const [editingImageType, setEditingImageType] = useState(null); // 'main' or index for additional

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e, isMain = true) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (isMain) {
        handleChange("image_url", file_url);
      } else {
        handleChange("additional_images", [...(form.additional_images || []), file_url]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Fehler beim Hochladen des Bildes");
    } finally {
      setUploading(false);
    }
  };

  const handleEditImage = (imageUrl, type) => {
    setEditingImage(imageUrl);
    setEditingImageType(type);
  };

  const handleSaveEditedImage = async (file) => {
    try {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (editingImageType === 'main') {
        handleChange("image_url", file_url);
      } else if (typeof editingImageType === 'number') {
        const newImages = [...(form.additional_images || [])];
        newImages[editingImageType] = file_url;
        handleChange("additional_images", newImages);
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
  };

  const handleMultiImageUpload = (urls) => {
    handleChange("additional_images", [...(form.additional_images || []), ...urls]);
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

  const handleDropFiles = async (files) => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];
    const errors = [];

    try {
      for (let i = 0; i < files.length; i++) {
        try {
          const file = files[i];
          const compressed = await compressImage(file, 1000);
          
          let retries = 2;
          let uploaded = false;
          
          while (retries > 0 && !uploaded) {
            try {
              const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
              uploadedUrls.push(file_url);
              uploaded = true;
            } catch (uploadError) {
              retries--;
              if (retries === 0) {
                throw uploadError;
              }
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch (fileError) {
          console.error(`Error processing file ${i}:`, fileError);
          errors.push(`Bild ${i + 1}`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        handleChange("additional_images", [...(form.additional_images || []), ...uploadedUrls]);
      }
      
      if (errors.length > 0) {
        alert(`${uploadedUrls.length}/${files.length} Bilder hochgeladen.\nFehler bei: ${errors.join(", ")}`);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Images Gallery */}
       <div>
         <Label className="text-white/70 text-sm mb-2 block">Fotos * (Mindestens 1 erforderlich)</Label>
         {form.additional_images && form.additional_images.length > 0 ? (
           <DragDropContext onDragEnd={handleDragEnd}>
             <Droppable droppableId="images" direction="horizontal" type="IMAGE">
               {(provided, snapshot) => (
                 <div
                   ref={provided.innerRef}
                   {...provided.droppableProps}
                   className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${snapshot.isDraggingOver ? 'bg-cyan-500/10 p-3 rounded-lg' : ''}`}
                 >
                   {form.additional_images.map((url, i) => (
                     <Draggable key={`image-${i}`} draggableId={`image-${i}`} index={i}>
                       {(provided, snapshot) => (
                         <div
                           ref={provided.innerRef}
                           {...provided.draggableProps}
                           className={`relative group ${snapshot.isDragging ? 'opacity-50' : ''}`}
                         >
                           <div className="aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-cyan-500/30 transition-colors">
                             <img src={url} alt="" className="w-full h-full object-cover" />
                           </div>
                           <div
                             {...provided.dragHandleProps}
                             className="absolute top-1 left-1 p-1.5 bg-black/60 rounded-full hover:bg-cyan-600/80 transition-colors opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
                           >
                             <GripVertical className="w-4 h-4 text-white" />
                           </div>
                           <button
                             type="button"
                             onClick={() => {
                               if (form.image_url === url) {
                                 handleChange("image_url", "");
                               } else {
                                 handleChange("image_url", url);
                               }
                             }}
                             className={`absolute top-1 right-1 p-1.5 rounded-full transition-all ${form.image_url === url ? 'bg-yellow-500 text-white' : 'bg-black/40 text-white/50 hover:bg-black/60'}`}
                           >
                             <Star className="w-4 h-4" fill={form.image_url === url ? "currentColor" : "none"} />
                           </button>
                           <button
                             type="button"
                             onClick={() => removeAdditionalImage(i)}
                             className="absolute bottom-1 right-1 p-1 bg-black/60 rounded-full hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <X className="w-3 h-3 text-white" />
                           </button>
                           <button
                             type="button"
                             onClick={() => handleEditImage(url, i)}
                             className="absolute bottom-1 left-1 p-1 bg-black/60 rounded-full hover:bg-orange-600/80 transition-colors opacity-0 group-hover:opacity-100"
                           >
                             <RotateCw className="w-3 h-3 text-white" />
                           </button>
                         </div>
                       )}
                     </Draggable>
                   ))}
                   {provided.placeholder}
                   <button
                     type="button"
                     onClick={() => setMultiImageDialogOpen(true)}
                     className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors"
                   >
                     <Upload className="w-6 h-6 text-white/30 mb-1" />
                     <span className="text-[10px] text-white/30">+ Fotos</span>
                   </button>
                 </div>
               )}
             </Droppable>
           </DragDropContext>
         ) : (
           <div
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             onClick={() => setMultiImageDialogOpen(true)}
             className="w-full aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors"
           >
             {uploading && <Loader2 className="w-8 h-8 text-cyan-400 mb-2 animate-spin" />}
             {!uploading && <Upload className="w-8 h-8 text-white/30 mb-2" />}
             <span className="text-white/40 text-sm">{uploading ? "Wird hochgeladen..." : "Klick hier oder zieh Fotos rein"}</span>
           </div>
         )}
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
                {LEAGUES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
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
          {isMobile ? (
            <MobileDrawerSelect
              value={form.jersey_type}
              onValueChange={(v) => handleChange("jersey_type", v)}
              options={TYPE_OPTIONS}
              label="Trikot-Typ wählen"
              placeholder="Typ wählen"
            />
          ) : (
            <Select value={form.jersey_type} onValueChange={(v) => handleChange("jersey_type", v)}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Typ wählen" />
              </SelectTrigger>
              <SelectContent>
                {JERSEY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Zustand</Label>
          {isMobile ? (
            <MobileDrawerSelect
              value={form.condition}
              onValueChange={(v) => handleChange("condition", v)}
              options={CONDITION_OPTIONS}
              label="Zustand wählen"
              placeholder="Zustand wählen"
            />
          ) : (
            <Select value={form.condition} onValueChange={(v) => handleChange("condition", v)}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Zustand wählen" />
              </SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={form.is_game_worn} onCheckedChange={(v) => handleChange("is_game_worn", v)} />
            <Label className="text-white/60 text-sm">Game-Worn</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_game_issued} onCheckedChange={(v) => handleChange("is_game_issued", v)} />
            <Label className="text-white/60 text-sm">Game-Issued</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_signed} onCheckedChange={(v) => handleChange("is_signed", v)} />
            <Label className="text-white/60 text-sm">Signiert</Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Switch checked={form.is_private} onCheckedChange={(v) => handleChange("is_private", v)} />
            <Label className="text-white/60 text-sm">Privat (nur ich kann es sehen)</Label>
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <Switch 
              checked={form.for_sale} 
              onCheckedChange={(v) => handleChange("for_sale", v)} 
            />
            <Label className="text-white/60 text-sm">Zum Verkauf</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch 
              checked={form.for_sale === false} 
              onCheckedChange={(v) => handleChange("for_sale", !v)} 
            />
            <Label className="text-white/60 text-sm">Nicht zum Verkauf</Label>
          </div>
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
           disabled={isSubmitting || !form.title || !form.team || !form.image_url || form.additional_images.length === 0}
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

      {/* Image Editor Modal */}
      {editingImage && (
        <ImageEditor
          imageUrl={editingImage}
          onSave={handleSaveEditedImage}
          onCancel={() => {
            setEditingImage(null);
            setEditingImageType(null);
          }}
        />
      )}

      {/* Multi Image Upload Dialog */}
      <MultiImageUploadDialog
        open={multiImageDialogOpen}
        onOpenChange={setMultiImageDialogOpen}
        onImagesUploaded={handleMultiImageUpload}
      />
    </form>
  );
}