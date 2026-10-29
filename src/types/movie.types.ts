/**
 * Tipos do domínio de filmes.
 *
 * `RawMovie` reflete exatamente o payload da API externa
 * (https://tv5hn2gvyijpl76yxlmsy66jwa0nlmxn.lambda-url.us-east-1.on.aws/),
 * que responde com `{ "filmes": RawMovie[] }`.
 *
 * `ParsedMovie` é o contrato final exposto por `GET /filmes`.
 */

/** Identificadores de idioma observados na API (aceita outros valores). */
export type SynopsisLanguage = 'pt-br' | 'en' | 'fr' | (string & {});

export interface RawRating {
  /** Ex.: 9.2 (IMDb, escala 0-10) ou 4.5 (Rotten Tomatoes, escala 0-5). */
  valor: number;
  /** Ex.: "IMDb", "Rotten Tomatoes". */
  fonte: string;
}

export interface RawSynopsis {
  texto: string;
  idioma: SynopsisLanguage;
}

export interface RawAward {
  nome: string;
  /** Quanto maior, mais relevante (observado: 6 a 10). */
  relevancia: number;
}

export interface RawMovie {
  titulo: string;
  diretor: string;
  ano: number;
  genero: string[];
  /** Duração em minutos. Ex.: 175. */
  duracao: number;
  ratings: RawRating[];
  elenco: string[];
  /** Pode não conter "pt-br" nem "en" (ex.: Matrix só possui "fr"). */
  sinopse: RawSynopsis[];
  poster: string;
  trailer: string;
  locacoes: string[];
  /**
   * Texto monetário em dólares com escala por extenso e ponto decimal.
   * Ex.: "$6 milhões", "$3.3 milhões", "$165 milhões".
   */
  orcamento: string;
  /**
   * Mesmo formato de `orcamento`, mas a escala pode estar no singular ou
   * plural. Ex.: "$245 milhões", "$2.208 bilhões", "$1.142 bilhão".
   */
  bilheteria: string;
  premios: RawAward[];
}

/** Envelope retornado pela API externa. */
export interface RawMoviesResponse {
  filmes: RawMovie[];
}

/** Contrato final retornado por `GET /filmes`. */
export interface ParsedMovie {
  titulo: string;
  ano: number;
  diretor: string;
  genero: string[];
  /** `duracao` (minutos) * 60. Ex.: 175 -> 10500. */
  duracaoSegundos: number;
  /** Valor do rating com fonte "IMDb", como string. Ex.: "9.2". */
  notaIMDb: string;
  /** `bilheteria - orcamento` formatado. Ex.: "$1.994 bilhões". */
  lucro: string;
  /** Nome do prêmio com maior `relevancia`. Ex.: "Oscar de Melhor Filme". */
  maiorPremiacao: string;
  /** Texto da sinopse: pt-br > en > primeira disponível. */
  sinopse: string;
}
