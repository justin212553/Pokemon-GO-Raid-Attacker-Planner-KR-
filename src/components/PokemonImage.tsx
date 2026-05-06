import React, { useState, useEffect } from 'react';
import { getPokemonImageUrl } from '../scripts/pokemonData';

interface PokemonImageProps {
  pokemonId: number;
  pokemonName: string;
  defaultImage: string;
  className?: string;
  [key: string]: any;
}

export function PokemonImage({ pokemonId, pokemonName, defaultImage, ...props }: PokemonImageProps) {
  const [displayImage, setDisplayImage] = useState<string>(defaultImage);

  useEffect(() => {
    let isMounted = true;
    setDisplayImage(defaultImage);
    getPokemonImageUrl(pokemonId, pokemonName, defaultImage).then(url => {
      if (isMounted) setDisplayImage(url);
    });
    return () => { isMounted = false; };
  }, [pokemonId, pokemonName, defaultImage]);

  return <img src={displayImage} alt={pokemonName} {...props} />;
}
