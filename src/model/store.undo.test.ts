import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

describe('undo / redo', () => {
  beforeEach(() => {
    useStore.getState().newProject('ibm')
  })

  it('undoes a meta edit and redo restores it', () => {
    useStore.getState().setMeta({ name: 'Alpha' })
    expect(useStore.getState().project.meta.name).toBe('Alpha')
    useStore.getState().undo()
    expect(useStore.getState().project.meta.name).toBe('New Scenario')
    useStore.getState().redo()
    expect(useStore.getState().project.meta.name).toBe('Alpha')
  })

  it('clears history on newProject', () => {
    useStore.getState().setMeta({ name: 'gone' })
    useStore.getState().newProject('ibm')
    expect(useStore.getState().undoStack).toEqual([])
    useStore.getState().undo()
    expect(useStore.getState().project.meta.name).toBe('New Scenario')
  })
})
