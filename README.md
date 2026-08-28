# scenario-forge

[![Build](https://img.shields.io/github/actions/workflow/status/flippelt/scenario-forge/build.yml?label=build)](https://github.com/flippelt/scenario-forge/actions) [![Pages](https://img.shields.io/github/actions/workflow/status/flippelt/scenario-forge/pages.yml?label=pages)](https://github.com/flippelt/scenario-forge/actions/workflows/pages.yml) [![Last commit](https://img.shields.io/github/last-commit/flippelt/scenario-forge)](https://github.com/flippelt/scenario-forge/commits) [![License](https://img.shields.io/github/license/flippelt/scenario-forge)](https://github.com/flippelt/scenario-forge/blob/main/LICENSE) ![Top language](https://img.shields.io/github/languages/top/flippelt/scenario-forge) ![Repo size](https://img.shields.io/github/repo-size/flippelt/scenario-forge) ![Issues](https://img.shields.io/github/issues/flippelt/scenario-forge)

Editor **web** para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs):
monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário e exporta a pasta
versionável **e** o JSON carregável em runtime.

**Uso:** <https://flippelt.github.io/scenario-forge/>

> **Status:** editor no navegador (sem instalador). Preview **in-process** (mesmo
> `rpgterm-engine` do editor, casca CRT via `rpg-prop-kit`). O terminal publicado
> da Pages é só um atalho, com aviso se o pin do engine divergir. Veja
> [PLANNING.md](./PLANNING.md).

## Stack
- **React + Vite + TypeScript**, publicado no GitHub Pages
- Modelo de dados fiel ao engine do terminal, consumido do pacote
  [`rpgterm-engine`](https://www.npmjs.com/package/rpgterm-engine) (npm), com
  teste de paridade garantindo que os flags gerados são exatamente os que o
  terminal lê.

## Desenvolvimento

Pré-requisito: **Node 22+**.

```bash
npm install

npm run dev

npm run typecheck
npm run test
npm run build
```

O app sobe em `http://localhost:5173`. `npm run web` é alias de `dev`.

Ícone-fonte: `npm run icon` regenera `assets/icon.png`
(`node scripts/gen-icon.mjs`, sem dependências).

## O que dá pra fazer
- **Começar de um template** por sistema (cofre/IBM, investigação com tracer/Cyberpunk…) ou em branco.
- Criar/abrir/renomear/excluir arquivos numa árvore de cenário.
- Editar `.md` (com **pré-visualização** do render do terminal) e `.dat` (dados),
  com **painel de flags** dirigido pelo vocabulário real do engine (lock/crack/decrypt/tracer/recon/mídia).
- `scenario.json` por **formulário**: tema, id, name, motd…, **diálogo** (`query`/`ask`)
  e **eventos** (countdown) — o editor de JSON avançado fica só para o que é raro.
- Traduções por idioma (`files.<lang>/`), com checagem de paridade.
- **Validação** cruzada (vigiado sem bloco tracer, bloqueio impossível de abrir,
  flag no arquivo errado, tradução órfã…).
- **Pasta versionável**: no Chrome/Edge, abrir e salvar a pasta de verdade
  (File System Access). Nos outros navegadores, importar/exportar um `.zip`
  (`scenario.json` + `files/` + `files.<lang>/`). O rascunho também fica no
  `localStorage` se você recarregar a página.
- **Bundle JSON** e **link** (`?scenario64=`) para o terminal.
- **▶ Preview ao vivo**: terminal **local** (`rpgterm-engine` + `rpg-prop-kit`).
  Crack/unlock/decrypt/query rodam no pin do editor, não na Pages.
  Atalho para o ITR publicado, com selo de deriva de versão.
- **Tubo CRT**: `shortName` e knobs (`scanlines`, `flicker`, `curve`, `bloom`,
  bezel/LED/plate) no formulário, não só no JSON avançado.
- **Cmd+S**, desfazer/refazer (Cmd+Z), **Salvar na mesa** (grava em
  `rpgterm/src/themes/scenarios/<tema>/<id>` no Chrome/Edge; nos outros
  navegadores baixa o `.zip` para extrair aí).

## Distribuição
O workflow `pages.yml` publica em
[flippelt.github.io/scenario-forge](https://flippelt.github.io/scenario-forge/)
a cada push na `main`. Não há instalador desktop.

## Família

| Projeto | Papel |
|---|---|
| [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs) | terminal que carrega o que você exporta · [demo](https://flippelt.github.io/Immersive-Terminal-for-RPGs/) |
| [rpgterm-engine](https://www.npmjs.com/package/rpgterm-engine) | motor npm (schema, VFS, crack/tracer) |
| [rpg-prop-kit](https://www.npmjs.com/package/rpg-prop-kit) | casca CRT do preview |
| [session-kit](https://github.com/flippelt/session-kit) | YAML de sessão → pasta de cenário |

Flags e `scenario.json`: wiki do terminal —
[Autoria: Cenários](https://github.com/flippelt/Immersive-Terminal-for-RPGs/wiki/Authoring-Scenarios)
e [Arquivos Trancados](https://github.com/flippelt/Immersive-Terminal-for-RPGs/wiki/Locked-Files).

## Próximos passos
Roadmap em [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
Manter o pin de `rpgterm-engine` no mesmo minor do ITR.
