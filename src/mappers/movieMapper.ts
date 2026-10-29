import type { ParsedMovie, RawMovie } from '../types/movie.types';
import { calculateProfit } from '../utils/moneyParser';

const SECONDS_PER_MINUTE = 60;

function getImdbRating(raw: RawMovie): string {
  const imdb = raw.ratings.find((rating) => rating.fonte.toLowerCase() === 'imdb');
  return imdb ? String(imdb.valor) : '';
}

function getTopAward(raw: RawMovie): string {
  const top = raw.premios.reduce<RawMovie['premios'][number] | undefined>(
    (best, award) => (best === undefined || award.relevancia > best.relevancia ? award : best),
    undefined,
  );
  return top ? top.nome : '';
}

function getSynopsis(raw: RawMovie): string {
  const byLanguage = (language: string) =>
    raw.sinopse.find((item) => item.idioma.toLowerCase() === language);

  return (byLanguage('pt-br') ?? byLanguage('en') ?? raw.sinopse[0])?.texto ?? '';
}

/**
 * Transforma um filme bruto da API externa no contrato final de `GET /filmes`.
 * Apenas as propriedades de `ParsedMovie` são retornadas.
 */
export function toParsedMovie(raw: RawMovie): ParsedMovie {
  return {
    titulo: raw.titulo,
    ano: raw.ano,
    diretor: raw.diretor,
    genero: raw.genero,
    duracaoSegundos: raw.duracao * SECONDS_PER_MINUTE,
    notaIMDb: getImdbRating(raw),
    lucro: calculateProfit(raw.bilheteria, raw.orcamento),
    maiorPremiacao: getTopAward(raw),
    sinopse: getSynopsis(raw),
  };
}
