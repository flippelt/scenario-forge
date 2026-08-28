import { describe, it, expect } from 'vitest'
import { isJunkPath, locateScenarioRoot, omitJunk, stripPrefix } from './folder'

describe('locateScenarioRoot', () => {
  it('reads a bare scenario folder', () => {
    expect(locateScenarioRoot(['scenario.json', 'files/case.md'])).toEqual({ prefix: '' })
  })

  it('strips the picked folder name (webkitdirectory / zip)', () => {
    expect(
      locateScenarioRoot(['heimdall/scenario.json', 'heimdall/files/case.md'])
    ).toEqual({ prefix: 'heimdall/' })
  })

  it('infers theme from scenarios/<theme>/<id>/', () => {
    expect(
      locateScenarioRoot(['cprd/heimdall/scenario.json', 'cprd/heimdall/files/case.md'])
    ).toEqual({ prefix: 'cprd/heimdall/', theme: 'cprd' })
  })

  it('ignores __MACOSX junk when choosing the root', () => {
    expect(
      locateScenarioRoot(['__MACOSX/scenario.json', 'heimdall/scenario.json', 'heimdall/files/a.md'])
    ).toEqual({ prefix: 'heimdall/' })
  })

  it('throws without scenario.json', () => {
    expect(() => locateScenarioRoot(['files/case.md'])).toThrow(/scenario\.json/)
  })
})

describe('path helpers', () => {
  it('drops Finder/zip junk', () => {
    expect(isJunkPath('heimdall/.DS_Store')).toBe(true)
    expect(isJunkPath('__MACOSX/._case.md')).toBe(true)
    expect(isJunkPath('files/case.md')).toBe(false)
    expect(omitJunk({ 'files/a.md': 'x', '.DS_Store': 'y' })).toEqual({ 'files/a.md': 'x' })
  })

  it('stripPrefix keeps relative scenario paths', () => {
    expect(stripPrefix({ 'heimdall/scenario.json': '{}', 'heimdall/files/a.md': 'a' }, 'heimdall/')).toEqual({
      'scenario.json': '{}',
      'files/a.md': 'a'
    })
  })
})
