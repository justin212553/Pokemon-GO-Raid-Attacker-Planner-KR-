// PvPoke gamemaster + pokemon-go-api(공식 한국어 번역)로 src/data/*.json 을 생성합니다.
//
//   node scripts/build-data.mjs           -> scripts/out/ 에 생성 + 현재 데이터와 비교 리포트
//   node scripts/build-data.mjs --write   -> src/data/ 를 직접 덮어씀 (리포트는 scripts/out/ 에)
//
// 구조(기술풀, 레거시 기술, 그림자 가능 여부)는 기존 preprocessing/pkmn.py 와 동일하게 PvPoke 에서,
// 이름은 scripts/ko-names.json -> pokemon-go-api 공식 번역 순서로 가져옵니다.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'src', 'data');
const OUT_DIR = join(ROOT, 'scripts', 'out');
const WRITE = process.argv.includes('--write');

const SOURCES = {
  pvpPokemon: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster/pokemon.json',
  pvpMoves: 'https://raw.githubusercontent.com/pvpoke/pvpoke/master/src/data/gamemaster/moves.json',
  pokedex: 'https://pokemon-go-api.github.io/pokemon-go-api/api/pokedex.json',
};

const FORM_LABELS = {
  Alolan: '알로라',
  Galarian: '가라르',
  Hisuian: '히스이',
  Paldean: '팔데아',
  Origin: '오리진',
  Altered: '어나더',
  Incarnate: '화신',
  Therian: '영물',
  Male: '수',
  Female: '암',
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
};

const readJson = async (path) => JSON.parse((await readFile(path, 'utf-8')).replace(/^﻿/, ''));

const main = async () => {
  const [pvpPokemon, pvpMoves, pokedex, ko] = await Promise.all([
    fetchJson(SOURCES.pvpPokemon),
    fetchJson(SOURCES.pvpMoves),
    fetchJson(SOURCES.pokedex),
    readJson(join(ROOT, 'scripts', 'ko-names.json')),
  ]);

  // --- 공식 한국어 사전 (pokemon-go-api) ---
  const koByDex = {};
  const koMega = {};
  const koMoves = {};
  const collectMoves = (entry) => {
    for (const group of ['quickMoves', 'cinematicMoves', 'eliteQuickMoves', 'eliteCinematicMoves']) {
      const moves = entry[group];
      if (!moves || Array.isArray(moves)) continue;
      for (const move of Object.values(moves)) {
        if (move?.names?.Korean) koMoves[move.id.replace(/_FAST$/, '')] = move.names.Korean;
      }
    }
  };
  for (const entry of pokedex) {
    koByDex[entry.dexNr] = entry.names.Korean;
    collectMoves(entry);
    for (const form of Object.values(entry.regionForms || {})) collectMoves(form);
    for (const mega of Object.values(entry.megaEvolutions || {})) {
      const suffix = mega.id.match(/_MEGA_([XYZ])$/)?.[1] || (mega.id.endsWith('_PRIMAL') ? 'PRIMAL' : '');
      koMega[`${entry.dexNr}:${suffix}`] = mega.names.Korean;
    }
  }

  const review = [];

  const generateName = (p) => {
    const base = koByDex[p.dex];
    if (!base) return null;
    const tags = [...p.speciesName.matchAll(/\(([^)]+)\)/g)].map((m) => m[1]);
    const mega = tags.find((t) => /^Mega( [XYZ])?$/.test(t));
    if (mega) {
      const letter = mega.split(' ')[1] || '';
      return koMega[`${p.dex}:${letter}`] || `메가${base}${letter}`;
    }
    if (tags.includes('Primal')) return koMega[`${p.dex}:PRIMAL`] || `원시${base}`;
    if (!tags.length) return base;
    return `${base} (${tags.map((t) => FORM_LABELS[t] || t).join(', ')})`;
  };

  // --- pokemons.json (preprocessing/pkmn.py 와 동일한 변환) ---
  const exclude = new Set(ko.exclude || []);
  const bySpeciesId = Object.fromEntries(pvpPokemon.map((p) => [p.speciesId, p]));
  const pokemons = [];
  for (const p of pvpPokemon) {
    if (p.speciesName.includes('(Shadow)') || exclude.has(p.speciesId)) continue;

    let name = ko.pokemon[p.speciesId];
    if (!name) {
      name = generateName(p) || p.speciesName;
      review.push({ kind: 'pokemon', id: p.speciesId, en: p.speciesName, name });
    }

    const elite = new Set(p.eliteMoves || []);
    // PvPoke 는 메가/원시 폼에 기본 폼의 레거시 기술 표시를 빠뜨리기도 함 (예: 메가뮤츠 X/Y 의 카운터)
    const baseId = p.speciesId.match(/^(.+?)_(?:mega(?:_[xyz])?|primal)$/)?.[1];
    for (const m of bySpeciesId[baseId]?.eliteMoves || []) elite.add(m);
    const forced = new Set(ko.forceElite?.[p.speciesId] || []);
    const fastMoves = p.fastMoves.filter((m) => !forced.has(m));
    const chargedMoves = p.chargedMoves.filter((m) => !forced.has(m));

    pokemons.push({
      id: p.dex,
      name,
      types: p.types,
      fast_moves: fastMoves,
      charged_moves: chargedMoves,
      fast_elite_moves: p.fastMoves.filter((m) => elite.has(m) || forced.has(m)),
      charged_elite_moves: p.chargedMoves.filter((m) => elite.has(m) || forced.has(m)),
      shadow_eligible: (p.tags || []).includes('shadoweligible'),
    });
  }

  // --- moves.json (preprocessing/fix_moves.py + 번역) ---
  // 어떤 포켓몬도 쓰지 않는 기술은 이름이 영어로 남아도 화면에 안 나오므로 리포트에서 뺍니다.
  const usedMoves = new Set(pokemons.flatMap((p) => [...p.fast_moves, ...p.charged_moves, ...p.fast_elite_moves, ...p.charged_elite_moves]));
  const officialMoveName = (id) => {
    if (koMoves[id]) return koMoves[id];
    const plus = id.match(/^(.+?)((?:_PLUS)+)$/);
    if (plus && (ko.moves[plus[1]] || koMoves[plus[1]])) return (ko.moves[plus[1]] || koMoves[plus[1]]) + '+'.repeat(plus[2].length / 5);
    return null;
  };
  const moves = pvpMoves.map((m) => {
    let name = ko.moves[m.moveId];
    if (!name) {
      const official = officialMoveName(m.moveId);
      name = official || m.name;
      if (usedMoves.has(m.moveId)) review.push({ kind: 'move', id: m.moveId, en: m.name, name, official: Boolean(official) });
    }
    return { id: m.moveId, name, type: m.type };
  });

  // --- 저장 ---
  await mkdir(OUT_DIR, { recursive: true });
  const target = WRITE ? DATA_DIR : OUT_DIR;
  const prevPokemons = await readJson(join(DATA_DIR, 'pokemons.json'));
  const prevMoves = await readJson(join(DATA_DIR, 'moves.json'));
  // 원본 API 장애/스키마 변경으로 데이터가 대량으로 빠지면 덮어쓰지 않고 실패시킵니다.
  if (WRITE && (pokemons.length < prevPokemons.length * 0.9 || moves.length < prevMoves.length * 0.9)) {
    throw new Error(`데이터가 비정상적으로 줄었습니다 (pokemons ${prevPokemons.length} -> ${pokemons.length}, moves ${prevMoves.length} -> ${moves.length}). 덮어쓰기를 중단합니다.`);
  }
  await writeFile(join(target, 'pokemons.json'), JSON.stringify(pokemons, null, 2) + '\n', 'utf-8');
  await writeFile(join(target, 'moves.json'), JSON.stringify(moves, null, 4) + '\n', 'utf-8');

  const report = buildReport({ prevPokemons, pokemons, prevMoves, moves, review });
  await writeFile(join(OUT_DIR, 'report.md'), report.text, 'utf-8');

  console.log(`pokemons: ${prevPokemons.length} -> ${pokemons.length}, moves: ${prevMoves.length} -> ${moves.length}`);
  console.log(`changed: ${report.changed}, review needed: ${review.length}`);
  console.log(`written to ${target}, report: ${join(OUT_DIR, 'report.md')}`);
};

