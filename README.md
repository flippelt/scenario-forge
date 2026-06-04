# scenario-forge

Editor desktop (Windows · macOS · Linux) para criar cenários do
[Immersive Terminal for RPGs](https://github.com/flippelt/Immersive-Terminal-for-RPGs):
monta a árvore de `.md`/`.dat`, configura os flags de jogo
(crackable, tracer, locked, dificuldade…) por formulário e exporta a pasta
versionável **e** o JSON carregável em runtime.

> **Status:** Fases 1 e 2 prontas — editor de árvore, editor md/dat, painel de
> flags, `scenario.json`, validação, export/import e **preview ao vivo** já
> funcionam. Próxima: Fase 3 (templates, import avançado, polish). Veja
> [PLANNING.md](./PLANNING.md).

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
- **▶ Preview ao vivo**: embute o terminal real (publicado) e carrega o cenário
  atual via `?scenario64=` — crackar/decifrar/tracer dentro do editor.

## Distribuição
`npm run tauri build` gera os instaladores em `src-tauri/target/release/bundle/`
(`.msi`/`.exe`, `.dmg`, `.AppImage`/`.deb`). O workflow de release publica uma
GitHub Release com os 3 OS ao empurrar uma tag `v*`. Builds não-assinados por
ora — veja [SIGNING.md](./SIGNING.md).

## Próximos passos
Roadmap em fases no [PLANNING.md](./PLANNING.md#8-roadmap-em-fases).
Fase 3 = templates por sistema, import de pasta avançado e polish.
