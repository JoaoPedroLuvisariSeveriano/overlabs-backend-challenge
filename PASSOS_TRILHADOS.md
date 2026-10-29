# Passos Trilhados — Objetivo 1

Este documento relata, de forma técnica e didática, o caminho percorrido para construir a API do **Overlabs Backend Challenge**: da inspeção do payload real da API externa até a suíte de testes final.

> Voltar para o [README](./README.md).

---

## Passo 1 — Análise Exploratória da API Externa

Antes de escrever qualquer regra de negócio, fiz uma requisição HTTP real para a API de metadados:

```
GET https://tv5hn2gvyijpl76yxlmsy66jwa0nlmxn.lambda-url.us-east-1.on.aws/
```

**Descoberta principal:** a resposta **não é um array direto** de filmes, e sim um **envelope**:

```json
{ "filmes": [ { "titulo": "...", "diretor": "...", "...": "..." } ] }
```

Outras observações que guiaram a modelagem dos tipos (`RawMovie` e `ParsedMovie` em `src/types/movie.types.ts`):

| Campo | O que o payload real mostrou |
|---|---|
| `orcamento` / `bilheteria` | Strings em dólar, com **ponto decimal** e escala por extenso: `"$6 milhões"`, `"$3.3 milhões"`, `"$2.208 bilhões"`. |
| `bilheteria` | A escala pode vir no **singular**: `"$1.142 bilhão"`. |
| `sinopse` | Array de `{ texto, idioma }`. Nem todo filme tem `pt-br`: "O Senhor dos Anéis" só tem `en` e `fr`; "Matrix" só tem `fr`. |
| `ratings` | Array de `{ valor, fonte }` com IMDb (0–10) e Rotten Tomatoes (0–5). `valor` é número. |
| `premios` | Array de `{ nome, relevancia }`, com `relevancia` inteira (de 6 a 10 nos dados atuais). |

Os acentos quebrados vistos no terminal do Windows eram apenas um problema de codificação do console. O JSON em si é UTF-8 válido.

---

## Passo 2 — Transformação de Dados (`src/mappers/movieMapper.ts`)

A função `toParsedMovie(raw: RawMovie): ParsedMovie` monta o objeto de saída **explicitamente**, campo a campo. Por isso `locacoes`, `poster`, `trailer` e os campos brutos substituídos nunca vazam para a resposta.

- **Duração em segundos:** `duracaoSegundos = duracao * 60`. Exemplo: `175 → 10500`.
- **Nota IMDb:** busca em `ratings` o item cuja `fonte` é `"IMDb"` (ignorando maiúsculas e minúsculas) e devolve `String(valor)`. Exemplo: `9.2 → "9.2"`.
- **Maior premiação:** um `reduce` sobre `premios` guarda o prêmio de maior `relevancia`, e o retorno é apenas o `nome`. Exemplo: `"Oscar de Melhor Filme"`. A ordem do array não importa.
- **Sinopse com fallback:** a ordem é `pt-br` → `en` → primeira ocorrência disponível. Isso é necessário de verdade nos dados atuais:
  - "O Poderoso Chefão" usa `pt-br`.
  - "O Senhor dos Anéis: O Retorno do Rei" cai para `en`.
  - "Matrix" cai para a primeira ocorrência, que está em `fr`.

Quando faltam dados (sem IMDb, sem prêmios ou sem sinopse), o mapper devolve `""` em vez de derrubar a requisição inteira.

---

## Passo 3 — O Parser Financeiro (`src/utils/moneyParser.ts`)

O cálculo do `lucro` (`bilheteria − orcamento`) é o ponto mais delicado, porque os valores chegam como **texto** em escalas diferentes. A solução tem três etapas:

1. **`parseMoneyToMillions`** extrai o número e o multiplicador com uma expressão regular, e normaliza tudo para **milhões**.
   - Aceita `milhão`, `milhões`, `bilhão` e `bilhões`, com ou sem acento, em qualquer caixa.
   - Aceita ponto ou vírgula decimal.
   - Exemplos: `"$3.3 milhões" → 3.3`, `"$1.142 bilhão" → 1142`, `"$2.208 bilhões" → 2208`.
   - Entradas inválidas lançam erro, para que um lucro errado nunca passe em silêncio.
