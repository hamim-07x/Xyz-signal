
import React, { useState, useEffect } from 'react';

export const HackSimulation: React.FC = () => {
    const [code, setCode] = useState("00");
    
    useEffect(() => {
        const interval = setInterval(() => {
            setCode(Math.random().toString(16).substring(2, 4).toUpperCase());
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full h-full relative flex flex-col items-center justify-center bg-black/80 rounded-full border-2 border-[#00ff41] overflow-hidden shadow-[0_0_30px_#00ff41]">
            
            {/* Spinning Rings */}
            <div className="absolute inset-0 border-4 border-[#003300] border-t-[#00ff41] rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-[#003300] border-b-[#00ff41] rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>

            {/* Central Data */}
            <div className="z-10 flex flex-col items-center">
                <div className="text-3xl font-mono font-bold text-[#00ff41] animate-pulse">
                    {code}
                </div>
                <div className="text-[8px] text-[#008F11] font-mono tracking-widest mt-1">
                    DECRYPTING
                </div>
            </div>

            {/* Scanline */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent to-[#00ff41]/20 animate-[scan-vertical_1s_linear_infinite]"></div>
        </div>
    );
};
