import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, Check, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageUrl) {
      loadAndDrawImage();
    }
  }, [imageUrl]);

  useEffect(() => {
    if (imageRef.current) {
      drawImage();
    }
  }, [rotation]);

  const loadAndDrawImage = async () => {
    if (!imageUrl) return;
    
    setLoading(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      imageRef.current = img;
      setLoading(false);
      setTimeout(() => drawImage(), 50);
    };
    
    img.onerror = () => {
      // Fallback: try loading without crossOrigin
      const img2 = new Image();
      img2.onload = () => {
        imageRef.current = img2;
        setLoading(false);
        setTimeout(() => drawImage(), 50);
      };
      img2.onerror = () => {
        setLoading(false);
        alert("Fehler beim Laden des Bildes");
      };
      img2.src = imageUrl;
    };
    
    img.src = imageUrl;
  };

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    // For 90 degree rotations, swap width and height
    if (rotation === 90 || rotation === 270) {
      canvas.width = img.height;
      canvas.height = img.width;
    } else {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const handleRotate = (degrees) => {
    setRotation((prev) => {
      const newRotation = (prev + degrees) % 360;
      return newRotation < 0 ? newRotation + 360 : newRotation;
    });
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    
    setSaving(true);
    
    try {
      const blob = await new Promise((resolve) => {
        canvasRef.current.toBlob(resolve, "image/jpeg", 0.92);
      });
      
      if (blob) {
        const file = new File([blob], "rotated-image.jpg", { type: "image/jpeg" });
        await onSave(file);
      }
    } catch (error) {
      console.error("Error saving image:", error);
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          // Prevent closing when clicking on backdrop
          if (e.target === e.currentTarget && !saving) {
            onCancel();
          }
        }}
      >
        <div className="w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Bild bearbeiten</h3>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCancel();
                }}
                type="button"
                className="p-2 text-white/40 hover:text-white/70 transition-colors active:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Preview */}
            <div className="p-6 flex items-center justify-center bg-slate-950/50 min-h-[300px] max-h-[60vh] overflow-auto">
              {loading ? (
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              ) : (
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-full rounded-lg shadow-2xl"
                />
              )}
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRotate(-90);
                  }}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || saving}
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10 active:bg-white/20"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  90° Links
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRotate(90);
                  }}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading || saving}
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10 active:bg-white/20"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  90° Rechts
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onCancel();
                  }}
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  className="text-white/50 hover:text-white hover:bg-white/5"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSave();
                  }}
                  type="button"
                  size="sm"
                  disabled={saving || loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Wird gespeichert...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Speichern
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Rotation indicator */}
            {rotation !== 0 && (
              <div className="px-6 py-2 bg-cyan-500/10 border-t border-cyan-500/20 text-center">
                <p className="text-cyan-400 text-xs">
                  Gedreht: {rotation}°
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}