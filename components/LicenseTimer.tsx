
import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

interface LicenseTimerProps {
  expiryTimestamp: number;
  onExpire: () => void;
}

export const LicenseTimer: React.FC<LicenseTimerProps> = ({ expiryTimestamp, onExpire }) => {
  const calculateTimeLeft = useCallback(() => {
    const now = Date.now();
    const diff = expiryTimestamp - now;
    if (diff <= 0) return 0;
    return diff;
  }, [expiryTimestamp]);

  const [timeLeftMs, setTimeLeftMs] = useState<number>(calculateTimeLeft());
  
  const formatTime = (ms: number) => {
    const hours = Math.floor((ms / (1000 * 60 * 60)));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (expiryTimestamp <= Date.now()) {
        onExpire();
        return;
    }
    const interval = setInterval(() => {
      const remaining = expiryTimestamp - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        onExpire();
        clearInterval(interval);
      } else {
        setTimeLeftMs(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryTimestamp, onExpire]);

  const isCritical = timeLeftMs < 5 * 60 * 1000;

  return (
    <div className="w-full flex justify-center py-1 animate-fade-in-up">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border shadow-lg ${isCritical ? 'border-red-500/50 shadow-red-900/20' : 'border-cyan-500/30 shadow-cyan-900/20'}`}>
            <Clock className={`w-3 h-3 ${isCritical ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} />
            <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">TIME LEFT</span>
                <span className={`text-sm font-bold font-mono tracking-widest ${isCritical ? 'text-red-400' : 'text-white'}`}>
                    {formatTime(timeLeftMs)}
                </span>
            </div>
        </div>
    </div>
  );
};
