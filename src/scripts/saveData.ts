import { PartySlotData, TrainingStatus } from './types';
import { POKEMON_DATA } from './pokemonData';

// 브라우저 저장과 파일 내보내기가 공유하는 슬롯 형식입니다.
// 포켓몬/기술은 이름과 ID만 저장하고, 불러올 때 최신 POKEMON_DATA 에서 다시 찾습니다.
export interface SavedSlot {
  name?: string;
  ivs?: number[];
  is_shadow?: boolean;
  training_level?: number;
  fast_move?: { id: string; is_trained: boolean } | null;
  charge_move?: { id: string; is_trained: boolean } | null;
}

export const STATUS_ENUM: TrainingStatus[] = ['Not Caught', 'To Catch', 'Caught', 'Evolved', 'Maxed Out', 'Mega Evolved'];

export const emptySlot = (i: number): PartySlotData => ({
  id: `slot-${i}`,
  pokemon: null,
  fastMove: null,
  chargeMove1: null,
  fastMoveChecked: false,
  chargeMove1Checked: false,
  isShadow: false,
  trainingStatus: 'Not Caught'
});

export const serializeSlot = (slot: PartySlotData): SavedSlot => {
  if (!slot.pokemon) return {};
  return {
    name: slot.pokemon.name,
    ivs: [slot.atkIv ?? 15, slot.defIv ?? 15, slot.hpIv ?? 15],
    is_shadow: slot.isShadow,
    training_level: STATUS_ENUM.indexOf(slot.trainingStatus || 'Not Caught'),
    fast_move: slot.fastMove ? { id: slot.fastMove.id, is_trained: slot.fastMoveChecked } : null,
    charge_move: slot.chargeMove1 ? { id: slot.chargeMove1.id, is_trained: slot.chargeMove1Checked } : null,
  };
};

export const deserializeSlot = (data: SavedSlot | undefined, i: number): PartySlotData => {
  const poke = data?.name ? POKEMON_DATA.find(p => p.name === data.name) : undefined;
  if (!data || !poke) return emptySlot(i);

  const fastMoveId = data.fast_move?.id;
  const fastMoveObj = poke.fastMoves.find(m => m.id === fastMoveId || m.name === fastMoveId) || poke.fastEliteMoves.find(m => m.id === fastMoveId || m.name === fastMoveId) || poke.fastMoves[0] || null;

  const chargeMoveId = data.charge_move?.id;
  const chargeMoveObj = poke.chargeMoves.find(m => m.id === chargeMoveId || m.name === chargeMoveId) || poke.chargeEliteMoves.find(m => m.id === chargeMoveId || m.name === chargeMoveId) || poke.chargeMoves[0] || null;

  return {
    id: `slot-${i}`,
    pokemon: poke,
    fastMove: fastMoveObj,
    chargeMove1: chargeMoveObj,
    fastMoveChecked: data.fast_move?.is_trained ?? false,
    chargeMove1Checked: data.charge_move?.is_trained ?? false,
    isShadow: data.is_shadow ?? false,
    trainingStatus: STATUS_ENUM[data.training_level ?? 0] ?? 'Not Caught',
    atkIv: data.ivs?.[0] ?? 15,
    defIv: data.ivs?.[1] ?? 15,
    hpIv: data.ivs?.[2] ?? 15,
  };
};

export const serializeParties = (allParties: Record<string, PartySlotData[]>): Record<string, SavedSlot[]> =>
  Object.fromEntries(Object.entries(allParties).map(([type, slots]) => [type, slots.map(serializeSlot)]));

// types 에 있는 타입만 6칸씩 복원합니다. 저장 데이터에 없는 타입/칸은 빈 슬롯이 됩니다.
export const deserializeParties = (partyList: Record<string, SavedSlot[]>, types: string[]): Record<string, PartySlotData[]> =>
  Object.fromEntries(types.map(type => [type, Array.from({ length: 6 }, (_, i) => deserializeSlot(partyList?.[type]?.[i], i))]));
