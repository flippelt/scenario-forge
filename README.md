# scenario-forge

Editor desktop (Windows · macOS · Linux) para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs)
(e do `rpgterm`): monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário e exporta a pasta
versionável **e** o JSON carregável em runtime.

> **Status:** Fase 1 em desenvolvimento — modelo de dados, editor de árvore,
> editor de arquivos, painel de flags, editor do `scenario.json`, validação e
> export já funcionam. Preview ao vivo (Fase 2) ainda não. Veja
> [PLANNING.md](./PLANNING.md).

## Stack
- **Tauri 2** (Rust) + **React + Vite + TypeScript**
- Modelo de dados fiel ao engine do terminal (`commands.js` / `themes/index.js`),
  com testes de round-trip garantindo que os flags gerados são exatamente os que
  o terminal lê.

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
- Criar/abrir/renomear/excluir arquivos numa árvore de cenário.
- Editar `.md` (prosa) e `.dat` (dados), com **painel de flags** dirigido pelo
  vocabulário real do engine (lock/crack/decrypt/tracer/recon/mídia).
- Editar o `scenario.json` (tema, id, name, header, prompt, motd…) com um editor
  avançado em JSON para o restante (dialog, tracer, events, commands…).
- Traduções por idioma (`files.<lang>/`), com checagem de paridade.
- **Validação** cruzada (arquivo vigiado sem bloco tracer, bloqueio impossível
  de abrir, flag no arquivo errado, tradução órfã…).
- **Export**: pasta `scenario.json + files/ + files.<lang>/` (desktop) e bundle
  JSON único (desktop e web). **Import** do bundle.

## Próximos passos
Roadmap em fases no [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
Fase 2 = preview ao vivo com o engine real embutido (depende de extrair o
pacote `@rpgterm/engine`).
