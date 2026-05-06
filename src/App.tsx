import React, { useState, useRef } from 'react';
import { PartyBuilder } from './components/PartyBuilder';
import { PartySlotData } from './scripts/types';
import { EliteTMTracker } from './components/EliteTMTracker';
import { Cloud, CloudUpload, CloudDownload, LogOut, Loader2, Upload, Download, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const POKEMON_TYPES_LIST = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

export default function App() {
  const [selectedType, setSelectedType] = useState<string>('fire');
  
  const generateDefaultSlots = () => Array.from({ length: 6 }).map((_, i) => ({
    id: `slot-${i}`,
    pokemon: null,
    fastMove: null,
    chargeMove1: null,
    fastMoveChecked: false,
    chargeMove1Checked: false,
    isShadow: false,
    trainingStatus: 'Not Caught' as const
  }));

  const initialParties = POKEMON_TYPES_LIST.reduce((acc, type) => {
    acc[type] = generateDefaultSlots();
    return acc;
  }, {} as Record<string, PartySlotData[]>);
  
  const [allParties, setAllParties] = useState<Record<string, PartySlotData[]>>(() => {
    const saved = localStorage.getItem('pogo-all-parties');
    if (saved) {
      try {
        return { ...initialParties, ...JSON.parse(saved) };
      } catch (err) {
        console.error('Failed to parse saved parties:', err);
      }
    }
    return initialParties;
  });

  const [tmOrders, setTmOrders] = useState<{fast: string[], charge: string[], commDayWait: string[] }>(() => {
    const saved = localStorage.getItem('pogo-tm-orders');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { fast: parsed.fast || [], charge: parsed.charge || [], commDayWait: parsed.commDayWait || [] };
      } catch (err) {
        console.error('Failed to parse saved TM orders:', err);
      }
    }
    return { fast: [], charge: [], commDayWait: [] };
  });

  React.useEffect(() => {
    localStorage.setItem('pogo-tm-orders', JSON.stringify(tmOrders));
  }, [tmOrders]);

  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [driveStatus, setDriveStatus] = useState<{ isAuthenticated: boolean; userEmail: string | null }>({
    isAuthenticated: false,
    userEmail: null
  });
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  React.useEffect(() => {
    checkDriveStatus();
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkDriveStatus();
        setSaveMessage({ text: '구글 드라이브 연결 성공!', type: 'success' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const checkDriveStatus = async () => {
    try {
      const res = await fetch('/api/drive/status');
      if (res.ok) {
        const data = await res.json();
        setDriveStatus(data);
      }
    } catch (e) {
      console.error('Failed to check drive status');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      window.open(data.url, 'google_auth', 'width=600,height=700');
    } catch (e) {
      setSaveMessage({ text: '구글 로그인 오류', type: 'error' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setDriveStatus({ isAuthenticated: false, userEmail: null });
      setSaveMessage({ text: '로그아웃 되었습니다.', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      setSaveMessage({ text: '로그아웃 실패', type: 'error' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDriveSave = async () => {
    setIsDriveLoading(true);
    try {
      const res = await fetch('/api/drive/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: { 
            allParties,
            tmOrders
          } 
        })
      });
      if (res.ok) {
        setSaveMessage({ text: '구글 드라이브에 저장되었습니다.', type: 'success' });
      } else {
        throw new Error();
      }
    } catch (e) {
      setSaveMessage({ text: '드라이브 저장 실패', type: 'error' });
    } finally {
      setIsDriveLoading(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleDriveLoad = async () => {
    setIsDriveLoading(true);
    try {
      const res = await fetch('/api/drive/load');
      if (res.ok) {
        const payload = await res.json();
        if (payload.allParties) setAllParties(payload.allParties);
        if (payload.tmOrders) setTmOrders(payload.tmOrders);
        setSaveMessage({ text: '구글 드라이브에서 데이터를 불러왔습니다.', type: 'success' });
      } else {
        throw new Error();
      }
    } catch (e) {
      setSaveMessage({ text: '드라이브 불러오기 실패', type: 'error' });
    } finally {
      setIsDriveLoading(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleExport = () => {
    try {
      localStorage.setItem('pogo-all-parties', JSON.stringify(allParties));
      localStorage.setItem('pogo-tm-orders', JSON.stringify(tmOrders));
      setSaveMessage({ text: '성공적으로 저장되었습니다.', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ text: '저장에 실패했습니다.', type: 'error' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleImport = () => {
    const savedParties = localStorage.getItem('pogo-all-parties');
    const savedOrders = localStorage.getItem('pogo-tm-orders');
    if (savedParties) {
      try {
        setAllParties({ ...initialParties, ...JSON.parse(savedParties) });
        if (savedOrders) {
          const parsedOrders = JSON.parse(savedOrders);
          setTmOrders({ fast: parsedOrders.fast || [], charge: parsedOrders.charge || [], commDayWait: parsedOrders.commDayWait || [] });
        }
        setSaveMessage({ text: '데이터를 성공적으로 불러왔습니다.', type: 'success' });
        setTimeout(() => setSaveMessage(null), 3000);
      } catch (err) {
        setSaveMessage({ text: '데이터를 불러오는데 실패했습니다.', type: 'error' });
        setTimeout(() => setSaveMessage(null), 3000);
      }
    } else {
      setSaveMessage({ text: '저장된 데이터가 없습니다.', type: 'error' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const slots = allParties[selectedType] || generateDefaultSlots();

  const setSlots = (newSlots: PartySlotData[] | ((prev: PartySlotData[]) => PartySlotData[])) => {
    setAllParties(prev => ({
      ...prev,
      [selectedType]: typeof newSlots === 'function' ? newSlots(prev[selectedType]) : newSlots
    }));
  };

  return (
    <main className="min-h-screen bg-[#090b0e] text-slate-100 font-sans selection:bg-slate-700">
      <div className="relative z-10 min-h-screen flex flex-col">
        <PartyBuilder 
          selectedType={selectedType} 
          setSelectedType={setSelectedType}
          slots={slots}
          setSlots={setSlots}
          setSaveMessage={setSaveMessage}
        />
        <EliteTMTracker 
          allParties={allParties} 
          tmOrders={tmOrders} 
          setTmOrders={setTmOrders} 
        />

        {/* Global Footer with Storage Settings */}
        <footer className="mt-12 pt-8 pb-12 border-t border-slate-800 flex flex-col items-center gap-8 px-4 bg-slate-950/20">
          <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-[1px] w-8 bg-slate-800"></div>
              <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Save & Sync Settings</span>
              <div className="h-[1px] w-8 bg-slate-800"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {/* Local Section */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <Trash2 className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-tight">Local Storage</h4>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleImport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl border border-slate-700 transition-all shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    로컬 불러오기
                  </button>
                  <button 
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl border border-slate-700 transition-all shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    로컬 저장하기
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                  현재 기기에 브라우저 저장소 데이터로 저장하거나 불러옵니다.
                </p>
              </div>

              {/* Google Drive Section */}
              <div className="bg-slate-900/40 border border-slate-800/50 rounded-2xl p-4 flex flex-col gap-3 transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-tight">Google Drive Sync</h4>
                  </div>
                  {driveStatus.isAuthenticated && (
                    <button onClick={handleGoogleLogout} className="text-[10px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors">
                      <LogOut className="w-3 h-3" />
                      로그아웃
                    </button>
                  )}
                </div>

                {!driveStatus.isAuthenticated ? (
                  <button 
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
                  >
                    <img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" className="w-4 h-4 object-contain" alt="" />
                    구글 드라이브 연결
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDriveLoad}
                        disabled={isDriveLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl border border-slate-700 transition-all shadow-sm disabled:opacity-50 active:scale-95"
                      >
                        {isDriveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudDownload className="w-3.5 h-3.5" />}
                        드라이브에서 불러오기
                      </button>
                      <button 
                        onClick={handleDriveSave}
                        disabled={isDriveLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm disabled:opacity-50 active:scale-95"
                      >
                        {isDriveLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
                        드라이브에 백업
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                  {driveStatus.isAuthenticated 
                    ? "드라이브와 데이터를 동기화하여 다른 기기에서도 계획을 확인할 수 있습니다."
                    : "모든 기기에서 플래너를 공유하려면 구글 드라이브를 연동하세요."}
                </p>
              </div>
            </div>
            
            <AnimatePresence>
              {saveMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 ${
                    saveMessage.type === 'error' 
                      ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' 
                      : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${saveMessage.type === 'error' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400 opacity-75'}`} />
                  <span className="text-xs font-bold tracking-tight">{saveMessage.text}</span>
                  <button onClick={() => setSaveMessage(null)} className="ml-2 hover:opacity-70">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="py-6 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity space-y-4">
            <img 
              src="https://lh3.googleusercontent.com/3TSaKxXGo2wT0lu0AyNUBnkk6wkCC2AzOhJyy3JXIPm-AmZ1k9DSAroWeBUyePswCZSs5lVp3mPF7HzUpY9VPlyOV5eddITONINr3WSqLNLm=e365-pa-nu-w280-rw" 
              alt="Pokemon GO Campfire" 
              className="w-32 object-contain grayscale opacity-50"
              referrerPolicy="no-referrer"
            />
            <p className="text-[10px] sm:text-xs text-slate-500 max-w-3xl px-4 break-keep">
              이 사이트의 모든 이미지 데이터는 주식회사 나이언틱(Niantic.) 및 주식회사 포켓몬(The Pokémon Company | 株式会社ポケモン | Pokémon, Inc.) 의 소유이며, 웹사이트의 소스코드 저작권은 제작자(github id: justin212553)에게 있음을 밝힙니다.
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}

