# scenario-forge

[![Build](https://img.shields.io/github/actions/workflow/status/flippelt/scenario-forge/build.yml?label=build)](https://github.com/flippelt/scenario-forge/actions) [![Release](https://img.shields.io/github/v/release/flippelt/scenario-forge)](https://github.com/flippelt/scenario-forge/releases) ![Release date](https://img.shields.io/github/release-date/flippelt/scenario-forge) [![Last commit](https://img.shields.io/github/last-commit/flippelt/scenario-forge)](https://github.com/flippelt/scenario-forge/commits) [![License](https://img.shields.io/github/license/flippelt/scenario-forge)](https://github.com/flippelt/scenario-forge/blob/main/LICENSE) ![Top language](https://img.shields.io/github/languages/top/flippelt/scenario-forge) ![Repo size](https://img.shields.io/github/repo-size/flippelt/scenario-forge) ![Issues](https://img.shields.io/github/issues/flippelt/scenario-forge)

Editor **web** (navegador) e desktop (Windows · macOS · Linux) para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs):
monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário e exporta a pasta
versionável **e** o JSON carregável em runtime.

> **Status:** Fases 1–3 + polish. Preview **in-process** (mesmo `rpgterm-engine`
> do editor, casca CRT via `rpg-prop-kit`). O terminal publicado da Pages é só
> um atalho, com aviso se o pin do engine divergir. Veja [PLANNING.md](./PLANNING.md).

## Stack
- **Tauri 2** (Rust) + **React + Vite + TypeScript**
- Modelo de dados fiel ao engine do terminal, consumido do pacote
  [`rpgterm-engine`](https://www.npmjs.com/package/rpgterm-engine) (npm), com
  teste de paridade garantindo que os flags gerados são exatamente os que o
  terminal lê.

## Desenvolvimento

Pré-requisitos: **Node 22+** e (para o app desktop) o
[toolchain Rust](https://www.rust-lang.org/tools/install).

```bash
npm install

# editor no navegador (sem Rust) — bundle JSON, etapas, trava/Editar
npm run web
# (alias: npm run dev)

# app desktop completo (requer Rust) — abrir/salvar pasta de cenário
npm run tauri dev

# checagens
npm run typecheck
npm run test
npm run build
```

### Ícones
`npm run icon` regenera os ícones do app a partir de `assets/icon.png`
(`node scripts/gen-icon.mjs` recria o PNG-fonte sem dependências).

## O que dá pra fazer agora
- **Começar de um template** por sistema (cofre/IBM, investigação com tracer/Cyberpunk…) ou em branco.
- Criar/abrir/renomear/excluir arquivos numa árvore de cenário.
- Editar `.md` (com **pré-visualização** do render do terminal) e `.dat` (dados),
  com **painel de flags** dirigido pelo vocabulário real do engine (lock/crack/decrypt/tracer/recon/mídia).
- `scenario.json` por **formulário**: tema, id, name, motd…, **diálogo** (`query`/`ask`)
  e **eventos** (countdown) — o editor de JSON avançado fica só para o que é raro.
- Traduções por idioma (`files.<lang>/`), com checagem de paridade.
- **Validação** cruzada (vigiado sem bloco tracer, bloqueio impossível de abrir,
  flag no arquivo errado, tradução órfã…).
- **Export**: pasta versionável (desktop) e bundle JSON (desktop/web).
  **Import**: bundle ou **link/token** (`?scenario64=`).
- **▶ Preview ao vivo**: terminal **local** (`rpgterm-engine` + `rpg-prop-kit`).
  Crack/unlock/decrypt/query rodam no pin do editor, não na Pages.
  Atalho para o ITR publicado, com selo de deriva de versão.
- **Tubo CRT**: `shortName` e knobs (`scanlines`, `flicker`, `curve`, `bloom`,
  bezel/LED/plate) no formulário, não só no JSON avançado.
- **Cmd+S**, desfazer/refazer (Cmd+Z), **Salvar na mesa** (pasta
  `rpgterm/src/themes/scenarios/<tema>/<id>`).

## Distribuição
`npm run tauri build` gera os instaladores em `src-tauri/target/release/bundle/`
(`.msi`/`.exe`, `.dmg`, `.AppImage`/`.deb`). O workflow de release publica uma
GitHub Release com os 3 OS ao empurrar uma tag `v*`. Builds não-assinados por
ora — veja [SIGNING.md](./SIGNING.md).

## Próximos passos
Roadmap em fases no [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
Próximo: cadastro SignPath (Windows grátis) e, se um dia valer, updater/notarização Mac.
