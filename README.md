# Overlabs Backend Challenge

> 📘 **Objetivo 1 — Relatório dos passos trilhados:** [PASSOS_TRILHADOS.md](./PASSOS_TRILHADOS.md)

API REST em **Node.js + TypeScript** que consome a API externa de metadados de filmes e expõe a rota `GET /filmes`. A resposta é transformada (parseada) para um contrato enxuto: duração em segundos, nota IMDb, lucro calculado, maior premiação e sinopse no melhor idioma disponível.

## Tecnologias

- [Node.js](https://nodejs.org/) **22.12 ou superior** (usa o `fetch` nativo; exigência do Vitest 5)
- [TypeScript](https://www.typescriptlang.org/) em modo estrito
- [Express](https://expressjs.com/) 5 e [CORS](https://github.com/expressjs/cors)
- [Vitest](https://vitest.dev/) e [Supertest](https://github.com/ladjs/supertest) para testes unitários e de integração

## Setup e execução

```bash
# 1. Instalar as dependências
npm install

# 2. Desenvolvimento (hot reload com tsx)
npm run dev

# 3. Build de produção (gera a pasta dist/)
npm run build

# 4. Executar o build
npm start

# 5. Rodar os testes (58 testes, sem depender de rede)
npm test
```

O servidor sobe em `http://localhost:3000`.

### Variáveis de ambiente (opcionais)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | Porta HTTP da API |
| `MOVIES_API_URL` | URL da API do desafio | URL da API externa de metadados |

## Rotas

### `GET /` — Healthcheck

```bash
curl http://localhost:3000/
```

```json
{
  "status": "ok",
  "message": "API Overlabs rodando. Acesse /filmes"
}
```

### `GET /filmes` — Lista de filmes parseados

```bash
curl http://localhost:3000/filmes
```

```json
[
  {
    "titulo": "O Poderoso Chefão",
    "ano": 1972,
    "diretor": "Francis Ford Coppola",
    "genero": ["Crime", "Drama"],
    "duracaoSegundos": 10500,
    "notaIMDb": "9.2",
    "lucro": "$239 milhões",
    "maiorPremiacao": "Oscar de Melhor Filme",
    "sinopse": "Um chefão da máfia tenta transferir o controle de seu império clandestino para seu filho relutante."
  },
  {
    "titulo": "Titanic",
    "ano": 1997,
    "diretor": "James Cameron",
    "genero": ["Drama", "Romance"],
    "duracaoSegundos": 11700,
    "notaIMDb": "7.8",
    "lucro": "$2.008 bilhões",
    "maiorPremiacao": "11 Oscars",
    "sinopse": "Um romance proibido floresce a bordo do navio mais famoso do mundo, que está destinado a uma tragédia."
  }
]
```

Os campos `locacoes`, `poster`, `trailer`, `elenco`, `orcamento`, `bilheteria`, `duracao`, `ratings` e `premios` **não** fazem parte da resposta.

### Erros

| Status | Quando |
|---|---|
| `502 Bad Gateway` | A API externa falhou: rede, status não-2xx, JSON inválido, payload sem `filmes` ou filmes malformados |
| `504 Gateway Timeout` | A API externa não respondeu em 10 segundos (na requisição ou na leitura do corpo) |
| `500 Internal Server Error` | Erro inesperado interno |
| `404 Not Found` | Rota inexistente |

```json
{ "error": "API externa respondeu com status 500." }
```

## Regras de transformação

| Campo | Regra |
|---|---|
| `duracaoSegundos` | `duracao` (minutos) × 60 |
| `notaIMDb` | `valor` do rating com fonte `IMDb`, como string |
| `lucro` | `bilheteria − orcamento`, formatado em milhões ou bilhões, com singular e plural corretos |
| `maiorPremiacao` | `nome` do prêmio com maior `relevancia` |
| `sinopse` | `texto` em `pt-br`, depois `en`, depois a primeira ocorrência |

Detalhes e decisões estão em [PASSOS_TRILHADOS.md](./PASSOS_TRILHADOS.md).

## Estrutura do projeto

```
src/
├── types/        # RawMovie, ParsedMovie
├── utils/        # moneyParser
├── mappers/      # movieMapper
├── services/     # movieService (fetch da API externa)
├── controllers/  # movieController
├── routes/       # movieRoutes
├── app.ts        # Configuração do Express
└── server.ts     # Inicialização do servidor
```
