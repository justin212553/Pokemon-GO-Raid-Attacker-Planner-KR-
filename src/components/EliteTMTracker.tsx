import React, { useState, useEffect, useMemo } from 'react';
import { PartySlotData } from '../scripts/types';
import { GripVertical } from 'lucide-react';
import { TYPE_ICONS } from '../scripts/icons';

interface EliteTMItem {
  id: string;
  slotId: string;
  partyType: string;
  pokemonName: string;
  moveName: string;
  moveType: 'fast' | 'charge';
  trainingStatus: string;
  isUncaught: boolean;
  isCommDayWait?: boolean;
}

interface EliteTMTrackerProps {
  allParties: Record<string, PartySlotData[]>;
  tmOrders: { fast: string[], charge: string[], commDayWait: string[] };
  setTmOrders: React.Dispatch<React.SetStateAction<{ fast: string[], charge: string[], commDayWait: string[] }>>;
}

export function EliteTMTracker({ allParties, tmOrders, setTmOrders }: EliteTMTrackerProps) {
  const items = useMemo(() => {
    const newItems: EliteTMItem[] = [];

    Object.entries(allParties).forEach(([partyType, party]) => {
      party.forEach(slot => {
        if (!slot.pokemon) return;
        
        const isUncaught = ['Not Caught', 'To Catch'].includes(slot.trainingStatus || 'Not Caught');
        const trainingStatus = slot.trainingStatus || 'Not Caught';

        // Check Fast Move
        const isFastTmEnabled = ['Evolved', 'Maxed Out', 'Mega Evolved'].includes(trainingStatus);
        if (slot.fastMove && !slot.fastMoveChecked && isFastTmEnabled) {
          const isElite = slot.pokemon.fastEliteMoves.some(m => m.name === slot.fastMove!.name);
          if (isElite) {
            const id = `${partyType}-${slot.id}-${slot.fastMove.name}-fast`;
            newItems.push({
              id,
              slotId: slot.id,
              partyType,
              pokemonName: slot.pokemon.name,
              moveName: slot.fastMove.name,
              moveType: 'fast',
              trainingStatus,
              isUncaught,
              isCommDayWait: tmOrders.commDayWait.includes(id)
            });
          }
        }

        // Check Charge Move
        if (slot.chargeMove1 && !slot.chargeMove1Checked) {
          const isElite = slot.pokemon.chargeEliteMoves.some(m => m.name === slot.chargeMove1!.name);
          if (isElite) {
            const id = `${partyType}-${slot.id}-${slot.chargeMove1.name}-charge`;
            newItems.push({
              id,
              slotId: slot.id,
              partyType,
              pokemonName: slot.pokemon.name,
              moveName: slot.chargeMove1.name,
              moveType: 'charge',
              trainingStatus,
              isUncaught,
              isCommDayWait: tmOrders.commDayWait.includes(id)
            });
          }
        }
      });
    });

    return newItems;
  }, [allParties, tmOrders.commDayWait]);

  const normalTmCounts = useMemo(() => {
    const counts: Record<string, { fast: number; charge: number }> = {};
    Object.entries(allParties).forEach(([partyType, party]) => {
      let fastCount = 0;
      let chargeCount = 0;
      party.forEach(slot => {
        if (!slot.pokemon) return;
        const isUncaught = ['Not Caught', 'To Catch'].includes(slot.trainingStatus || 'Not Caught');
        if (isUncaught) return;

        const isFastTmEnabled = ['Evolved', 'Maxed Out', 'Mega Evolved'].includes(slot.trainingStatus || '');

        if (slot.fastMove && !slot.fastMoveChecked && isFastTmEnabled) {
          const isElite = slot.pokemon.fastEliteMoves.some(m => m.name === slot.fastMove!.name);
          if (!isElite) fastCount++;
        }
        if (slot.chargeMove1 && !slot.chargeMove1Checked) {
          const isElite = slot.pokemon.chargeEliteMoves.some(m => m.name === slot.chargeMove1!.name);
          if (!isElite) chargeCount++;
        }
      });
      if (fastCount > 0 || chargeCount > 0) {
        counts[partyType] = { fast: fastCount, charge: chargeCount };
      }
    });
    return counts;
  }, [allParties]);

  const fastItems = useMemo(() => items.filter(i => i.moveType === 'fast'), [items]);
  const chargeItems = useMemo(() => items.filter(i => i.moveType === 'charge'), [items]);

  // Sync order with items
  useEffect(() => {
    setTmOrders(prev => {
      let isChanged = false;
      
      const newFast = prev.fast.filter(id => fastItems.some(item => item.id === id));
      fastItems.forEach(item => {
        if (!newFast.includes(item.id)) {
          newFast.push(item.id);
          isChanged = true;
        }
      });
      if (newFast.length !== prev.fast.length) isChanged = true;

      const newCharge = prev.charge.filter(id => chargeItems.some(item => item.id === id));
      chargeItems.forEach(item => {
        if (!newCharge.includes(item.id)) {
          newCharge.push(item.id);
          isChanged = true;
        }
      });
      if (newCharge.length !== prev.charge.length) isChanged = true;

      const newCommDayWait = prev.commDayWait.filter(id => items.some(item => item.id === id));
      if (newCommDayWait.length !== prev.commDayWait.length) isChanged = true;

      if (isChanged) {
        return { fast: newFast, charge: newCharge, commDayWait: newCommDayWait };
      }
      return prev;
    });
  }, [fastItems, chargeItems, items, setTmOrders]);

  const handleDragStart = (e: React.DragEvent, id: string, moveType: string) => {
    e.dataTransfer.setData('text/plain', `${moveType}:${id}`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string, itemMoveType: string, isUncaught: boolean) => {
    e.preventDefault();
    if (isUncaught) return; // Prevent dropping on uncaught items

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;
    const [dragMoveType, dragId] = data.split(':');
    
    if (dragMoveType !== itemMoveType || dragId === targetId) return;

    const updateOrder = (prev: string[]) => {
      const draggedIdx = prev.indexOf(dragId);
      const targetIdx = prev.indexOf(targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIdx, 1);
      next.splice(targetIdx, 0, draggedItem);
      return next;
    };

    setTmOrders(prev => {
      if (itemMoveType === 'fast') {
        return { ...prev, fast: updateOrder(prev.fast) };
      } else {
        return { ...prev, charge: updateOrder(prev.charge) };
      }
    });
  };

  if (items.length === 0 && Object.keys(normalTmCounts).length === 0) {
    return null;
  }

  const getSortGroup = (item: EliteTMItem) => {
    if (item.isCommDayWait) return 1;
    if (item.isUncaught) return 2;
    return 0;
  };

  const sortedFastItems = [...fastItems].sort((a, b) => {
    const groupA = getSortGroup(a);
    const groupB = getSortGroup(b);
    if (groupA !== groupB) return groupA - groupB;
    const idxA = tmOrders.fast.indexOf(a.id);
    const idxB = tmOrders.fast.indexOf(b.id);
    return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
  });

  const sortedChargeItems = [...chargeItems].sort((a, b) => {
    const groupA = getSortGroup(a);
    const groupB = getSortGroup(b);
    if (groupA !== groupB) return groupA - groupB;
    const idxA = tmOrders.charge.indexOf(a.id);
    const idxB = tmOrders.charge.indexOf(b.id);
    return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
  });

  const toggleCommDayWait = (id: string) => {
    setTmOrders(prev => {
      const isWaiting = prev.commDayWait.includes(id);
      return {
        ...prev,
        commDayWait: isWaiting ? prev.commDayWait.filter(x => x !== id) : [...prev.commDayWait, id]
      };
    });
  };

  const getStatusColorClass = (status: string, isUncaught: boolean, isWait?: boolean) => {
    if (isUncaught || isWait) return 'bg-slate-800 text-slate-400 border-slate-700';
    switch (status) {
      case 'Caught': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Evolved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Maxed Out': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Mega Evolved': return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const TMList = ({ title, itemsToRender, moveType }: { title: string, itemsToRender: EliteTMItem[], moveType: 'fast' | 'charge' }) => {
    const validCount = itemsToRender.filter(i => !i.isUncaught && !i.isCommDayWait).length;
    
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-1.5">
            <span className="text-yellow-400">★</span> 
            {title}
          </h3>
          <span className="text-xs text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
            총 {validCount}개 필요
          </span>
        </div>
        <div className="flex flex-col gap-2 min-h-[150px] max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar relative">
          {itemsToRender.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-600/50 p-2 text-center w-full tracking-widest">EMPTY</div>}
          {itemsToRender.map((item, index) => {
            const Icon = TYPE_ICONS[item.partyType] || '';
            const isDisabled = item.isUncaught || item.isCommDayWait;
            return (
              <div 
                key={item.id} 
                draggable={!isDisabled}
                onDragStart={(e) => handleDragStart(e, item.id, moveType)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.id, moveType, isDisabled)}
                className={`w-full group flex items-center gap-2 border rounded-lg p-2 transition-all ${!isDisabled && 'cursor-grab active:cursor-grabbing'} ${
                  isDisabled 
                    ? 'bg-slate-900/40 border-slate-800/50 grayscale opacity-50 hover:opacity-80 cursor-default' 
                    : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col items-center justify-center w-5 shrink-0">
                  <span className="text-[9px] font-black text-slate-500 mb-0.5">{isDisabled ? '-' : `#${index + 1}`}</span>
                  {!isDisabled && (
                    <div className="opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  )}
                </div>
                
                <div className="w-5 h-5 shrink-0 opacity-80" title={`${item.partyType} 타입 파티`}>
                  <img src={Icon} alt={item.partyType} className="w-full h-full object-contain filter drop-shadow-md" />
                </div>

                <div className="flex-1 flex items-center min-w-0 pr-1">
                  <span className={`text-xs md:text-sm font-bold truncate ${isDisabled ? 'text-slate-400' : 'text-slate-200'}`} title={item.pokemonName}>
                    {item.pokemonName}
                  </span>
                </div>
                
                <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border whitespace-nowrap ${getStatusColorClass(item.trainingStatus, item.isUncaught, item.isCommDayWait)}`}>
                    {item.trainingStatus}
                  </span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={!!item.isCommDayWait}
                      onChange={() => toggleCommDayWait(item.id)}
                      className="w-3 h-3 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap">CD</span>
                  </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const NormalTMList = () => {
    const entries = Object.entries(normalTmCounts) as [string, { fast: number; charge: number }][];
    

    let totalFast = 0;
    let totalCharge = 0;
    entries.forEach(([_, count]) => {
      totalFast += count.fast;
      totalCharge += count.charge;
    });

    const fastEntries = entries.filter(([, counts]) => counts.fast > 0).sort((a, b) => b[1].fast - a[1].fast);
    const chargeEntries = entries.filter(([, counts]) => counts.charge > 0).sort((a, b) => b[1].charge - a[1].charge);

    return (
        <div className="flex flex-row gap-8">
          {/* Normal Fast TM */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span className="text-emerald-400">❖</span> 
                기술머신(노말)
              </h3>
              <span className="text-xs text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
                총 {totalFast}개 
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[150px] max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar relative">
              {fastEntries.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-600/50 p-2 text-center w-full tracking-widest">EMPTY</div>}
              {fastEntries.map(([partyType, count]) => {
                const Icon = TYPE_ICONS[partyType] || '';
                return (
                  <div key={partyType} className="w-full flex items-center gap-2 border border-slate-700/50 bg-slate-900/60 rounded-lg p-2 hover:bg-slate-800/60 transition-colors">
                    <div className="w-6 h-6 shrink-0 bg-slate-800 rounded-full flex items-center justify-center p-1" title={`${partyType} 타입 파티`}>
                      <img src={Icon} alt={partyType} className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-xs text-slate-200 font-bold uppercase tracking-wider truncate">{partyType}</span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">{count.fast}개</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Normal Charge TM */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-1.5">
                <span className="text-indigo-400">❖</span> 
                기술머신(스페셜)
              </h3>
              <span className="text-xs text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
                총 {totalCharge}개 
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[150px] max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar relative">
              {chargeEntries.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-600/50 p-2 text-center w-full tracking-widest">EMPTY</div>}
              {chargeEntries.map(([partyType, count]) => {
                const Icon = TYPE_ICONS[partyType] || '';
                return (
                  <div key={partyType} className="w-full flex items-center gap-2 border border-slate-700/50 bg-slate-900/60 rounded-lg p-2 hover:bg-slate-800/60 transition-colors">
                    <div className="w-6 h-6 shrink-0 bg-slate-800 rounded-full flex items-center justify-center p-1" title={`${partyType} 타입 파티`}>
                      <img src={Icon} alt={partyType} className="w-full h-full object-contain filter drop-shadow-md" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center min-w-0">
                      <span className="text-xs text-slate-200 font-bold uppercase tracking-wider truncate">{partyType}</span>
                    </div>
                    <div className="flex items-center shrink-0">
                      <span className="text-indigo-400 text-xs font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">{count.charge}개</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-8 py-4 mt-4 border-t border-slate-800/50">
      <div className="flex flex-row gap-8">
        <TMList title="대단한 기술머신(노말)" itemsToRender={sortedFastItems} moveType="fast" />
        <TMList title="대단한 기술머신(스페셜)" itemsToRender={sortedChargeItems} moveType="charge" />
      </div>
      <div className="mt-8 pt-6 border-t border-slate-800/50">
        <NormalTMList />
      </div>
    </div>
  );
}
