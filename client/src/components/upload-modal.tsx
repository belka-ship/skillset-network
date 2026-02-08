import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Upload, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  onUploadComplete: (fileUrl: string | null) => void;
}

export function UploadModal({ isOpen, onClose, taskName, onUploadComplete }: UploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setIsUploading(false);
        setProgress(0);
        setIsComplete(false);
        setSelectedFile(null);
      }, 300);
    }
  }, [isOpen]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      const { uploadURL, objectPath } = await api.getUploadUrl();
      
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setIsComplete(true);
          setTimeout(() => {
            onUploadComplete(objectPath);
            onClose();
          }, 1000);
        } else {
          console.error("Upload failed:", xhr.status, xhr.statusText);
          setIsUploading(false);
          setProgress(0);
        }
      });
      
      xhr.addEventListener("error", () => {
        console.error("Upload error");
        setIsUploading(false);
        setProgress(0);
      });
      
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", selectedFile.type);
      xhr.send(selectedFile);
    } catch (error) {
      console.error("Failed to get upload URL:", error);
      setIsUploading(false);
      setProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/90 border border-white/10 text-white sm:max-w-[400px] backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-xl font-medium tracking-tight text-center text-white">Upload Data</DialogTitle>
          <DialogDescription className="text-center text-gray-500 text-sm">
            {taskName}
          </DialogDescription>
        </DialogHeader>

        <div className="w-full">
          {!isUploading && !isComplete ? (
            <div className="space-y-4">
              <div
                className={`
                  group relative overflow-hidden rounded-2xl border border-dashed transition-all duration-500 cursor-pointer h-48 flex flex-col items-center justify-center gap-4
                  ${dragActive ? "border-white bg-white/5" : "border-white/20 hover:border-white/40 hover:bg-white/5"}
                  ${selectedFile ? "border-green-500/50 bg-green-500/5" : ""}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                <div className="text-center space-y-1">
                  {selectedFile ? (
                    <>
                      <p className="text-sm text-green-400 font-medium">File selected</p>
                      <p className="text-xs text-gray-500">{selectedFile.name}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/80 font-medium">Drop file to upload</p>
                      <p className="text-xs text-gray-500">MP4 or MOV</p>
                    </>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                onClick={handleUpload}
                disabled={!selectedFile}
                className="w-full bg-white text-black hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 rounded-full py-2 px-4 font-medium transition-all duration-300"
                data-testid="button-submit-upload"
              >
                {selectedFile ? "Upload Video" : "Select a video first"}
              </Button>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-6">
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="p-4 rounded-full bg-white text-black">
                      <Check className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-white">Upload Complete</span>
                  </motion.div>
                ) : (
                  <div className="w-full max-w-[200px] space-y-4">
                    <div className="flex items-center justify-center gap-3 text-sm text-white/80">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                    <Progress value={progress} className="h-1 bg-white/10" />
                    <p className="text-center text-xs text-gray-500 font-mono">{progress}%</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
