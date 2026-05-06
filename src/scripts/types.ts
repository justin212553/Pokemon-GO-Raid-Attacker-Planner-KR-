export interface Move {
  id: string;
  name: string;
  type: string;
}

export type TrainingStatus = 'Not Caught' | 'To Catch' | 'Caught' | 'Evolved' | 'Maxed Out' | 'Mega Evolved';

export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  image: string;
  fastMoves: Move[];
  fastEliteMoves: Move[];
  chargeMoves: Move[];
  chargeEliteMoves: Move[];
  shadow_eligible: boolean;
}

export interface PartySlotData {
  id: string;
  pokemon: Pokemon | null;
  fastMove: Move | null;
  chargeMove1: Move | null;
  fastMoveChecked: boolean;
  chargeMove1Checked: boolean;
  isShadow: boolean;
  trainingStatus: TrainingStatus;
  atkIv?: number;
  defIv?: number;
  hpIv?: number;
}
