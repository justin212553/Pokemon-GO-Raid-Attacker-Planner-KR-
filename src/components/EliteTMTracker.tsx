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
        if (slot.fastMove && !slot.fastMoveChecked) {
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

  if (items.length === 0) {
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
    if (itemsToRender.length === 0) return null;
    
    const validCount = itemsToRender.filter(i => !i.isUncaught && !i.isCommDayWait).length;
    
    return (
      <div className="flex-1 min-w-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="text-yellow-400">★</span> 
            {title}
          </h3>
          <span className="text-xs text-slate-500 font-medium bg-slate-900/50 px-2 py-1 rounded-full border border-slate-800">
            총 {validCount}개 필요
          </span>
        </div>
        <div className="space-y-2">
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
                className={`group flex items-center gap-3 border rounded-lg p-2 transition-all ${!isDisabled && 'cursor-grab active:cursor-grabbing'} ${
                  isDisabled 
                    ? 'bg-slate-900/40 border-slate-800/50 grayscale opacity-50 hover:opacity-80 cursor-default' 
                    : 'bg-slate-900/60 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex flex-col items-center justify-center w-8 shrink-0">
                  <span className="text-[10px] font-black text-slate-500 mb-0.5">{isDisabled ? '-' : `#${index + 1}`}</span>
                  {!isDisabled && (
                    <div className="opacity-30 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <GripVertical className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
                
                <div className="w-6 h-6 shrink-0 opacity-80" title={`${item.partyType} 타입 파티`}>
                  <img src={Icon} alt={item.partyType} className="w-full h-full object-contain filter drop-shadow-md" />
                </div>

                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-[90px] sm:w-[120px] shrink-0 text-sm font-bold truncate ${isDisabled ? 'text-slate-400' : 'text-slate-200'}`} title={item.pokemonName}>
                    {item.pokemonName}
                  </span>
                  <span className="text-slate-600 text-xs font-black shrink-0">|</span>
                  <span className={`w-[90px] sm:w-[120px] shrink-0 text-xs font-medium truncate ${isDisabled ? 'text-slate-500' : 'text-slate-400'}`} title={item.moveName}>
                    {item.moveName}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${getStatusColorClass(item.trainingStatus, item.isUncaught, item.isCommDayWait)}`}>
                    {item.trainingStatus}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-1 sm:ml-2">
                    <input 
                      type="checkbox"
                      checked={!!item.isCommDayWait}
                      onChange={() => toggleCommDayWait(item.id)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-indigo-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">커뮤니티데이</span>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-8 py-4 mt-4 border-t border-slate-800/50">
      <div className="flex flex-col gap-8">
        <TMList title="대단한 기술머신(일반) 필요 목록" itemsToRender={sortedFastItems} moveType="fast" />
        <TMList title="대단한 기술머신(스페셜) 필요 목록" itemsToRender={sortedChargeItems} moveType="charge" />
      </div>
    </div>
  );
}
