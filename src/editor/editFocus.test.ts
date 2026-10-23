import { describe, it, expect, afterEach } from 'vitest'
import { jumpToField } from './editFocus'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('jumpToField', () => {
  it('abre o bloco do campo e põe o foco nele', () => {
    document.body.innerHTML = `
      <aside class="desk">
        <details><summary>Terminal</summary>
          <div class="form-row" data-edit="motd"><textarea></textarea></div>
        </details>
      </aside>`
    jumpToField('motd')
    expect(document.querySelector('details')!.open).toBe(true)
    expect(document.activeElement).toBe(document.querySelector('textarea'))
  })

  it('ignora chave sem campo no menu', () => {
    document.body.innerHTML = '<aside class="desk"></aside>'
    expect(() => jumpToField('header')).not.toThrow()
  })
})
