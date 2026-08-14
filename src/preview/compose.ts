// Compose the open project with the same function the terminal uses, then
// overlay `shortName` (not yet a SKIN_KEY in the engine) so the in-process
// preview matches what the author set in the form.
import { composeCustomScenario } from 'rpgterm-engine'
import { toRuntimeBundle } from '../model/serialize'
import type { Project } from '../model/types'

export function composeProject(project: Project, lang = 'en'): Record<string, unknown> {
  const bundle = toRuntimeBundle(project)
  const theme = composeCustomScenario(bundle, lang)
  if (typeof bundle.shortName === 'string' && bundle.shortName.trim()) {
    theme.shortName = bundle.shortName
  }
  return theme
}
