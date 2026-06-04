import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { App } from './App'

afterEach(cleanup)

// Smoke test: render the whole app. This catches render-time crashes that the
// model/unit tests miss — notably the infinite re-render loop a non-stable
// zustand selector causes (which blanked the window). If any component throws
// or loops on mount, this fails instead of shipping a black screen.
describe('App', () => {
  it('renders without crashing (no infinite render loop)', () => {
    const { getByText } = render(<App />)
    expect(getByText(/scenario-forge/)).toBeTruthy()
  })
})
