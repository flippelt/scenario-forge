# scenario-forge — Planejamento

> Editor **web** para autoria de cenários do **Immersive Terminal for RPGs**:
> cria a árvore de `.md`/`.dat`, configura os flags de jogo (crackable, tracer,
> locked, dificuldade…) por formulário, **testa no terminal real embutido**, e
> exporta a pasta versionável **e** o JSON carregável em runtime.

**Status:** Fases 0–3 + polish + **web-only** (2026-08). Preview **in-process**
(`rpgterm-engine` + `rpg-prop-kit`); formulário CRT/`shortName`; aviso de deriva
de versão; Cmd+S / desfazer; salvar na pasta da mesa via File System Access
(Chrome/Edge) ou zip. Sem instalador Tauri.

---

## 1. Decisões travadas

| Decisão | Escolha |
|---|---|
| Stack | **React + Vite** no navegador; GitHub Pages |
| Pasta no disco | File System Access (Chromium) + zip / `webkitdirectory` (todos) |
| Saída | **Ambas**: pasta do repo (`scenario.json` + `files/` + `files.<lang>/`) **e** JSON runtime único |
| Preview | **Ao vivo** — terminal real embutido (crack/tracer/locked) |
| Repositório | Público |
| Nome | `scenario-forge` |

---

## 2. Arquitetura

- **Front React + Vite**: preview in-process com `rpg-prop-kit` (`CRTScreen`) e
  o **engine do terminal** (`rpgterm-engine`). O iframe da Pages ficou só no
  atalho “abrir terminal publicado”.
- **Store em memória** = a verdade do cenário; serializadores convertem para os
  3 formatos (pasta repo ⇄ VFS runtime ⇄ JSON único). O rascunho persiste em
  `localStorage`. Handles de pasta (FSA) ficam no IndexedDB.
- **Sem shell nativo.** O backend Rust/Tauri saiu: o que precisava do SO
  (abrir/gravar pasta) passou para a File System Access API + zip.

```
scenario-forge/
├─ src/
│  ├─ model/         # tipos + (de)serializadores (pasta ⇄ runtime ⇄ store)
│  ├─ editor/        # árvore de arquivos, editor .md, painel de flags, scenario.json
│  ├─ fs/            # pasta nativa (FSA), zip, import de bundle/link
│  ├─ preview/       # terminal embutido (engine real)
│  └─ validation/    # regras de consistência
└─ .github/workflows # CI (typecheck/test/build) + Pages
```

---

## 3. Modelo de dados (ancorado no engine real)

### 3.1 Scenario (`scenario.json`)
- `theme` — um dos 8 sistemas: `alien`, `br`, `cprd`, `dataslate`, `fallout`, `ibm`, `lancer`, `wh40k`
  (gravado no JSON para o import web não depender do path `scenarios/<theme>/<id>`)
- `id`, `name`, `header`
- `motd[]` — linhas do banner inicial
- `dialog` — `{ thinking, fallback, responses[] }`
  - `responses[]`: `{ match: string[], type?: "muted"|…, lines: string[] }`

### 3.2 Árvore de arquivos
- Diretórios + arquivos `.md` (documentos) e `.dat` (dados com frontmatter).
- Runtime VFS: `{ "/caminho": { type:"dir", children:[…] } | { type:"file", content:"…" } }`.

### 3.3 Flags de `.dat` (frontmatter) — formulário dedicado
- **Lock**: `locked` (bool), `password` (string), `lockLabel` / `decryptLabel` (string)
- **Crack**: `crackable` (bool), `crackDC` (number — dificuldade), `crackAttempts` (number),
  `crackSeconds` (number), `crackFailMessage` (string), `crackLines` (string[])
- **Tracer**: `tracer` (bool), `tracerSeconds`, `tracerStartAfter`, `tracerTrip`,
  `tracerPenalty`, `tracerNocrackSeconds`
- **Outros**: `hidden` (bool), `difficulty`

### 3.4 i18n
- `files/` (default) + `files.pt/` (pt-br); extensível a outros locales.
- Editor mostra **paridade** (arquivos presentes numa língua e ausentes na outra).

---

## 4. Funcionalidades

### MVP
- Criar/abrir cenário; árvore (novo/renomear/excluir dir e arquivo).
- Editor `.md` (markdown) e `.dat` (conteúdo + **painel de flags** com toggles, números, presets de DC).
- Editor do `scenario.json` (theme picker, motd, dialog/responses).
- **Validação cruzada**: `locked` sem `password`; `crackable` sem `crackDC`;
  `tracer` sem segundos; paths inválidos; paridade i18n.
- **Export**: pasta `scenario.json + files/ + files.pt/` **e** JSON runtime único.

### v1
- **Preview ao vivo**: terminal real embutido (crackar, tracer rodando, senha, locked).
- **Import** de cenário existente (pasta / zip / bundle / link).
- Templates por sistema/tema; biblioteca de snippets de dialog.

### Futuro
- Commit/PR direto pro repositório de jogo privado; múltiplos locales; "modo teste" com rolagem d20 vs DC;
  validação contra a versão do engine.

---

## 5. Build & distribuição
- **CI**: typecheck + testes + `vite build` (com `BASE_PATH=/scenario-forge/`).
- **GitHub Pages** no push da `main`.
- Instaladores desktop (Tauri) foram descontinuados — assinatura/SignPath não se aplica mais.

---

## 6. Engine no preview
O terminal e o editor compartilham [`rpgterm-engine`](https://www.npmjs.com/package/rpgterm-engine).
CI valida com round-trip (gerar → carregar no engine → conferir). Manter o pin
no mesmo minor do ITR.

---

## 7. Riscos / decisões em aberto

| Risco / decisão | Encaminhamento |
|---|---|
| Schema dos flags pode divergir | Schema único vindo do engine + teste round-trip no CI |
| Firefox/Safari sem File System Access | Abrir via `webkitdirectory`; salvar via zip |
| Nome do projeto | Confirmado (`scenario-forge`) |

---

## 8. Roadmap em fases
- **Fase 0** ✅ — Scaffold React+TS + CI.
- **Fase 1** ✅ — Modelo de dados (fiel ao engine) + árvore + editores md/dat + painel de flags + scenario.json + validação + export/import + testes de round-trip.
- **Fase 2** ✅ — Preview ao vivo (engine embutido via `rpgterm-engine`).
- **Fase 3** ✅ — Templates, import (pasta/bundle/link), diálogo/eventos.
- **Web-only** ✅ — sem Tauri; pasta nativa no Chromium; zip em qualquer navegador; Pages.
- **Depois** — manter o pin de `rpgterm-engine` no mesmo minor do ITR.
