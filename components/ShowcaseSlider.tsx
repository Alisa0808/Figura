import React, { useState } from 'react';

interface ShowcaseSliderProps {
  before: string;
  after: string;
  title: string;
  description: string;
}

export const ShowcaseSlider: React.FC<ShowcaseSliderProps> = ({ before, after, title, description }) => {
  const [revealPercentage, setRevealPercentage] = useState(50);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setRevealPercentage(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setRevealPercentage(percentage);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-white">{title}</h4>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <div 
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-col-resize select-none bg-zinc-900 border border-zinc-800 shadow-xl group"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {/* Background (After) */}
        <img 
          src={after} 
          alt="After" 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Foreground (Before - Clipped) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `polygon(0 0, ${revealPercentage}% 0, ${revealPercentage}% 100%, 0 100%)` }}
        >
          <img 
            src={before} 
            alt="Before" 
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Divider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center"
          style={{ left: `${revealPercentage}%` }}
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center -ml-[12px] opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-medium text-white border border-white/10 pointer-events-none">
          Original
        </div>
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-medium text-black border border-white/20 pointer-events-none">
          PosePilot
        </div>
      </div>
    </div>
  );
};
