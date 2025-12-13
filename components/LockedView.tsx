
import React, { useState } from 'react';
import { ShieldCheck, Loader2, CreditCard, Gem, Crown, Sparkles, Lock, Play, XCircle, ArrowRight } from 'lucide-react';
import { redeemKeyOnServer, checkAdEligibility, grantAdReward } from '../lib/firebase';
import { GlobalSettings } from '../types';

interface LockedViewProps {
  telegramId: number;
  onSuccess: (expiry: number) => void;
  contactLink: string;
  onOpenSupport?: () => void;
  settings?: GlobalSettings;
}

// Declare the global ad function
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
  const [adError, setAdError] = useState('');
  const [adStatus, setAdStatus] = useState('IDLE'); // IDLE, WATCHING, COOLING

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
             setError(result.message || 'INVALID KEY');
             setLoading(false);
        }
    } catch (err) {
        console.error(err);
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

  // --- AD LOGIC ---
  const handleOpenAdModal = async () => {
      const limit = settings?.dailyAdLimit || 1;
      const eligible = await checkAdEligibility(telegramId, limit);
      
      if(eligible) {
          setIsAdModalOpen(true);
          setAdCount(0);
          setAdError('');
          setAdStatus('IDLE');
      } else {
          setError(`DAILY LIMIT REACHED (${limit}/${limit})`);
      }
  };

  const invokeAd = (): Promise<void> => {
      return new Promise((resolve) => {
          // Check if function exists (loaded from index.html)
          if (typeof window.show_10174286 === 'function') {
              window.show_10174286()
                  .then(() => {
                      console.log("Ad finished");
                      resolve();
                  })
                  .catch((e) => {
                      console.warn("Ad skipped or failed", e);
                      // Even if fails (e.g. adblock), we resolve to let user proceed in this logic
                      // Or you can reject to force them to disable adblock
                      resolve(); 
                  });
          } else {
              console.warn("Ad Script not loaded yet.");
              // Fallback simulation
              setTimeout(resolve, 3000); 
          }
      });
  };

  const watchNextAd = async () => {
      setAdStatus('WATCHING');
      setIsAdLoading(true);
      
      // Call the Ad SDK
      await invokeAd();

      // After Ad is done
      setIsAdLoading(false);
      startCooldown();
  };

  const startCooldown = () => {
      setAdStatus('COOLING');
      setAdCooldown(10); // 10 Seconds cooldown between ads
      
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
          // Grant Reward
          setIsAdModalOpen(false);
          setLoading(true); // Show main loading to indicate processing
          const hours = settings?.adRewardHours || 1;
          const durationMs = await grantAdReward(telegramId, hours);
          
          if (durationMs > 0) {
              const now = Date.now();
              const newExpiry = now + durationMs;
              localStorage.setItem(`xhunter_license_${telegramId}`, newExpiry.toString());
              onSuccess(newExpiry);
          } else {
              setError("REWARD FAILED");
              setLoading(false);
          }
      }
  };

  return (
    <div className="w-full relative min-h-[350px] flex flex-col items-center justify-center p-2 animate-fade-in-up">
      
      {/* Background Decor */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950 rounded-2xl overflow-hidden border border-slate-800">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[280px] flex flex-col items-center">
        
        {/* VIP Badge */}
        <div className="flex items-center gap-2 mb-6 bg-slate-900/80 border border-slate-700 rounded-full px-4 py-1.5 shadow-lg">
            <Crown className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 tracking-[0.2em] font-orbitron">PREMIUM ACCESS</span>
        </div>

        {/* Status Icon */}
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-slate-800 to-black rounded-2xl border border-slate-700 flex items-center justify-center shadow-2xl transform rotate-45">
                <div className="transform -rotate-45">
                    <ShieldCheck className="w-8 h-8 text-yellow-500" />
                </div>
            </div>
        </div>

        {/* Input Section */}
        <div className="w-full space-y-4">
            <div className="relative">
                <label className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1.5 block ml-1">License Key</label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600/50 to-slate-600/50 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                    <input 
                        type="text" 
                        value={inputKey}
                        onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                        placeholder="XXXX-XXXX-XXXX"
                        className="relative w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center text-yellow-100 font-mono text-sm tracking-[0.2em] focus:outline-none focus:border-yellow-500/50 transition-all uppercase placeholder-slate-800 shadow-inner"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
                </div>
            </div>

            {error && (
                <div className="text-center text-red-400 text-[9px] font-bold bg-red-950/20 py-2 rounded-lg border border-red-500/20 animate-pulse tracking-wide flex items-center justify-center gap-2">
                   <XCircle className="w-3 h-3"/> {error}
                </div>
            )}

            {/* Buttons */}
            <div className="space-y-2.5 pt-2">
                <button
                    onClick={handleUnlock}
                    disabled={loading || !inputKey}
                    className="w-full py-3.5 bg-gradient-to-r from-yellow-700 via-yellow-600 to-yellow-700 text-black font-bold rounded-xl tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group border-t border-yellow-400/30"
                >
                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:animate-shine"></div>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ShieldCheck className="w-4 h-4"/>}
                    <span className="text-xs">ACTIVATE LICENSE</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={handleOpenAdModal}
                        className="py-3 bg-slate-900 hover:bg-slate-800 text-yellow-500 font-bold rounded-xl tracking-wide border border-yellow-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                    >
                        <Gem className="w-3.5 h-3.5 group-hover:animate-bounce" />
                        <span className="text-[10px]">SPONSORED</span>
                    </button>
                    <button
                        onClick={handleContact}
                        className="py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold rounded-xl tracking-wide border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span className="text-[10px]">BUY KEY</span>
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* --- ADS MODAL (PREMIUM) --- */}
      {isAdModalOpen && (
          <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in-up">
              <div className="w-full max-w-sm bg-[#0b0f19] border border-yellow-500/30 rounded-2xl p-6 relative shadow-[0_0_60px_rgba(234,179,8,0.15)] overflow-hidden">
                  
                  {/* Modal Background FX */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                  <div className="absolute -right-10 -top-10 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl"></div>

                  <div className="text-center mb-8 relative z-10">
                      <div className="w-12 h-12 bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3 border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                          <Sparkles className="w-6 h-6 text-yellow-500" />
                      </div>
                      <h3 className="text-lg font-bold text-white font-orbitron tracking-widest">SPONSORED UNLOCK</h3>
                      <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wide">
                          Complete tasks to bypass security
                      </p>
                  </div>

                  {/* Enhanced Progress Bar */}
                  <div className="mb-6 relative z-10">
                      <div className="flex justify-between text-[10px] font-bold text-yellow-500 mb-2 uppercase tracking-wider">
                          <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Processing</span>
                          <span>{Math.round((adCount / (settings?.adsTarget || 10)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-800 overflow-hidden relative shadow-inner">
                          <div 
                             className="h-full bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.6)] transition-all duration-700 ease-out"
                             style={{ width: `${(adCount / (settings?.adsTarget || 10)) * 100}%` }}
                          ></div>
                      </div>
                      <div className="flex justify-between mt-2">
                           <span className="text-[9px] text-slate-600 font-mono">TASK_ID: #{Math.floor(Math.random() * 9999)}</span>
                           <span className="text-[9px] text-slate-400 font-mono">{adCount}/{settings?.adsTarget || 10} COMPLETED</span>
                      </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                      {adStatus === 'COOLING' ? (
                          <div className="w-full py-5 bg-slate-900/50 rounded-xl border border-yellow-500/20 flex flex-col items-center justify-center relative overflow-hidden">
                              <div className="text-3xl font-bold text-white font-mono tracking-widest drop-shadow-md">
                                  {adCooldown}<span className="text-sm text-slate-500">s</span>
                              </div>
                              <span className="text-[9px] text-yellow-500/80 font-bold tracking-[0.2em] mt-1 uppercase animate-pulse">Synchronizing...</span>
                          </div>
                      ) : (
                          <button 
                            onClick={watchNextAd}
                            disabled={isAdLoading}
                            className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
                          >
                              {isAdLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    <span>CONNECTING SERVER...</span>
                                  </>
                              ) : (
                                  <>
                                    <Play className="w-4 h-4 fill-black"/>
                                    <span>WATCH SPONSOR AD</span>
                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all"/>
                                  </>
                              )}
                          </button>
                      )}

                      <button 
                        onClick={() => setIsAdModalOpen(false)}
                        className="w-full py-2.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors tracking-widest uppercase font-bold"
                      >
                          Abort Operation
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
