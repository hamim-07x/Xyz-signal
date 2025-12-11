
import React, { useEffect, useState } from 'react';
import { Radio, ChevronRight, Power } from 'lucide-react';

interface IntroAnimationProps {
  appName?: string;
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ appName = "SYSTEM", onComplete }) => {
  const [percentage, setPercentage] = useState(0);
  const [text, setText] = useState("INITIALIZING");
  const [isComplete, setIsComplete] = useState(false);
  const [showManualButton, setShowManualButton] = useState(false);

  useEffect(() => {
    // Safety Timer: Show manual button after 3 seconds if not done
    const safetyTimer = setTimeout(() => {
        setShowManualButton(true);
    }, 3000);

    const interval = setInterval(() => {
      setPercentage(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setText("ACCESS GRANTED");
          setIsComplete(true);
          setTimeout(onComplete, 1000);
          return 100;
        }
        
        // Dynamic status text
        if (prev === 20) setText("LOADING KERNEL...");
        if (prev === 45) setText("BYPASSING FIREWALL...");
        if (prev === 70) setText("SYNCING DATA STREAMS...");
        if (prev === 90) setText("FINALIZING...");

        return prev + 1;
      });
    }, 30); // Faster loading

    return () => {
        clearInterval(interval);
        clearTimeout(safetyTimer);
    };
  }, [onComplete]);

  const handleManualStart = () => {
      setIsComplete(true);
      onComplete();
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden transition-all duration-1000 ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
      
      <div className="relative flex flex-col items-center w-full max-w-xs px-6">
          
          {/* Central 3D Core Structure */}
          <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center mb-8">
              {/* Outer Ring */}
              <div className="absolute inset-0 border-[1px] border-cyan-500/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute -inset-4 border-[1px] border-dashed border-blue-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
              
              {/* Spinning Hexagons */}
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                 <div className="w-28 h-28 sm:w-40 sm:h-40 border border-cyan-400/20 rotate-45 transform"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center animate-[spin_4s_linear_infinite_reverse]">
                 <div className="w-28 h-28 sm:w-40 sm:h-40 border border-blue-400/20 rotate-12 transform"></div>
              </div>

              {/* Core Icon */}
              <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-black/80 backdrop-blur-md rounded-full border border-cyan-500/50 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)]">
                 <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400 animate-pulse" />
              </div>
          </div>

          {/* Text & Progress */}
          <div className="text-center space-y-4 w-full">
              <h1 className="text-2xl sm:text-3xl font-orbitron font-bold text-white tracking-[0.3em] drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  {appName}
              </h1>
              
              <div className="flex flex-col items-center gap-2">
                  <div className="text-[10px] font-mono text-cyan-500 tracking-widest uppercase animate-pulse">
                      {text}
                  </div>
                  <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative">
                      <div 
                          className="h-full bg-gradient-to-r from-cyan-600 to-blue-400 shadow-[0_0_15px_cyan]"
                          style={{ width: `${percentage}%` }}
                      ></div>
                  </div>
                  <div className="flex justify-between w-full text-[9px] text-gray-600 font-mono">
                      <span>SYS.BOOT</span>
                      <span>{percentage}%</span>
                  </div>
              </div>

              {/* MANUAL ENTRY BUTTON (Failsafe) */}
              {showManualButton && !isComplete && (
                  <button 
                    onClick={handleManualStart}
                    className="mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-900/20 border border-cyan-500/30 rounded-full text-cyan-400 text-xs font-bold tracking-widest hover:bg-cyan-900/40 hover:border-cyan-400 transition-all animate-fade-in-up w-full"
                  >
                      <Power className="w-3 h-3" />
                      INITIALIZE SYSTEM
                      <ChevronRight className="w-3 h-3" />
                  </button>
              )}
          </div>
      </div>
    </div>
  );
};
