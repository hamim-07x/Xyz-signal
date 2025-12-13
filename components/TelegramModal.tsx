
import React, { useState } from 'react';
import { Shield, ChevronRight, Fingerprint, Loader2, AlertTriangle, Send, CheckCircle2, Power, ScanLine, UserCheck } from 'lucide-react';

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
  const [isExiting, setIsExiting] = useState(false);

  const handleJoin = () => {
    const link = channelLink || '#';
    window.open(link, '_blank');
    setHasClickedJoin(true);
  };

  const triggerSuccess = () => {
      setStatusMessage('IDENTITY CONFIRMED');
      setIsChecking(false);
      setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
              onVerify();
          }, 600); 
      }, 1000);
  };

  const checkMembershipReal = async () => {
    if (!botToken || !channelChatId || !telegramUserId) {
      setError('CONFIG_MISSING_ABORT');
      setIsChecking(false);
      return;
    }

    try {
      const telegramUrl = `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${channelChatId}&user_id=${telegramUserId}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(telegramUrl)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
          const tgData = JSON.parse(data.contents);
          if (tgData.ok) {
            const status = tgData.result.status;
            if (['creator', 'administrator', 'member', 'restricted'].includes(status)) {
               triggerSuccess();
            } else {
               setError('SUBJECT_NOT_FOUND_IN_CHANNEL');
               setIsChecking(false);
            }
          } else {
             setError('API_GATEWAY_ERROR');
             setIsChecking(false);
          }
      } else {
          throw new Error("Proxy Error");
      }
    } catch (err) {
      console.error(err);
      setError('NETWORK_UPLINK_FAILED');
      setIsChecking(false);
    }
  };

  const handleVerify = () => {
    if (!hasClickedJoin) return; 
    
    setIsChecking(true);
    setError('');
    setStatusMessage('SCANNING_BIOMETRICS...');

    if (strictMode) {
       checkMembershipReal();
    } else {
      setTimeout(() => {
        triggerSuccess();
      }, 2000);
    }
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl transition-all duration-700 ${isExiting ? 'scale-110 opacity-0 blur-lg' : 'scale-100 opacity-100'}`}>
      
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none animate-pulse"></div>

      {/* Holographic Card */}
      <div className="relative w-full max-w-sm overflow-hidden bg-[#0a0b10] border border-[#00f3ff]/30 shadow-[0_0_50px_rgba(0,243,255,0.15)] clip-path-polygon">
        
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00f3ff]"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00f3ff]"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00f3ff]"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00f3ff]"></div>

        {/* Scan Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#00f3ff] shadow-[0_0_20px_#00f3ff] animate-[scan_2s_linear_infinite] opacity-50 z-20"></div>

        <div className="p-6 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 border-b border-[#00f3ff]/20 pb-4">
                <div className="w-14 h-14 rounded-md border border-[#00f3ff]/50 p-1 relative overflow-hidden group">
                     {telegramPhoto ? (
                         <img src={telegramPhoto} alt="User" className="w-full h-full object-cover rounded-sm grayscale group-hover:grayscale-0 transition-all" />
                     ) : (
                         <div className="w-full h-full bg-[#00f3ff]/10 flex items-center justify-center">
                             <ScanLine className="w-6 h-6 text-[#00f3ff]" />
                         </div>
                     )}
                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00f3ff] shadow-[0_0_10px_#00f3ff]"></div>
                </div>
                <div>
                     <h2 className="text-lg font-bold text-white font-orbitron tracking-wider glitch-text" data-text={telegramName || 'UNKNOWN'}>
                        {telegramName || 'UNKNOWN AGENT'}
                     </h2>
                     <p className="text-[10px] font-mono text-[#00f3ff]/70 tracking-[0.2em] mt-1">ID: {telegramUserId || 'XXXX-XXXX'}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
                
                {/* Step 1 */}
                <button
                  onClick={handleJoin}
                  className={`w-full group relative overflow-hidden p-4 border transition-all duration-300
                    ${!hasClickedJoin 
                        ? 'bg-[#00f3ff]/5 border-[#00f3ff]/30 hover:bg-[#00f3ff]/10 hover:border-[#00f3ff]' 
                        : 'bg-green-500/10 border-green-500/50'
                    }
                  `}
                >
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${hasClickedJoin ? 'bg-green-500 text-black' : 'bg-[#00f3ff]/20 text-[#00f3ff]'}`}>
                                {hasClickedJoin ? <CheckCircle2 className="w-4 h-4"/> : <Send className="w-4 h-4 -rotate-45"/>}
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-gray-400 font-mono tracking-wider">PROTOCOL 01</div>
                                <div className={`text-xs font-bold font-orbitron ${hasClickedJoin ? 'text-green-400' : 'text-white'}`}>
                                    {hasClickedJoin ? 'UPLINK ESTABLISHED' : 'JOIN SECURE CHANNEL'}
                                </div>
                            </div>
                        </div>
                        {!hasClickedJoin && <ChevronRight className="w-4 h-4 text-[#00f3ff] animate-pulse"/>}
                    </div>
                </button>

                {/* Connection Line */}
                <div className="h-4 w-0.5 bg-[#00f3ff]/30 mx-auto"></div>

                {/* Step 2 */}
                <button
                  onClick={handleVerify}
                  disabled={!hasClickedJoin || isChecking}
                  className={`w-full group relative overflow-hidden p-4 border transition-all duration-300
                    ${!hasClickedJoin
                        ? 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed' 
                        : 'bg-[#00f3ff]/10 border-[#00f3ff]/50 hover:bg-[#00f3ff]/20 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]'
                    }
                  `}
                >
                     <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${isChecking ? 'text-[#00f3ff] animate-spin' : 'text-[#00f3ff] bg-[#00f3ff]/20'}`}>
                                 {isChecking ? <Loader2 className="w-4 h-4"/> : <Fingerprint className="w-4 h-4"/>}
                            </div>
                            <div className="text-left">
                                <div className="text-[10px] text-gray-400 font-mono tracking-wider">PROTOCOL 02</div>
                                <div className="text-xs font-bold text-white font-orbitron">
                                    {isChecking ? 'DECRYPTING...' : 'VERIFY ACCESS'}
                                </div>
                            </div>
                        </div>
                        {isChecking && <span className="text-[8px] font-mono text-[#00f3ff] animate-pulse">{statusMessage}</span>}
                    </div>
                    
                    {/* Progress Bar Animation */}
                    {isChecking && (
                        <div className="absolute bottom-0 left-0 h-0.5 bg-[#00f3ff] animate-[load_2s_ease-in-out_infinite] w-full shadow-[0_0_10px_#00f3ff]"></div>
                    )}
                </button>

                 {error && (
                    <div className="flex items-center gap-2 text-[#ff003c] bg-[#ff003c]/10 p-2 border border-[#ff003c]/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[9px] font-mono font-bold tracking-widest">{error}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="bg-[#00f3ff]/5 p-2 border-t border-[#00f3ff]/20 flex justify-between items-center px-4">
             <div className="flex items-center gap-1">
                 <div className="w-1.5 h-1.5 bg-[#00f3ff] rounded-full animate-ping"></div>
                 <span className="text-[7px] font-mono text-[#00f3ff]">SYSTEM_ONLINE</span>
             </div>
             <span className="text-[7px] font-mono text-gray-500">ENCRYPTED_V2.0</span>
        </div>
      </div>
    </div>
  );
};
