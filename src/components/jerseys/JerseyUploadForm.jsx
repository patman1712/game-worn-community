import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, X, Image as ImageIcon, Loader2, RotateCw, Images, GripVertical, AlertCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MobileDrawerSelect from "./MobileDrawerSelect";
import ImageEditor from "./ImageEditor";
import MultiImageUploadDialog from "./MultiImageUploadDialog";
import CopyrightDialog from "./CopyrightDialog";

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

const LEAGUES_BY_SPORT = {
  icehockey: ["NHL", "DEL", "SHL", "KHL", "NLA", "EIHL", "Liiga", "CHL", "IIHF", "AHL", "OHL", "Sonstige"],
  soccer: ["Bundesliga", "Premier League", "La Liga", "Serie A", "Ligue 1", "Champions League", "Europa League", "Sonstige"],
  football: ["NFL", "NCAA", "CFL", "Sonstige"],
  basketball: ["NBA", "BBL", "EuroLeague", "NCAA", "Sonstige"],
  baseball: ["MLB", "NPB", "KBO", "Sonstige"],
  other: ["Sonstige"]
};

const JERSEY_TYPES = ["Home", "Away", "Third", "Special", "All-Star", "Retro", "Practice", "Warm-Up", "Fan-Jersey"];
const CONDITIONS = ["Neu mit Etikett", "Neu ohne Etikett", "Sehr gut", "Gut", "Getragen", "Game-Worn"];
const CAPTAIN_PATCH_OPTIONS = ["Keine", "C", "A"];

const TYPE_OPTIONS = JERSEY_TYPES.map(t => ({ value: t, label: t }));
const CONDITION_OPTIONS = CONDITIONS.map(c => ({ value: c, label: c }));

