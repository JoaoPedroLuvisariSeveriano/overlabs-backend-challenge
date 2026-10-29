import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../app';
import type { RawMovie } from '../types/movie.types';

const rawMovie: RawMovie = {
  titulo: 'Titanic',
  diretor: 'James Cameron',
  ano: 1997,
  genero: ['Drama', 'Romance'],
  duracao: 195,
  ratings: [
    { valor: 7.8, fonte: 'IMDb' },
    { valor: 4.4, fonte: 'Rotten Tomatoes' },
  ],
  elenco: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'],
  sinopse: [
    { texto: 'Um romance proibido a bordo do navio mais famoso do mundo.', idioma: 'pt-br' },
    { texto: 'A forbidden romance aboard the most famous ship.', idioma: 'en' },
  ],
  poster: 'link para o poster do filme',
  trailer: 'link para o trailer do filme',
  locacoes: ['México', 'Califórnia'],
  orcamento: '$200 milhões',
  bilheteria: '$2.208 bilhões',
  premios: [
    { nome: '3 BAFTAs', relevancia: 8 },
    { nome: '11 Oscars', relevancia: 10 },
  ],
};

const contractKeys = [
  'titulo',
  'ano',
  'diretor',
  'genero',
  'duracaoSegundos',
  'notaIMDb',
  'lucro',
  'maiorPremiacao',
  'sinopse',
];

const removedKeys = [
  'locacoes',
  'poster',
  'trailer',
  'elenco',
  'orcamento',
  'bilheteria',
  'duracao',
  'ratings',
  'premios',
];

describe('GET /filmes', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(global, 'fetch');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna 200 com os filmes transformados no contrato exato', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ filmes: [rawMovie] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const response = await request(app).get('/filmes');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);

    const [movie] = response.body;
    expect(Object.keys(movie).sort()).toEqual([...contractKeys].sort());
    expect(movie).toEqual({
      titulo: 'Titanic',
      ano: 1997,
      diretor: 'James Cameron',
      genero: ['Drama', 'Romance'],
      duracaoSegundos: 11700,
      notaIMDb: '7.8',
      lucro: '$2.008 bilhões',
      maiorPremiacao: '11 Oscars',
      sinopse: 'Um romance proibido a bordo do navio mais famoso do mundo.',
    });

    for (const key of removedKeys) {
      expect(movie).not.toHaveProperty(key);
    }
  });

  it('retorna 502 quando a API externa rejeita a requisição', async () => {
    fetchSpy.mockRejectedValue(new TypeError('fetch failed'));

    const response = await request(app).get('/filmes');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({
      error: 'Não foi possível acessar a API externa de filmes.',
    });
  });

  it('retorna 502 quando a API externa responde com status 500', async () => {
    fetchSpy.mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

    const response = await request(app).get('/filmes');

    expect(response.status).toBe(502);
    expect(response.body).toEqual({ error: 'API externa respondeu com status 500.' });
  });

  it('retorna 502 quando o payload externo não tem o envelope "filmes"', async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ outro: [] }), { status: 200 }),
    );

    const response = await request(app).get('/filmes');

    expect(response.status).toBe(502);
    expect(response.body.error).toMatch(/"filmes" ausente/);
  });

  it('retorna 500 genérico quando o parser falha (valor monetário inválido)', async () => {
    fetchSpy.mockResolvedValue(
      new Response(
        JSON.stringify({ filmes: [{ ...rawMovie, bilheteria: 'sem valor' }] }),
        { status: 200 },
      ),
    );

    const response = await request(app).get('/filmes');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'Erro interno do servidor.' });
  });
});

describe('GET /', () => {
  it('retorna o healthcheck', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      message: 'API Overlabs rodando. Acesse /filmes',
    });
  });
});
