import React, { useState } from 'react';

interface ComparisonViewProps {
  original: string;
  processed: string;
  aspectRatio: string; // e.g. "16:9" or "width:height"
  onDownload: () => void;
  onReset: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ original, processed, aspectRatio, onDownload, onReset }) => {
  const [revealPercentage, setRevealPercentage] = useState(50);
  const [isHovering, setIsHovering] = useState(false);

  // Parse aspect ratio string to numeric value
  const [w, h] = aspectRatio.split(':').map(Number);
  const ratioValue = w / h;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setRevealPercentage(percentage);
  };

  return (
    <div className="space-y-6">
      <div 
        className="relative w-full rounded-xl overflow-hidden cursor-col-resize select-none bg-[#fffdf7] border border-[#d8e4c0] shadow-sm"
        style={{ aspectRatio: ratioValue || '4/3' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left;
          const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
          setRevealPercentage(percentage);
        }}
      >
        {/* Re-implementing clearer slider logic */}
        <div 
            className="absolute inset-0 w-full h-full pointer-events-none"
        >
             {/* Original Layer */}
             <div 
                className="absolute inset-0 h-full bg-[#fffdf7]"
                style={{ clipPath: `polygon(0 0, ${revealPercentage}% 0, ${revealPercentage}% 100%, 0 100%)` }}
             >
                <img 
                    src={original} 
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Original"
                />
             </div>
             
             {/* Processed Layer */}
             <div 
                className="absolute inset-0 h-full"
                style={{ clipPath: `polygon(${revealPercentage}% 0, 100% 0, 100% 100%, ${revealPercentage}% 100%)` }}
             >
                 <img 
                    src={processed} 
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Processed"
                />
             </div>

             {/* Handle */}
             <div 
                className="absolute top-0 bottom-0 w-0.5 bg-[#fffdf7] shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
                style={{ left: `${revealPercentage}%` }}
             >
                <div className="w-8 h-8 rounded-full bg-[#fffdf7] shadow-lg flex items-center justify-center -ml-[15px]">
                    <svg className="w-4 h-4 text-[#2d3a1e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
                    </svg>
                </div>
             </div>
        </div>

        <div className="absolute top-4 left-4 bg-[#fffdf7]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-[#2d3a1e] border border-[#c8d8b0]">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-[#4a7c59]/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white border border-[#4a7c59]">
          Figura
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button 
            onClick={onReset}
            className="text-sm text-[#5a6e48] hover:text-[#4a7c59] transition-colors flex items-center gap-2"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Upload New Photo
        </button>
        <div className="flex-1"></div>
        <button 
            onClick={onDownload}
            className="px-6 py-3 bg-[#4a7c59] text-white rounded-full font-medium hover:bg-[#3a6246] transition-colors flex items-center gap-2 shadow-sm"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Result
        </button>
      </div>
    </div>
  );
};