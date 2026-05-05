import React, { useState, useRef } from 'react';
import { PartyBuilder } from './components/PartyBuilder';
import { PartySlotData } from './scripts/types';

const POKEMON_TYPES_LIST = [
  "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy", "normal"
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

  const handleExport = () => {
    try {
      localStorage.setItem('pogo-all-parties', JSON.stringify(allParties));
      alert('성공적으로 브라우저에 저장되었습니다!');
    } catch (err) {
      alert('저장에 실패했습니다.');
    }
  };

  const handleImport = () => {
    const saved = localStorage.getItem('pogo-all-parties');
    if (saved) {
      try {
        setAllParties({ ...initialParties, ...JSON.parse(saved) });
        alert('저장된 데이터를 성공적으로 불러왔습니다!');
      } catch (err) {
        alert('데이터를 불러오는데 실패했습니다.');
      }
    } else {
      alert('저장된 데이터가 없습니다.');
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
          onImportClick={handleImport}
          onExportClick={handleExport}
        />
        <footer className="mt-auto py-6 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity space-y-4">
          <img 
            src="https://lh3.googleusercontent.com/3TSaKxXGo2wT0lu0AyNUBnkk6wkCC2AzOhJyy3JXIPm-AmZ1k9DSAroWeBUyePswCZSs5lVp3mPF7HzUpY9VPlyOV5eddITONINr3WSqLNLm=e365-pa-nu-w280-rw" 
            alt="Pokemon GO Campfire" 
            className="w-32 object-contain grayscale opacity-50"
            referrerPolicy="no-referrer"
          />
          <p className="text-[10px] sm:text-xs text-slate-500 max-w-3xl px-4 break-keep">
            이 사이트의 모든 이미지 데이터는 주식회사 나이언틱(Niantic.) 및 주식회사 포켓몬(The Pokémon Company | 株式会社ポケモン | Pokémon, Inc.) 의 소유이며, 웹사이트의 소스코드 저작권은 제작자(github id: justin212553)에게 있음을 밝힙니다.
          </p>
        </footer>
      </div>
    </main>
  );
}

