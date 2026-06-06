import { describe, it, expect } from 'vitest'
import { coerceFlag, KNOWN_FLAG_KEYS, FLAG_GROUPS } from './flags'
import type { FileMeta } from './types'

describe('coerceFlag', () => {
  it('bool: só a string "true" é verdadeira', () => {
    expect(coerceFlag('bool', 'true')).toBe(true)
    expect(coerceFlag('bool', 'false')).toBe(false)
    expect(coerceFlag('bool', '')).toBe(false)
  })

  it('number: converte finito, senão 0', () => {
    expect(coerceFlag('number', '15')).toBe(15)
    expect(coerceFlag('number', '3.5')).toBe(3.5)
    expect(coerceFlag('number', '-2')).toBe(-2)
    expect(coerceFlag('number', 'abc')).toBe(0)
  })

  it('string: passa o valor direto', () => {
    expect(coerceFlag('string', '/vault.dat,/safe.dat')).toBe('/vault.dat,/safe.dat')
    expect(coerceFlag('string', '')).toBe('')
  })
})

describe('KNOWN_FLAG_KEYS', () => {
  it('não tem chaves duplicadas', () => {
    expect(new Set(KNOWN_FLAG_KEYS).size).toBe(KNOWN_FLAG_KEYS.length)
  })

  it('inclui as chaves canônicas do engine', () => {
    for (const k of ['locked', 'password', 'reveals', 'crackDC', 'decryptGame', 'tracer', 'checkDC', 'image']) {
      expect(KNOWN_FLAG_KEYS).toContain(k)
    }
  })
})

// Visibilidade dos campos no painel: o predicado `when` decide o que aparece.
const fieldByKey = (key: string) =>
  FLAG_GROUPS.flatMap((g) => g.fields).find((field) => field.key === key)!

describe('visibilidade de campos (when)', () => {
  it('password só aparece em arquivo bloqueado', () => {
    expect(fieldByKey('password').when!({ locked: true })).toBe(true)
    expect(fieldByKey('password').when!({})).toBe(false)
  })

  it('crackDC exige crackável (locked e crackable !== false)', () => {
    expect(fieldByKey('crackDC').when!({ locked: true })).toBe(true)
    expect(fieldByKey('crackDC').when!({ locked: true, crackable: false })).toBe(false)
  })

  it('crackFailMessage só quando NÃO crackável', () => {
    expect(fieldByKey('crackFailMessage').when!({ locked: true, crackable: false })).toBe(true)
    expect(fieldByKey('crackFailMessage').when!({ locked: true })).toBe(false)
  })

  it('tracerSeconds exige tracer ligado num arquivo bloqueado', () => {
    expect(fieldByKey('tracerSeconds').when!({ locked: true, tracer: true })).toBe(true)
    expect(fieldByKey('tracerSeconds').when!({ locked: true })).toBe(false)
  })

  it('imageAlt só quando há image preenchida', () => {
    expect(fieldByKey('imageAlt').when!({ image: 'esper.png' } as FileMeta)).toBe(true)
    expect(fieldByKey('imageAlt').when!({ image: '' } as FileMeta)).toBe(false)
    expect(fieldByKey('imageAlt').when!({})).toBe(false)
  })
})