const buildReport = ({ prevPokemons, pokemons, prevMoves, moves, review }) => {
  const byName = (list) => new Map(list.map((p) => [p.name, p]));
  const prev = byName(prevPokemons);
  const next = byName(pokemons);
  const lines = [];
  const section = (title, items) => {
    lines.push(`## ${title} (${items.length})`, '');
    lines.push(...(items.length ? items.map((i) => `- ${i}`) : ['- 없음']), '');
  };
  const diffList = (a = [], b = []) => {
    const added = b.filter((m) => !a.includes(m));
    const removed = a.filter((m) => !b.includes(m));
    return [...added.map((m) => `+${m}`), ...removed.map((m) => `-${m}`)].join(' ');
  };

  const added = [...next.keys()].filter((n) => !prev.has(n));
  const removed = [...prev.keys()].filter((n) => !next.has(n));
  const changed = [];
  for (const [name, p] of next) {
    const o = prev.get(name);
    if (!o) continue;
    const parts = [];
    for (const key of ['types', 'fast_moves', 'charged_moves', 'fast_elite_moves', 'charged_elite_moves']) {
      const d = diffList(o[key], p[key]);
      if (d) parts.push(`${key}: ${d}`);
    }
    if (o.shadow_eligible !== p.shadow_eligible) parts.push(`shadow_eligible: ${o.shadow_eligible} -> ${p.shadow_eligible}`);
    if (parts.length) changed.push(`**${name}** — ${parts.join(' / ')}`);
  }

  const prevMoveMap = new Map(prevMoves.map((m) => [m.id, m]));
  const moveChanges = moves
    .filter((m) => !prevMoveMap.has(m.id) || prevMoveMap.get(m.id).type !== m.type)
    .map((m) => (prevMoveMap.has(m.id) ? `${m.id}: type ${prevMoveMap.get(m.id).type} -> ${m.type}` : `+${m.id} (${m.name}, ${m.type})`));
  const nextMoveIds = new Set(moves.map((m) => m.id));
  moveChanges.push(...prevMoves.filter((m) => !nextMoveIds.has(m.id)).map((m) => `-${m.id} (${m.name})`));

  lines.push(`# 데이터 갱신 리포트`, '', `생성 시각: ${new Date().toISOString()}`, '');
  section('이름 확인 필요 (ko-names.json 에 없어서 자동 생성됨)', review.map((r) =>
    r.kind === 'pokemon'
      ? `[포켓몬] \`${r.id}\` ${r.en} → **${r.name}**`
      : `[기술] \`${r.id}\` ${r.en} → **${r.name}**${r.official ? '' : ' (공식 번역 없음)'}`));
  section('새 포켓몬', added);
  section('사라진 포켓몬', removed);
  section('기술/타입/그림자 변경', changed);
  section('기술 목록 변경', moveChanges);

  return { text: lines.join('\n'), changed: added.length + removed.length + changed.length + moveChanges.length };
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
