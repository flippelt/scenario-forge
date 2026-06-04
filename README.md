# scenario-forge

Editor desktop (Windows · macOS · Linux) para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs)
(e do `rpgterm`): monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário, testa no terminal real
embutido e exporta a pasta versionável **e** o JSON carregável em runtime.

> **Status:** planejamento. Veja [PLANNING.md](./PLANNING.md). Nada implementado ainda.

## Stack pretendida
- **Tauri 2** (Rust) + **React + Vite**
- Reúso de `rpg-prop-kit` e do engine do terminal (a extrair como `@rpgterm/engine`)

## Próximos passos
Ver o roadmap em fases no [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
