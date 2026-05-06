import { Pokemon, Move } from './types';
import rawPokemons from '../data/pokemons.json';
import rawMoves from '../data/moves.json';

export const POKEMON_TYPES: Record<string, string> = {
  'normal': 'bg-gray-400',
  'fire': 'bg-red-500',
  'water': 'bg-blue-500',
  'grass': 'bg-green-500',
  'electric': 'bg-yellow-400',
  'ice': 'bg-cyan-300',
  'fighting': 'bg-orange-600',
  'poison': 'bg-purple-500',
  'ground': 'bg-yellow-600',
  'flying': 'bg-indigo-300',
  'psychic': 'bg-pink-500',
  'bug': 'bg-lime-500',
  'rock': 'bg-yellow-700',
  'ghost': 'bg-purple-700',
  'dragon': 'bg-indigo-600',
  'dark': 'bg-zinc-700',
  'steel': 'bg-gray-500',
  'fairy': 'bg-pink-300'
};

export const TYPE_TEXT_COLORS: Record<string, string> = {
  'normal': 'text-slate-400',
  'fire': 'text-orange-400',
  'water': 'text-blue-400',
  'grass': 'text-emerald-400',
  'electric': 'text-yellow-400',
  'ice': 'text-cyan-400',
  'fighting': 'text-red-400',
  'poison': 'text-purple-400',
  'ground': 'text-amber-400',
  'flying': 'text-sky-400',
  'psychic': 'text-pink-400',
  'bug': 'text-lime-400',
  'rock': 'text-stone-400',
  'ghost': 'text-fuchsia-400',
  'dragon': 'text-indigo-400',
  'dark': 'text-zinc-400',
  'steel': 'text-slate-400',
  'fairy': 'text-rose-400'
};

export const TYPE_LIST = Object.keys(POKEMON_TYPES);

const movesDict: Record<string, any> = {};
for (const move of rawMoves) {
  movesDict[move.id] = move;
}

const formImageCache: Record<string, string> = {};

const getLatestGenSprite = (sprites: any, fallback: string) => {
  if (!sprites) return fallback;
  return sprites.other?.['official-artwork']?.front_default ||
         sprites.other?.home?.front_default ||
         sprites.versions?.['generation-ix']?.['scarlet-violet']?.front_default ||
         sprites.versions?.['generation-viii']?.['brilliant-diamond-shining-pearl']?.front_default ||
         sprites.versions?.['generation-vii']?.['ultra-sun-ultra-moon']?.front_default ||
         sprites.versions?.['generation-vi']?.['omegaruby-alphasapphire']?.front_default ||
         sprites.front_default ||
         fallback;
};

