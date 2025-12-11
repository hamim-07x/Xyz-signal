
import React, { useState, useEffect, useCallback } from 'react';
import { BackgroundEffects } from './components/BackgroundEffects';
import { TelegramModal } from './components/TelegramModal';
import { IntroAnimation } from './components/IntroAnimation';
import { LockedView } from './components/LockedView';
import { AdminPanel } from './components/AdminPanel';
import { LicenseTimer } from './components/LicenseTimer';
import { HackSimulation } from './components/HackSimulation';
import { Wifi, Power, User, Trash2, Clock } from 'lucide-react';
import { PredictionResult, HistoryItem, TelegramUser, GlobalSettings } from './types';
import { saveUserToFirebase } from './lib/firebase';
import { SupportProfile } from './components/SupportProfile';

// --- SCRAMBLE TEXT COMPONENT ---
const ScrambleText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [display, setDisplay] = useState(text || '');
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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
  
  // Note: Admin Tap Count state removed (Link Only Access)

  // Game Logic
  const [timeLeft, setTimeLeft] = useState(0);
  const [period, setPeriod] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [lastPredictedPeriod, setLastPredictedPeriod] = useState<string>('');
  
  // Live Clock State
  const [formattedTime, setFormattedTime] = useState('');

  const [appSettings, setAppSettings] = useState<GlobalSettings>({ appName: 'X-HUNTER', channelLink: '', contactLink: '', strictMode: false });
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Initialization
  useEffect(() => {
    // Check URL for Secret Admin Command
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('cmd') === 'admin') {
        setIsAdminOpen(true);
    }

    const savedSettings = localStorage.getItem('xhunter_settings');
    if (savedSettings) {
      try { 
        const parsed = JSON.parse(savedSettings);
        setAppSettings(parsed); 
        if(parsed.appName) document.title = parsed.appName;
      } catch (e) {}
    }

    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#000000');
      
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user);
        checkLocalLicense(user.id);
        saveUserToFirebase(user);
      } else {
        const guestId = 1001; 
        setTelegramUser({ id: guestId, first_name: "GUEST" });
        checkLocalLicense(guestId);
      }
    } else {
       const guestId = 1001;
       setTelegramUser({ id: guestId, first_name: "WEB_USER" });
       checkLocalLicense(guestId);
    }
  }, []);

  // Ping Sim
  useEffect(() => {
    const interval = setInterval(() => {
        setPing(Math.floor(Math.random() * (50 - 15) + 15));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkLocalLicense = (userId: number) => {
    const savedExpiry = localStorage.getItem(`xhunter_license_${userId}`);
    const now = Date.now();
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      if (expiryTime > now) {
        setIsLicenseValid(true);
        setLicenseExpiry(expiryTime);
      } else {
        setIsLicenseValid(false);
      }
    }
  };

  // Sync Settings
  useEffect(() => {
    const interval = setInterval(() => {
       const savedSettings = localStorage.getItem('xhunter_settings');
       if (savedSettings) {
         try {
           const parsed = JSON.parse(savedSettings);
           if (JSON.stringify(parsed) !== JSON.stringify(appSettings)) {
             setAppSettings(parsed);
           }
         } catch(e) {}
       }
    }, 2000);
    return () => clearInterval(interval);
  }, [appSettings]);

  // Wingo Logic & Live Clock - UTC+6 (Bangladesh Time)
  useEffect(() => {
    const updateGameData = () => {
      // 1. Get current UTC time
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      
      // 2. Convert to Dhaka Time (UTC + 6 hours)
      const dhakaTime = new Date(utc + (3600000 * 6));

      // --- CLOCK UPDATE ---
      const h = String(dhakaTime.getHours()).padStart(2, '0');
      const m = String(dhakaTime.getMinutes()).padStart(2, '0');
      const s = String(dhakaTime.getSeconds()).padStart(2, '0');
      setFormattedTime(`${h}:${m}:${s}`);

      // --- PERIOD UPDATE ---
      const year = dhakaTime.getFullYear();
      const month = String(dhakaTime.getMonth() + 1).padStart(2, '0');
      const day = String(dhakaTime.getDate()).padStart(2, '0');
      
      const hours = dhakaTime.getHours();
      const minutes = dhakaTime.getMinutes();
      const seconds = dhakaTime.getSeconds();
      
      const totalMinutes = (hours * 60) + minutes;
      const periodSequence = String(totalMinutes + 1).padStart(4, '0');
      
      const newPeriod = `${year}${month}${day}01${periodSequence}`;
      
      if (newPeriod !== period) {
          setPeriod(newPeriod);
      }
      
      const remaining = 60 - seconds;
      setTimeLeft(remaining === 60 ? 0 : remaining);
    };
    
    const interval = setInterval(updateGameData, 1000);
    updateGameData();
    return () => clearInterval(interval);
  }, [period]);

  const handleLoginSuccess = (newExpiry: number) => {
      setLicenseExpiry(newExpiry);
      setIsLicenseValid(true);
  };

  const handleClearHistory = useCallback(() => {
      setHistory([]);
  }, []);

  const handleHack = () => {
    if (isAnalyzing || timeLeft <= 5) return;
    if (lastPredictedPeriod === period) return;

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
      setHistory(prev => [{ period, result, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false}) }, ...prev].slice(0, 10));
    }, 3000);
  };

  const handleIntroComplete = useCallback(() => {
      setShowIntro(false);
  }, []);

  if (showIntro) {
    return <IntroAnimation appName={appSettings.appName} onComplete={handleIntroComplete} />;
  }

  return (
    <div className="relative h-screen w-full bg-black text-white overflow-hidden font-sans select-none flex flex-col">
      <BackgroundEffects />
      
      {/* GLOBAL OVERLAYS */}
      <div className="scanlines pointer-events-none"></div>
      <div className="scan-overlay pointer-events-none"></div>

      {!isChannelVerified && (
        <TelegramModal 
          onVerify={() => { setIsChannelVerified(true); }} 
          channelLink={appSettings.channelLink}
          strictMode={appSettings.strictMode}
          botToken={appSettings.botToken}
          channelChatId={appSettings.channelChatId}
          telegramUserId={telegramUser?.id}
          telegramPhoto={telegramUser?.photo_url}
          telegramName={telegramUser?.first_name}
        />
      )}
      
      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)} 
        onClearHistory={handleClearHistory}
      />

       <SupportProfile 
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        adminName="ADMIN SUPPORT"
        adminImageUrl={appSettings.adminImageUrl}
        contactLink={appSettings.contactLink}
      />

      {/* --- HEADER --- */}
      <div className="relative z-20 px-4 pt-4 pb-2 flex justify-between items-start bg-black/40 border-b border-white/5 backdrop-blur-md">
            {/* Left: Avatar, Info & Live Clock */}
            <div className="flex items-center gap-3 mt-1">
                 <div className="w-10 h-10 rounded-full border border-cyan-500/50 p-0.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0">
                     {telegramUser?.photo_url ? (
                         <img src={telegramUser.photo_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                     ) : (
                         <div className="w-full h-full rounded-full bg-cyan-950 flex items-center justify-center">
                             <User className="w-5 h-5 text-cyan-400" />
                         </div>
                     )}
                 </div>
                 <div className="flex flex-col justify-center">
                    <span className="text-sm font-bold text-white font-orbitron leading-none tracking-wide">
                        {telegramUser?.first_name || 'GUEST'}
                    </span>
                    <span className="text-[10px] text-cyan-500 font-mono mt-0.5 mb-1">
                        UID: {telegramUser?.id || '---'}
                    </span>
                    
                    {/* LIVE CLOCK (Small & Stylish) */}
                    <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-1.5 py-0.5 rounded-md w-fit">
                        <Clock className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                        <span className="text-[9px] font-mono font-bold text-gray-300 leading-none">
                            {formattedTime} <span className="text-[7px] text-gray-500 ml-0.5">BD</span>
                        </span>
                    </div>
                 </div>
            </div>

            {/* Right: App Name & Ping */}
            <div className="flex flex-col items-end gap-1 mt-1">
                {/* App Name */}
                <div className="text-[10px] font-bold text-gray-400 font-orbitron tracking-[0.2em] transition-colors mt-1">
                   <ScrambleText text={appSettings.appName || "HUNTER"} />
                </div>

                {/* Ping */}
                <div className="flex items-center gap-1 bg-black/50 px-1.5 py-0.5 rounded border border-white/10">
                    <Wifi className="w-2.5 h-2.5 text-green-500" />
                    <span className="text-[8px] text-gray-500 font-mono">{ping}ms</span>
                </div>
            </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 relative overflow-y-auto custom-scrollbar p-3 pb-0 flex flex-col gap-3">
            
            {/* PERIOD & TIMER CARD */}
            <div className="relative rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10 p-4 shadow-lg overflow-hidden shrink-0 flex flex-col items-center">
                 {/* Period Info */}
                 <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">LIVE PERIOD (UTC+6)</span>
                 <div className="text-3xl font-bold font-mono text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)] tracking-widest mb-2">
                     {period}
                 </div>
                 
                 {/* Visual Separator */}
                 <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-1"></div>

                 {/* Countdown Timer */}
                 <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4 text-cyan-500 animate-pulse" />
                    <span className={`text-2xl font-bold font-mono tracking-widest ${timeLeft <= 10 ? 'text-red-500' : 'text-white'}`}>
                        00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                 </div>
            </div>

            {/* LICENSE TIMER - COMPACT */}
            {isLicenseValid ? (
               <LicenseTimer expiryTimestamp={licenseExpiry} onExpire={() => { setIsLicenseValid(false); }} />
            ) : null}

            {isLicenseValid ? (
               <div className="flex-1 flex flex-col items-center justify-center relative min-h-[280px]">
                  
                  {/* CENTRAL INTERFACE - COMPACT MOBILE LAYOUT */}
                  <div className="relative w-full h-full flex flex-col items-center justify-center gap-4">
                      
                      {/* REACTOR CONTAINER */}
                      <div className="reactor-container mt-2 scale-90 relative w-[180px] h-[180px] flex items-center justify-center">
                          {/* Outer Rings */}
                          <div className={`absolute inset-0 border-2 ${isAnalyzing ? 'border-red-500' : 'border-cyan-800'} rounded-full animate-[spin_8s_linear_infinite] opacity-50`}></div>
                          <div className={`absolute inset-2 border border-dashed ${isAnalyzing ? 'border-red-400' : 'border-cyan-600'} rounded-full animate-[spin_4s_linear_infinite_reverse] opacity-40`}></div>
                          
                          {/* Inner Core / Button */}
                          <button 
                             onClick={handleHack}
                             disabled={timeLeft <= 5 || isAnalyzing || lastPredictedPeriod === period}
                             className={`absolute inset-0 w-full h-full rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all active:scale-95 border-2 overflow-hidden z-20
                                ${timeLeft <= 5 ? 'bg-gray-900 border-gray-700 opacity-50 grayscale' : 
                                  isAnalyzing ? 'bg-black border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 
                                  'bg-black border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.3)]'}`}
                          >
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                             
                             {/* DEFAULT STATE */}
                             {!isAnalyzing && (!currentPrediction || lastPredictedPeriod !== period) && (
                                 <div className="flex flex-col items-center z-10">
                                     <Power className={`w-8 h-8 mb-1 ${timeLeft <= 5 ? 'text-gray-500' : 'text-cyan-400 animate-pulse'}`} />
                                     <span className={`text-[10px] font-bold font-orbitron tracking-widest ${timeLeft <= 5 ? 'text-gray-500' : 'text-white'}`}>
                                         {timeLeft <= 5 ? 'WAIT' : 'START'}
                                     </span>
                                 </div>
                             )}

                             {isAnalyzing && (
                                 <div className="absolute inset-0 flex items-center justify-center">
                                    <HackSimulation />
                                 </div>
                             )}

                             {/* RESULT OVERLAY - ABSOLUTE CENTERED */}
                             {!isAnalyzing && currentPrediction && lastPredictedPeriod === period && (
                                 <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md animate-scale-in rounded-full">
                                      <span className={`text-2xl font-black font-orbitron tracking-widest uppercase mb-1 drop-shadow-[0_0_10px_currentColor]
                                          ${currentPrediction.size === 'Big' ? 'text-yellow-400' : 'text-cyan-400'}`}>
                                          {currentPrediction.size}
                                      </span>
                                      
                                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl text-white border-4 border-white/20 shadow-lg mt-1
                                          ${currentPrediction.color === 'Green' ? 'bg-green-600' : currentPrediction.color === 'Red' ? 'bg-red-600' : 'bg-purple-600'}`}>
                                          {currentPrediction.number}
                                      </div>
                                 </div>
                             )}
                          </button>
                      </div>

                      {/* Info Text */}
                      <div className="h-6 flex items-center justify-center">
                          {timeLeft <= 5 ? (
                              <span className="text-[9px] text-red-500 font-bold bg-red-950/30 px-3 py-1 rounded border border-red-900/50">DO NOT TRADE</span>
                          ) : isAnalyzing ? (
                              <span className="text-[9px] text-red-400 font-mono animate-pulse">DECRYPTING SIGNAL...</span>
                          ) : lastPredictedPeriod === period ? (
                               <span className="text-[9px] text-green-400 font-mono tracking-widest">SIGNAL LOCKED</span>
                          ) : (
                              <span className="text-[9px] text-cyan-600 font-mono tracking-widest opacity-70">SYSTEM READY</span>
                          )}
                      </div>

                  </div>
               </div>
            ) : (
               <LockedView 
                 telegramId={telegramUser?.id || 0} 
                 onSuccess={handleLoginSuccess}
                 contactLink={appSettings.contactLink}
                 onOpenSupport={() => setIsSupportOpen(true)}
               />
            )}
      </div>

      {/* --- BOTTOM SECTION (History Only - Clean) --- */}
      {isLicenseValid && (
        <div className="bg-black/95 border-t border-white/10 p-2 pb-6 shrink-0 z-20 backdrop-blur-xl">
            {history.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-2 px-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">History</span>
                        </div>
                        <button onClick={handleClearHistory} className="text-gray-600 hover:text-red-500 transition-colors p-1">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar px-1">
                        {history.map((h, i) => (
                            <div key={i} className="shrink-0 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[60px] relative overflow-hidden">
                                <span className="text-[8px] text-gray-500 font-mono mb-0.5">#{h.period.slice(-4)}</span>
                                <span className={`text-xs font-bold ${h.result.size === 'Big' ? 'text-yellow-400' : 'text-cyan-400'}`}>{h.result.size}</span>
                                <div className={`absolute bottom-0 left-0 w-full h-0.5 ${h.result.color === 'Green' ? 'bg-green-500' : h.result.color === 'Red' ? 'bg-red-500' : 'bg-purple-500'}`}></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {history.length === 0 && (
                <div className="text-center text-[9px] text-gray-700 font-mono py-1">NO SIGNALS RECORDED</div>
            )}
        </div>
      )}
    </div>
  );
}

export default App;
