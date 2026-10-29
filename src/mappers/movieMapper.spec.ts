import { describe, expect, it } from 'vitest';
import type { RawMovie } from '../types/movie.types';
import { toParsedMovie } from './movieMapper';

const buildRawMovie = (overrides: Partial<RawMovie> = {}): RawMovie => ({
  titulo: 'O Poderoso Chefão',
  diretor: 'Francis Ford Coppola',
  ano: 1972,
  genero: ['Crime', 'Drama'],
  duracao: 175,
  ratings: [
    { valor: 9.2, fonte: 'IMDb' },
    { valor: 4.5, fonte: 'Rotten Tomatoes' },
  ],
  elenco: ['Marlon Brando', 'Al Pacino', 'James Caan'],
  sinopse: [
    { texto: 'Sinopse em português.', idioma: 'pt-br' },
    { texto: 'Synopsis in English.', idioma: 'en' },
    { texto: 'Synopsis en français.', idioma: 'fr' },
  ],
  poster: 'link para o poster do filme',
  trailer: 'link para o trailer do filme',
  locacoes: ['Nova York', 'Sicília', 'Las Vegas'],
  orcamento: '$6 milhões',
  bilheteria: '$245 milhões',
  premios: [
    { nome: 'Oscar de Melhor Ator', relevancia: 8 },
    { nome: 'Oscar de Melhor Filme', relevancia: 10 },
  ],
  ...overrides,
});

describe('toParsedMovie', () => {
  it('transforma o filme completo no contrato final', () => {
    expect(toParsedMovie(buildRawMovie())).toEqual({
      titulo: 'O Poderoso Chefão',
      ano: 1972,
      diretor: 'Francis Ford Coppola',
      genero: ['Crime', 'Drama'],
      duracaoSegundos: 10500,
      notaIMDb: '9.2',
      lucro: '$239 milhões',
      maiorPremiacao: 'Oscar de Melhor Filme',
      sinopse: 'Sinopse em português.',
    });
  });

  it('não expõe campos removidos nem os brutos substituídos', () => {
    const parsed = toParsedMovie(buildRawMovie());

    for (const key of [
      'locacoes',
      'poster',
      'trailer',
      'elenco',
      'orcamento',
      'bilheteria',
      'duracao',
      'ratings',
      'premios',
    ]) {
      expect(parsed).not.toHaveProperty(key);
    }

    expect(Object.keys(parsed).sort()).toEqual(
      [
        'titulo',
        'ano',
        'diretor',
        'genero',
        'duracaoSegundos',
        'notaIMDb',
        'lucro',
        'maiorPremiacao',
        'sinopse',
      ].sort(),
    );
  });

  describe('notaIMDb', () => {
    it('ignora case da fonte', () => {
      const parsed = toParsedMovie(buildRawMovie({ ratings: [{ valor: 8.6, fonte: 'imdb' }] }));
      expect(parsed.notaIMDb).toBe('8.6');
    });

    it('converte valores inteiros para string', () => {
      const parsed = toParsedMovie(buildRawMovie({ ratings: [{ valor: 9, fonte: 'IMDb' }] }));
      expect(parsed.notaIMDb).toBe('9');
    });

    it('retorna string vazia quando não há IMDb', () => {
      const parsed = toParsedMovie(
        buildRawMovie({ ratings: [{ valor: 4.5, fonte: 'Rotten Tomatoes' }] }),
      );
      expect(parsed.notaIMDb).toBe('');
    });
  });

  describe('maiorPremiacao', () => {
    it('retorna o prêmio de maior relevância independente da ordem', () => {
      const parsed = toParsedMovie(
        buildRawMovie({
          premios: [
            { nome: 'A', relevancia: 3 },
            { nome: 'B', relevancia: 9 },
            { nome: 'C', relevancia: 7 },
          ],
        }),
      );
      expect(parsed.maiorPremiacao).toBe('B');
    });

    it('retorna string vazia sem prêmios', () => {
      expect(toParsedMovie(buildRawMovie({ premios: [] })).maiorPremiacao).toBe('');
    });
  });

  describe('sinopse', () => {
    it('prioriza pt-br', () => {
      expect(toParsedMovie(buildRawMovie()).sinopse).toBe('Sinopse em português.');
    });

    it('cai para en quando não há pt-br', () => {
      const parsed = toParsedMovie(
        buildRawMovie({
          sinopse: [
            { texto: 'Synopsis en français.', idioma: 'fr' },
            { texto: 'Synopsis in English.', idioma: 'en' },
          ],
        }),
      );
      expect(parsed.sinopse).toBe('Synopsis in English.');
    });

    it('cai para a primeira ocorrência quando não há pt-br nem en', () => {
      const parsed = toParsedMovie(
        buildRawMovie({
          sinopse: [
            { texto: 'Synopsis en français.', idioma: 'fr' },
            { texto: 'Sinopsis en español.', idioma: 'es' },
          ],
        }),
      );
      expect(parsed.sinopse).toBe('Synopsis en français.');
    });

    it('retorna string vazia sem sinopses', () => {
      expect(toParsedMovie(buildRawMovie({ sinopse: [] })).sinopse).toBe('');
    });
  });

  describe('lucro', () => {
    it('trata bilhões e milhões (Titanic)', () => {
      const parsed = toParsedMovie(
        buildRawMovie({ orcamento: '$200 milhões', bilheteria: '$2.208 bilhões' }),
      );
      expect(parsed.lucro).toBe('$2.008 bilhões');
    });

    it('trata bilhão singular (O Retorno do Rei)', () => {
      const parsed = toParsedMovie(
        buildRawMovie({ orcamento: '$94 milhões', bilheteria: '$1.142 bilhão' }),
      );
      expect(parsed.lucro).toBe('$1.048 bilhões');
    });
  });

  it('calcula duracaoSegundos', () => {
    expect(toParsedMovie(buildRawMovie({ duracao: 136 })).duracaoSegundos).toBe(8160);
  });
});
