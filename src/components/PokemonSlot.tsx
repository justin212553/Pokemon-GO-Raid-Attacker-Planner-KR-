import React, { useState, useEffect } from 'react';
import { POKEMON_DATA, POKEMON_TYPES, TYPE_TEXT_COLORS } from '../scripts/pokemonData';
import { Pokemon, PartySlotData, Move } from '../scripts/types';
import { Shield, User, Play, ChevronDown, Check, Swords, Plus } from 'lucide-react';
import { PokemonImage } from './PokemonImage';
import { TYPE_ICONS } from '../scripts/icons';

interface PokemonSlotProps {
  slot: PartySlotData;
  roleColor: string;
  onUpdate: (slot: PartySlotData) => void;
  onSelectPokemonRequest: () => void;
}

export function PokemonSlot({ 
  slot, 
  roleColor,
  onUpdate,
  onSelectPokemonRequest, 
}: PokemonSlotProps) {

  if (!slot.pokemon) {
    return (
      <div 
        onClick={onSelectPokemonRequest}
        className="relative h-[92px] border-2 border-dashed border-slate-800 hover:border-slate-600 bg-slate-900/10 rounded-lg flex items-center justify-center cursor-pointer transition-colors text-slate-600 hover:text-slate-400 group overflow-hidden"
      >
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border border-slate-700 flex items-center justify-center text-slate-600 group-hover:text-slate-400 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-slate-600 uppercase mt-2 tracking-widest group-hover:text-slate-400">Assign Pokemon</span>
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
    <div className="group/slot relative flex border border-slate-700/50 bg-slate-900/80 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/80 transition-all text-slate-100">
      
      <div className={`absolute left-0 top-0 bottom-0 w-3 rounded-l-lg ${getStatusBgColor(trainingStatus || 'Not Caught')} z-10 opacity-100 pointer-events-none`}></div>
      
      {/* 포켓몬 이미지 (Left Box) */}
      <div className="w-2/5 min-w-[140px] pl-4 pr-1 py-4 overflow-hidden border-r border-slate-800/50 flex flex-row items-center bg-slate-950/50 transition-colors relative group/img rounded-l-lg ">
        <div className="flex flex-col gap-1 z-20 shrink-0">
          <input title="Attack IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.atkIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, atkIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-7 h-5 text-[10px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-red-400'} outline-none focus:border-red-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
          <input title="Defense IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.defIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, defIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-7 h-5 text-[10px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-blue-400'} outline-none focus:border-blue-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
          <input title="HP IV" type={isUncaught ? "text" : "number"} min="0" max="15" value={isUncaught ? "-" : (slot.hpIv ?? 15)} readOnly={isUncaught} onChange={(e) => { if(!isUncaught){ const v = parseInt(e.target.value); onUpdate({...slot, hpIv: isNaN(v) ? 0 : Math.min(15, Math.max(0, v))}); } }} className={`w-7 h-5 text-[10px] bg-slate-900 border border-slate-700 text-center font-bold ${isUncaught ? 'text-slate-500' : 'text-green-400'} outline-none focus:border-green-500 rounded-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]`} />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center cursor-pointer h-full relative" onClick={onSelectPokemonRequest}>
          <PokemonImage 
            pokemonId={pokemon.id}
            pokemonName={pokemon.name}
            defaultImage={pokemon.image}
            className={`w-50 h-50 object-contain absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isShadow ? 'drop-shadow-[0_0_10px_rgba(168,85,247,0.8)] mix-blend-plus-lighter' : 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]'}`}
          />
          <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500 font-bold bg-slate-900/80 px-1 py-0.5 rounded border border-slate-800">
            #{String(pokemon.id).padStart(3, '0')}
          </span>
        </div>
      </div>

      {/* 정보 및 스킬 (Right Box) */}
      <div className="flex-1 flex flex-col justify-center py-1 relative">
        {/* 포켓몬 이름 & 훈련 상태 (Top Row) */}
        <div className="flex justify-between items-center px-4 py-1 border-b border-slate-800/50">
          {/* 왼쪽 영역: 그림자 아이콘 + 이름 */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              disabled={!canBeShadow}
              onClick={toggleShadow}
              className={`shrink-0 w-6 h-6 rounded flex items-center justify-center border transition-all ${
                !canBeShadow 
                  ? 'opacity-30 cursor-not-allowed border-slate-700 bg-slate-800' 
                  : isShadow 
                    ? 'bg-purple-600/30 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.4)] text-purple-400' 
                    : 'border-slate-600 bg-slate-800 text-slate-500 hover:border-purple-500/50 hover:text-purple-400'
              }`}
              title={!canBeShadow ? 'Shadow not available' : isShadow ? 'Shadow' : 'Normal'}
            >
              <span className="text-[10px] font-bold leading-none">S</span>
            </button>
            
            <h4 className="text-xl font-bold tracking-tight text-white truncate leading-tight">
              {pokemon.name}
            </h4>
          </div>

          {/* 오른쪽 영역: 타입 아이콘 + 육성 상태 */}
          <div className="flex items-center gap-3 shrink-0">
            {/* 타입 아이콘 그룹 */}
            <div className="flex gap-1 items-center">
              {pokemon.types.map(t => (
                <img 
                  key={t} 
                  src={TYPE_ICONS[t]} 
                  alt={t} 
                  className="w-5 h-5 object-contain" 
                  title={t} 
                />
              ))}
            </div>

            {/* 드롭다운 버튼 */}
            <div className="relative dropdown-container">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDropdown(openDropdown === 'status' ? null : 'status');
                }}
                className={`px-3 py-1.5 text-[11px] font-bold rounded bg-slate-800 border border-slate-600 hover:bg-slate-700 transition-colors w-28 text-center ${getStatusColor(trainingStatus || 'Not Caught')}`}
              >
                {trainingStatus || 'Not Caught'}
              </button>

              {/* 드롭다운 메뉴 (동일) */}
              {openDropdown === 'status' && (
                <div className="absolute top-full right-0 mt-1 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                  {availableStatuses.map((status) => (
                    <div 
                      key={status}
                      className="px-3 py-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
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
                      <span className={`text-[10px] font-bold ${getStatusColor(status)}`}>{status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 퀵무브 (Middle Row) */}
        <div className="flex items-center px-4 py-2 border-b border-slate-800/50 relative">
          <div className="flex-1 relative">
            <button 
              className="w-full flex justify-between items-center px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] hover:border-slate-500 transition-colors relative overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                if (!pokemon || combinedFastMoves.length === 0) return;
                setOpenDropdown(openDropdown === 'fast' ? null : 'fast');
              }}
            >
              {isFastMoveElite && (
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[12px] border-t-purple-500/80 border-r-[12px] border-r-transparent"></div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase font-bold tracking-widest text-[9px] shrink-0">Fast</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </div>
              <div className="flex items-center gap-1.5 truncate ml-2 text-right">
                {fastMove && <img src={TYPE_ICONS[fastMove.type]} alt={fastMove.type} className="w-3.5 h-3.5 object-contain shrink-0" />}
                <span className={`font-bold truncate ${fastMove ? TYPE_TEXT_COLORS[fastMove.type] || 'text-slate-400' : 'text-slate-500'}`}>
                  {fastMove?.name || 'Select Move'}
                </span>
              </div>
            </button>
            
            {openDropdown === 'fast' && pokemon && (
              <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                {combinedFastMoves.map((m, idx) => (
                  <div 
                    key={idx}
                    className="px-3 py-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Remove isElite when passing back to state if we want strictly type Move
                      onUpdate({ ...slot, fastMove: { name: m.name, type: m.type } });
                      setOpenDropdown(null);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img src={TYPE_ICONS[m.type]} className="w-4 h-4 object-contain" />
                      <span className={`text-[11px] font-bold py-0.5 ${TYPE_TEXT_COLORS[m.type] || 'text-slate-400'}`}>{m.name}</span>
                      {m.isElite && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 uppercase font-bold">Legacy</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="ml-3 shrink-0">
            <div 
              className={`w-5 h-5 border rounded-sm transition-colors cursor-pointer flex items-center justify-center ${
                slot.fastMoveChecked ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-700'
              }`}
              onClick={() => onUpdate({ ...slot, fastMoveChecked: !slot.fastMoveChecked })}
            >
              {slot.fastMoveChecked && <Check className="w-3 h-3 text-slate-950 font-bold" />}
            </div>
          </div>
        </div>

        {/* 차지무브 (Bottom Row) */}
        <div className="flex items-center px-4 pt-2 relative">
          <div className="flex-1 relative">
            <button 
              className="w-full flex justify-between items-center px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-[11px] hover:border-slate-500 transition-colors relative overflow-hidden"
              onClick={(e) => {
                e.stopPropagation();
                if (!pokemon || combinedChargeMoves.length === 0) return;
                setOpenDropdown(openDropdown === 'charge1' ? null : 'charge1');
              }}
            >
              {isChargeMove1Elite && (
                <div className="absolute top-0 left-0 w-0 h-0 border-t-[12px] border-t-purple-500/80 border-r-[12px] border-r-transparent"></div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase font-bold tracking-widest text-[9px] shrink-0">Charge</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </div>
              <div className="flex items-center gap-1.5 truncate ml-2 text-right">
                {chargeMove1 && <img src={TYPE_ICONS[chargeMove1.type]} alt={chargeMove1.type} className="w-3.5 h-3.5 object-contain shrink-0" />}
                <span className={`font-bold truncate ${chargeMove1 ? TYPE_TEXT_COLORS[chargeMove1.type] || 'text-slate-400' : 'text-slate-500'}`}>
                  {chargeMove1?.name || 'Select Move'}
                </span>
              </div>
            </button>
            
            {openDropdown === 'charge1' && pokemon && (
              <div className="absolute bottom-full mb-1 left-0 w-full bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar">
                {combinedChargeMoves.map((m, idx) => (
                  <div 
                    key={idx}
                    className="px-3 py-2 flex items-center justify-between hover:bg-slate-800 cursor-pointer border-b border-slate-800/50 last:border-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdate({ ...slot, chargeMove1: { name: m.name, type: m.type } });
                      setOpenDropdown(null);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <img src={TYPE_ICONS[m.type]} className="w-4 h-4 object-contain" />
                      <span className={`text-[11px] font-bold py-0.5 ${TYPE_TEXT_COLORS[m.type] || 'text-slate-400'}`}>{m.name}</span>
                      {m.isElite && (
                        <span className="text-[8px] px-1 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 uppercase font-bold">Legacy</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ml-3 shrink-0">
            <div 
              className={`w-5 h-5 border rounded-sm transition-colors cursor-pointer flex items-center justify-center ${
                slot.chargeMove1Checked ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-900 border-slate-700'
              }`}
              onClick={() => onUpdate({ ...slot, chargeMove1Checked: !slot.chargeMove1Checked })}
            >
              {slot.chargeMove1Checked && <Check className="w-3 h-3 text-slate-950 font-bold" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
