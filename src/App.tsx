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
      </div>
    </main>
  );
}

