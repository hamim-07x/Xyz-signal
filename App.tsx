
import React, { useState, useEffect } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { TelegramModal } from './components/TelegramModal';
import { IntroAnimation } from './components/IntroAnimation';
import { LockedView } from './components/LockedView';
import { AdminPanel } from './components/AdminPanel';
import { LicenseTimer } from './components/LicenseTimer';
import { HackSimulation } from './components/HackSimulation';
import { Wifi, Power, Clock, Activity, Signal, Terminal, Server, Shield } from 'lucide-react';
import { PredictionResult, HistoryItem, TelegramUser, GlobalSettings } from './types';
import { saveUserToFirebase, subscribeToSettings, listenToUserBanStatus } from './lib/firebase';
import { SupportProfile } from './components/SupportProfile';

// Utility for scramble text effect
const ScrambleText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [display, setDisplay] = useState(text || '');
  const chars = "0101010101XYZA";

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
  const [accuracy, setAccuracy] = useState<number>(0);
  
  // Live Clock
  const [formattedTime, setFormattedTime] = useState('');
  const [appSettings, setAppSettings] = useState<GlobalSettings>({ appName: 'NET-HUNTER', channelLink: '', contactLink: '', strictMode: false });
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cmd') === 'root') setIsAdminOpen(true);

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
      try {
        tg.setHeaderColor('#000000');
        tg.setBackgroundColor('#000000');
      } catch (e) { console.log("Header color not supported"); }
      
      const user = tg.initDataUnsafe?.user || { id: 1001, first_name: "GUEST_NODE" };
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
    const interval = setInterval(() => setPing(Math.floor(Math.random() * (45 - 15) + 15)), 2000);
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

  // --- ANALYZED SIGNAL LOGIC ---
  const handleHack = () => {
    if (isAnalyzing || timeLeft <= 5 || lastPredictedPeriod === period) return;

    setIsAnalyzing(true);
    setCurrentPrediction(null);
    setAccuracy(0);

    // Simulation Timer
    setTimeout(() => {
      // 1. Generate Number (Logic extracted from analysis: Standard Wingo RNG)
      const rand = Math.floor(Math.random() * 10);
      
      // 2. Determine Size
      const isBig = rand >= 5; // 5-9 is Big, 0-4 is Small
      
      // 3. Determine Color (Standard Rules)
      let color: 'Red' | 'Green' | 'Violet';
      if (rand === 0 || rand === 5) {
          color = 'Violet'; 
      } else if (rand % 2 === 1) {
          color = 'Green';
      } else {
          color = 'Red';
      }

      const result: PredictionResult = {
        number: rand,
        size: isBig ? 'Big' : 'Small',
        color: color
      };
      
      setCurrentPrediction(result);
      setAccuracy(Math.floor(Math.random() * (100 - 88) + 88)); // 88-100% fake accuracy
      setIsAnalyzing(false);
      setLastPredictedPeriod(period);
      setHistory(prev => [{ period, result, timestamp: new Date().toLocaleTimeString('en-US',{hour12:false}) }, ...prev].slice(0, 10));
    }, 3000); 
  };

  if (showIntro) return <IntroAnimation appName={appSettings.appName} onComplete={() => setShowIntro(false)} />;

  if (isBanned) return (
      <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-6 text-center font-mono">
          <div className="border border-red-600 p-8 w-full max-w-sm relative overflow-hidden bg-red-950/10">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,0,0,0.1)_10px,rgba(255,0,0,0.1)_20px)]"></div>
              <Shield className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse relative z-10" />
              <h1 className="text-2xl font-bold text-red-500 tracking-widest glitch-effect relative z-10">ACCESS DENIED</h1>
              <p className="mt-4 text-red-400 text-xs tracking-widest relative z-10">NODE HAS BEEN BLACKLISTED BY ADMIN</p>
          </div>
      </div>
  );

  return (
    <div className="relative h-screen w-full overflow-hidden flex flex-col font-sans select-none bg-[#050505] text-[#e0e0e0]">
      <BackgroundEffects />
      
      {/* VIGNETTE OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_50%,#000_100%)]"></div>

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

        {/* --- HEADER --- */}
        <div className="px-4 py-3 flex justify-between items-center bg-[#050505]/80 backdrop-blur-sm border-b border-[#00ff41]/20">
            <div className="flex items-center gap-3">
                <div className="relative w-9 h-9">
                    <div className="absolute inset-0 border border-[#00ff41] rounded-sm transform rotate-45"></div>
                    <img src={telegramUser?.photo_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} alt="U" className="w-full h-full rounded-sm object-cover relative z-10 grayscale hover:grayscale-0 transition-all" />
                </div>
                <div className="leading-tight">
                    <h2 className="text-[10px] font-bold text-[#00ff41] font-mono tracking-widest">{telegramUser?.first_name.toUpperCase()}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-[#00ff41] rounded-full animate-pulse"></span>
                        <span className="text-[8px] font-mono text-gray-400">CONNECTED</span>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <div className="flex items-center justify-end gap-2 text-[8px] text-[#00ff41] font-mono mb-0.5">
                    <Wifi className="w-3 h-3" />
                    <span>{ping}ms</span>
                </div>
                <div className="text-[12px] font-bold text-white font-orbitron tracking-widest text-glow">
                    <ScrambleText text={appSettings.appName || "SYSTEM"} />
                </div>
            </div>
        </div>

        {/* --- MAIN DASHBOARD --- */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-5">
            
            {/* DATA DISPLAY */}
            <div className="tech-border p-4 relative overflow-hidden bg-[#0a0a0a]/90">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-[#008F11] font-mono tracking-widest uppercase">Target_Period</span>
                        <span className="text-xl font-mono text-white font-bold tracking-widest drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">
                            {period.slice(10)}
                        </span>
                    </div>
                    <div className="text-right flex flex-col items-end">
                        <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold tracking-widest ${timeLeft <= 5 ? 'text-[#ff003c] animate-pulse' : 'text-[#00ff41]'}`}>
                                {timeLeft <= 5 ? 'LOCKING' : 'OPEN'}
                            </span>
                            <Server className="w-3 h-3 text-gray-500"/>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-[#111] h-1.5 mb-2 overflow-hidden border border-[#222]">
                    <div 
                        className={`h-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-[#ff003c]' : 'bg-[#00ff41]'}`}
                        style={{ width: `${(timeLeft / 60) * 100}%` }}
                    ></div>
                </div>
                
                <div className="flex justify-center">
                    <span className={`text-4xl font-black font-mono tracking-widest ${timeLeft <= 10 ? 'text-[#ff003c]' : 'text-white'}`}>
                        {timeLeft.toString().padStart(2, '0')}
                    </span>
                </div>
            </div>

            {isLicenseValid ? (
               <div className="flex-1 flex flex-col items-center justify-start min-h-[320px]">
                   <LicenseTimer expiryTimestamp={licenseExpiry} onExpire={() => setIsLicenseValid(false)} />
                   
                   {/* REACTOR CORE BUTTON */}
                   <div className="relative w-56 h-56 flex items-center justify-center mt-6">
                       
                       {/* Spinning Outer Ring */}
                       <div className={`absolute inset-0 border-[1px] border-[#003300] rounded-full ${isAnalyzing ? 'animate-[spin_2s_linear_infinite]' : 'animate-spin-slow'}`}>
                           <div className="absolute top-0 left-1/2 w-2 h-2 bg-[#00ff41] rounded-full -translate-x-1/2 -translate-y-1/2 box-shadow-[0_0_10px_#00ff41]"></div>
                       </div>
                       
                       {/* Counter-Spinning Inner */}
                       <div className={`absolute inset-6 border-[1px] border-[#00ff41]/20 rounded-full ${isAnalyzing ? 'animate-[spin_1s_linear_infinite_reverse]' : 'animate-spin-reverse'}`}></div>

                       {/* Main Button */}
                       <button
                           onClick={handleHack}
                           disabled={timeLeft <= 5 || isAnalyzing || lastPredictedPeriod === period}
                           className={`relative z-20 w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 group
                             ${isAnalyzing 
                                ? 'bg-black border-2 border-[#00ff41] shadow-[0_0_30px_#00ff41] scale-95' 
                                : timeLeft <= 5 || lastPredictedPeriod === period
                                    ? 'bg-[#111] border border-[#333] opacity-80 cursor-not-allowed'
                                    : 'bg-black border-2 border-[#008F11] hover:border-[#00ff41] shadow-[0_0_15px_#008F11] hover:shadow-[0_0_25px_#00ff41] active:scale-95'
                             }
                           `}
                       >
                           {/* Button Content */}
                           {isAnalyzing ? (
                               <HackSimulation />
                           ) : currentPrediction && lastPredictedPeriod === period ? (
                               <div className="flex flex-col items-center animate-scale-in">
                                   <div className={`text-3xl font-black font-orbitron tracking-widest ${currentPrediction.size === 'Big' ? 'text-yellow-400' : 'text-[#00f3ff]'} text-glow`}>
                                       {currentPrediction.size.toUpperCase()}
                                   </div>
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white mt-2 border-2 border-white/20 shadow-lg relative
                                       ${currentPrediction.color === 'Green' ? 'bg-[#00b33c]' : currentPrediction.color === 'Red' ? 'bg-[#e60036]' : 'bg-[#8c00ff]'}
                                   `}>
                                       <span className="text-lg relative z-10">{currentPrediction.number}</span>
                                       {currentPrediction.color === 'Violet' && (
                                           <div className={`absolute -right-1 -top-1 w-4 h-4 rounded-full border border-black ${currentPrediction.number === 0 ? 'bg-[#e60036]' : 'bg-[#00b33c]'}`}></div>
                                       )}
                                   </div>
                               </div>
                           ) : (
                               <div className="flex flex-col items-center">
                                   <Power className={`w-10 h-10 ${timeLeft <= 5 ? 'text-[#333]' : 'text-[#00ff41] group-hover:text-white transition-colors'}`} />
                                   <span className={`text-[10px] font-orbitron font-bold mt-2 tracking-[0.2em] ${timeLeft <= 5 ? 'text-[#333]' : 'text-[#008F11] group-hover:text-[#00ff41]'}`}>
                                       {timeLeft <= 5 ? 'LOCKED' : 'INITIALIZE'}
                                   </span>
                               </div>
                           )}
                       </button>
                   </div>

                   {/* Status Readout */}
                   <div className="mt-6 w-full text-center h-8">
                       {timeLeft <= 5 ? (
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#220000] border border-[#ff003c]/30 rounded">
                               <span className="w-1.5 h-1.5 bg-[#ff003c] rounded-full animate-ping"></span>
                               <span className="text-[9px] font-mono font-bold text-[#ff003c] tracking-widest">NETWORK_LOCKED</span>
                           </div>
                       ) : isAnalyzing ? (
                           <span className="text-[#00ff41] font-mono text-xs animate-pulse tracking-widest">...DECRYPTING_PACKETS...</span>
                       ) : lastPredictedPeriod === period && currentPrediction ? (
                           <div className="flex flex-col items-center">
                               <span className="text-[#00ff41] font-mono text-[10px] tracking-widest mb-1">SUCCESSFUL_DECRYPTION</span>
                               <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#00ff41]/10 rounded border border-[#00ff41]/20">
                                   <Signal className="w-3 h-3 text-yellow-500"/>
                                   <span className="text-[9px] font-mono text-white">CONFIDENCE: {accuracy}%</span>
                               </div>
                           </div>
                       ) : (
                           <span className="text-gray-600 font-mono text-[10px] tracking-widest">SYSTEM_READY // AWAITING_INPUT</span>
                       )}
                   </div>
               </div>
            ) : (
               <LockedView telegramId={telegramUser?.id || 0} onSuccess={handleLoginSuccess} contactLink={appSettings.contactLink} onOpenSupport={() => setIsSupportOpen(true)} settings={appSettings} />
            )}
            
        </div>

        {/* --- BOTTOM DATA STREAM --- */}
        {isLicenseValid && (
            <div className="bg-[#080808] border-t border-[#00ff41]/20 h-24 overflow-hidden relative flex flex-col">
                <div className="px-2 py-1 flex justify-between items-center bg-[#001100] border-b border-[#003300]">
                    <span className="text-[8px] text-[#008F11] font-mono uppercase">DATA_STREAM_LOG</span>
                    <Activity className="w-3 h-3 text-[#008F11] animate-pulse"/>
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar p-2 h-full items-center">
                    {history.length === 0 ? (
                        <div className="w-full text-center text-[9px] text-[#003300] font-mono uppercase tracking-widest animate-pulse">
                            WAITING_FOR_DATA...
                        </div>
                    ) : (
                        history.map((h, i) => (
                           <div key={i} className="min-w-[80px] h-full bg-[#0a0a0a] border border-[#003300] rounded p-2 flex flex-col items-center justify-center shrink-0 relative overflow-hidden group hover:border-[#00ff41] transition-colors">
                               <div className={`absolute top-0 left-0 w-full h-0.5 ${h.result.color === 'Green' ? 'bg-[#00b33c]' : h.result.color === 'Red' ? 'bg-[#e60036]' : 'bg-[#8c00ff]'}`}></div>
                               <span className="text-[8px] text-gray-500 font-mono mb-1">{h.period.slice(-4)}</span>
                               <div className="flex items-center gap-1">
                                   <span className={`text-xs font-bold font-orbitron ${h.result.size === 'Big' ? 'text-yellow-400' : 'text-[#00f3ff]'}`}>{h.result.size.toUpperCase()}</span>
                               </div>
                               <div className={`mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                                   ${h.result.color === 'Green' ? 'bg-[#00b33c]' : h.result.color === 'Red' ? 'bg-[#e60036]' : 'bg-[#8c00ff]'}
                               `}>
                                   {h.result.number}
                               </div>
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
