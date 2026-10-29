import { describe, expect, it } from 'vitest';
import { calculateProfit, formatMillions, parseMoneyToMillions } from './moneyParser';

describe('parseMoneyToMillions', () => {
  it.each([
    ['$6 milhões', 6],
    ['$3.3 milhões', 3.3],
    ['$1 milhão', 1],
    ['$2 bilhões', 2000],
    ['$1.142 bilhão', 1142],
    ['$2.208 bilhões', 2208],
    ['  $245 MILHÕES ', 245],
    ['$1,5 bilhão', 1500],
  ])('converte "%s" para %d milhões', (input, expected) => {
    expect(parseMoneyToMillions(input)).toBe(expected);
  });

  it.each(['', 'abc', '$ milhões', '$10', '$10 mil'])('lança erro para "%s"', (input) => {
    expect(() => parseMoneyToMillions(input)).toThrow(/inválido/);
  });
});

describe('formatMillions', () => {
  it.each([
    [239, '$239 milhões'],
    [1, '$1 milhão'],
    [0, '$0 milhões'],
    [26.7, '$26.7 milhões'],
    [26.756, '$26.76 milhões'],
    [1000, '$1 bilhão'],
    [1994, '$1.994 bilhões'],
    [1400, '$1.4 bilhões'],
    [999.999, '$1 bilhão'],
    [-5, '-$5 milhões'],
    [-1500, '-$1.5 bilhões'],
  ])('formata %d como "%s"', (input, expected) => {
    expect(formatMillions(input)).toBe(expected);
  });
});

describe('calculateProfit', () => {
  it('calcula lucro em milhões', () => {
    expect(calculateProfit('$245 milhões', '$6 milhões')).toBe('$239 milhões');
  });

  it('calcula lucro com decimais', () => {
    expect(calculateProfit('$30 milhões', '$3.3 milhões')).toBe('$26.7 milhões');
  });

  it('mistura bilhões e milhões (2 bilhões - 6 milhões)', () => {
    expect(calculateProfit('$2 bilhões', '$6 milhões')).toBe('$1.994 bilhões');
  });

  it('trata bilhões plural menos milhões (2.208 bilhões - 6 milhões)', () => {
    expect(calculateProfit('$2.208 bilhões', '$6 milhões')).toBe('$2.202 bilhões');
  });

  it('trata bilhão singular (1.142 bilhão - 94 milhões)', () => {
    expect(calculateProfit('$1.142 bilhão', '$94 milhões')).toBe('$1.048 bilhões');
  });

  it('usa bilhão no singular quando o lucro é exatamente 1 bilhão', () => {
    expect(calculateProfit('$1.2 bilhões', '$200 milhões')).toBe('$1 bilhão');
  });

  it('desce para milhões quando o lucro é menor que 1 bilhão', () => {
    expect(calculateProfit('$1 bilhão', '$300 milhões')).toBe('$700 milhões');
  });

  it('retorna valor negativo em caso de prejuízo', () => {
    expect(calculateProfit('$10 milhões', '$25 milhões')).toBe('-$15 milhões');
  });

  it('não vaza ruído de ponto flutuante', () => {
    expect(calculateProfit('$2.208 bilhões', '$165 milhões')).toBe('$2.043 bilhões');
  });

  it('propaga erro para entradas inválidas', () => {
    expect(() => calculateProfit('invalido', '$6 milhões')).toThrow();
  });
});
