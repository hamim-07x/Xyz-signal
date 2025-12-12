
import React, { useState } from 'react';
import { Unlock, Loader2, Send } from 'lucide-react';

interface LockedViewProps {
  telegramId: number;
  onSuccess: (expiry: number) => void;
  contactLink: string;
  onOpenSupport?: () => void;
}

export const LockedView: React.FC<LockedViewProps> = ({ telegramId, onSuccess, contactLink, onOpenSupport }) => {
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (!inputKey.trim()) return;
    setLoading(true);
    setError('');

    setTimeout(() => {
      try {
        const keyString = inputKey.trim();
        const savedKeysStr = localStorage.getItem('xhunter_keys');
        const savedKeys = savedKeysStr ? JSON.parse(savedKeysStr) : {};
        const keyData = savedKeys[keyString];

        if (!keyData) {
          setError('ACCESS DENIED: INVALID KEY');
          setLoading(false);
          return;
        }

        if (keyData.isUsed) {
          setError('ACCESS DENIED: KEY REDEEMED');
          setLoading(false);
          return;
        }

        const now = Date.now();
        const duration = keyData.durationMs; 
        const newExpiry = now + duration;

        // Update Key Status
        keyData.isUsed = true;
        keyData.usedBy = telegramId;
        keyData.activatedAt = now; // SAVE ACTIVATION TIME
        savedKeys[keyString] = keyData;
        localStorage.setItem('xhunter_keys', JSON.stringify(savedKeys));

        // Save License to Local User
        localStorage.setItem(`xhunter_license_${telegramId}`, newExpiry.toString());

        // Notify Parent App Component Immediately
        setLoading(false);
        onSuccess(newExpiry);

      } catch (err) {
        console.error(err);
        setError('SYSTEM CRITICAL ERROR');
        setLoading(false);
      }
    }, 800); // Cinematic delay
  };

  const handleContact = () => {
    if (onOpenSupport) {
        onOpenSupport();
    } else if (contactLink) {
      const link = contactLink.startsWith('http') || contactLink.startsWith('tg://') 
        ? contactLink 
        : `https://t.me/${contactLink.replace('@', '')}`;
      window.open(link, '_blank');
    }
  };

  return (
    <div className="w-full relative min-h-[300px] flex flex-col items-center justify-center p-1 animate-fade-in-up">
      {/* Container Frame */}
      <div className="absolute inset-0 bg-[#0a0a0a] border border-red-900/50 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
         {/* Cyber Lines */}
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
         <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
         <div className="absolute top-0 left-0 h-full w-[80px] bg-gradient-to-r from-red-900/5 to-transparent skew-x-12"></div>
      </div>

      <div className="relative z-10 w-full max-w-[260px] flex flex-col items-center space-y-4">
        
        {/* Lock Animation */}
        <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-red-500/30 flex items-center justify-center animate-pulse">
                <div className="w-12 h-12 rounded-full border border-red-500/50 flex items-center justify-center bg-red-950/20">
                    <Unlock className="w-6 h-6 text-red-500" />
                </div>
            </div>
            <div className="absolute -inset-2 border border-dashed border-red-900/60 rounded-full animate-[spin_10s_linear_infinite]"></div>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-white tracking-[0.2em] uppercase font-mono drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]">SYSTEM LOCKED</h3>
          <p className="text-[8px] text-red-400 font-mono tracking-widest">ENTER DECRYPTION KEY</p>
        </div>

        <div className="w-full space-y-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-red-900 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
            <input 
                type="text" 
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
                className="relative w-full bg-black border border-red-800 rounded-lg p-3 text-center text-red-100 font-mono text-base tracking-[0.2em] focus:outline-none focus:border-red-500 uppercase placeholder-red-900/30"
            />
          </div>

          {error && (
            <div className="text-center text-red-500 text-[9px] font-bold bg-red-950/50 py-1.5 rounded border border-red-500/30 animate-pulse tracking-wide">
              {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={loading || !inputKey}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all font-mono text-xs tracking-widest uppercase relative overflow-hidden group
              ${loading || !inputKey
                ? 'bg-gray-900 text-gray-600 cursor-not-allowed border border-gray-800' 
                : 'bg-red-700 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)] border border-red-500 active:scale-95'
              }`}
          >
            {loading ? (
                <>
                   <Loader2 className="w-3.5 h-3.5 animate-spin" />
                   <span>DECRYPTING...</span>
                </>
            ) : (
                <>
                    <span className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 group-hover:animate-shine"></span>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>UNLOCK ACCESS</span>
                </>
            )}
          </button>

          {(contactLink || onOpenSupport) && (
            <button
              onClick={handleContact}
              className="w-full py-2 rounded-lg font-bold flex items-center justify-center space-x-2 transition-all font-mono text-[9px] tracking-widest text-gray-500 hover:text-white border border-transparent hover:border-white/10 hover:bg-white/5"
            >
              <Send className="w-2.5 h-2.5" />
              <span>CONTACT ADMIN FOR KEY</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
