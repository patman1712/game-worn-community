import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCw, RotateCcw, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ImageEditor({ imageUrl, onSave, onCancel }) {
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (imageUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        imageRef.current = img;
        drawImage();
      };
      img.src = imageUrl;
    }
  }, [imageUrl, rotation]);

  const drawImage = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;

    // Calculate new dimensions based on rotation
    const angle = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(angle));
    const cos = Math.abs(Math.cos(angle));
    
    const newWidth = img.width * cos + img.height * sin;
    const newHeight = img.width * sin + img.height * cos;

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.clearRect(0, 0, newWidth, newHeight);
    ctx.save();
    ctx.translate(newWidth / 2, newHeight / 2);
    ctx.rotate(angle);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
  };

  const handleRotate = (degrees) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob((blob) => {
      const file = new File([blob], "rotated-image.jpg", { type: "image/jpeg" });
      onSave(file, rotation);
    }, "image/jpeg", 0.95);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div className="w-full max-w-2xl">
          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Bild bearbeiten</h3>
              <button
                onClick={onCancel}
                className="p-2 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Preview */}
            <div className="p-6 flex items-center justify-center bg-slate-950/50 min-h-[300px] max-h-[60vh] overflow-auto">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full rounded-lg shadow-2xl"
                style={{ transform: `rotate(0deg)` }}
              />
            </div>

            {/* Controls */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRotate(-90)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  90° Links
                </Button>
                <Button
                  onClick={() => handleRotate(90)}
                  variant="outline"
                  size="sm"
                  className="bg-white/5 text-white border-white/10 hover:bg-white/10"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  90° Rechts
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                  className="text-white/50 hover:text-white hover:bg-white/5"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSave}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Speichern
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