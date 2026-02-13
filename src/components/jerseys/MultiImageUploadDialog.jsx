import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize if too large
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

        // Compress to target size (1000kb = 1MB)
        let quality = 0.9;
        let compressed;
        
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob.size > 1000 * 1024 && quality > 0.1) {
                quality -= 0.1;
                tryCompress();
              } else {
                resolve(new File([blob], file.name, { type: "image/jpeg" }));
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryCompress();
      };
    };
  });
};

export default function MultiImageUploadDialog({ open, onOpenChange, onImagesUploaded }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState([]);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress({});
    setCompleted([]);

    const uploadedUrls = [];

    for (let i = 0; i < files.length; i++) {
      try {
        setProgress((prev) => ({ ...prev, [i]: 50 }));

        // Compress image
        const compressed = await compressImage(files[i]);
        setProgress((prev) => ({ ...prev, [i]: 80 }));

        // Upload
        const { file_url } = await base44.integrations.Core.UploadFile({ file: compressed });
        uploadedUrls.push(file_url);

        setProgress((prev) => ({ ...prev, [i]: 100 }));
        setCompleted((prev) => [...prev, i]);
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error);
        setProgress((prev) => ({ ...prev, [i]: -1 }));
      }
    }

    setUploading(false);
    onImagesUploaded(uploadedUrls);

    // Reset after 2 seconds
    setTimeout(() => {
      setFiles([]);
      setProgress({});
      setCompleted([]);
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-white/10 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Mehrere Bilder hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File selection */}
          {!uploading && files.length === 0 && (
            <label className="flex flex-col items-center justify-center w-full p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors">
              <Upload className="w-8 h-8 text-white/30 mb-2" />
              <span className="text-white/40 text-sm">Klicke oder ziehe Bilder hier hin</span>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          )}

          {/* Selected files */}
          {files.length > 0 && !uploading && (
            <div className="space-y-2">
              <p className="text-white/70 text-sm">
                {files.length} Bild{files.length !== 1 ? "er" : ""} ausgewählt
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-white/5">
                    <span className="text-white/70 text-sm truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-white/40" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="flex items-center justify-center w-full p-3 rounded-lg border border-dashed border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors">
                <span className="text-white/40 text-sm">+ Weitere hinzufügen</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="space-y-3">
              {files.map((file, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/60 text-xs truncate">{file.name}</span>
                    <span className="text-white/40 text-xs">
                      {progress[i] === 100 ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : progress[i] === -1 ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : (
                        `${progress[i] || 0}%`
                      )}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        progress[i] === -1
                          ? "bg-red-500"
                          : "bg-gradient-to-r from-cyan-500 to-blue-600"
                      }`}
                      style={{ width: `${Math.max(0, progress[i] || 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!uploading && files.length > 0 && (
              <Button
                onClick={handleUpload}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                {files.length} Bild{files.length !== 1 ? "er" : ""} hochladen
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="flex-1 text-white/50 hover:text-white hover:bg-white/5"
              disabled={uploading}
            >
              {uploading ? "Wird hochgeladen..." : "Schließen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}