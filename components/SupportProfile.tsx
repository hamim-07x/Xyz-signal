
import React from 'react';
import { X, MessageCircle, ShieldCheck } from 'lucide-react';

interface SupportProfileProps {
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
  adminImageUrl?: string;
  contactLink: string;
}

export const SupportProfile: React.FC<SupportProfileProps> = ({ isOpen, onClose, adminName, adminImageUrl, contactLink }) => {
  if (!isOpen) return null;

  const handleContact = () => {
     if (contactLink) {
      const link = contactLink.startsWith('http') || contactLink.startsWith('tg://') 
        ? contactLink 
        : `https://t.me/${contactLink.replace('@', '')}`;
      window.open(link, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-full max-w-xs bg-[#0a0a0a] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)]">
        
        {/* Header / Banner */}
        <div className="h-24 bg-gradient-to-b from-cyan-900/20 to-transparent relative">
             <div className="absolute top-2 right-2">
                 <button onClick={onClose} className="p-1 rounded-full bg-black/50 hover:bg-red-900/50 text-gray-400 hover:text-white transition-colors">
                     <X className="w-5 h-5" />
                 </button>
             </div>
        </div>

        {/* Profile Image */}
        <div className="relative -mt-12 flex justify-center">
            <div className="w-24 h-24 rounded-full p-1 bg-black border-2 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)] relative">
                {adminImageUrl ? (
                    <img src={adminImageUrl} alt="Admin" className="w-full h-full rounded-full object-cover" />
                ) : (
                    <div className="w-full h-full rounded-full bg-cyan-950 flex items-center justify-center">
                        <ShieldCheck className="w-10 h-10 text-cyan-400" />
                    </div>
                )}
                {/* Online Status */}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
            </div>
        </div>

        {/* Info */}
        <div className="p-6 text-center space-y-2">
            <h3 className="text-xl font-bold text-white font-orbitron tracking-wide">{adminName || 'ADMIN SUPPORT'}</h3>
            <div className="inline-block px-3 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded-full text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                Official Agent
            </div>
            
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                For license keys, technical support, or payment inquiries, please contact directly.
            </p>

            <button 
                onClick={handleContact}
                className="w-full mt-4 bg-gradient-to-r from-cyan-700 to-cyan-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all active:scale-95"
            >
                <MessageCircle className="w-4 h-4" />
                <span>SEND MESSAGE</span>
            </button>
        </div>

      </div>
    </div>
  );
};
