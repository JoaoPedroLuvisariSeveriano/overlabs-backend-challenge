import { toParsedMovie } from '../mappers/movieMapper';
import type { ParsedMovie, RawMoviesResponse } from '../types/movie.types';

const DEFAULT_MOVIES_API_URL = 'https://tv5hn2gvyijpl76yxlmsy66jwa0nlmxn.lambda-url.us-east-1.on.aws/';
const REQUEST_TIMEOUT_MS = 10_000;

/** Falha ao consumir a API externa de metadados (resposta HTTP inválida, payload fora do esperado, timeout). */
export class ExternalApiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'ExternalApiError';
  }
}

function isMoviesResponse(payload: unknown): payload is RawMoviesResponse {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as { filmes?: unknown }).filmes)
  );
}

/** Busca os filmes na API externa e devolve-os já transformados. */
export async function getMovies(): Promise<ParsedMovie[]> {
  const url = process.env.MOVIES_API_URL ?? DEFAULT_MOVIES_API_URL;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    throw new ExternalApiError('Não foi possível acessar a API externa de filmes.', { cause: error });
  }

  if (!response.ok) {
    throw new ExternalApiError(`API externa respondeu com status ${response.status}.`);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ExternalApiError('A API externa retornou um JSON inválido.', { cause: error });
  }

  if (!isMoviesResponse(payload)) {
    throw new ExternalApiError('Payload inesperado da API externa: propriedade "filmes" ausente.');
  }

  return payload.filmes.map(toParsedMovie);
}
