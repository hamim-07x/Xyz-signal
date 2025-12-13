
import React, { useState } from 'react';
import { ShieldCheck, Loader2, CreditCard, Gem, Crown, Sparkles, Lock, Play, XCircle, ArrowRight, Key, AlertOctagon } from 'lucide-react';
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
             setError(result.message || 'INVALID_ENCRYPTION_KEY');
             setLoading(false);
        }
    } catch (err) {
        setError('SERVER_UNREACHABLE');
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
          setError(`LIMIT_REACHED_${limit}/${limit}`);
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
              setError("REWARD_GENERATION_FAILED");
              setLoading(false);
          }
      }
  };

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-4 relative animate-fade-in-up">
      
      {/* Container with Hexagon Background */}
      <div className="w-full max-w-[320px] bg-black/80 backdrop-blur-xl border border-[#ffd700]/20 rounded-2xl p-6 relative overflow-hidden shadow-[0_0_50px_rgba(255,215,0,0.1)]">
          
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ffd700] to-transparent animate-[scan_3s_linear_infinite] opacity-50"></div>
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#ffd700]/10 rounded-full blur-3xl"></div>

          {/* Header */}
          <div className="text-center mb-8 relative">
              <div className="inline-flex items-center justify-center p-3 rounded-full border border-[#ffd700]/50 bg-[#ffd700]/10 mb-3 shadow-[0_0_15px_rgba(255,215,0,0.3)] animate-pulse">
                  <Crown className="w-6 h-6 text-[#ffd700]" />
              </div>
              <h2 className="text-xl font-bold font-orbitron text-white tracking-[0.2em]">VIP ACCESS</h2>
              <p className="text-[10px] font-mono text-[#ffd700] mt-1 tracking-widest">SYSTEM LOCKED // REQUIRES KEY</p>
          </div>

          {/* Key Input */}
          <div className="space-y-5 relative z-10">
              <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ffd700] to-[#b8860b] rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  <div className="relative bg-black border border-[#ffd700]/30 rounded-lg flex items-center p-1">
                      <div className="pl-3">
                          <Key className="w-4 h-4 text-[#ffd700]/70" />
                      </div>
                      <input 
                          type="text" 
                          value={inputKey}
                          onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                          placeholder="XXXX-XXXX-XXXX"
                          className="w-full bg-transparent border-none text-center text-[#ffd700] font-mono text-sm font-bold tracking-[0.15em] focus:outline-none p-3 placeholder-[#ffd700]/20"
                      />
                  </div>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 text-[#ff003c] text-[10px] font-bold font-mono bg-[#ff003c]/10 py-2 rounded border border-[#ff003c]/30 animate-pulse">
                   <AlertOctagon className="w-3 h-3"/> {error}
                </div>
              )}

              {/* Main Unlock Button */}
              <button
                  onClick={handleUnlock}
                  disabled={loading || !inputKey}
                  className="w-full py-4 bg-gradient-to-r from-[#ffd700] via-[#e5c100] to-[#ffd700] text-black font-bold font-orbitron text-sm tracking-widest rounded-lg shadow-[0_0_20px_rgba(255,215,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                  <div className="absolute top-0 -left-[100%] w-full h-full bg-white/30 skew-x-12 group-hover:animate-[shine_1s_infinite]"></div>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <ShieldCheck className="w-4 h-4"/>}
                  <span>AUTHENTICATE</span>
              </button>

              <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                      onClick={handleOpenAdModal}
                      className="flex-1 py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-[#ffd700]/20 hover:border-[#ffd700]/50 rounded-lg text-[#ffd700] text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                      <Gem className="w-3 h-3" /> SPONSORED
                  </button>
                  <button
                      onClick={handleContact}
                      className="flex-1 py-3 bg-[#1a1a1a] hover:bg-[#252525] border border-blue-500/20 hover:border-blue-500/50 rounded-lg text-blue-400 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                      <CreditCard className="w-3 h-3" /> PURCHASE
                  </button>
              </div>
          </div>
      </div>

      {/* --- ADS MODAL (CYBER STYLE) --- */}
      {isAdModalOpen && (
          <div className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md animate-fade-in-up">
              <div className="w-full max-w-sm bg-black border border-[#ffd700]/40 rounded-xl p-6 relative shadow-[0_0_100px_rgba(255,215,0,0.2)] overflow-hidden">
                  
                  {/* Holo Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,215,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,215,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                  <div className="text-center mb-6 relative z-10">
                      <Sparkles className="w-8 h-8 text-[#ffd700] mx-auto mb-2 animate-spin-slow" />
                      <h3 className="text-lg font-bold text-white font-orbitron tracking-widest">DECRYPTING DATA</h3>
                      <p className="text-[9px] text-gray-400 mt-2 font-mono uppercase">
                          Task completion required for access grant
                      </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6 relative z-10">
                      <div className="flex justify-between text-[10px] font-mono text-[#ffd700] mb-2">
                          <span>PROGRESS</span>
                          <span>{Math.round((adCount / (settings?.adsTarget || 10)) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden border border-[#ffd700]/20">
                          <div 
                             className="h-full bg-[#ffd700] shadow-[0_0_10px_#ffd700] transition-all duration-500"
                             style={{ width: `${(adCount / (settings?.adsTarget || 10)) * 100}%` }}
                          ></div>
                      </div>
                      <div className="text-right text-[8px] text-gray-500 font-mono mt-1">
                          PACKET {adCount}/{settings?.adsTarget || 10}
                      </div>
                  </div>

                  <div className="space-y-3 relative z-10">
                      {adStatus === 'COOLING' ? (
                          <div className="w-full py-6 border border-[#ffd700]/20 bg-[#ffd700]/5 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold text-white font-mono tracking-widest">
                                  {adCooldown}<span className="text-sm text-gray-500">s</span>
                              </div>
                              <span className="text-[8px] text-[#ffd700] font-mono tracking-[0.2em] mt-1 animate-pulse">ESTABLISHING LINK...</span>
                          </div>
                      ) : (
                          <button 
                            onClick={watchNextAd}
                            disabled={isAdLoading}
                            className="w-full py-4 bg-[#ffd700] hover:bg-[#ffed4a] text-black font-bold font-orbitron tracking-widest rounded-lg shadow-[0_0_30px_rgba(255,215,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                              {isAdLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4 fill-black"/>}
                              <span>{isAdLoading ? 'PROCESSING...' : 'EXECUTE TASK'}</span>
                          </button>
                      )}

                      <button 
                        onClick={() => setIsAdModalOpen(false)}
                        className="w-full py-2 text-[10px] text-gray-500 hover:text-white transition-colors tracking-widest font-mono border border-white/10 rounded"
                      >
                          ABORT
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
