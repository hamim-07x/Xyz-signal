
import React, { useState } from 'react';
import { Shield, Lock, ChevronRight, Fingerprint, Loader2, AlertTriangle, Send, CheckCircle2, Power, User } from 'lucide-react';

interface TelegramModalProps {
  onVerify: () => void;
  channelLink: string;
  strictMode: boolean;
  botToken?: string;
  channelChatId?: string;
  telegramUserId?: number;
  telegramPhoto?: string;
  telegramName?: string;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ 
  onVerify, 
  channelLink, 
  strictMode,
  botToken,
  channelChatId,
  telegramUserId,
  telegramPhoto,
  telegramName
}) => {
  const [hasClickedJoin, setHasClickedJoin] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const handleJoin = () => {
    const link = channelLink || '#';
    window.open(link, '_blank');
    setHasClickedJoin(true);
  };

  const checkMembershipReal = async () => {
    if (!botToken || !channelChatId || !telegramUserId) {
      setError('CONFIG ERROR');
      setIsChecking(false);
      return;
    }

    try {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelChatId}&user_id=${telegramUserId}`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(telegramUrl)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();

      if (data.ok) {
        const status = data.result.status;
        if (['creator', 'administrator', 'member'].includes(status)) {
           setStatusMessage('ACCESS GRANTED');
           setTimeout(() => {
             setIsChecking(false);
             onVerify();
           }, 800);
        } else {
           setError('USER NOT FOUND');
           setIsChecking(false);
        }
      } else {
        setError('API ERROR');
        setIsChecking(false);
      }
    } catch (err) {
      setError('NETWORK ERROR');
      setIsChecking(false);
    }
  };

  const handleVerify = () => {
    if (!hasClickedJoin) return; 
    
    setIsChecking(true);
    setError('');
    setStatusMessage('SCANNING BIOMETRICS...');

    if (strictMode) {
       checkMembershipReal();
    } else {
      setTimeout(() => {
        setIsChecking(false);
        onVerify();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-md animate-fade-in-up">
      {/* Holographic Card Frame */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-[30px] bg-[#0a0a0a] border border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        
        {/* Animated Top Scanline */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-scan opacity-70 z-20"></div>

        {/* Header Section */}
        <div className="relative p-6 text-center bg-gradient-to-b from-gray-900 to-black border-b border-gray-800">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            
            <div className="flex flex-col items-center">
                 <div className="w-20 h-20 rounded-full border-2 border-cyan-500/30 p-1 mb-3 animate-profile-glow">
                     {telegramPhoto ? (
                         <img src={telegramPhoto} alt="User" className="w-full h-full rounded-full object-cover" />
                     ) : (
                         <div className="w-full h-full rounded-full bg-cyan-950 flex items-center justify-center">
                             <User className="w-8 h-8 text-cyan-500" />
                         </div>
                     )}
                 </div>
                 <h2 className="text-lg font-bold text-white font-orbitron tracking-wide">{telegramName || 'UNKNOWN USER'}</h2>
                 <p className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest mt-1">ID: {telegramUserId || '---'}</p>
            </div>
        </div>

        {/* Content Section */}
        <div className="p-6 relative bg-black/80">
            
            {/* Step 1: Join (Uplink) */}
            <button
              onClick={handleJoin}
              className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-500 mb-0 z-10
                ${!hasClickedJoin 
                    ? 'bg-blue-950/20 border-blue-500/30 hover:border-blue-400 hover:bg-blue-900/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'bg-green-950/20 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                }
              `}
            >
                <div className="relative z-10 px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 ${!hasClickedJoin ? 'bg-blue-600/20 text-blue-400' : 'bg-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.8)]'}`}>
                            {!hasClickedJoin ? <Send className="w-5 h-5 -rotate-45 ml-1" /> : <CheckCircle2 className="w-6 h-6" />}
                        </div>
                        <div className="text-left">
                            <div className={`text-xs font-bold uppercase tracking-wider transition-colors ${!hasClickedJoin ? 'text-blue-100' : 'text-green-400'}`}>
                                {hasClickedJoin ? 'Uplink Established' : 'Initialize Uplink'}
                            </div>
                            <div className="text-[9px] text-gray-500 font-mono mt-0.5">
                                {hasClickedJoin ? 'Connection Stable' : 'Target: Official Channel'}
                            </div>
                        </div>
                    </div>
                    {!hasClickedJoin && <ChevronRight className="w-4 h-4 text-blue-500 animate-pulse"/>}
                </div>
                {!hasClickedJoin && <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            </button>

            {/* Connecting Power Line */}
            <div className="flex justify-center -my-1 relative z-0">
                <div className={`w-0.5 h-8 transition-all duration-700 ${hasClickedJoin ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'bg-gray-800'}`}></div>
            </div>

            {/* Step 2: Verify (Auth) */}
            <button
              onClick={handleVerify}
              disabled={!hasClickedJoin || isChecking}
              className={`w-full group relative overflow-hidden rounded-xl border transition-all duration-700 z-10
                ${!hasClickedJoin
                    ? 'bg-gray-900/50 border-gray-800 grayscale opacity-40 cursor-not-allowed' 
                    : 'bg-cyan-950/20 border-cyan-500/50 hover:bg-cyan-900/30 hover:border-cyan-400 shadow-[0_0_25px_rgba(8,145,178,0.2)] cursor-pointer'
                }
              `}
            >
                 <div className="relative z-10 px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-500 
                            ${!hasClickedJoin 
                                ? 'bg-gray-800 text-gray-600' 
                                : isChecking ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                            }`}>
                             {isChecking ? <Loader2 className="w-5 h-5 animate-spin"/> : <Fingerprint className="w-6 h-6"/>}
                        </div>
                        <div className="text-left">
                            <div className={`text-xs font-bold uppercase tracking-wider transition-colors ${!hasClickedJoin ? 'text-gray-500' : 'text-cyan-100'}`}>
                                {isChecking ? 'Verifying...' : 'Authenticate'}
                            </div>
                            <div className="text-[9px] text-gray-600 font-mono mt-0.5">
                                {!hasClickedJoin ? 'Waiting for Uplink...' : statusMessage || 'Ready to Scan'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Status Indicator */}
                    <div className={`w-2 h-2 rounded-full ${!hasClickedJoin ? 'bg-red-900' : 'bg-cyan-500 animate-ping'}`}></div>
                </div>
                
                {/* Active Scan Effect */}
                {hasClickedJoin && !isChecking && (
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent skew-x-12 animate-shine"></div>
                )}
            </button>

             {/* Error Message */}
             {error && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-red-500 bg-red-950/30 p-2 rounded-lg border border-red-900/50 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span className="text-[10px] font-bold tracking-wider">{error}</span>
                </div>
            )}
        </div>
        
        {/* Footer */}
        <div className="p-3 bg-black border-t border-gray-800 text-center flex justify-between items-center px-6">
            <div className="flex items-center space-x-1">
                <Power className={`w-3 h-3 ${hasClickedJoin ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-[8px] text-gray-500 font-mono">SYSTEM {hasClickedJoin ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <span className="text-[8px] text-gray-700 font-mono">SECURE ACCESS</span>
        </div>
      </div>
    </div>
  );
};
