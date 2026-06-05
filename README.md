# scenario-forge

Editor desktop (Windows · macOS · Linux) para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs):
monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário e exporta a pasta
versionável **e** o JSON carregável em runtime.

> **Status:** Fases 1–3 implementadas — árvore de arquivos, editores md/dat,
> painel de flags, formulários do `scenario.json` (incl. **diálogo** e **eventos**),
> validação, export/import (pasta · bundle · link), **preview ao vivo** (postMessage)
> e **templates** por sistema. Resta só polish opcional. Veja [PLANNING.md](./PLANNING.md).

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

# UI no navegador (sem Rust) — export/import só pelo bundle JSON
npm run dev

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
- **▶ Preview ao vivo**: embute o terminal real e envia o cenário por **postMessage**
  — crackar/decifrar/tracer no editor, sem limite de tamanho.

## Distribuição
`npm run tauri build` gera os instaladores em `src-tauri/target/release/bundle/`
(`.msi`/`.exe`, `.dmg`, `.AppImage`/`.deb`). O workflow de release publica uma
GitHub Release com os 3 OS ao empurrar uma tag `v*`. Builds não-assinados por
ora — veja [SIGNING.md](./SIGNING.md).

## Próximos passos
Roadmap em fases no [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
Resta polish opcional (arrastar/soltar na árvore, mais atalhos de teclado).
