/**
 * Utilitários para valores monetários em texto no formato da API externa,
 * ex.: "$6 milhões", "$3.3 milhões", "$1.142 bilhão", "$2.208 bilhões".
 *
 * Internamente tudo é normalizado para MILHÕES (de dólares).
 */

const MILLIONS_PER_BILLION = 1000;

const MONEY_REGEX =
  /^\s*\$?\s*(\d+(?:[.,]\d+)?)\s*(milh(?:ão|ões|ao|oes)|bilh(?:ão|ões|ao|oes))\s*$/i;

/** Arredonda para `decimals` casas evitando ruídos de ponto flutuante. */
function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Converte um texto monetário para um número em milhões.
 * @throws Error se o formato não for reconhecido.
 */
export function parseMoneyToMillions(text: string): number {
  const match = MONEY_REGEX.exec(text);
  if (!match) {
    throw new Error(`Valor monetário inválido: "${text}"`);
  }

  const amount = Number((match[1] as string).replace(',', '.'));
  const isBillion = (match[2] as string).toLowerCase().startsWith('bilh');

  return round(isBillion ? amount * MILLIONS_PER_BILLION : amount, 6);
}

/**
 * Formata um valor em milhões como texto.
 * - Abaixo de 1000 milhões: "$X milhões" (até 2 casas decimais).
 * - A partir de 1000 milhões: "$X bilhões" (até 3 casas decimais).
 * - Respeita singular ("$1 milhão", "$1 bilhão") e valores negativos ("-$5 milhões").
 */
export function formatMillions(millions: number): string {
  const sign = millions < 0 ? '-' : '';
  const abs = Math.abs(millions);

  if (round(abs, 2) < MILLIONS_PER_BILLION) {
    const value = round(abs, 2);
    return `${sign}$${value} ${value === 1 ? 'milhão' : 'milhões'}`;
  }

  const value = round(abs / MILLIONS_PER_BILLION, 3);
  return `${sign}$${value} ${value === 1 ? 'bilhão' : 'bilhões'}`;
}

/** Calcula `bilheteria - orcamento` e devolve o resultado formatado. */
export function calculateProfit(bilheteria: string, orcamento: string): string {
  const profit = parseMoneyToMillions(bilheteria) - parseMoneyToMillions(orcamento);
  return formatMillions(round(profit, 6));
}