2. **Subtração** em milhões, com arredondamento para eliminar o ruído de ponto flutuante. Sem isso, `1.142 * 1000` viraria `1142.0000000000002`.
3. **`formatMillions`** devolve o texto no formato certo:
   - Abaixo de 1000 milhões, usa `milhões`, com até 2 casas decimais. Exemplo: `"$26.7 milhões"`.
   - A partir de 1000 milhões, usa `bilhões`, com até 3 casas decimais. Exemplo: `"$2.008 bilhões"`.
   - Respeita o **singular** (`"$1 milhão"`, `"$1 bilhão"`) e prejuízos (`"-$15 milhões"`).
   - Resultados que passam de 1000 milhões, mas que o arredondamento levaria a `1000.00`, são tratados no limite correto.

| Bilheteria | Orçamento | Lucro |
|---|---|---|
| `$245 milhões` | `$6 milhões` | `$239 milhões` |
| `$30 milhões` | `$3.3 milhões` | `$26.7 milhões` |
| `$1.142 bilhão` | `$94 milhões` | `$1.048 bilhões` |
| `$2.208 bilhões` | `$200 milhões` | `$2.008 bilhões` |

### Nota sobre o exemplo do PDF

No exemplo ilustrativo do desafio, uma bilheteria de **"$2 bilhões"** com orçamento de **"$6 milhões"** aparece associada a `"$1.4 bilhões"`. Matematicamente, porém:

```
2.000 milhões − 6 milhões = 1.994 milhões = "$1.994 bilhões"
```

Tratei o valor do PDF como ilustrativo. Esta API faz o **cálculo matemático exato**, e o caso está coberto por teste (`calculateProfit('$2 bilhões', '$6 milhões')` → `'$1.994 bilhões'`).

---

## Passo 4 — Arquitetura e Qualidade

**Stack:** Node.js, TypeScript em modo `strict` (com `noUncheckedIndexedAccess`), Express 5, CORS, Vitest e Supertest.

**Clean Code em camadas**, cada uma com uma única responsabilidade:

```
src/
├── types/        # Contratos: RawMovie, ParsedMovie
├── utils/        # moneyParser (regra financeira pura)
├── mappers/      # movieMapper (transformação RawMovie → ParsedMovie)
├── services/     # movieService (fetch da API externa + validação do envelope)
├── controllers/  # movieController (HTTP: chama o serviço e responde)
├── routes/       # movieRoutes (GET /filmes)
├── app.ts        # Configuração do Express (separada da inicialização)
└── server.ts     # Apenas app.listen
```

Separar `app.ts` de `server.ts` permite testar a API com Supertest sem abrir uma porta de rede.

**Tratamento de erros** com um middleware global:

| Situação | Resposta |
|---|---|
| Falha de rede, status não-2xx, JSON inválido, payload sem `filmes` ou filmes malformados na API externa | **502 Bad Gateway** (`ExternalApiError`) com mensagem descritiva |
| Timeout de 10 s da API externa, na requisição ou na leitura do corpo | **504 Gateway Timeout** (`ExternalApiError` com `statusCode` 504) |
| Qualquer outro erro inesperado | **500** com mensagem genérica, sem vazar detalhes internos |
| Rota inexistente | **404** em JSON |

**Suíte de testes: 58 testes** com Vitest, todos passando e sem depender de rede.

| Arquivo | Testes | Foco |
|---|---|---|
| `moneyParser.spec.ts` | 34 | Parsing, formatação, singular/plural, decimais, prejuízo, entradas inválidas |
| `movieMapper.spec.ts` | 14 | Transformação completa, fallback de idioma, ausência dos campos removidos |
| `movieRoutes.spec.ts` | 10 | Integração com Supertest e `fetch` mockado: contrato exato, 502 (rede, status, JSON inválido, envelope, dados malformados) e 504 (timeout) |

O build com `npm run build` também passa sem erros do compilador.
