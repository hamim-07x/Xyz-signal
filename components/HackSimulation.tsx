
import React from 'react';

export const HackSimulation: React.FC = () => {
    return (
        <div className="w-full h-full relative flex items-center justify-center">
            {/* Radar Sweep Effect */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/30 overflow-hidden bg-black/40">
                <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rotate-[45deg] animate-[spin_2s_linear_infinite]"></div>
            </div>

            {/* Target Crosshairs */}
            <div className="absolute inset-4 border border-dashed border-cyan-400/50 rounded-full animate-[spin_4s_linear_infinite_reverse]"></div>
            
            {/* Center Lock Reticle */}
            <div className="relative z-10 w-16 h-16 flex items-center justify-center">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-full bg-cyan-500/50"></div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-0.5 bg-cyan-500/50"></div>
                <div className="w-10 h-10 border-2 border-red-500 rounded-full animate-ping opacity-75"></div>
                <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_red]"></div>
            </div>

            {/* Scanning Text */}
            <div className="absolute bottom-6 text-[8px] font-mono text-cyan-400 bg-black/60 px-2 py-0.5 rounded tracking-widest animate-pulse">
                TARGET_LOCKING...
            </div>
        </div>
    );
};
