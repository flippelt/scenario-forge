import { describe, it, expect } from 'vitest'
import { TEMPLATES } from './templates'
import { validateProject } from '../validation/rules'

describe('templates', () => {
  it('every template builds a project with no validation errors', () => {
    for (const t of TEMPLATES) {
      const errors = validateProject(t.build()).filter((i) => i.severity === 'error')
      expect(errors, `${t.id}: ${errors.map((e) => e.message).join('; ')}`).toHaveLength(0)
    }
  })

  it('each template has an id, label and description', () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy()
      expect(t.label).toBeTruthy()
      expect(t.description).toBeTruthy()
    }
  })
})
