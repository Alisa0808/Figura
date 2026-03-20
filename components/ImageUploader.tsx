import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { UploadCloud, Camera } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void;
  maleCount: number;
  femaleCount: number;
  onMaleCountChange: (count: number) => void;
  onFemaleCountChange: (count: number) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageSelected,
  maleCount,
  femaleCount,
  onMaleCountChange,
  onFemaleCountChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [cameraAspectRatio, setCameraAspectRatio] = useState("1:1");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    setShowCamera(true);
    
    try {
      // First try environment camera (rear camera on mobile)
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
      } catch (err) {
        // Fallback to any available video source (e.g. laptop webcam)
        console.log("Environment camera not found, falling back to default.", err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please check permissions or ensure a camera is connected.");
    }
  };

  const resizeImage = (dataUrl: string, type: string) => {
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const resizedDataUrl = canvas.toDataURL(type, 0.85);
        const base64 = resizedDataUrl.split(',')[1];
        onImageSelected(base64, type);
      }
    };
    img.src = dataUrl;
  };

  const handleCapture = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const videoRatio = vw / vh;
      
      let targetRatio = 1;
      const [w, h] = cameraAspectRatio.split(':').map(Number);
      if (w && h) targetRatio = w / h;

      let cropWidth = vw;
      let cropHeight = vh;

      if (videoRatio > targetRatio) {
        cropWidth = vh * targetRatio;
      } else {
        cropHeight = vw / targetRatio;
      }

      const finalWidth = cropWidth / cameraZoom;
      const finalHeight = cropHeight / cameraZoom;

      const startX = (vw - finalWidth) / 2;
      const startY = (vh - finalHeight) / 2;

      // Limit max dimensions for the capture canvas to prevent OOM on mobile
      const MAX_DIMENSION = 1024;
      let targetCanvasWidth = cropWidth;
      let targetCanvasHeight = cropHeight;

      if (targetCanvasWidth > targetCanvasHeight) {
        if (targetCanvasWidth > MAX_DIMENSION) {
          targetCanvasHeight *= MAX_DIMENSION / targetCanvasWidth;
          targetCanvasWidth = MAX_DIMENSION;
        }
      } else {
        if (targetCanvasHeight > MAX_DIMENSION) {
          targetCanvasWidth *= MAX_DIMENSION / targetCanvasHeight;
          targetCanvasHeight = MAX_DIMENSION;
        }
      }

      canvas.width = targetCanvasWidth;
      canvas.height = targetCanvasHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, startX, startY, finalWidth, finalHeight, 0, 0, targetCanvasWidth, targetCanvasHeight);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.split(',')[1];
        onImageSelected(base64, 'image/jpeg');
        stopCameraStream();
        setShowCamera(false);
      }
    }
  };

  const handleCancelCamera = () => {
    stopCameraStream();
    setShowCamera(false);
    setCameraError(null);
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        resizeImage(result, file.type);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col">
        {cameraError ? (
            <div className="text-white text-center p-6 space-y-4">
                <p className="text-[#e07a5f]">{cameraError}</p>
                <Button onClick={handleCancelCamera} variant="secondary">Close</Button>
            </div>
        ) : (
            <>
                {/* Top Controls Bar */}
                <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
                  <button
                      onClick={handleCancelCamera}
                      className="text-white px-4 py-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all font-medium text-sm"
                      type="button"
                  >
                      Cancel
                  </button>

                  {/* Aspect Ratio Selector - Compact */}
                  <div className="flex gap-1.5 bg-white/10 p-1 rounded-full backdrop-blur-md">
                    {["1:1", "4:3", "16:9", "3:4", "9:16"].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setCameraAspectRatio(ratio)}
                        className={`px-2.5 py-1 text-[10px] font-semibold rounded-full transition-colors ${cameraAspectRatio === ratio ? 'bg-white text-black' : 'text-white/80 hover:bg-white/20'}`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>

                  <div className="w-[72px]"></div> {/* Spacer for balance */}
                </div>

                {/* Camera Preview - Full Screen */}
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <div
                      className="relative overflow-hidden w-full h-full flex items-center justify-center"
                    >
                      <video
                          ref={videoRef}
                          className="w-full h-full object-cover origin-center"
                          style={{
                            transform: `scale(${cameraZoom})`,
                            aspectRatio: cameraAspectRatio.replace(':', '/')
                          }}
                          playsInline
                          muted
                          autoPlay
                      />
                    </div>

                    {/* Zoom Control - Side Vertical */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 bg-black/40 px-2 py-4 rounded-full backdrop-blur-md">
                      <span className="text-white text-[10px] font-medium">3x</span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.1"
                        value={cameraZoom}
                        onChange={(e) => setCameraZoom(parseFloat(e.target.value))}
                        className="accent-white h-32 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        style={{
                          writingMode: 'vertical-lr',
                          direction: 'rtl'
                        }}
                      />
                      <span className="text-white text-[10px] font-medium">1x</span>
                    </div>
                </div>

                {/* Bottom Capture Button */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  <button
                      onClick={handleCapture}
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-white/20 hover:bg-white/40 transition-all shadow-lg"
                      aria-label="Take photo"
                      type="button"
                  >
                      <div className="w-16 h-16 bg-white rounded-full"></div>
                  </button>
                </div>
            </>
        )}
      </div>
    );
  }

  return (
    <div className="transition-all duration-300">
      
      {/* Dropzone Area */}
      <div 
        className={`relative overflow-hidden border-2 border-dashed rounded-[16px] px-6 py-12 text-center transition-all duration-300 flex flex-col items-center justify-center group ${
          isDragging 
            ? 'border-[#4a7c59] bg-[#e8f0d8] scale-[0.99]' 
            : 'border-[#c8d8b0] hover:border-[#a8c878] bg-[#f0f4e8] hover:bg-[#e8f0d8]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          accept="image/*"
          onChange={handleFileInput}
        />
        
        <div className="w-16 h-16 bg-white border border-[#d8e4c0] rounded-2xl flex items-center justify-center mb-5 shadow-sm rotate-3 transition-transform group-hover:rotate-6">
          <UploadCloud className="w-7 h-7 text-[#4a7c59]" />
        </div>
        
        <h3 className="text-[17px] font-medium text-[#2d3a1e] mb-2">
          Drop a photo of your scene
        </h3>
        <p className="text-[14px] font-light text-[#5a6e48] mb-8 max-w-xs mx-auto">
          JPG, PNG or HEIC &middot; any location works
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="px-6 py-2.5 bg-[#4a7c59] text-white text-[14px] font-medium rounded-full hover:bg-[#3d6649] transition-colors shadow-sm w-full sm:w-auto"
          >
            Browse Files
          </button>
          <button 
            onClick={startCamera} 
            className="px-6 py-2.5 bg-white text-[#4a7c59] border border-[#c8d8b0] text-[14px] font-medium rounded-full hover:bg-[#f0f4e8] transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Camera className="w-4 h-4" />
            Take Photo
          </button>
        </div>
      </div>

      {/* Subjects Configuration */}
      <div className="mt-8 pt-6 border-t border-[#d8e4c0]">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[13px] font-medium tracking-[0.05em] uppercase text-[#2d3a1e]">Subjects</h4>
          <span className="text-[12px] font-light text-[#5a6e48] bg-[#f0f4e8] px-2.5 py-1 rounded-full">Max 5 total</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Male Counter */}
          <div className="flex items-center justify-between bg-[#faf6ee] px-4 py-3 rounded-[12px] border border-[#d8e4c0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#e8f0f8] flex items-center justify-center border border-[#cce0f0]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#7baacc]"></div>
              </div>
              <span className="text-[#2d3a1e] text-[15px] font-medium">Male</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg border border-[#d8e4c0] p-1 shadow-sm">
              <button 
                onClick={(e) => { e.stopPropagation(); maleCount > 0 && onMaleCountChange(maleCount - 1); }}
                disabled={maleCount === 0 || (maleCount === 1 && femaleCount === 0)}
                className="w-7 h-7 rounded-md text-[#5a6e48] flex items-center justify-center hover:bg-[#f0f4e8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
              </button>
              <span className="w-4 text-center text-[#2d3a1e] font-semibold text-[14px]">{maleCount}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); maleCount + femaleCount < 5 && onMaleCountChange(maleCount + 1); }}
                disabled={maleCount + femaleCount >= 5}
                className="w-7 h-7 rounded-md text-[#5a6e48] flex items-center justify-center hover:bg-[#f0f4e8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>
          </div>
          
          {/* Female Counter */}
          <div className="flex items-center justify-between bg-[#faf6ee] px-4 py-3 rounded-[12px] border border-[#d8e4c0]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#fdf0ed] flex items-center justify-center border border-[#f8d8d0]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e07a5f]"></div>
              </div>
              <span className="text-[#2d3a1e] text-[15px] font-medium">Female</span>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-lg border border-[#d8e4c0] p-1 shadow-sm">
              <button 
                onClick={(e) => { e.stopPropagation(); femaleCount > 0 && onFemaleCountChange(femaleCount - 1); }}
                disabled={femaleCount === 0 || (femaleCount === 1 && maleCount === 0)}
                className="w-7 h-7 rounded-md text-[#5a6e48] flex items-center justify-center hover:bg-[#f0f4e8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
              </button>
              <span className="w-4 text-center text-[#2d3a1e] font-semibold text-[14px]">{femaleCount}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); maleCount + femaleCount < 5 && onFemaleCountChange(femaleCount + 1); }}
                disabled={maleCount + femaleCount >= 5}
                className="w-7 h-7 rounded-md text-[#5a6e48] flex items-center justify-center hover:bg-[#f0f4e8] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};