export const getPokemonImageUrl = async (id: number, name: string, defaultImage: string): Promise<string> => {
  const cacheKey = `${id}-${name}`;
  if (formImageCache[cacheKey]) return formImageCache[cacheKey];

  const isForm = /메가|알로라|가라르|히스이|원시|테투리|오리진|어나더|영물|화신|폼|모습|새벽의|황혼의|울트라|켄타로스|캐스퐁|아르세우스|실버디|도롱충이|도롱마담|춤추새|체리꼬|로토무|불비달마|케르디오|메로엣타|게노세크트|킬가르도|루가루암|약어리|메테노|스트린더|자시안|자마젠타|무한다이노|우라오스|버드랙스|파밀리쥐|돌핀맨|싸리용|%/.test(name);

  if (!isForm) {
    return defaultImage;
  }

  try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`);
      if (!res.ok) return defaultImage;
      const data = await res.json();
      
      let targetVariety = data.varieties.find((v: any) => v.is_default);
      
      if (name.includes('메가')) {
      if (name.includes('X')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-mega-x')) || targetVariety;
      } else if (name.includes('Y')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-mega-y')) || targetVariety;
      } else {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-mega')) || targetVariety;
      }
    } else if (name.includes('알로라')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-alola')) || targetVariety;
    } else if (name.includes('가라르')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-galar')) || targetVariety;
    } else if (name.includes('히스이')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-hisui')) || targetVariety;
    } else if (name.includes('원시')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-primal')) || targetVariety;
    } else if (name.includes('오리진')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-origin')) || targetVariety;
    } else if (name.includes('어나더')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-alter')) || targetVariety;
    } else if (name.includes('영물')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-therian')) || targetVariety;
    } else if (name.includes('화신')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-incarnate')) || targetVariety;
    } else if (name.includes('새벽의 날개')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-dawn')) || targetVariety;
    } else if (name.includes('황혼의 갈기')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-dusk')) || targetVariety;
    } else if (name.includes('울트라')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-ultra')) || targetVariety;
    } else if (name.includes('10%')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-10-power-construct')) || targetVariety;
    } else if (name.includes('50%')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-50-power-construct')) || targetVariety;
    } else if (name.includes('퍼펙트')) {
      targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-complete')) || targetVariety;
    } else if (name.includes('켄타로스')) {
      if (name.includes('워')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-aqua')) || targetVariety;
      }
      else if (name.includes('블레이즈')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-blaze')) || targetVariety;
      }
      else if (name.includes('컴벳')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-combat')) || targetVariety;
      }
    } else if (name.includes('캐스퐁')){
      if (name.includes('태양')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-sunny')) || targetVariety;
      } else if (name.includes('빗방')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-rainy')) || targetVariety;
      } else if (name.includes('설')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-snowy')) || targetVariety;
      }
    } else if (name.includes('테오키스')) {
      if (name.includes('어택')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-attack')) || targetVariety;
      } else if (name.includes('디펜스')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-defense')) || targetVariety;
      } else if (name.includes('스피드')) {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-speed')) || targetVariety;
      } else {
        targetVariety = data.varieties.find((v: any) => v.pokemon.name === 'deoxys-normal' || v.pokemon.name === 'deoxys') || targetVariety;
      }
      // --- 도롱충이 & 도롱마담 ---
      } else if (name.includes('도롱충이') || name.includes('도롱마담')) {
        if (name.includes('모래땅도롱')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-sandy')) || targetVariety;
        } else if (name.includes('슈레도롱')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-trash')) || targetVariety;
        } else if (name.includes('초목도롱')){
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-plant')) || targetVariety;
        }

      // --- 체리꼬 ---
      } else if (name.includes('체리꼬')) {
        if (name.includes('포지')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-sunshine')) || targetVariety;
        } else if (name.includes('네거')){
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-overcast')) || targetVariety;
        }

      // --- 로토무 ---
      } else if (name.includes('로토무')) {
        if (name.includes('히트')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-heat')) || targetVariety;
        } else if (name.includes('워시')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-wash')) || targetVariety;
        } else if (name.includes('프로스트')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-frost')) || targetVariety;
        } else if (name.includes('스핀')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-fan')) || targetVariety;
        } else if (name.includes('커트')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-mow')) || targetVariety;
        }

      // --- 쉐이미 ---
      } else if (name.includes('쉐이미')) {
        if (name.includes('스카이')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-sky')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-land')) || targetVariety;
        }

      // --- 아르세우스 & 실버디 (타입별) ---
      } else if (name.includes('아르세우스') || name.includes('실버디')) {
        const typeTag = name.match(/\((.*?)\)/)?.[1]; 
        if (typeTag) {
          const typeMap: Record<string, string> = {
            '격투': 'fighting', '비행': 'flying', '독': 'poison', '땅': 'ground',
            '바위': 'rock', '벌레': 'bug', '고스트': 'ghost', '강철': 'steel',
            '불꽃': 'fire', '물': 'water', '풀': 'grass', '전기': 'electric',
            '에스퍼': 'psychic', '얼음': 'ice', '드래곤': 'dragon', '악': 'dark',
            '페어리': 'fairy'
          };
          const engType = typeMap[typeTag];
          if (engType) {
            targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes(`-${engType}`)) || targetVariety;
          }
        }

      // --- 불비달마 (달마모드) ---
      } else if (name.includes('불비달마')) {
        if (name.includes('달마')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-zen')) || targetVariety;
        }

      // --- 케르디오 ---
      } else if (name.includes('케르디오')) {
        if (name.includes('각오')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-resolute')) || targetVariety;
        }

      // --- 메로엣타 ---
      } else if (name.includes('메로엣타')) {
        if (name.includes('스텝')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-pirouette')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-aria')) || targetVariety;
        }

      // --- 게노세크트 (카세트) ---
      } else if (name.includes('게노세크트')) {
        if (name.includes('아쿠아')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-douse')) || targetVariety;
        else if (name.includes('번개')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-shock')) || targetVariety;
        else if (name.includes('블레이즈')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-burn')) || targetVariety;
        else if (name.includes('프리즈')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-chill')) || targetVariety;

      // --- 킬가르도 ---
      } else if (name.includes('킬가르도')) {
        if (name.includes('블레이드')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-blade')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-shield')) || targetVariety;
        }

      // --- 춤추새 ---
      } else if (name.includes('춤추새')) {
        if (name.includes('이글이글')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-baile')) || targetVariety;
        else if (name.includes('파직파직')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-pom-pom')) || targetVariety;
        else if (name.includes('훌라훌라')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-pau')) || targetVariety;
        else if (name.includes('하늘하늘')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-sensu')) || targetVariety;

      // --- 루가루암 ---
      } else if (name.includes('루가루암')) {
        if (name.includes('한밤중')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-midnight')) || targetVariety;
        else if (name.includes('황혼')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-dusk')) || targetVariety;
        else targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-midday')) || targetVariety;

      // --- 약어리 ---
      } else if (name.includes('약어리')) {
        if (name.includes('군집')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-school')) || targetVariety;
        }

      // --- 메테노 ---
      } else if (name.includes('메테노')) {
        if (name.includes('코어')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-core')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-meteor')) || targetVariety;
        }

      // --- 스트린더 ---
      } else if (name.includes('스트린더')) {
        if (name.includes('로우')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-low-key')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-amped')) || targetVariety;
        }

      // --- 자시안 & 자마젠타 ---
      } else if (name.includes('자시안') || name.includes('자마젠타')) {
        if (name.includes('왕')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-crowned')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-hero')) || targetVariety;
        }

      // --- 무한다이노 ---
      } else if (name.includes('무한다이노')) {
        if (name.includes('무한다이맥스')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-eternamax')) || targetVariety;
        }

      // --- 우라오스 ---
      } else if (name.includes('우라오스')) {
        if (name.includes('연격')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-rapid-strike')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-single-strike')) || targetVariety;
        }

      // --- 버드랙스 ---
      } else if (name.includes('버드랙스')) {
        if (name.includes('백마')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-ice')) || targetVariety;
        } else if (name.includes('흑마')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-shadow')) || targetVariety;
        }

      // --- 파밀리쥐 ---
      } else if (name.includes('파밀리쥐')) {
        if (name.includes('3마리')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-family-of-three')) || targetVariety;
        }

      // --- 돌핀맨 ---
      } else if (name.includes('돌핀맨')) {
        if (name.includes('히어로')) {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-hero')) || targetVariety;
        } else {
          targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-zero')) || targetVariety;
        }

      // --- 싸리용 ---
      } else if (name.includes('싸리용')) {
        if (name.includes('늘어진')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-droopy')) || targetVariety;
        else if (name.includes('뻗은')) targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-stretchy')) || targetVariety;
        else targetVariety = data.varieties.find((v: any) => v.pokemon.name.includes('-curly')) || targetVariety;
      }
    
    if (targetVariety && targetVariety.pokemon.url) {
      const varietyRes = await fetch(targetVariety.pokemon.url);
      const varietyData = await varietyRes.json();
      const imageUrl = getLatestGenSprite(varietyData.sprites, varietyData.sprites?.front_default || defaultImage);
      formImageCache[cacheKey] = imageUrl;
      return imageUrl;
    }
  } catch (e) {
    console.error('Failed to fetch alternate form image', e);
  }
  
  return defaultImage;
};

export const POKEMON_DATA: Pokemon[] = (() => {
  const uniqueNames = new Set<string>();
  const data: Pokemon[] = [];
  
  rawPokemons.forEach((p: any) => {
    if (!uniqueNames.has(p.name)) {
      uniqueNames.add(p.name);
      
      const getMoveData = (moveId: string): Move => {
        const moveInfo = movesDict[moveId];
        return {
          name: moveInfo ? moveInfo.name : moveId,
          type: moveInfo ? moveInfo.type.toLowerCase() : 'normal'
        };
      };

      const fastMoves = p.fast_moves.map((m: string) => getMoveData(m));
      const fastEliteMoves = p.fast_elite_moves.map((m: string) => getMoveData(m));
      const chargeMoves = p.charged_moves.map((m: string) => getMoveData(m));
      const chargeEliteMoves = p.charged_elite_moves.map((m: string) => getMoveData(m));

      data.push({
        id: p.id, 
        name: p.name,
        types: Array.from(new Set(p.types.map((t: string) => t.toLowerCase()).filter((t: string) => t && t !== 'none'))),
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
        fastMoves,
        fastEliteMoves,
        chargeMoves,
        chargeEliteMoves,
        shadow_eligible: p.shadow_eligible || false
      });
    }
  });
  
  return data;
})();

