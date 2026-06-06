import { describe, it, expect } from 'vitest'
import { buildTree, normalizeVfsPath, isFlagCapable, fileExt } from './vfs'
import type { FileNode } from './types'

const f = (path: string): FileNode => ({ path, content: '', meta: {} })

describe('normalizeVfsPath', () => {
  it('garante barra inicial e remove a final', () => {
    expect(normalizeVfsPath('a/b')).toBe('/a/b')
    expect(normalizeVfsPath('/a/b/')).toBe('/a/b')
  })

  it('resolve "." e ".."', () => {
    expect(normalizeVfsPath('/a/./b')).toBe('/a/b')
    expect(normalizeVfsPath('/a/../b')).toBe('/b')
    expect(normalizeVfsPath('/a/b/..')).toBe('/a')
    expect(normalizeVfsPath('a/../../b')).toBe('/b')
  })

  it('vazio e raiz viram "/"', () => {
    expect(normalizeVfsPath('')).toBe('/')
    expect(normalizeVfsPath('/')).toBe('/')
  })
})

describe('isFlagCapable', () => {
  it('é false só para .md (case-insensitive)', () => {
    expect(isFlagCapable('/notes.md')).toBe(false)
    expect(isFlagCapable('/README.MD')).toBe(false)
    expect(isFlagCapable('/data.dat')).toBe(true)
    expect(isFlagCapable('/semext')).toBe(true)
    // só conta a extensão final
    expect(isFlagCapable('/a.md.dat')).toBe(true)
  })
})

describe('fileExt', () => {
  it('extrai a extensão em minúsculas', () => {
    expect(fileExt('/a/b.DAT')).toBe('dat')
    expect(fileExt('/x/archive.tar.gz')).toBe('gz')
  })

  it('é vazio quando não há extensão', () => {
    expect(fileExt('/a/file')).toBe('')
    expect(fileExt('noext')).toBe('')
  })

  it('dotfile (.config) não conta como extensão', () => {
    expect(fileExt('/dir/.config')).toBe('')
  })
})

describe('buildTree', () => {
  it('monta a árvore com dirs antes de arquivos, ordenados por nome', () => {
    const tree = buildTree([f('/z.txt'), f('/a/c.txt'), f('/a/b.txt'), f('/b.txt')])
    expect(tree.path).toBe('/')
    expect(tree.children.map((c) => `${c.type}:${c.name}`)).toEqual([
      'dir:a',
      'file:b.txt',
      'file:z.txt'
    ])
    const a = tree.children.find((c) => c.name === 'a')!
    expect(a.type).toBe('dir')
    expect(a.children.map((c) => c.name)).toEqual(['b.txt', 'c.txt'])
  })

  it('sintetiza diretórios intermediários ausentes', () => {
    const tree = buildTree([f('/intel/deep/safe.dat')])
    const intel = tree.children.find((c) => c.name === 'intel')!
    expect(intel.type).toBe('dir')
    const deep = intel.children.find((c) => c.name === 'deep')!
    expect(deep.type).toBe('dir')
    expect(deep.children.map((c) => c.name)).toEqual(['safe.dat'])
  })
})
