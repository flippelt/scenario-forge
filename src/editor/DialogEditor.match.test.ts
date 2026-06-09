import { describe, expect, it } from 'vitest'
import { splitMatchInput, normalizeMatch } from './DialogEditor'

describe('match input (campo de respostas)', () => {
  it('preserva espaços dentro de uma frase enquanto digita (sem trim)', () => {
    // O bug: trim a cada tecla comia o espaço final e colava as palavras.
    expect(splitMatchInput('self destruct')).toEqual(['self destruct'])
    // espaço sendo digitado no fim sobrevive (não vira "self")
    expect(splitMatchInput('self ')).toEqual(['self '])
  })

  it('divide por ; mantendo os espaços de cada segmento', () => {
    expect(splitMatchInput('self destruct; nostromo')).toEqual(['self destruct', ' nostromo'])
  })

  it('normaliza só no blur: trim + remove vazios', () => {
    expect(normalizeMatch(['self destruct', ' nostromo', '  ', ''])).toEqual([
      'self destruct',
      'nostromo',
    ])
  })

  it('frase com espaços internos sobrevive ao ciclo digitar→blur', () => {
    const typed = 'o que houve, exatamente?'
    expect(normalizeMatch(splitMatchInput(typed))).toEqual(['o que houve, exatamente?'])
  })
})
