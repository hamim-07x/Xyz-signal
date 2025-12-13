
import React, { useState, useEffect, useCallback } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { TelegramModal } from './components/TelegramModal';
import { IntroAnimation } from './components/IntroAnimation';
import { LockedView } from './components/LockedView';
import { AdminPanel } from './components/AdminPanel';
import { LicenseTimer } from './components/LicenseTimer';
import { HackSimulation } from './components/HackSimulation';
import { Wifi, Power, User, Trash2, Clock, Ban, Activity, Radio, Cpu } from 'lucide-react';
import { PredictionResult, HistoryItem, TelegramUser, GlobalSettings } from './types';
import { saveUserToFirebase, subscribeToSettings, listenToUserBanStatus } from './lib/firebase';
import { SupportProfile } from './components/SupportProfile';

const ScrambleText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [display, setDisplay] = useState(text || '');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

  useEffect(() => {
    if (!text) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 40);
    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{display}</span>;
};

function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isChannelVerified, setIsChannelVerified] = useState(false);
  const [isLicenseValid, setIsLicenseValid] = useState(false);
  const [licenseExpiry, setLicenseExpiry] = useState(0);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [ping, setPing] = useState(24);
  const [isBanned, setIsBanned] = useState(false);
  
  // Game Logic
  const [timeLeft, setTimeLeft] = useState(0);
  const [period, setPeriod] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [lastPredictedPeriod, setLastPredictedPeriod] = useState<string>('');
  
  // Live Clock
  const [formattedTime, setFormattedTime] = useState('');
  const [appSettings, setAppSettings] = useState<GlobalSettings>({ appName: 'CYBER-HUNTER', channelLink: '', contactLink: '', strictMode: false });
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cmd') === 'admin') setIsAdminOpen(true);

    const unsubscribe = subscribeToSettings((settings) => {
        if (settings) {
            setAppSettings(settings);
            if(settings.appName) document.title = settings.appName;
        }
    });

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      const user = tg.initDataUnsafe?.user || { id: 1001, first_name: "GUEST" };
      setTelegramUser(user);
      checkLocalLicense(user.id);
      saveUserToFirebase(user);
    } else {
       setTelegramUser({ id: 1001, first_name: "WEB_USER" });
       checkLocalLicense(1001);
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (telegramUser?.id) {
        return listenToUserBanStatus(telegramUser.id, setIsBanned);
    }
  }, [telegramUser]);

  useEffect(() => {
    const interval = setInterval(() => setPing(Math.floor(Math.random() * (50 - 15) + 15)), 2000);
    return () => clearInterval(interval);
  }, []);

  const checkLocalLicense = (userId: number) => {
    const savedExpiry = localStorage.getItem(`xhunter_license_${userId}`);
    if (savedExpiry && parseInt(savedExpiry) > Date.now()) {
        setIsLicenseValid(true);
        setLicenseExpiry(parseInt(savedExpiry));
    }
  };

  useEffect(() => {
    const updateGameData = () => {
      const now = new Date();
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const dhakaTime = new Date(utcTime + (3600000 * 6));
      setFormattedTime(`${String(dhakaTime.getHours()).padStart(2,'0')}:${String(dhakaTime.getMinutes()).padStart(2,'0')}:${String(dhakaTime.getSeconds()).padStart(2,'0')}`);

      const totalMinutes = (now.getUTCHours() * 60) + now.getUTCMinutes();
      const newPeriod = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}10001${String(totalMinutes + 1).padStart(4, '0')}`;
      if (newPeriod !== period) setPeriod(newPeriod);
      
      const s = now.getUTCSeconds();
      setTimeLeft(60 - s === 60 ? 0 : 60 - s);
    };
    const interval = setInterval(updateGameData, 1000);
    updateGameData();
    return () => clearInterval(interval);
  }, [period]);

  const handleLoginSuccess = (newExpiry: number) => {
      setLicenseExpiry(newExpiry);
      setIsLicenseValid(true);
  };

  const handleHack = () => {
    if (isAnalyzing || timeLeft <= 5 || lastPredictedPeriod === period) return;

    setIsAnalyzing(true);
    setCurrentPrediction(null);

    setTimeout(() => {
      const rand = Math.floor(Math.random() * 10);
      const isBig = rand >= 5;
      const result: PredictionResult = {
        number: rand,
        size: isBig ? 'Big' : 'Small',
        color: rand === 0 || rand === 5 ? 'Violet' : (rand % 2 === 1 ? 'Green' : 'Red')
      };
      
      setCurrentPrediction(result);
      setIsAnalyzing(false);
      setLastPredictedPeriod(period);
      setHistory(prev => [{ period, result, timestamp: new Date().toLocaleTimeString('en-US',{hour12:false}) }, ...prev].slice(0, 10));
    }, 3500); // 3.5s for cool animation
  };

  if (showIntro) return <IntroAnimation appName={appSettings.appName} onComplete={() => setShowIntro(false)} />;

  if (isBanned) return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6 text-center font-mono">
          <div className="border border-red-500 p-8 rounded bg-red-950/20 shadow-[0_0_50px_red]">
              <Ban className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
              <h1 className="text-3xl font-bold text-red-500 tracking-widest glitch-text" data-text="TERMINATED">TERMINATED</h1>
              <p className="mt-4 text-red-400">CONNECTION SEVERED BY ADMIN</p>
          </div>
      </div>
  );

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-sans select-none bg-[#050505]">
      <BackgroundEffects />
      
      {/* HUD OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black via-transparent to-transparent opacity-80"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
      </div>

      {!isChannelVerified && (
        <TelegramModal 
          onVerify={() => setIsChannelVerified(true)} 
          channelLink={appSettings.channelLink}
          strictMode={appSettings.strictMode}
          botToken={appSettings.botToken}
          channelChatId={appSettings.channelChatId}
          telegramUserId={telegramUser?.id}
          telegramPhoto={telegramUser?.photo_url}
          telegramName={telegramUser?.first_name}
        />
      )}
      
      <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} onClearHistory={() => setHistory([])} />
      <SupportProfile isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} adminName="SUPPORT AGENT" adminImageUrl={appSettings.adminImageUrl} contactLink={appSettings.contactLink} />

      {/* --- APP CONTAINER --- */}
      <div className={`flex flex-col h-full w-full z-10 transition-opacity duration-1000 ${isChannelVerified ? 'opacity-100' : 'opacity-0'}`}>

        {/* --- TOP BAR --- */}
        <div className="px-4 py-3 flex justify-between items-center backdrop-blur-md border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                    <div className="absolute inset-0 bg-[#00f3ff] rounded-full blur-md opacity-50 animate-pulse"></div>
                    <img src={telegramUser?.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="U" className="w-full h-full rounded-full object-cover relative z-10 border border-[#00f3ff]" />
                </div>
                <div>
                    <h2 className="text-xs font-bold text-white font-orbitron tracking-widest">{telegramUser?.first_name || 'AGENT'}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-1 bg-[#00f3ff]/10 px-1.5 py-0.5 rounded border border-[#00f3ff]/30">
                            <Activity className="w-2.5 h-2.5 text-[#00f3ff]" />
                            <span className="text-[8px] font-mono text-[#00f3ff]">{formattedTime}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[8px] text-gray-500 font-mono mb-1">
                    <Wifi className="w-2.5 h-2.5 text-green-500" />
                    <span>{ping} MS</span>
                </div>
                <div className="text-[10px] font-bold text-white font-orbitron tracking-[0.2em] text-shadow-glow">
                    <ScrambleText text={appSettings.appName || "SYSTEM"} />
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4">
            
            {/* DATA CARD */}
            <div className="cyber-card rounded-xl p-4 flex flex-col items-center justify-center relative">
                <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#00f3ff]"></div>
                <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#00f3ff]"></div>
                
                <span className="text-[9px] text-gray-400 font-mono tracking-[0.3em] mb-1">TARGET_PERIOD</span>
                <div className="text-2xl font-bold font-mono text-[#00f3ff] tracking-widest drop-shadow-[0_0_10px_#00f3ff]">
                    {period.slice(0,8)}-<span className="text-white">{period.slice(8)}</span>
                </div>
                
                <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-2"></div>
                
                <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-red-500 animate-ping' : 'text-gray-400'}`} />
                    <span className={`text-xl font-bold font-mono tracking-widest ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                        00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {isLicenseValid ? (
               <div className="flex-1 flex flex-col items-center justify-center min-h-[300px]">
                   <LicenseTimer expiryTimestamp={licenseExpiry} onExpire={() => setIsLicenseValid(false)} />
                   
                   {/* REACTOR BUTTON */}
                   <div className="relative w-48 h-48 flex items-center justify-center mt-6">
                       {/* Background Rings */}
                       <div className={`absolute inset-0 border border-[#00f3ff]/30 rounded-full ${isAnalyzing ? 'animate-[spin_1s_linear_infinite]' : 'animate-spin-slow'}`}></div>
                       <div className={`absolute inset-4 border border-dashed border-[#bc13fe]/40 rounded-full ${isAnalyzing ? 'animate-[spin_2s_linear_infinite_reverse]' : 'animate-spin-reverse'}`}></div>
                       
                       {/* Core Button */}
                       <button
                           onClick={handleHack}
                           disabled={timeLeft <= 5 || isAnalyzing || lastPredictedPeriod === period}
                           className={`relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300
                             ${isAnalyzing 
                                ? 'bg-red-900/20 shadow-[0_0_50px_red] scale-95 border-2 border-red-500' 
                                : 'bg-black/50 shadow-[0_0_30px_#00f3ff] hover:scale-105 active:scale-95 border-2 border-[#00f3ff]'
                             }
                           `}
                       >
                           {/* Button Content */}
                           {isAnalyzing ? (
                               <HackSimulation />
                           ) : currentPrediction && lastPredictedPeriod === period ? (
                               <div className="flex flex-col items-center animate-scale-in">
                                   <div className={`text-2xl font-black font-orbitron tracking-widest ${currentPrediction.size === 'Big' ? 'text-yellow-400' : 'text-cyan-400'} drop-shadow-md`}>
                                       {currentPrediction.size}
                                   </div>
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white mt-1 border-2 border-white/30 shadow-lg
                                       ${currentPrediction.color === 'Green' ? 'bg-green-600' : currentPrediction.color === 'Red' ? 'bg-red-600' : 'bg-purple-600'}
                                   `}>
                                       {currentPrediction.number}
                                   </div>
                               </div>
                           ) : (
                               <div className="flex flex-col items-center">
                                   <Power className={`w-8 h-8 ${timeLeft <= 5 ? 'text-gray-600' : 'text-[#00f3ff] animate-pulse'}`} />
                                   <span className={`text-[10px] font-orbitron font-bold mt-1 tracking-widest ${timeLeft <= 5 ? 'text-gray-600' : 'text-white'}`}>
                                       {timeLeft <= 5 ? 'LOCKED' : 'INFILTRATE'}
                                   </span>
                               </div>
                           )}
                       </button>

                       {/* Particles when analyzing */}
                       {isAnalyzing && (
                          <div className="absolute inset-0 rounded-full border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                       )}
                   </div>

                   {/* Status Text */}
                   <div className="mt-8 text-center h-6">
                       {timeLeft <= 5 ? (
                           <span className="text-red-500 font-mono text-xs font-bold bg-red-950/30 px-3 py-1 rounded border border-red-800">⚠️ TRADE RESTRICTED</span>
                       ) : isAnalyzing ? (
                           <span className="text-[#00f3ff] font-mono text-xs animate-pulse">BYPASSING FIREWALL...</span>
                       ) : lastPredictedPeriod === period ? (
                           <span className="text-green-400 font-mono text-xs tracking-widest">DATA EXTRACTED SUCCESSFULLY</span>
                       ) : (
                           <span className="text-gray-500 font-mono text-xs tracking-widest">AWAITING COMMAND</span>
                       )}
                   </div>
               </div>
            ) : (
               <LockedView telegramId={telegramUser?.id || 0} onSuccess={handleLoginSuccess} contactLink={appSettings.contactLink} onOpenSupport={() => setIsSupportOpen(true)} settings={appSettings} />
            )}
            
        </div>

        {/* --- BOTTOM STREAM --- */}
        {isLicenseValid && (
            <div className="bg-black/80 backdrop-blur-md border-t border-white/5 p-2 h-20 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-30"></div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 h-full items-center px-2">
                    {history.length === 0 ? (
                        <div className="w-full text-center text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                            NO_DATA_STREAM_FOUND
                        </div>
                    ) : (
                        history.map((h, i) => (
                           <div key={i} className="min-w-[70px] bg-[#0a0a0a] border border-white/10 rounded p-1.5 flex flex-col items-center shrink-0 relative overflow-hidden group">
                               <div className={`absolute bottom-0 left-0 h-[2px] w-full ${h.result.color === 'Green' ? 'bg-green-500' : h.result.color === 'Red' ? 'bg-red-500' : 'bg-purple-500'}`}></div>
                               <span className="text-[8px] text-gray-500 font-mono">{h.period.slice(-4)}</span>
                               <span className={`text-xs font-bold ${h.result.size === 'Big' ? 'text-yellow-400' : 'text-cyan-400'}`}>{h.result.size}</span>
                           </div> 
                        ))
                    )}
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

export default App;
