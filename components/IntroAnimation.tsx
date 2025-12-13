
import React, { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';

interface IntroAnimationProps {
  appName?: string;
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ appName = "SYSTEM", onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const bootSequence = [
    "INITIALIZING KERNEL...",
    "MOUNTING FILE SYSTEM [RW]...",
    "LOADING MODULES: [NET] [CRYPTO] [AI]...",
    "BYPASSING SECURITY PROTOCOLS...",
    "ESTABLISHING SECURE CONNECTION...",
    "SYNCING WITH SERVER NODES...",
    "DECRYPTING PAYLOAD...",
    "ACCESS GRANTED."
  ];

  useEffect(() => {
    let delay = 0;
    bootSequence.forEach((line, index) => {
        delay += Math.random() * 300 + 100;
        setTimeout(() => {
            setLines(prev => [...prev, `> ${line}`]);
            if (index === bootSequence.length - 1) {
                setTimeout(() => {
                    setIsComplete(true);
                    setTimeout(onComplete, 500);
                }, 800);
            }
        }, delay);
    });
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-start justify-end p-6 font-mono text-xs md:text-sm overflow-hidden transition-opacity duration-500 ${isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      <div className="absolute inset-0 bg-[#001100] opacity-20"></div>
      
      <div className="w-full max-w-lg mb-10 z-10 relative">
          <div className="flex items-center gap-2 text-[#00ff41] mb-4 border-b border-[#00ff41]/30 pb-2">
              <Terminal className="w-4 h-4" />
              <span className="font-bold tracking-widest">{appName} v2.0</span>
          </div>
          
          <div className="space-y-1">
              {lines.map((line, i) => (
                  <div key={i} className="text-[#00ff41] opacity-90 drop-shadow-[0_0_5px_rgba(0,255,65,0.5)]">
                      {line}
                  </div>
              ))}
              <div className="text-[#00ff41] animate-pulse">_</div>
          </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-1 bg-[#00ff41] shadow-[0_0_20px_#00ff41] animate-[scan-vertical_2s_linear_infinite] opacity-30"></div>
    </div>
  );
};
