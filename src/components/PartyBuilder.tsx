import React, { useState } from 'react';
import { PokemonSlot } from './PokemonSlot';
import { PartySlotData, Pokemon, Move } from '../scripts/types';
import { POKEMON_DATA, POKEMON_TYPES, TYPE_TEXT_COLORS } from '../scripts/pokemonData';
import { TYPE_ICONS } from '../scripts/icons';
import { PokemonImage } from './PokemonImage';
import { ChevronDown, X, Trash2, Upload, Download, GripVertical, Eye, EyeOff } from 'lucide-react';

interface PartyBuilderProps {
  selectedType: string;
  setSelectedType: (type: string) => void;
  slots: PartySlotData[];
  setSlots: React.Dispatch<React.SetStateAction<PartySlotData[]>>;
  onImportClick: () => void;
  onExportClick: () => void;
}

const POKEMON_TYPES_LIST = [
  "normal", "fire", "water", "grass", "electric", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

export function PartyBuilder({ selectedType, setSelectedType, slots, setSlots, onImportClick, onExportClick }: PartyBuilderProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'pokemon' | 'fastMove' | 'chargeMove';
    slotId: string | null;
  }>({
    isOpen: false,
    type: 'pokemon',
    slotId: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('pogo-hidden-types');
    return saved ? JSON.parse(saved) : [];
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newSlots = [...slots];
    const item = newSlots[draggedIndex];
    newSlots.splice(draggedIndex, 1);
    newSlots.splice(dropIndex, 0, item);
    setSlots(newSlots);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpdateSlot = (updatedSlot: PartySlotData) => {
    setSlots(slots.map(s => s.id === updatedSlot.id ? updatedSlot : s));
  };

  const openPokemonSelector = (slotId: string) => setModalState({ isOpen: true, type: 'pokemon', slotId });
  const openFastMoveSelector = (slotId: string) => setModalState({ isOpen: true, type: 'fastMove', slotId });
  const openChargeMoveSelector = (slotId: string) => setModalState({ isOpen: true, type: 'chargeMove', slotId });

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
    setSearchTerm('');
    setSearchQuery('');
  };

  const handleSelectPokemon = (pokemon: Pokemon) => {
    if (!modalState.slotId) return;
    const targetSlot = slots.find(s => s.id === modalState.slotId);
    if (!targetSlot) return;

    handleUpdateSlot({
      ...targetSlot,
      pokemon,
      fastMove: pokemon.fastMoves[0] || null,
      chargeMove1: pokemon.chargeMoves[0] || null,
      fastMoveChecked: false,
      chargeMove1Checked: false,
      isShadow: false,
      trainingStatus: 'Not Caught'
    });
    closeModal();
  };

  const handleSelectMove = (move: Move) => {
    if (!modalState.slotId) return;
    const targetSlot = slots.find(s => s.id === modalState.slotId);
    if (!targetSlot) return;

    if (modalState.type === 'fastMove') {
      handleUpdateSlot({ ...targetSlot, fastMove: move });
    } else if (modalState.type === 'chargeMove') {
      handleUpdateSlot({ ...targetSlot, chargeMove1: move });
    }
    closeModal();
  };

  const activeSlot = slots.find(s => s.id === modalState.slotId);
  const activePokemon = activeSlot?.pokemon;

  const filteredPokemons = POKEMON_DATA.filter(poke => {
    const normSearch = searchTerm.trim().toLowerCase();
    
    const isMegaOrPrimal = poke.name.startsWith('메가') || poke.name.startsWith('원시');
    let matchSlot = false;
    if (modalState.slotId === 'slot-0') {
      matchSlot = isMegaOrPrimal;
    } else {
      matchSlot = !isMegaOrPrimal;
    }

    const matchType = poke.types.includes(selectedType);

    if (!normSearch) {
      return matchType && matchSlot;
    }

    let isMatch = false;
    if (normSearch.length >= 2) {
      // 2글자 이상 입력 시에만 부분 일치 허용 (이름의 일부가 분명히 포함)
      isMatch = poke.name.toLowerCase().includes(normSearch);
    } else {
      // 1글자 입력 시에는 정확히 일치하는 경우만 허용 (전체를 검색했을 때만)
      isMatch = poke.name.toLowerCase() === normSearch;
    }
    
    // 검색 시에는 타입 필터를 무시하고 슬롯 조건과 검색 조건만으로 필터링
    return isMatch && matchSlot;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-24 w-full pt-16">
      <header className="flex flex-col w-full max-w-full items-center mb-8 border-b border-slate-800 relative z-10">
        <div className="flex flex-row w-full max-w-full items-center justify-between">
          <div>
            <h6 className="font-black tracking-tighter uppercase text-left">
              <span className="text-yellow-300">POKEMON </span>
              <span className="text-blue-500">GO</span>
              <br/>
              <span className="text-white-600">Raid Attacker Planner</span>
            </h6>
            <span className="text-gray-600 text-xs">포켓몬고 레이드 공격대 육성계획표</span>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-end">
          <button 
            onClick={toggleCurrentTypeVisibility}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            {hiddenTypes.includes(selectedType) ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hiddenTypes.includes(selectedType) ? '현재 타입 보이기' : '현재 타입 뒤로'}
          </button>
          <button 
            onClick={onImportClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            불러오기
          </button>
          <button 
            onClick={onExportClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-full border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            저장하기
          </button>
        </div>
        </div>

        <div className="w-full max-w-full h-14 mx-auto mt-4 px-2 overflow-x-auto custom-scrollbar items-center">
          <div className="flex items-center h-10 gap-2 min-w-max justify-between sm:justify-between">
            {[...POKEMON_TYPES_LIST.filter(t => !hiddenTypes.includes(t)), ...POKEMON_TYPES_LIST.filter(t => hiddenTypes.includes(t))].map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shrink-0 border-none ${
                  selectedType === type 
                    ? 'scale-125 z-10' 
                    : 'opacity-70 hover:opacity-100'
                } ${hiddenTypes.includes(type) && selectedType !== type ? 'opacity-30 grayscale' : ''}`}
                title={type}
              >
                <img src={TYPE_ICONS[type]} alt={type} className="w-6 h-6 object-contain" />
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-2 relative">
        {slots.map((slot, index) => {
          const roleLabel = index === 0 ? 'MEGA' : index === 1 || index === 2 ? 'DPS' : index === 3 || index === 4 ? 'ACE' : 'TANK';
          const roleTextColor = index === 0 ? 'text-purple-400' : index === 1 || index === 2 ? 'text-red-400' : index === 3 || index === 4 ? 'text-blue-400' : 'text-emerald-400';
          const roleBgColor = index === 0 ? 'bg-purple-500' : index === 1 || index === 2 ? 'bg-red-500' : index === 3 || index === 4 ? 'bg-blue-500' : 'bg-emerald-500';
          
          return (
          <div 
            key={slot.id} 
            className={`flex gap-2 items-center group transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <div className={`w-4 sm:w-12 flex flex-col items-center justify-center font-black tracking-widest text-[10px] sm:text-xs text-center ${roleTextColor} opacity-80 uppercase shrink-0`}>
              <div className="cursor-grab hover:text-white mb-2 active:cursor-grabbing text-slate-500">
                <GripVertical className="w-4 h-4" />
              </div>
              <span className="-rotate-90 sm:rotate-0 inline-block">{roleLabel}</span>
            </div>
            <div className="flex-1 pointer-events-auto">
              <PokemonSlot 
                slot={slot}
                roleColor={roleBgColor}
                onUpdate={handleUpdateSlot}
                onSelectPokemonRequest={() => openPokemonSelector(slot.id)}
              />
            </div>
            <button 
              onClick={() => {
                handleUpdateSlot({
                  ...slot,
                  pokemon: null,
                  fastMove: null,
                  chargeMove1: null,
                  fastMoveChecked: false,
                  chargeMove1Checked: false,
                  isShadow: false,
                  trainingStatus: 'Not Caught'
                });
              }}
              className="w-10 h-10 bg-red-500/10 text-red-500 rounded flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors border border-red-500/20 opacity-0 group-hover:opacity-100 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )})}
      </div>

      {/* Modals */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-[#090b0e]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.15)] w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">
                {modalState.type === 'pokemon' && 'Select Pokemon'}
                {modalState.type === 'fastMove' && 'Select Fast Move'}
                {modalState.type === 'chargeMove' && 'Select Charge Move'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalState.type === 'pokemon' && (
              <form 
                className="p-2 border-b border-slate-800/80 bg-slate-900/80 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchTerm(searchQuery);
                }}
              >
                <input 
                  type="text" 
                  placeholder="Search Pokémon..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded transition-colors"
                >
                  검색
                </button>
              </form>
            )}

            <div className="p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {modalState.type === 'pokemon' && (
                <div className="grid grid-cols-2 gap-2">
                  {filteredPokemons.length > 0 ? filteredPokemons.map(poke => (
                    <button
                      key={poke.name}
                      onClick={() => handleSelectPokemon(poke)}
                      className="flex items-center p-2 rounded bg-slate-900/50 hover:bg-slate-800 border border-slate-800/50 hover:border-blue-500/50 transition-all text-left"
                    >
                      <div className="w-12 h-12 bg-slate-950/50 border border-slate-800 rounded flex items-center justify-center mr-3 shrink-0">
                         <PokemonImage pokemonId={poke.id} pokemonName={poke.name} defaultImage={poke.image} className="w-10 h-10 object-contain drop-shadow-md" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase mb-0.5">#{poke.id}</div>
                        <div className="font-bold text-sm tracking-tight">{poke.name}</div>
                        <div className="flex gap-1 mt-1">
                          {poke.types.map(t => (
                            <img key={t} src={TYPE_ICONS[t]} alt={t} className="w-3.5 h-3.5 object-contain" title={t} />
                          ))}
                        </div>
                      </div>
                    </button>
                  )) : (
                    <div className="col-span-2 text-center p-4 text-slate-500 text-sm">No Pokémon found.</div>
                  )}
                </div>
              )}

              {modalState.type === 'fastMove' && activePokemon && (
                <div className="flex flex-col gap-1">
                  {[
                    ...activePokemon.fastMoves.map((m) => ({ ...m, isElite: false })),
                    ...activePokemon.fastEliteMoves.map((m) => ({ ...m, isElite: true }))
                  ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map((move, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMove({ name: move.name, type: move.type })}
                      className="flex items-center justify-between px-3 py-2 rounded bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <img src={TYPE_ICONS[move.type]} alt={move.type} className="w-4 h-4 object-contain" />
                        <span className={`font-bold text-sm transition-colors ml-1 ${TYPE_TEXT_COLORS[move.type] || 'text-slate-400'}`}>{move.name}</span>
                        {move.isElite && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest font-bold">Legacy</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{move.type}</span>
                    </button>
                  ))}
                </div>
              )}

              {modalState.type === 'chargeMove' && activePokemon && (
                <div className="flex flex-col gap-1">
                  {[
                    ...activePokemon.chargeMoves.map((m) => ({ ...m, isElite: false })),
                    ...activePokemon.chargeEliteMoves.map((m) => ({ ...m, isElite: true }))
                  ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i).map((move, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectMove({ name: move.name, type: move.type })}
                      className="flex items-center justify-between px-3 py-2 rounded bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2">
                         <img src={TYPE_ICONS[move.type]} alt={move.type} className="w-4 h-4 object-contain" />
                        <span className={`font-bold text-sm transition-colors ml-1 ${TYPE_TEXT_COLORS[move.type] || 'text-slate-400'}`}>{move.name}</span>
                        {move.isElite && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-600/20 text-purple-400 border border-purple-500/30 uppercase tracking-widest font-bold">Legacy</span>
                        )}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500">{move.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
