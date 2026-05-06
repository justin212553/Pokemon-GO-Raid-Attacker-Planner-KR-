import React, { useState } from 'react';
import { TYPE_TEXT_COLORS } from '../scripts/pokemonData';
import { PartySlotData } from '../scripts/types';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { PokemonImage } from './PokemonImage';
import { TYPE_ICONS } from '../scripts/icons';

interface MobilePokemonSlotProps {
  slot: PartySlotData;
  roleColor: string;
  roleLabel: string;
  roleTextColor: string;
  onUpdate: (slot: PartySlotData) => void;
  onSelectPokemonRequest: () => void;
  onRemoveRequest: () => void;
}

export function MobilePokemonSlot({ 
  slot, 
  roleColor,
  roleLabel,
  roleTextColor,
  onUpdate,
  onSelectPokemonRequest, 
  onRemoveRequest
}: MobilePokemonSlotProps) {

  if (!slot.pokemon) {
    return (
      <div className="w-[180px] shrink-0 h-[240px] flex flex-col relative">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] sm:text-xs font-black tracking-widest uppercase ${roleTextColor}`}>
            {roleLabel}
          </span>
        </div>
        <div 
          onClick={onSelectPokemonRequest}
          className="flex-1 border-2 border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/10 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-slate-600 hover:text-slate-400 group"
        >
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-600 group-hover:text-slate-400 group-hover:scale-110 transition-transform">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-600 uppercase mt-2 tracking-widest group-hover:text-slate-400">Assign Pokemon</span>
          </div>
        </div>
      </div>
    );
  }

  const { pokemon, fastMove, chargeMove1, isShadow, trainingStatus } = slot;

  const isMegaOrPrimal = pokemon.name.startsWith('메가') || pokemon.name.startsWith('원시');
  const canBeShadow = pokemon.shadow_eligible && !isMegaOrPrimal;
  const isUncaught = ['Not Caught', 'To Catch'].includes(trainingStatus || 'Not Caught');

  const toggleShadow = () => {
    if (!canBeShadow) return;
    onUpdate({ ...slot, isShadow: !isShadow });
  };

  const TRAINING_STATUSES = ['Not Caught', 'To Catch', 'Caught', 'Evolved', 'Maxed Out', 'Mega Evolved'] as const;
  const availableStatuses = isMegaOrPrimal 
    ? TRAINING_STATUSES 
    : TRAINING_STATUSES.filter(s => s !== 'Mega Evolved');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Caught': return 'text-slate-400';
      case 'To Catch': return 'text-yellow-400';
      case 'Caught': return 'text-green-400';
      case 'Evolved': return 'text-blue-400';
      case 'Maxed Out': return 'text-purple-400';
      case 'Mega Evolved': return 'text-pink-400';
      default: return 'text-slate-300';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Not Caught': return 'bg-slate-400';
      case 'To Catch': return 'bg-yellow-400';
      case 'Caught': return 'bg-green-400';
      case 'Evolved': return 'bg-blue-400';
      case 'Maxed Out': return 'bg-purple-400';
      case 'Mega Evolved': return 'bg-pink-400';
      default: return 'bg-slate-400';
    }
  };

  const [openDropdown, setOpenDropdown] = useState<'fast' | 'charge1' | 'status' | null>(null);
  
  React.useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const combinedFastMoves = pokemon ? [
    ...pokemon.fastMoves.map((m) => ({ ...m, isElite: false })),
    ...pokemon.fastEliteMoves.map((m) => ({ ...m, isElite: true }))
  ].filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i) : [];

  const combinedChargeMoves = pokemon ? [
    ...pokemon.chargeMoves.map((m) => ({ ...m, isElite: false })),
    ...pokemon.chargeEliteMoves.map((m) => ({ ...m, isElite: true }))
  ].filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i) : [];

  const isFastMoveElite = fastMove && pokemon?.fastEliteMoves.some(m => m.name === fastMove.name);
  const isChargeMove1Elite = chargeMove1 && pokemon?.chargeEliteMoves.some(m => m.name === chargeMove1.name);

  return (
    <div className="w-[180px] shrink-0 flex flex-col relative snap-center snap-always">
      {/* Role Header */}
      <div className="flex items-center justify-between mb-2 px-1 ">
        <span className={`text-[10px] font-black tracking-widest uppercase ${roleTextColor}`}>
          {roleLabel}
        </span>
        <button onClick={onRemoveRequest} className="text-[10px] text-slate-500 hover:text-red-400">
          비우기
        </button>
      </div>

      <div className="flex-1 flex flex-col border border-slate-700/50 bg-slate-900/80 rounded-lg relative">
        <div className={`absolute left-0 right-0 top-0 h-[3px] rounded-t-lg ${getStatusBgColor(trainingStatus || 'Not Caught')} z-10 pointer-events-none`}></div>

        {/* Top: Image */}
        <div className="px-2 pt-3 pb-1 border-b border-slate-800/50 bg-slate-950/50 rounded-t-lg relative flex flex-col items-center overflow-hidden group/img">
          
          <div className="w-full flex justify-between absolute top-2 px-2 left-0 z-20">
            <button
              disabled={!canBeShadow}
              onClick={toggleShadow}
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-all ${
                !canBeShadow 
                  ? 'opacity-30 cursor-not-allowed border-slate-700 bg-slate-800' 
                  : isShadow 
                    ? 'bg-purple-600/30 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)] text-purple-400' 
                    : 'border-slate-600 bg-slate-800 text-slate-500 hover:border-purple-500/50 hover:text-purple-400'
              }`}
            >
              <span className="text-[8px] font-bold leading-none">S</span>
            </button>
            <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">
              #{String(pokemon.id).padStart(3, '0')}
            </span>
          </div>

          <div className="cursor-pointer my-2 flex items-center justify-center w-full h-[144px] relative" onClick={onSelectPokemonRequest}>
             <PokemonImage 
              pokemonId={pokemon.id}
              pokemonName={pokemon.name}
              defaultImage={pokemon.image}
              className={`w-80 h-80 object-contain ${isShadow ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] mix-blend-plus-lighter' : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]'}`}
            />
          </div>
        </div>

        {/* Middle: Name & Types & Status */}
        <div className="p-2 border-b border-slate-800/50 flex flex-col items-center pb-2">
          <h4 className="text-sm font-bold tracking-tight text-white truncate w-full text-center mb-1">
            {pokemon.name}
          </h4>
          
          <div className="flex gap-1 flex-row mb-2 z-20">
            <input title="Attack IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.atkIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, atkIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-6 h-4 text-[9px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-red-400'} outline-none focus:border-red-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
            <input title="Defense IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.defIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, defIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-6 h-4 text-[9px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-blue-400'} outline-none focus:border-blue-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
            <input title="HP IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.hpIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, hpIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-6 h-4 text-[9px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-green-400'} outline-none focus:border-green-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
          </div>

          <div className="flex items-center justify-between w-full">
            <div className="flex gap-1 shrink-0">
              {pokemon.types.map(t => (
                <img 
                  key={t} 
                  src={TYPE_ICONS[t]} 
                  alt={t} 
                  className="w-3.5 h-3.5 object-contain" 
                  title={t} 
                />
              ))}
            </div>

            <div className="relative dropdown-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'status' ? null : 'status');
                }}
                className={`px-1.5 py-0.5 text-[9px] font-bold rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-colors ${getStatusColor(trainingStatus || 'Not Caught')}`}
              >
                {trainingStatus || 'Not Caught'}
              </button>
              {openDropdown === 'status' && (
                <div className="absolute bottom-full right-0 mb-1 w-24 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-y-auto max-h-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {availableStatuses.map((status) => (
                    <div 
                      key={status}
                      className="px-2 py-1.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        const isNowUncaught = ['Not Caught', 'To Catch'].includes(status);
                        onUpdate({ 
                          ...slot, 
                          trainingStatus: status,
                          ...(isNowUncaught && { atkIv: undefined, defIv: undefined, hpIv: undefined })
                        });
                        setOpenDropdown(null);
                      }}
                    >
                      <span className={`text-[9px] font-bold ${getStatusColor(status)}`}>{status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom: Fast & Charge moves stacked vertically */}
        <div className="p-2 flex flex-col gap-1.5">
          {/* Fast */}
          <div className="flex items-center relative">
            <div className="flex-1 relative">
              <button 
                className="w-full flex flex-col items-start p-1 bg-slate-950 border border-slate-800 rounded text-[10px] hover:border-slate-500 overflow-hidden relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!pokemon || combinedFastMoves.length === 0) return;
                  setOpenDropdown(openDropdown === 'fast' ? null : 'fast');
                }}
              >
                {isFastMoveElite && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-purple-500/80 border-l-[10px] border-l-transparent"></div>
                )}
                <span className="text-slate-500 uppercase font-black text-[8px] mb-0.5">Fast</span>
                <div className="flex items-center gap-1 w-full truncate">
                  {fastMove && <img src={TYPE_ICONS[fastMove.type]} alt={fastMove.type} className="w-3 h-3 object-contain" />}
                  <span className={`font-bold truncate ${fastMove ? TYPE_TEXT_COLORS[fastMove.type] || 'text-slate-400' : 'text-slate-500'}`}>
                    {fastMove?.name || 'Select'}
                  </span>
                </div>
              </button>
              
              {openDropdown === 'fast' && pokemon && (
                <div className="absolute bottom-full left-0 w-48 mb-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {combinedFastMoves.map((m, idx) => (
                    <div 
                      key={idx}
                      className="px-2 py-1.5 flex items-center hover:bg-slate-800 cursor-pointer border-b border-slate-800/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...slot, fastMove: { name: m.name, type: m.type } });
                        setOpenDropdown(null);
                      }}
                    >
                      <img src={TYPE_ICONS[m.type]} className="w-3 h-3 object-contain mr-1" />
                      <span className={`text-[10px] font-bold ${TYPE_TEXT_COLORS[m.type] || 'text-slate-400'}`}>{m.name}</span>
                      {m.isElite && <span className="ml-auto text-[7px] px-1 bg-purple-600/20 text-purple-400 rounded">Legacy</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="ml-1 shrink-0">
              <div 
                className={`w-4 h-4 border rounded-sm transition-colors cursor-pointer flex items-center justify-center ${
                  slot.fastMoveChecked ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-700'
                }`}
                onClick={() => onUpdate({ ...slot, fastMoveChecked: !slot.fastMoveChecked })}
              >
                {slot.fastMoveChecked && <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />}
              </div>
            </div>
          </div>

          {/* Charge */}
          <div className="flex items-center relative">
            <div className="flex-1 relative">
              <button 
                className="w-full flex flex-col items-start p-1 bg-slate-950 border border-slate-800 rounded text-[10px] hover:border-slate-500 overflow-hidden relative"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!pokemon || combinedChargeMoves.length === 0) return;
                  setOpenDropdown(openDropdown === 'charge1' ? null : 'charge1');
                }}
              >
                {isChargeMove1Elite && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[10px] border-t-purple-500/80 border-l-[10px] border-l-transparent"></div>
                )}
                <span className="text-slate-500 uppercase font-black text-[8px] mb-0.5">Charge</span>
                <div className="flex items-center gap-1 w-full truncate">
                  {chargeMove1 && <img src={TYPE_ICONS[chargeMove1.type]} alt={chargeMove1.type} className="w-3 h-3 object-contain" />}
                  <span className={`font-bold truncate ${chargeMove1 ? TYPE_TEXT_COLORS[chargeMove1.type] || 'text-slate-400' : 'text-slate-500'}`}>
                    {chargeMove1?.name || 'Select'}
                  </span>
                </div>
              </button>
              
              {openDropdown === 'charge1' && pokemon && (
                <div className="absolute bottom-full left-0 w-48 mb-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-32 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {combinedChargeMoves.map((m, idx) => (
                    <div 
                      key={idx}
                      className="px-2 py-1.5 flex items-center hover:bg-slate-800 cursor-pointer border-b border-slate-800/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdate({ ...slot, chargeMove1: { name: m.name, type: m.type } });
                        setOpenDropdown(null);
                      }}
                    >
                      <img src={TYPE_ICONS[m.type]} className="w-3 h-3 object-contain mr-1" />
                      <span className={`text-[10px] font-bold ${TYPE_TEXT_COLORS[m.type] || 'text-slate-400'}`}>{m.name}</span>
                      {m.isElite && <span className="ml-auto text-[7px] px-1 bg-purple-600/20 text-purple-400 rounded">Legacy</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ml-1 shrink-0">
              <div 
                className={`w-4 h-4 border rounded-sm transition-colors cursor-pointer flex items-center justify-center ${
                  slot.chargeMove1Checked ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-700'
                }`}
                onClick={() => onUpdate({ ...slot, chargeMove1Checked: !slot.chargeMove1Checked })}
              >
                {slot.chargeMove1Checked && <Check className="w-2.5 h-2.5 text-slate-950 font-bold" />}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
