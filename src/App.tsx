import React, { useState, useRef } from 'react';
import { PartyBuilder } from './components/PartyBuilder';
import { PartySlotData } from './scripts/types';
import { EliteTMTracker } from './components/EliteTMTracker';
import { POKEMON_DATA } from './scripts/pokemonData';

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

  const [hiddenTypes, setHiddenTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('pogo-hidden-types');
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  });

  const toggleCurrentTypeVisibility = () => {
    setHiddenTypes(prev => {
      let next;
      if (prev.includes(selectedType)) {
        next = prev.filter(t => t !== selectedType);
      } else {
        next = [...prev, selectedType];
      }
      localStorage.setItem('pogo-hidden-types', JSON.stringify(next));
      return next;
    });
  };

  React.useEffect(() => {
    localStorage.setItem('pogo-tm-orders', JSON.stringify(tmOrders));
  }, [tmOrders]);

  const [saveMessage, setSaveMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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

  const handleExportFile = () => {
    try {
      const statusEnum = ['Not Caught', 'To Catch', 'Caught', 'Evolved', 'Maxed Out', 'Mega Evolved'];
      const data: any = {
        "hidden_types": hiddenTypes,
        "party_list": {}
      };
      
      for (const [type, _partySlots] of Object.entries(allParties)) {
        const partySlots = _partySlots as PartySlotData[];
        data["party_list"][type] = partySlots.map(slot => {
          if (!slot.pokemon) return {};
          let fastEliteOrder = 0;
          if (slot.fastMove) {
             const idx = tmOrders.fast.indexOf(`${type}-${slot.id}-${slot.fastMove.name}-fast`);
             if (idx !== -1) fastEliteOrder = idx + 1;
          }
          let chargeEliteOrder = 0;
          if (slot.chargeMove1) {
             const idx = tmOrders.charge.indexOf(`${type}-${slot.id}-${slot.chargeMove1.name}-charge`);
             if (idx !== -1) chargeEliteOrder = idx + 1;
          }
          const fId = slot.fastMove ? `${type}-${slot.id}-${slot.fastMove.name}-fast` : '';
          const cId = slot.chargeMove1 ? `${type}-${slot.id}-${slot.chargeMove1.name}-charge` : '';
          const isCommDayWait = (fId && tmOrders.commDayWait.includes(fId)) || (cId && tmOrders.commDayWait.includes(cId)) || false;

          return {
            "name": slot.pokemon.name,
            "ivs": [slot.atkIv ?? 15, slot.defIv ?? 15, slot.hpIv ?? 15],
            "is_shadow": slot.isShadow,
            "training_level": statusEnum.indexOf(slot.trainingStatus || 'Not Caught'),
            "fast_move": slot.fastMove ? { "id": slot.fastMove.id, "is_trained": slot.fastMoveChecked } : null,
            "charge_move": slot.chargeMove1 ? { "id": slot.chargeMove1.id, "is_trained": slot.chargeMove1Checked } : null,
            "elite_fast_order": fastEliteOrder,
            "elite_charge_order": chargeEliteOrder,
            "waitlisted": isCommDayWait
          };
        });
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pogo_planner_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSaveMessage({ text: '파일로 저장되었습니다.', type: 'success' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({ text: '파일 저장에 실패했습니다.', type: 'error' });
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const handleImportFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);
          const statusEnum = ['Not Caught', 'To Catch', 'Caught', 'Evolved', 'Maxed Out', 'Mega Evolved'];
          
          if (data["hidden_types"] && Array.isArray(data["hidden_types"])) {
            setHiddenTypes(data["hidden_types"]);
            localStorage.setItem('pogo-hidden-types', JSON.stringify(data["hidden_types"]));
          }

          if (data["party_list"]) {
            const newAllParties: Record<string, PartySlotData[]> = { ...initialParties };
            let newFastOrders: Array<{id: string, order: number}> = [];
            let newChargeOrders: Array<{id: string, order: number}> = [];
            let newCommDayWait: string[] = [];

            for (const [type, slotsData] of Object.entries(data["party_list"])) {
                const slotArray = slotsData as any[];
                if (!newAllParties[type]) continue;
                
                for (let i = 0; i < 6; i++) {
                    const externalData = slotArray[i];
                    if (!externalData || !externalData["name"]) {
                        newAllParties[type][i] = {
                           id: `slot-${i}`,
                           pokemon: null,
                           fastMove: null,
                           chargeMove1: null,
                           fastMoveChecked: false,
                           chargeMove1Checked: false,
                           isShadow: false,
                           trainingStatus: 'Not Caught'
                        };
                        continue;
                    }

                    const poke = POKEMON_DATA.find(p => p.name === externalData["name"]);
                    if (poke) {
                       const fastMoveId = externalData["fast_move"]?.["id"];
                       const fastMoveObj = poke.fastMoves.find((m: any) => m.id === fastMoveId || m.name === fastMoveId) || poke.fastEliteMoves.find((m: any) => m.id === fastMoveId || m.name === fastMoveId) || poke.fastMoves[0] || null;

                       const chargeMoveId = externalData["charge_move"]?.["id"];
                       const chargeMoveObj = poke.chargeMoves.find((m: any) => m.id === chargeMoveId || m.name === chargeMoveId) || poke.chargeEliteMoves.find((m: any) => m.id === chargeMoveId || m.name === chargeMoveId) || poke.chargeMoves[0] || null;
                        
                       newAllParties[type][i] = {
                           id: `slot-${i}`,
                           pokemon: poke,
                           fastMove: fastMoveObj,
                           chargeMove1: chargeMoveObj,
                           fastMoveChecked: externalData["fast_move"]?.["is_trained"] ?? false,
                           chargeMove1Checked: externalData["charge_move"]?.["is_trained"] ?? false,
                           isShadow: externalData["is_shadow"] ?? false,
                           trainingStatus: statusEnum[externalData["training_level"] ?? 0] as any,
                           atkIv: externalData["ivs"]?.[0] ?? 15,
                           defIv: externalData["ivs"]?.[1] ?? 15,
                           hpIv: externalData["ivs"]?.[2] ?? 15,
                       };

                       const fId = fastMoveObj ? `${type}-slot-${i}-${fastMoveObj.name}-fast` : '';
                       const cId = chargeMoveObj ? `${type}-slot-${i}-${chargeMoveObj.name}-charge` : '';

                       if (externalData["elite_fast_order"] > 0 && fId) {
                           newFastOrders.push({ id: fId, order: externalData["elite_fast_order"] });
                       }
                       if (externalData["elite_charge_order"] > 0 && cId) {
                           newChargeOrders.push({ id: cId, order: externalData["elite_charge_order"] });
                       }
                       if (externalData["waitlisted"]) {
                           if (fId) newCommDayWait.push(fId);
                           if (cId) newCommDayWait.push(cId);
                       }
                    }
                }
            }

            newFastOrders.sort((a,b) => a.order - b.order);
            newChargeOrders.sort((a,b) => a.order - b.order);

            setTmOrders({
                fast: newFastOrders.map(x => x.id),
                charge: newChargeOrders.map(x => x.id),
                commDayWait: [...new Set(newCommDayWait)]
            });
            setAllParties(newAllParties);
          } else if (data.allParties) {
             setAllParties(data.allParties);
             if (data.tmOrders) setTmOrders(data.tmOrders);
          }
          
          setSaveMessage({ text: '파일에서 불러왔습니다.', type: 'success' });
          setTimeout(() => setSaveMessage(null), 3000);
        } catch (err) {
          setSaveMessage({ text: '파일을 불러오는데 실패했습니다.', type: 'error' });
          setTimeout(() => setSaveMessage(null), 3000);
        }
      };
      reader.readAsText(file);
    };
    input.click();
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
    <main className="min-h-screen min-w-fit bg-[#090b0e] text-slate-100 font-sans selection:bg-slate-700 flex flex-col items-center">
      <div className="relative z-10 flex flex-col w-[768px]">
        <PartyBuilder 
          selectedType={selectedType} 
          setSelectedType={setSelectedType}
          slots={slots}
          setSlots={setSlots}
          onImportClick={handleImport}
          onExportClick={handleExport}
          onImportFileClick={handleImportFile}
          onExportFileClick={handleExportFile}
          saveMessage={saveMessage}
          hiddenTypes={hiddenTypes || []}
          toggleCurrentTypeVisibility={toggleCurrentTypeVisibility}
        />
        <EliteTMTracker 
          allParties={allParties} 
          tmOrders={tmOrders} 
          setTmOrders={setTmOrders} 
        />
        <div className="w-full border-t border-slate-800/80 my-4" />
        <footer className="mt-auto py-6 pb-24 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity space-y-4">
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

