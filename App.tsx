import React, { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { ImageUploader } from './components/ImageUploader';
import { ComparisonView } from './components/ComparisonView';
import { generateLineArtCharacter } from './services/atlasService';
import { AppState, ModelType, ProcessedImage } from './types';
import { ChevronDown, Eye, EyeOff, Check, Github } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.NANO_BANANA_PRO);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>("1:1");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userApiKey, setUserApiKey] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isKeyApplied, setIsKeyApplied] = useState<boolean>(false);
  const [maleCount, setMaleCount] = useState<number>(0);
  const [femaleCount, setFemaleCount] = useState<number>(1);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [history, setHistory] = useState<ProcessedImage[]>(() => {
    try {
      const saved = localStorage.getItem('figura_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
      return [];
    }
  });

  const handleImageSelected = async (base64: string, mimeType: string) => {
    const fullDataUri = `data:${mimeType};base64,${base64}`;
    setOriginalImage(fullDataUri);
    setAppState(AppState.PROCESSING);
    setErrorMsg(null);

    try {
      // 1. Calculate dimensions to find closest aspect ratio
      const getImageDimensions = (src: string): Promise<{width: number, height: number}> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = reject;
          img.src = src;
        });
      };

      const { width, height } = await getImageDimensions(fullDataUri);
      
      // Calculate closest supported aspect ratio
      const getClosestRatio = (w: number, h: number): string => {
        const ratio = w / h;
        const targets = [
          { name: "1:1", val: 1 },
          { name: "3:4", val: 3/4 },
          { name: "4:3", val: 4/3 },
          { name: "9:16", val: 9/16 },
          { name: "16:9", val: 16/9 }
        ];
        const closest = targets.reduce((prev, curr) => 
          Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
        );
        return closest.name;
      };

      const ratioStr = getClosestRatio(width, height);
      setAspectRatio(ratioStr);
      
      console.log(`Detected Ratio: ${width}:${height} -> Snapped to: ${ratioStr}`);

      const result = await generateLineArtCharacter(fullDataUri, mimeType, ratioStr, selectedModel, userApiKey, maleCount, femaleCount);
      setProcessedImage(result);
      setAppState(AppState.SUCCESS);
      
      const newHistoryItem: ProcessedImage = {
        id: Date.now().toString(),
        original: fullDataUri,
        processed: result,
        timestamp: Date.now()
      };
      setHistory(prev => {
        const updated = [newHistoryItem, ...prev].slice(0, 3);
        try {
          localStorage.setItem('figura_history', JSON.stringify(updated));
        } catch (e) {
          console.warn('Failed to save history to localStorage', e);
        }
        return updated;
      });
    } catch (error: any) {
      console.error(error);
      setAppState(AppState.ERROR);
      
      let msg = "Failed to process image. Please try again.";
      
      if (error.message) {
        if (error.message.includes('429')) {
          if (error.message.includes('Resource exhausted') || error.message.includes('quota')) {
            msg = "The shared Atlas Cloud API key has reached its limit. Please provide your own API key in the settings below to continue using the app.";
          } else {
            msg = "You have reached the 3-time free trial limit. Please provide your own Atlas Cloud API key to continue.";
          }
        } else if (error.message.includes('403')) {
          msg = "Permission denied. Please check your API key permissions.";
        } else if (error.message.includes('401')) {
          msg = "The server is not configured with an API key. Please provide your own to continue.";
        } else if (error.message.includes('Failed to fetch')) {
          msg = "Network error: Could not connect to the generation server. Please check your internet connection or try again later.";
        } else {
          // If it's a custom error from our service, it might already have a good message
          msg = error.message;
        }
      }
      
      setErrorMsg(msg);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'figura-composition.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#faf6ee] text-[#2d3a1e] selection:bg-[#c8d8b0] selection:text-[#2d3a1e] flex flex-col">
      {/* Header */}
      <header className="border-b-[1.5px] border-[#d8e4c0] bg-[#fffdf7] sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 shrink-0" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="22" fill="#4a7c59"></rect>
              <path d="M14 80 Q50 12 86 36" strokeWidth="22" fill="none" strokeLinecap="round" stroke="#3a6048"></path>
              <circle cx="54" cy="26" r="9" fill="#e8f0dc"></circle>
              <line x1="54" y1="35" x2="54" y2="64" strokeWidth="5" strokeLinecap="round" stroke="#e8f0dc" fill="none"></line>
              <line x1="54" y1="46" x2="70" y2="36" strokeWidth="4.5" strokeLinecap="round" stroke="#e8f0dc" fill="none"></line>
              <line x1="54" y1="46" x2="40" y2="54" strokeWidth="4.5" strokeLinecap="round" stroke="#e8f0dc" fill="none"></line>
              <line x1="54" y1="64" x2="44" y2="82" strokeWidth="4.5" strokeLinecap="round" stroke="#e8f0dc" fill="none"></line>
              <line x1="54" y1="64" x2="66" y2="81" strokeWidth="4.5" strokeLinecap="round" stroke="#e8f0dc" fill="none"></line>
            </svg>
            <span className="font-playfair font-semibold text-lg sm:text-xl tracking-tight text-[#2d3a1e]">Figura</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#fffdf7] text-[#4a7c59] text-xs sm:text-sm font-medium rounded-full border border-[#c8d8b0] hover:bg-[#f0f4e8] transition-all whitespace-nowrap shadow-sm"
              >
                <span className="text-[#e8b520]">🍌</span>
                <span className="hidden sm:inline">{selectedModel === ModelType.NANO_BANANA_PRO ? 'Nano Banana Pro' : 'Nano Banana 2'}</span>
                <span className="sm:hidden">{selectedModel === ModelType.NANO_BANANA_PRO ? 'Pro' : 'V2'}</span>
                <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#fffdf7] border border-[#d8e4c0] rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <button
                    onClick={() => {
                      setSelectedModel(ModelType.NANO_BANANA_PRO);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[#f0f4e8] transition-colors flex items-center gap-2 ${
                      selectedModel === ModelType.NANO_BANANA_PRO ? 'text-[#4a7c59] font-medium bg-[#f0f4e8]' : 'text-[#5a6e48]'
                    }`}
                  >
                    <span className="text-[#e8b520]">🍌</span>
                    Nano Banana Pro
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModel(ModelType.NANO_BANANA_2);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[#f0f4e8] transition-colors flex items-center gap-2 ${
                      selectedModel === ModelType.NANO_BANANA_2 ? 'text-[#4a7c59] font-medium bg-[#f0f4e8]' : 'text-[#5a6e48]'
                    }`}
                  >
                    <span className="text-[#e8b520]">🍌</span>
                    Nano Banana 2
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#fffdf7] text-[#4a7c59] text-xs sm:text-sm font-medium rounded-full border border-[#c8d8b0] hover:bg-[#f0f4e8] transition-all whitespace-nowrap shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
              History
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full">
        
        {showHistory ? (
          <div className="max-w-5xl mx-auto px-6 py-12 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-playfair text-[#2d3a1e]">Generation History</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-[#fffdf7] text-[#4a7c59] text-sm font-medium rounded-full border border-[#c8d8b0] hover:bg-[#f0f4e8] transition-all shadow-sm"
              >
                Back to Generator
              </button>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-20 bg-[#fffdf7] border border-[#d8e4c0] rounded-2xl">
                <p className="text-[#5a6e48]">No generation history yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map((item) => (
                  <div key={item.id} className="bg-[#fffdf7] border border-[#d8e4c0] rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="relative aspect-square bg-[#faf6ee]">
                      <img src={item.processed} alt="Generated" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="p-4 flex items-center justify-between bg-[#fffdf7] border-t border-[#d8e4c0]">
                      <div className="text-xs text-[#5a6e48]">
                        {new Date(item.timestamp).toLocaleString()}
                      </div>
                      <button 
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = item.processed;
                          link.download = `figura-${item.id}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-2 bg-[#f0f4e8] hover:bg-[#e0ecd0] text-[#4a7c59] rounded-lg transition-colors border border-[#c8d8b0]"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Intro (Only show if not success) */}
            {appState !== AppState.SUCCESS && (
              <div className="bg-[#f0f4e8] pb-8 pt-12 relative overflow-hidden">
                {/* Top decorative strip */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1 opacity-75"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(to right, #e8b520 0, #e8b520 32px, #7baacc 32px, #7baacc 64px, #a8c878 64px, #a8c878 96px, #e07a5f 96px, #e07a5f 128px, #c8a8d8 128px, #c8a8d8 160px)'
                  }}
                ></div>

                <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-[1px] w-8 bg-[#7baacc]"></div>
                    <span className="text-[11px] font-medium tracking-[0.1em] uppercase text-[#7baacc]">AI Pose Studio</span>
                    <div className="h-[1px] w-8 bg-[#7baacc]"></div>
                  </div>
                  
                  <h1 className="text-[32px] sm:text-[42px] leading-[1.15] tracking-[-0.01em] font-playfair text-[#2d3a1e] whitespace-nowrap">
                    Find Your <span className="italic text-[#4a7c59]">Perfect Pose</span>
                  </h1>
                  
                  <p className="text-[15px] leading-[1.8] text-[#5a6e48] max-w-xl mx-auto font-light">
                    Upload a photo of any location, and let AI sketch the perfect pose for your environment.
                  </p>
                </div>
              </div>
            )}

            {/* Decorative dab row */}
            {appState !== AppState.SUCCESS && (
              <div className="flex justify-center gap-4 py-4 opacity-60">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e8b520]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#7baacc]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#a8c878]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#e07a5f]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#c8a8d8]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#e8b520]"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-[#7baacc]"></div>
              </div>
            )}

            {/* State Machine UI */}
            <div className="max-w-3xl mx-auto px-6 pb-8">
              
              {appState === AppState.IDLE && (
                <div className="animate-in fade-in zoom-in duration-500">
                  <ImageUploader 
                    onImageSelected={handleImageSelected} 
                    maleCount={maleCount}
                    femaleCount={femaleCount}
                    onMaleCountChange={setMaleCount}
                    onFemaleCountChange={setFemaleCount}
                  />
                </div>
              )}

              {appState === AppState.PROCESSING && (
                <div className="bg-[#fffdf7] border border-[#d8e4c0] rounded-2xl p-12 text-center space-y-6 animate-pulse shadow-sm">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border-4 border-[#d8e4c0] rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#4a7c59] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-playfair text-[#2d3a1e]">Analyzing Geometry</h3>
                    <p className="text-[15px] font-light text-[#5a6e48] mt-2">Identifying perspective lines, light sources, and seating areas...</p>
                  </div>
                </div>
              )}

              {appState === AppState.ERROR && (
                 <div className="bg-[#fffdf7] border border-[#e07a5f]/30 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                    <div className="w-12 h-12 bg-[#e07a5f]/10 text-[#e07a5f] rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-[17px] font-playfair text-[#2d3a1e]">Generation Failed</h3>
                    <p className="text-[15px] font-light text-[#5a6e48]">{errorMsg}</p>
                    
                    {(errorMsg?.includes('limit') || errorMsg?.includes('configured')) && (
                      <div className="mt-6 p-6 bg-[#faf6ee] rounded-xl border border-[#d8e4c0] text-left space-y-3 max-w-md mx-auto">
                        <label className="block text-[15px] font-light text-[#2d3a1e]">
                          Enter your Atlas Cloud API Key to continue:
                        </label>
                        <div className="flex items-center bg-[#fffdf7] border border-[#c8d8b0] rounded-[10px] overflow-hidden shadow-sm">
                          <input 
                            type={showApiKey ? "text" : "password"}
                            value={userApiKey}
                            onChange={(e) => {
                              setUserApiKey(e.target.value);
                              setIsKeyApplied(false);
                            }}
                            placeholder="apikey-..."
                            className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] font-light text-[#2d3a1e] focus:outline-none placeholder:text-[#a8c878]"
                          />
                          <button 
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-2 sm:p-3 text-[#a8c878] hover:text-[#4a7c59] transition-colors shrink-0"
                            title={showApiKey ? "Hide API Key" : "Show API Key"}
                          >
                            {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button
                            onClick={() => {
                              if (userApiKey.trim()) setIsKeyApplied(true);
                            }}
                            className={`px-2 sm:px-4 py-3 font-medium text-[12px] sm:text-[14px] transition-colors border-l border-[#c8d8b0] shrink-0 ${
                              isKeyApplied 
                                ? 'bg-[#f0f4e8] text-[#4a7c59]' 
                                : 'bg-[#faf6ee] text-[#5a6e48] hover:bg-[#f0f4e8]'
                            }`}
                          >
                            {isKeyApplied ? (
                              <span className="flex items-center gap-1"><Check size={16} /><span className="hidden sm:inline">Applied</span><span className="sm:hidden">OK</span></span>
                            ) : (
                              'Apply'
                            )}
                          </button>
                        </div>
                        <p className="text-[13px] font-light text-[#5a6e48]">
                          Get your API key from <a href="https://www.atlascloud.ai/console/api-keys?ref=F27PTG&utm_source=figura" target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] hover:underline">Atlas Cloud Console</a>.
                        </p>
                      </div>
                    )}

                    <button 
                      onClick={handleReset}
                      className="mt-6 px-6 py-3 bg-[#4a7c59] text-white font-medium rounded-full hover:bg-[#3a6246] transition-colors"
                    >
                      Try Again
                    </button>
                 </div>
              )}

              {appState === AppState.SUCCESS && originalImage && processedImage && (
                 <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pt-12">
                    <ComparisonView 
                      original={originalImage}
                      processed={processedImage}
                      aspectRatio={aspectRatio}
                      onDownload={handleDownload}
                      onReset={handleReset}
                    />
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-[15px] font-light text-[#5a6e48]">
                      <div className="p-6 rounded-xl bg-[#fffdf7] border border-[#d8e4c0] shadow-sm">
                        <strong className="block text-[#2d3a1e] mb-2 font-medium">Scale</strong>
                        A figure provides an instant reference for the size of architectural elements.
                      </div>
                      <div className="p-6 rounded-xl bg-[#fffdf7] border border-[#d8e4c0] shadow-sm">
                        <strong className="block text-[#2d3a1e] mb-2 font-medium">Narrative</strong>
                        Even a simple line drawing implies usage and life within a static space.
                      </div>
                      <div className="p-6 rounded-xl bg-[#fffdf7] border border-[#d8e4c0] shadow-sm">
                        <strong className="block text-[#2d3a1e] mb-2 font-medium">Balance</strong>
                        Human elements can balance negative space in minimalist compositions.
                      </div>
                    </div>
                 </div>
              )}

            </div>
          </>
        )}

        {/* API Key Section at bottom */}
        <div className="w-full bg-[#faf6ee] border-t border-[#d8e4c0] py-8 mt-auto">
          <div className="max-w-md mx-auto px-6">
            <div className="flex items-center bg-[#fffdf7] border border-[#c8d8b0] rounded-[10px] overflow-hidden shadow-sm">
              <input 
                type={showApiKey ? "text" : "password"}
                value={userApiKey}
                onChange={(e) => {
                  setUserApiKey(e.target.value);
                  setIsKeyApplied(false);
                }}
                placeholder="Optional: API Key"
                className="flex-1 min-w-0 bg-transparent px-3 sm:px-4 py-3 text-[14px] sm:text-[15px] font-light text-[#2d3a1e] focus:outline-none placeholder:text-[#a8c878]"
              />
              <button 
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2 sm:p-3 text-[#a8c878] hover:text-[#4a7c59] transition-colors shrink-0"
                title={showApiKey ? "Hide API Key" : "Show API Key"}
              >
                {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={() => {
                  if (userApiKey.trim()) setIsKeyApplied(true);
                }}
                className={`px-2 sm:px-4 py-3 font-medium text-[12px] sm:text-[14px] transition-colors border-l border-[#c8d8b0] shrink-0 ${
                  isKeyApplied 
                    ? 'bg-[#f0f4e8] text-[#4a7c59]' 
                    : 'bg-[#faf6ee] text-[#5a6e48] hover:bg-[#f0f4e8]'
                }`}
              >
                {isKeyApplied ? (
                  <span className="flex items-center gap-1"><Check size={16} /><span className="hidden sm:inline">Applied</span><span className="sm:hidden">OK</span></span>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
            <div className="mt-3 text-center px-2">
              <p className="text-[13px] font-light text-[#5a6e48] leading-relaxed">
                3 free uses per IP. Enter an <a href="https://www.atlascloud.ai/console/api-keys?ref=F27PTG&utm_source=figura" target="_blank" rel="noopener noreferrer" className="text-[#4a7c59] font-medium hover:underline whitespace-nowrap">Atlas Cloud API key</a> to bypass this limit.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-12 border-t border-[#d8e4c0] bg-[#f0ebe0] mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2 text-[#5a6e48] font-light text-[15px]">
            <span>Powered by</span>
            <a href="https://www.atlascloud.ai?ref=F27PTG&utm_source=figura" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="/atlas-logo.svg" alt="Atlas Cloud" className="h-14 object-contain" />
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Alisa0808/Figura"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[#5a6e48] hover:text-[#4a7c59] transition-colors text-[14px] font-light"
              title="View source on GitHub"
            >
              <Github size={18} />
              <span>Open Source</span>
            </a>
          </div>
          <p className="text-[#5a6e48] text-[11px] tracking-[0.1em] uppercase font-medium">&copy; 2026 <span className="text-[#4a7c59]">Figura</span>. All rights reserved.</p>
        </div>
      </footer>
      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default App;