
import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Key, Copy, Check, Save, ToggleLeft, ToggleRight, Trash2, Smartphone, Lock, Hash, Activity, Users, Timer, RefreshCw } from 'lucide-react';
import { LicenseKey, GlobalSettings, AdminPanelProps } from '../types';
import { getRealUserCount } from '../lib/firebase';

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, onClearHistory }) => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'keys' | 'settings'>('dashboard');
  
  // Key Generation State
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [quantity, setQuantity] = useState(1);
  
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  const [keysList, setKeysList] = useState<LicenseKey[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Dashboard Stats (REAL DATA ONLY)
  const [stats, setStats] = useState({ totalKeys: 0, redeemedKeys: 0, activeUsers: 0 });
  const [loadingStats, setLoadingStats] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<GlobalSettings>({ 
    appName: 'X-HUNTER',
    channelLink: '', 
    contactLink: '',
    strictMode: false,
    botToken: '',
    channelChatId: '',
    adminImageUrl: ''
  });
  const [savedSettings, setSavedSettings] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      loadKeys();
      fetchRealStats(); 
      const saved = localStorage.getItem('xhunter_settings');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSettings({
            appName: parsed.appName || 'X-HUNTER',
            channelLink: parsed.channelLink || '',
            contactLink: parsed.contactLink || '',
            strictMode: parsed.strictMode || false,
            botToken: parsed.botToken || '',
            channelChatId: parsed.channelChatId || '',
            adminImageUrl: parsed.adminImageUrl || ''
          });
        } catch(e) {}
      }
    }
  }, [isUnlocked, activeTab]);

  const fetchRealStats = async () => {
      setLoadingStats(true);
      const userCount = await getRealUserCount();
      
      const savedKeysStr = localStorage.getItem('xhunter_keys');
      let total = 0;
      let redeemed = 0;
      
      if (savedKeysStr) {
          try {
              const list = Object.values(JSON.parse(savedKeysStr)) as LicenseKey[];
              total = list.length;
              redeemed = list.filter(k => k.isUsed).length;
          } catch(e) {}
      }

      setStats({
          totalKeys: total,
          redeemedKeys: redeemed,
          activeUsers: userCount 
      });
      setLoadingStats(false);
  };

  const loadKeys = () => {
    const savedKeysStr = localStorage.getItem('xhunter_keys');
    if (savedKeysStr) {
      try {
        const parsed = JSON.parse(savedKeysStr);
        const list = Object.values(parsed) as LicenseKey[];
        const sortedList = list.sort((a, b) => b.createdAt - a.createdAt);
        setKeysList(sortedList);
      } catch (e) {
        setKeysList([]);
      }
    }
  };

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1122') {
      setIsUnlocked(true);
    } else {
      alert('ACCESS DENIED');
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleGenerateKeys = async () => {
    const totalDurationMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    if (totalDurationMs <= 0) {
      alert("Please set a valid duration");
      return;
    }

    const savedKeysStr = localStorage.getItem('xhunter_keys');
    let savedKeys = savedKeysStr ? JSON.parse(savedKeysStr) : {};
    const newKeys: string[] = [];

    for(let i=0; i<quantity; i++) {
      const newKeyString = generateRandomKey();
      const newKeyData: LicenseKey = {
        key: newKeyString,
        durationHours: parseFloat((totalDurationMs / (1000 * 60 * 60)).toFixed(2)),
        durationMs: totalDurationMs,
        isUsed: false,
        createdAt: Date.now()
      };
      savedKeys[newKeyString] = newKeyData;
      newKeys.push(newKeyString);
    }
    
    try {
      localStorage.setItem('xhunter_keys', JSON.stringify(savedKeys));
      setGeneratedKeys(newKeys);
      loadKeys();
      fetchRealStats(); 
    } catch (err) {
      alert("Storage Error");
    }
  };

  const handleDeleteAllKeys = () => {
    if(window.confirm("DELETE ALL KEYS?")) {
      localStorage.removeItem('xhunter_keys');
      setKeysList([]);
      setGeneratedKeys([]);
      loadKeys();
      fetchRealStats();
    }
  };

  const handleDeleteSingleKey = (keyToDelete: string) => {
    if(!window.confirm(`DELETE ${keyToDelete}?`)) return;
    
    // Immediate UI update
    const newList = keysList.filter(k => k.key !== keyToDelete);
    setKeysList(newList);

    const savedKeysStr = localStorage.getItem('xhunter_keys');
    if (savedKeysStr) {
        const savedKeys = JSON.parse(savedKeysStr);
        delete savedKeys[keyToDelete];
        localStorage.setItem('xhunter_keys', JSON.stringify(savedKeys));
    }
    fetchRealStats();
  };

  const handleSaveSettings = () => {
    setSettingsError('');
    if (settings.strictMode) {
        if (!settings.botToken || !settings.channelChatId) {
            setSettingsError('CREDENTIALS MISSING');
            return;
        }
    }
    try {
      localStorage.setItem('xhunter_settings', JSON.stringify(settings));
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 2000);
    } catch (e) {
      alert('Error saving settings');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopiedKey(text);
        setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  const toggleStrictMode = () => {
    setSettings(prev => ({ ...prev, strictMode: !prev.strictMode }));
  };

  const formatRemainingTime = (key: LicenseKey) => {
    if (!key.isUsed || !key.activatedAt) return 'NOT USED';
    const expiresAt = key.activatedAt + key.durationMs;
    const diff = expiresAt - now;
    if (diff <= 0) return 'EXPIRED';
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  const renderOptions = (max: number) => Array.from({ length: max + 1 }, (_, i) => <option key={i} value={i}>{i}</option>);

  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] text-white font-mono flex flex-col w-full h-full safe-area-top">
      {/* FIXED HEADER */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#111] border-b border-red-900/50 shadow-md shrink-0 safe-top-padding">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="font-bold text-red-100 tracking-wider text-sm">ADMIN PANEL</h3>
        </div>
        <button 
          onClick={onClose} 
          className="p-2 bg-red-950/50 rounded-lg text-red-500 hover:bg-red-900 hover:text-white border border-red-900/50 active:scale-95 transition-all z-50"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 relative custom-scrollbar">
        {!isUnlocked ? (
            <div className="h-full flex flex-col items-center justify-center -mt-20">
                <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(220,38,38,0.2)]">
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-6 tracking-widest font-orbitron">SECURE LOGIN</h2>
                <form onSubmit={handleLogin} className="w-full max-w-[250px] space-y-4">
                  <input
                    type="password"
                    inputMode="numeric"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="PIN CODE"
                    className="w-full bg-black border border-red-800 rounded-xl p-3 text-center text-red-500 text-lg focus:outline-none focus:border-red-500 placeholder-red-900/30 tracking-[0.5em] shadow-inner"
                  />
                  <button type="submit" className="w-full bg-gradient-to-r from-red-800 to-red-600 text-white font-bold py-3 rounded-xl tracking-widest shadow-lg active:scale-95 border border-red-500/50">
                    UNLOCK
                  </button>
                </form>
            </div>
        ) : (
          <div className="space-y-5 pb-20 max-w-md mx-auto">
            {/* Tabs */}
            <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-white/10 shrink-0">
               <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 text-[10px] font-bold tracking-wider rounded-md transition-all ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>DASHBOARD</button>
               <button onClick={() => setActiveTab('keys')} className={`flex-1 py-2 text-[10px] font-bold tracking-wider rounded-md transition-all ${activeTab === 'keys' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>KEYS</button>
               <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 text-[10px] font-bold tracking-wider rounded-md transition-all ${activeTab === 'settings' ? 'bg-red-600 text-white' : 'text-gray-500'}`}>SETTINGS</button>
            </div>

            {activeTab === 'dashboard' && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in-up">
                    <div className="col-span-2 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 shadow-lg relative overflow-hidden">
                        <div className="absolute top-2 right-2">
                             <button onClick={fetchRealStats} disabled={loadingStats} className="p-1 rounded bg-white/5 hover:bg-white/10">
                                 <RefreshCw className={`w-3 h-3 text-gray-400 ${loadingStats ? 'animate-spin' : ''}`}/>
                             </button>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] font-bold uppercase text-gray-400">Database Status</span>
                        </div>
                        <div className="text-xl font-bold text-green-400 tracking-wider">CONNECTED</div>
                    </div>
                    
                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <Users className="w-5 h-5 text-blue-500 mb-2" />
                        <div>
                            <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Total Users</div>
                        </div>
                    </div>

                    <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
                        <Key className="w-5 h-5 text-yellow-500 mb-2" />
                        <div>
                            <div className="text-2xl font-bold text-white">{stats.totalKeys}</div>
                            <div className="text-[9px] text-gray-500 uppercase font-bold">Generated Keys</div>
                        </div>
                    </div>
                    
                    <div className="col-span-2 bg-[#0f0f0f] border border-white/10 rounded-xl p-4 flex items-center justify-between">
                         <div className="flex flex-col">
                            <span className="text-[9px] text-gray-500 uppercase font-bold">Active Licenses</span>
                            <span className="text-lg font-bold text-red-500">{stats.redeemedKeys} Keys Redeemed</span>
                         </div>
                         <div className="w-10 h-10 rounded-full bg-red-900/20 flex items-center justify-center border border-red-500/20">
                             <Lock className="w-4 h-4 text-red-500" />
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'keys' && (
               <div className="space-y-4 animate-fade-in-up">
                 <div className="bg-[#0f0f0f] p-4 rounded-xl border border-red-900/20 shadow-lg">
                   <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5 text-red-400 text-xs font-bold uppercase">
                      <Key className="w-3 h-3"/> Create Licenses
                   </div>
                   
                   <div className="grid grid-cols-3 gap-3 mb-4">
                      {['Days', 'Hours', 'Mins'].map((label, idx) => (
                          <div key={label} className="relative">
                              <span className="text-[9px] text-gray-500 block mb-1.5 uppercase text-center font-bold tracking-wide">{label}</span>
                              <div className="relative">
                                <select 
                                    value={idx === 0 ? days : idx === 1 ? hours : minutes} 
                                    onChange={(e) => {
                                        const v = Number(e.target.value);
                                        if(idx === 0) setDays(v);
                                        else if(idx === 1) setHours(v);
                                        else setMinutes(v);
                                    }} 
                                    className="w-full bg-black border border-gray-700 rounded-lg p-2 text-white text-center text-xs appearance-none focus:border-red-500"
                                >
                                    {renderOptions(idx === 0 ? 30 : idx === 1 ? 24 : 60)}
                                </select>
                                <div className="absolute inset-0 border border-white/5 rounded-lg pointer-events-none"></div>
                              </div>
                          </div>
                      ))}
                   </div>
                   
                   <div className="mb-4">
                       <span className="text-[9px] text-gray-500 block mb-1.5 uppercase font-bold text-center">Quantity</span>
                       <select 
                          value={quantity} 
                          onChange={(e) => setQuantity(parseInt(e.target.value))}
                          className="w-full bg-black border border-gray-700 rounded-lg p-2.5 text-white text-center text-xs appearance-none focus:border-red-500"
                       >
                          {[1, 5, 10, 20, 50].map(q => <option key={q} value={q}>{q} Keys</option>)}
                       </select>
                   </div>

                   <button 
                      onClick={handleGenerateKeys}
                      className="w-full bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-3.5 rounded-lg tracking-widest shadow-lg active:scale-95 transition-all"
                   >
                     GENERATE KEYS
                   </button>
                 </div>

                 {generatedKeys.length > 0 && (
                   <div className="bg-green-900/10 p-3 rounded-lg border border-green-500/20 relative animate-scale-in">
                      <div className="flex justify-between items-center mb-2 border-b border-green-500/10 pb-1">
                          <span className="text-[10px] text-green-500 font-bold uppercase">New Keys</span>
                          <button onClick={() => copyToClipboard(generatedKeys.join('\\n'))} className="text-green-500 bg-black/50 p-1 rounded hover:bg-green-900/30">
                              <Copy className="w-3 h-3"/>
                          </button>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                        {generatedKeys.map((k, i) => (
                           <div key={i} className="text-green-400 text-xs font-bold font-mono">{k}</div>
                        ))}
                      </div>
                   </div>
                 )}

                 <div className="bg-[#0f0f0f] rounded-xl border border-white/5 flex flex-col h-[320px]">
                    <div className="flex justify-between items-center p-3 border-b border-white/5 bg-white/5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Database ({keysList.length})</span>
                        <button onClick={handleDeleteAllKeys} className="text-red-400 hover:text-red-300 bg-red-950/30 px-2 py-1 rounded text-[9px] border border-red-900/30 transition-colors">CLEAR ALL</button>
                    </div>
                    <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar flex-1">
                        {keysList.map((k) => (
                          <div key={k.key} className="flex justify-between items-center p-3 bg-black border border-white/5 rounded-lg hover:border-white/10 transition-colors group">
                            <div>
                                <div className="text-gray-200 font-bold text-[11px] font-mono tracking-wider flex items-center gap-2">
                                    {k.key}
                                    {copiedKey === k.key && <span className="text-[8px] text-green-500">COPIED</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {k.isUsed ? (
                                    <div className="text-[9px] text-blue-400 font-mono flex items-center gap-1">
                                      <Timer className="w-3 h-3"/> {formatRemainingTime(k)}
                                    </div>
                                  ) : (
                                    <div className="text-[9px] text-gray-600">
                                      Duration: {(k.durationMs / 3600000).toFixed(1)}h
                                    </div>
                                  )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => copyToClipboard(k.key)} className="p-1.5 text-gray-500 hover:text-white bg-white/5 rounded hover:bg-white/10 transition-colors">
                                    {copiedKey === k.key ? <Check className="w-3.5 h-3.5 text-green-500"/> : <Copy className="w-3.5 h-3.5"/>}
                                </button>
                                <button onClick={() => handleDeleteSingleKey(k.key)} className="p-1.5 text-gray-600 hover:text-red-500 bg-white/5 rounded hover:bg-red-950/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5"/>
                                </button>
                            </div>
                          </div>
                        ))}
                        {keysList.length === 0 && <div className="text-center text-gray-600 text-[10px] mt-10">NO KEYS FOUND</div>}
                    </div>
                 </div>
               </div>
            )}

            {activeTab === 'settings' && (
                 <div className="space-y-4 animate-fade-in-up">
                   <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-4 shadow-lg">
                       <label className="text-[9px] text-gray-400 font-bold block mb-2 uppercase tracking-wide">App Name</label>
                       <div className="flex items-center bg-black border border-gray-700 rounded-lg px-3 py-2">
                           <Smartphone className="w-4 h-4 text-gray-500 mr-2" />
                           <input 
                              type="text" 
                              value={settings.appName || ''} 
                              onChange={(e) => setSettings({...settings, appName: e.target.value})}
                              placeholder="X-HUNTER PRIME"
                              className="bg-transparent text-white w-full text-xs focus:outline-none placeholder-gray-700 font-bold"
                           />
                       </div>
                   </div>

                   <div className="flex items-center justify-between bg-[#0f0f0f] border border-red-900/30 rounded-xl p-4 shadow-lg">
                        <div>
                           <div className="text-xs text-red-400 font-bold uppercase flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5"/> Strict Mode</div>
                           <div className="text-[9px] text-gray-500 mt-1 tracking-wide">REQUIRE API VERIFICATION</div>
                        </div>
                        <button onClick={toggleStrictMode} className={`transition-colors duration-300 ${settings.strictMode ? 'text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'text-gray-700'}`}>
                          {settings.strictMode ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
                        </button>
                   </div>

                   <div className="bg-[#0f0f0f] p-4 rounded-xl border border-white/5 space-y-4 shadow-lg">
                     <div>
                       <label className="text-[9px] text-gray-400 font-bold block mb-2 uppercase tracking-wide">Channel Link</label>
                       <input 
                          type="text" 
                          value={settings.channelLink} 
                          onChange={(e) => setSettings({...settings, channelLink: e.target.value})}
                          placeholder="https://t.me/..."
                          className="bg-black border border-gray-700 rounded-lg p-3 text-white w-full text-xs focus:border-red-500 transition-colors"
                       />
                     </div>

                     {settings.strictMode && (
                        <div className="space-y-3 pt-3 border-t border-white/5 animate-fade-in-up">
                            <div>
                                <label className="text-[9px] text-red-400 font-bold block mb-2 uppercase tracking-wide flex items-center gap-1"><Key className="w-3 h-3"/> Bot Token</label>
                                <input 
                                    type="text" 
                                    value={settings.botToken || ''} 
                                    onChange={(e) => setSettings({...settings, botToken: e.target.value})}
                                    className="bg-black border border-red-900/40 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-red-500"
                                    placeholder="123456:ABC-DEF..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-red-400 font-bold block mb-2 uppercase tracking-wide flex items-center gap-1"><Hash className="w-3 h-3"/> Channel ID</label>
                                <input 
                                    type="text" 
                                    value={settings.channelChatId || ''} 
                                    onChange={(e) => setSettings({...settings, channelChatId: e.target.value})}
                                    className="bg-black border border-red-900/40 rounded-lg p-3 text-white w-full text-xs font-mono focus:border-red-500"
                                    placeholder="@channel or -100..."
                                />
                            </div>
                        </div>
                     )}

                     <div>
                       <label className="text-[9px] text-gray-400 font-bold block mb-2 uppercase tracking-wide">Contact Admin Link</label>
                       <input 
                          type="text" 
                          value={settings.contactLink} 
                          onChange={(e) => setSettings({...settings, contactLink: e.target.value})}
                          placeholder="@username"
                          className="bg-black border border-gray-700 rounded-lg p-3 text-white w-full text-xs focus:border-blue-500 transition-colors"
                       />
                     </div>

                     {settingsError && <div className="text-[10px] text-red-500 text-center font-bold bg-red-950/20 py-2 rounded animate-pulse">{settingsError}</div>}

                     <button 
                        onClick={handleSaveSettings}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-3.5 rounded-lg tracking-widest mt-2 flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                     >
                       {savedSettings ? <Check className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
                       {savedSettings ? 'SETTINGS SAVED' : 'SAVE CONFIGURATION'}
                     </button>
                   </div>
                 </div>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
      `}</style>
    </div>
  );
};