export default function JerseyUploadForm({ onSubmit, onCancel, initialData, isSubmitting }) {
  const queryClient = useQueryClient();
  const defaultFormData = {
    sport_type: "icehockey",
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
    is_authentic: false,
    is_fan_jersey: false,
    is_signed: false,
    captain_patch: "Keine",
    has_loa: false,
    loa_certificate_images: [],
    loa_certificates_public: false,
    is_photomatch: false,
    photomatch_images: [],
    is_private: false,
    for_sale: false,
    purchase_price: null,
    brand: "",
    size: "",
  };
  
  const [form, setForm] = useState(initialData ? { ...defaultFormData, ...initialData } : defaultFormData);
  const [uploading, setUploading] = useState(false);
  const [multiImageDialogOpen, setMultiImageDialogOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const [editingImage, setEditingImage] = useState(null);
  const [editingImageType, setEditingImageType] = useState(null); // 'main' or index for additional
  const [copyrightDialogOpen, setCopyrightDialogOpen] = useState(false);
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [initialImageCount] = useState(initialData?.additional_images?.length || 0);
  
  const leagueOptions = LEAGUES_BY_SPORT[form.sport_type] || [];
  const LEAGUE_OPTIONS = leagueOptions.map(l => ({ value: l, label: l }));

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
      
      let updateData = {};
      if (editingImageType === 'main') {
        updateData = { image_url: file_url };
        handleChange("image_url", file_url);
      } else if (typeof editingImageType === 'number') {
        const oldImageUrl = form.additional_images[editingImageType];
        const newImages = form.additional_images.filter((_, i) => i !== editingImageType);
        newImages.unshift(file_url);
        updateData = { additional_images: newImages, image_url: file_url };
        handleChange("additional_images", newImages);
        handleChange("image_url", file_url);
      }
      
      // Update jersey directly in DB if we have an ID
      if (initialData?.id && Object.keys(updateData).length > 0) {
        await base44.entities.Jersey.update(initialData.id, updateData);
      }
      
      queryClient.invalidateQueries({ queryKey: ["jerseys"] });
      queryClient.invalidateQueries({ queryKey: ["jersey"] });
      
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
    // Show copyright dialog immediately when images are uploaded
    if (urls.length > 0) {
      setCopyrightDialogOpen(true);
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
        const newImages = [...(form.additional_images || []), ...uploadedUrls];
        handleChange("additional_images", newImages);
        if (newImages.length > 0) {
          handleChange("image_url", newImages[0]);
        }
        // Show copyright dialog immediately
        setCopyrightDialogOpen(true);
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
    
    // Check if new images were added and copyright needs to be agreed
    const currentImageCount = form.additional_images?.length || 0;
    const hasNewImages = currentImageCount > initialImageCount;
    if (hasNewImages && !copyrightAgreed) {
      setCopyrightDialogOpen(true);
      return;
    }
    
    // Validate exactly one jersey type is selected
    const selectedTypes = [form.is_game_worn, form.is_game_issued, form.is_authentic, form.is_fan_jersey].filter(Boolean).length;
    if (selectedTypes !== 1) {
      alert('Bitte wähle genau einen Trikot-Typ aus (Game-Worn, Game-Issued, Authentic oder Fan-Jersey)');
      return;
    }
    
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
              value={form.league === "Sonstige" || !leagueOptions.includes(form.league) ? "Sonstige" : form.league}
              onValueChange={(v) => {
                if (v === "Sonstige") {
                  handleChange("league", "");
                } else {
                  handleChange("league", v);
                }
              }}
              options={LEAGUE_OPTIONS}
              label="Liga wählen"
              placeholder="Liga wählen"
            />
          ) : (
            <Select value={form.league === "Sonstige" || !leagueOptions.includes(form.league) ? "Sonstige" : form.league} onValueChange={(v) => {
              if (v === "Sonstige") {
                handleChange("league", "");
              } else {
                handleChange("league", v);
              }
            }}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Liga wählen" />
              </SelectTrigger>
              <SelectContent>
                {leagueOptions.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {(form.league === "" || (form.league && form.league !== "" && !leagueOptions.includes(form.league))) && (
            <Input
              value={form.league}
              onChange={(e) => handleChange("league", e.target.value)}
              placeholder="Liga eingeben"
              className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50 mt-2"
            />
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
          <Label className="text-white/70 text-sm mb-1.5 block">{form.sport_type === 'soccer' ? 'Trikotnummer' : 'Rückennummer'}</Label>
          <Input
            value={form.player_number}
            onChange={(e) => handleChange("player_number", e.target.value)}
            placeholder={form.sport_type === 'soccer' ? "z.B. 7" : "z.B. 99"}
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
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
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Captain/Alternate Patch</Label>
          {isMobile ? (
            <MobileDrawerSelect
              value={form.captain_patch}
              onValueChange={(v) => handleChange("captain_patch", v)}
              options={CAPTAIN_PATCH_OPTIONS.map(c => ({ value: c, label: c }))}
              label="Patch wählen"
              placeholder="Patch wählen"
            />
          ) : (
            <Select value={form.captain_patch} onValueChange={(v) => handleChange("captain_patch", v)}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue placeholder="Patch wählen" />
              </SelectTrigger>
              <SelectContent>
                {CAPTAIN_PATCH_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Marke/Hersteller</Label>
          <Input
            value={form.brand || ""}
            onChange={(e) => handleChange("brand", e.target.value)}
            placeholder="z.B. Adidas"
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
        </div>
        <div>
          <Label className="text-white/70 text-sm mb-1.5 block">Größe</Label>
          <Input
            value={form.size || ""}
            onChange={(e) => handleChange("size", e.target.value)}
            placeholder="z.B. L, 54, etc."
            className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <div>
          <Label className="text-white/70 text-sm mb-2 block">Trikot-Typ * (Genau einer erforderlich)</Label>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                handleChange("is_game_worn", true);
                handleChange("is_game_issued", false);
                handleChange("is_authentic", false);
                handleChange("is_fan_jersey", false);
              }}
              className={`${form.is_game_worn ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'} transition-colors`}
            >
              {form.sport_type === 'soccer' ? 'Matchworn' : 'Game-Worn'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                handleChange("is_game_worn", false);
                handleChange("is_game_issued", true);
                handleChange("is_authentic", false);
                handleChange("is_fan_jersey", false);
              }}
              className={`${form.is_game_issued ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'} transition-colors`}
            >
              {form.sport_type === 'soccer' ? 'Player Edition' : 'Game-Issued'}
            </Button>
            {form.sport_type !== 'soccer' && (
              <Button
                type="button"
                onClick={() => {
                  handleChange("is_game_worn", false);
                  handleChange("is_game_issued", false);
                  handleChange("is_authentic", true);
                  handleChange("is_fan_jersey", false);
                }}
                className={`${form.is_authentic ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'} transition-colors`}
              >
                Authentic
              </Button>
            )}
            <Button
              type="button"
              onClick={() => {
                handleChange("is_game_worn", false);
                handleChange("is_game_issued", false);
                handleChange("is_authentic", false);
                handleChange("is_fan_jersey", true);
              }}
              className={`${form.is_fan_jersey ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-600 hover:bg-slate-700 text-white'} transition-colors`}
            >
              Fantrikot
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => handleChange("is_signed", !form.is_signed)}
            className={`${form.is_signed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Signiert
          </Button>
          <Button
            type="button"
            onClick={() => handleChange("has_loa", !form.has_loa)}
            className={`${form.has_loa ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Zertifikat (LOA)
          </Button>
          <Button
            type="button"
            onClick={() => handleChange("is_photomatch", !form.is_photomatch)}
            className={`${form.is_photomatch ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Photomatch
          </Button>
        </div>

        {/* Certificate Images Section */}
        {form.has_loa && (
          <div className="space-y-3 p-4 bg-slate-800/30 rounded-lg border border-white/10">
            <Label className="text-white/70 text-sm block">Zertifikat-Bilder (max. 2)</Label>
            <div className="grid grid-cols-2 gap-3">
              {form.loa_certificate_images?.map((url, i) => (
                <div key={i} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border-2 border-white/10 bg-slate-800/50 flex items-center justify-center">
                    {url.toLowerCase().endsWith('.pdf') ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18.5,9L13,3.5V9H18.5M6,20V4H11V10H18V20H6Z" />
                        </svg>
                        <span className="text-white/60 text-xs">PDF</span>
                      </div>
                    ) : (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleChange("loa_certificate_images", form.loa_certificate_images.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-red-600/80 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {(!form.loa_certificate_images || form.loa_certificate_images.length < 2) && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.add('border-cyan-500/60', 'bg-cyan-500/5');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-cyan-500/60', 'bg-cyan-500/5');
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove('border-cyan-500/60', 'bg-cyan-500/5');
                    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/') || f.type === 'application/pdf');
                    if (files.length === 0) return;
                    const currentCount = form.loa_certificate_images?.length || 0;
                    const maxAllowed = 2 - currentCount;
                    const filesToUpload = files.slice(0, maxAllowed);
                    setUploading(true);
                    try {
                      const uploadPromises = filesToUpload.map(file => base44.integrations.Core.UploadFile({ file }));
                      const results = await Promise.all(uploadPromises);
                      const newUrls = results.map(r => r.file_url);
                      handleChange("loa_certificate_images", [...(form.loa_certificate_images || []), ...newUrls]);
                      setCopyrightDialogOpen(true);
                    } catch (error) {
                      alert("Fehler beim Hochladen");
                    } finally {
                      setUploading(false);
                    }
                  }}
                  onClick={() => document.getElementById('cert-upload').click()}
                  className="aspect-square flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <input
                    id="cert-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const { file_url } = await base44.integrations.Core.UploadFile({ file });
                        handleChange("loa_certificate_images", [...(form.loa_certificate_images || []), file_url]);
                        setCopyrightDialogOpen(true);
                      } catch (error) {
                        alert("Fehler beim Hochladen");
                      } finally {
                        setUploading(false);
                      }
                    }}
                  />
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-white/30 mb-1" />
                      <span className="text-[10px] text-white/30">Klicken oder ziehen</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="text-white/70 text-sm">Wie soll das Zertifikat angezeigt werden</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleChange("loa_certificates_public", false)}
                  className={`${!form.loa_certificates_public ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} text-white text-xs`}
                >
                  Privat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleChange("loa_certificates_public", true)}
                  className={`${form.loa_certificates_public ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-700'} text-white text-xs`}
                >
                  Öffentlich
                </Button>
              </div>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            type="button"
            onClick={() => handleChange("is_private", true)}
            className={`${form.is_private ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Privat
          </Button>
          <Button
            type="button"
            onClick={() => handleChange("is_private", false)}
            className={`${!form.is_private ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Öffentlich
          </Button>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => handleChange("for_sale", true)}
            className={`${form.for_sale ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Zum Verkauf
          </Button>
          <Button
            type="button"
            onClick={() => handleChange("for_sale", false)}
            className={`${!form.for_sale ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'} transition-colors`}
          >
            Nicht zum Verkauf
          </Button>
        </div>
      </div>

      {/* Purchase Price */}
      <div>
        <Label className="text-white/70 text-sm mb-1.5 block">Kaufpreis (optional, nur für dich sichtbar)</Label>
        <Input
          type="number"
          step="0.01"
          value={form.purchase_price || ""}
          onChange={(e) => handleChange("purchase_price", e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="z.B. 150.00"
          className="bg-slate-800/50 border-white/10 text-white placeholder:text-white/20 focus:border-cyan-500/50"
        />
      </div>

      {/* Invoice Upload - Only visible if purchase price is set */}
      {form.purchase_price && parseFloat(form.purchase_price) > 0 && (
        <div className="p-4 bg-slate-800/30 rounded-lg border border-white/10">
          <Label className="text-white/70 text-sm mb-2 block">Rechnung hochladen (optional, nur für dich sichtbar)</Label>
          {form.invoice_url ? (
            <div className="relative group">
              <div className="p-4 rounded-lg border-2 border-white/10 bg-slate-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-cyan-400" />
                  <div>
                    <p className="text-white text-sm">Rechnung hochgeladen</p>
                    <p className="text-white/40 text-xs">Klicken zum Anzeigen</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleChange("invoice_url", "")}
                  className="p-2 bg-red-600/80 rounded-full hover:bg-red-700 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => document.getElementById('invoice-upload').click()}
              className="w-full p-6 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors"
            >
              <input
                id="invoice-upload"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    const { file_url } = await base44.integrations.Core.UploadFile({ file });
                    handleChange("invoice_url", file_url);
                  } catch (error) {
                    alert("Fehler beim Hochladen der Rechnung");
                  } finally {
                    setUploading(false);
                  }
                }}
              />
              {uploading ? (
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin mb-2" />
              ) : (
                <Upload className="w-6 h-6 text-white/30 mb-2" />
              )}
              <span className="text-white/40 text-sm">Rechnung hochladen (Bild oder PDF)</span>
            </div>
          )}
        </div>
      )}

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
           disabled={isSubmitting || !form.team || !form.image_url}
           className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 disabled:opacity-50 disabled:cursor-not-allowed"
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
      
      {!copyrightAgreed && !initialData && form.additional_images?.length > 0 && (
        <p className="text-amber-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Bitte bestätige die Urheberrechtsbestätigung, um fortzufahren.
        </p>
      )}
      {!copyrightAgreed && initialData && (form.additional_images?.length || 0) > initialImageCount && (
        <p className="text-amber-400 text-xs flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Bitte bestätige die Urheberrechtsbestätigung für die neuen Bilder.
        </p>
      )}

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

      {/* Copyright Dialog */}
      <CopyrightDialog
        open={copyrightDialogOpen}
        onConfirm={() => {
          setCopyrightAgreed(true);
          setCopyrightDialogOpen(false);
        }}
        onCancel={() => {
          // Remove newly uploaded images if user cancels
          if (initialData) {
            // Restore to initial images
            handleChange("additional_images", initialData.additional_images || []);
            if (initialData.image_url) handleChange("image_url", initialData.image_url);
          } else {
            handleChange("additional_images", []);
            handleChange("image_url", "");
          }
          setCopyrightDialogOpen(false);
        }}
      />
    </form>
  );
}