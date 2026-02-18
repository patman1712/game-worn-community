import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { api } from '@/api/apiClient';
import { useTranslation } from 'react-i18next';

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

export default function MultiImageUploadDialog({ open, onOpenChange, onImagesUploaded }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({});
  const [completed, setCompleted] = useState([]);
  const fileInputRef = React.useRef(null);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  React.useEffect(() => {
    if (open && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [open]);

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
        setProgress((prev) => ({ ...prev, [i]: 30 }));

        const compressed = await compressImage(files[i], 1000);
        setProgress((prev) => ({ ...prev, [i]: 60 }));

        let retries = 2;
        let uploaded = false;
        
        while (retries > 0 && !uploaded) {
          try {
            const { file_url } = await api.integrations.Core.UploadFile({ file: compressed });
            uploadedUrls.push(file_url);
            uploaded = true;
            setProgress((prev) => ({ ...prev, [i]: 100 }));
            setCompleted((prev) => [...prev, i]);
          } catch (uploadError) {
            retries--;
            if (retries === 0) {
              throw uploadError;
            }
            await new Promise(r => setTimeout(r, 800));
          }
        }
      } catch (error) {
        console.error(`Error uploading file ${i}:`, error);
        setProgress((prev) => ({ ...prev, [i]: -1 }));
      }
    }

    setUploading(false);
    onImagesUploaded(uploadedUrls);

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
          <DialogTitle className="text-white">{t('upload.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Hidden file input - always present */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* File selection */}
          {!uploading && files.length === 0 && (
            <label className="flex flex-col items-center justify-center w-full p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-cyan-500/40 bg-slate-800/50 cursor-pointer transition-colors"
              onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-white/30 mb-2" />
              <span className="text-white/40 text-sm">{t('upload.clickOrDrop')}</span>
            </label>
          )}

          {/* Selected files */}
          {files.length > 0 && !uploading && (
            <div className="space-y-2">
              <p className="text-white/70 text-sm">
                {t('upload.selected', {count: files.length})}
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
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 rounded-lg border border-dashed border-white/10 hover:border-cyan-500/30 cursor-pointer transition-colors"
              >
                <span className="text-white/40 text-sm">{t('upload.addMore')}</span>
              </button>
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
                {t('upload.uploadButton', {count: files.length})}
              </Button>
            )}
            <Button
              onClick={() => onOpenChange(false)}
              variant="ghost"
              className="flex-1 text-white/50 hover:text-white hover:bg-white/5"
              disabled={uploading}
            >
              {uploading ? t('upload.uploading') : t('upload.close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}