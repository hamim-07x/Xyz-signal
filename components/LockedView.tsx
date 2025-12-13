
import React, { useState } from 'react';
import { ShieldCheck, Loader2, CreditCard, Gem, Lock, Play, AlertOctagon, Cpu, Terminal } from 'lucide-react';
import { redeemKeyOnServer, checkAdEligibility, grantAdReward } from '../lib/firebase';
import { GlobalSettings } from '../types';

interface LockedViewProps {
  telegramId: number;
  onSuccess: (expiry: number) => void;
  contactLink: string;
  onOpenSupport?: () => void;
  settings?: GlobalSettings;
}

declare global {
    interface Window {
        show_10174286: () => Promise<any>;
    }
}

export const LockedView: React.FC<LockedViewProps> = ({ telegramId, onSuccess, contactLink, onOpenSupport, settings }) => {
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AD SYSTEM STATE
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [adCount, setAdCount] = useState(0);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [adCooldown, setAdCooldown] = useState(0);
  const [adStatus, setAdStatus] = useState('IDLE');

  const handleUnlock = async () => {
    if (!inputKey.trim()) return;
    setLoading(true);
    setError('');

    try {
        const keyString = inputKey.trim().toUpperCase(); 
        const result = await redeemKeyOnServer(keyString, telegramId);

        if (result.success && result.duration) {
             const now = Date.now();
             const newExpiry = now + result.duration;
             localStorage.setItem(`xhunter_license_${telegramId}`, newExpiry.toString());
             setLoading(false);
             onSuccess(newExpiry);
        } else {
             setError(result.message || 'ACCESS DENIED');
             setLoading(false);
        }
    } catch (err) {
        setError('SERVER ERROR');
        setLoading(false);
    }
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

  const handleOpenAdModal = async () => {
      const limit = settings?.dailyAdLimit || 1;
      const eligible = await checkAdEligibility(telegramId, limit);
      
      if(eligible) {
          setIsAdModalOpen(true);
          setAdCount(0);
          setAdStatus('IDLE');
      } else {
          setError(`DAILY LIMIT ${limit}/${limit}`);
      }
  };

  const invokeAd = (): Promise<void> => {
      return new Promise((resolve) => {
          if (typeof window.show_10174286 === 'function') {
              window.show_10174286()
                  .then(() => { resolve(); })
                  .catch(() => { resolve(); });
          } else {
              setTimeout(resolve, 3000); 
          }
      });
  };

  const watchNextAd = async () => {
      setAdStatus('WATCHING');
      setIsAdLoading(true);
      await invokeAd();
      setIsAdLoading(false);
      startCooldown();
  };

  const startCooldown = () => {
      setAdStatus('COOLING');
      setAdCooldown(10);
      
      const timer = setInterval(() => {
          setAdCooldown((prev) => {
              if (prev <= 1) {
                  clearInterval(timer);
                  handleAdComplete();
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
  };

  const handleAdComplete = async () => {
      const newCount = adCount + 1;
      const target = settings?.adsTarget || 10;
      setAdCount(newCount);
      setAdStatus('IDLE');

      if (newCount >= target) {
          setIsAdModalOpen(false);
          setLoading(true);
          const hours = settings?.adRewardHours || 1;
          const durationMs = await grantAdReward(telegramId, hours);
          
          if (durationMs > 0) {
              const now = Date.now();
              const newExpiry = now + durationMs;
              localStorage.setItem(`xhunter_license_${telegramId}`, newExpiry.toString());
              onSuccess(newExpiry);
          } else {
              setError("AUTH FAILED");
              setLoading(false);
          }
      }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 relative animate-fade-in-up">
      
      {/* Security Terminal Container */}
      <div className="tech-border w-full max-w-[320px] p-6 relative overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-[#00ff41]/20 pb-3">
              <div className="w-10 h-10 bg-[#00ff41]/10 border border-[#00ff41] rounded flex items-center justify-center animate-pulse">
                  <Lock className="w-5 h-5 text-[#00ff41]" />
              </div>
              <div>
                  <h2 className="text-lg font-bold font-orbitron text-white tracking-widest text-glow">SECURITY GATE</h2>
                  <p className="text-[9px] font-mono text-[#00ff41]">AUTH_REQUIRED</p>
              </div>
          </div>

          {/* Key Input */}
          <div className="space-y-4 relative z-10">
              <div className="relative">
                  <label className="text-[9px] text-[#008F11] font-mono block mb-1">ENTER_ACCESS_KEY</label>
                  <div className="flex items-center bg-black border border-[#008F11] p-1 rounded transition-colors focus-within:border-[#00ff41] focus-within:shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                      <Terminal className="w-4 h-4 text-[#00ff41] ml-2" />
                      <input 
                          type="text" 
                          value={inputKey}
                          onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full bg-transparent border-none text-[#00ff41] font-mono text-sm tracking-[0.2em] focus:outline-none p-3 placeholder-[#003300]"
                      />
                  </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[#ff003c] text-[10px] font-bold font-mono bg-[#ff003c]/10 p-2 border border-[#ff003c]/30">
                   <AlertOctagon className="w-3 h-3"/> {error}
                </div>
              )}

              {/* Unlock Button */}
              <button
                  onClick={handleUnlock}
                  disabled={loading || !inputKey}
                  className="w-full py-4 bg-[#003300] hover:bg-[#004400] border border-[#00ff41] text-[#00ff41] font-bold font-mono tracking-widest text-xs relative overflow-hidden group transition-all active:scale-95"
              >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 
                    <span className="flex items-center justify-center gap-2">
                        <Cpu className="w-4 h-4"/> EXECUTE PROTOCOL
                    </span>
                  }
              </button>

              <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                      onClick={handleOpenAdModal}
                      className="py-2.5 bg-black border border-[#ffd700]/30 hover:border-[#ffd700] text-[#ffd700] text-[9px] font-mono font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                      <Gem className="w-3 h-3" /> AD_BYPASS
                  </button>
                  <button
                      onClick={handleContact}
                      className="py-2.5 bg-black border border-[#00f3ff]/30 hover:border-[#00f3ff] text-[#00f3ff] text-[9px] font-mono font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                      <CreditCard className="w-3 h-3" /> BUY_KEY
                  </button>
              </div>
          </div>
      </div>

      {/* --- ADS MODAL (HACKER STYLE) --- */}
      {isAdModalOpen && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in-up">
              <div className="tech-border w-full max-w-sm p-6 relative">
                  
                  <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-2 border-2 border-dashed border-[#ffd700] rounded-full flex items-center justify-center animate-spin-slow">
                          <Gem className="w-5 h-5 text-[#ffd700]" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-orbitron tracking-widest">SPONSOR UPLINK</h3>
                      <div className="h-px w-20 bg-[#ffd700] mx-auto mt-2"></div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6 font-mono">
                      <div className="flex justify-between text-[10px] text-[#ffd700] mb-1">
                          <span>UPLOADING...</span>
                          <span>{Math.round((adCount / (settings?.adsTarget || 10)) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#111] border border-[#333]">
                          <div 
                             className="h-full bg-[#ffd700] shadow-[0_0_10px_#ffd700] transition-all duration-300"
                             style={{ width: `${(adCount / (settings?.adsTarget || 10)) * 100}%` }}
                          ></div>
                      </div>
                      <div className="text-right text-[8px] text-[#555] mt-1">
                          PACKETS: {adCount}/{settings?.adsTarget || 10}
                      </div>
                  </div>

                  <div className="space-y-3">
                      {adStatus === 'COOLING' ? (
                          <div className="w-full py-6 border border-[#ffd700]/30 bg-[#ffd700]/5 flex flex-col items-center justify-center">
                              <div className="text-2xl font-bold text-white font-mono">
                                  00:{adCooldown.toString().padStart(2, '0')}
                              </div>
                              <span className="text-[8px] text-[#ffd700] font-mono tracking-widest mt-1 animate-pulse">COOLDOWN_ACTIVE</span>
                          </div>
                      ) : (
                          <button 
                            onClick={watchNextAd}
                            disabled={isAdLoading}
                            className="w-full py-4 bg-[#ffd700] hover:bg-[#ffed4a] text-black font-bold font-orbitron tracking-widest shadow-[0_0_20px_rgba(255,215,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                              {isAdLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-black"/>}
                              <span>{isAdLoading ? 'CONNECTING...' : 'WATCH AD'}</span>
                          </button>
                      )}

                      <button 
                        onClick={() => setIsAdModalOpen(false)}
                        className="w-full py-2 text-[10px] text-gray-500 hover:text-white transition-colors tracking-widest font-mono border border-white/10 hover:border-white/30"
                      >
                          TERMINATE_CONNECTION
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
