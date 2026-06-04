# scenario-forge — Planejamento

> Editor desktop (Win/Mac/Linux) para autoria de cenários do **Immersive
> Terminal for RPGs**: cria a árvore de `.md`/`.dat`, configura os
> flags de jogo (crackable, tracer, locked, dificuldade…) por formulário,
> **testa no terminal real embutido**, e exporta a pasta versionável **e** o
> JSON carregável em runtime.

**Status:** Fases 0, 1 e 2 implementadas — scaffold Tauri+React+TS; modelo de
dados fiel ao engine (consumido do pacote `rpgterm-engine` no npm); editores
md/dat; painel de flags; validação; export/import; **preview ao vivo** (iframe
do terminal real); CI multiplataforma; teste de paridade contra o engine real.
Falta a Fase 3 (templates, import avançado, polish).

---

## 1. Decisões travadas

| Decisão | Escolha |
|---|---|
| Stack | **Tauri 2** (Rust backend) + **React + Vite** (front) |
| Saída | **Ambas**: pasta do repo (`scenario.json` + `files/` + `files.pt/`) **e** JSON runtime único |
| Preview | **Ao vivo** — terminal real embutido (crack/tracer/locked) |
| Repositório | Novo, **público** |
| Nome | `scenario-forge` (provisório, renomeável) |

---

## 2. Arquitetura

- **Tauri 2**: shell nativo; backend **Rust** apenas para o que precisa do SO —
  ler/gravar pastas de cenário, diálogos abrir/salvar, exportar, (futuro) updater.
- **Front React + Vite**: reaproveita `rpg-prop-kit` (UI CRT) e o **engine do
  terminal** (ver §6) para o preview.
- **Store em memória** = a verdade do cenário; serializadores convertem para os
  3 formatos (pasta repo ⇄ VFS runtime ⇄ JSON único).

```
scenario-forge/
├─ src-tauri/        # Rust: comandos FS, empacotamento, updater
├─ src/
│  ├─ model/         # tipos + (de)serializadores (pasta ⇄ runtime ⇄ store)
│  ├─ editor/        # árvore de arquivos, editor .md, painel de flags, scenario.json
│  ├─ preview/       # terminal embutido (engine real)
│  └─ validation/    # regras de consistência
└─ .github/workflows # build matrix 3 OS
```

---

## 3. Modelo de dados (ancorado no engine real)

### 3.1 Scenario (`scenario.json`)
- `theme` — um dos 8 sistemas: `alien`, `br`, `cprd`, `dataslate`, `fallout`, `ibm`, `lancer`, `wh40k`
- `id`, `name`, `header`
- `motd[]` — linhas do banner inicial
- `dialog` — `{ thinking, fallback, responses[] }`
  - `responses[]`: `{ match: string[], type?: "muted"|…, lines: string[] }`

### 3.2 Árvore de arquivos
- Diretórios + arquivos `.md` (documentos) e `.dat` (dados com frontmatter).
- Runtime VFS: `{ "/caminho": { type:"dir", children:[…] } | { type:"file", content:"…" } }`.

### 3.3 Flags de `.dat` (frontmatter) — formulário dedicado
> ⚠️ Semântica/defaults exatos devem ser derivados do engine na Fase 1
> (`src/engine/filesystem.js` + lógica de crack/tracer). Lista observada:

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
- **Import** de cenário existente (abrir pasta do repo).
- Templates por sistema/tema; biblioteca de snippets de dialog.

### Futuro
- Commit/PR direto pro repositório de jogo privado; múltiplos locales; "modo teste" com rolagem d20 vs DC;
  auto-update (Tauri updater); validação contra a versão do engine.

---

## 5. Build & distribuição
- **GitHub Actions matrix**: `windows` (.msi/.exe), `macos` (.dmg, idealmente universal arm64+x64),
  `ubuntu` (.AppImage/.deb).
- **Releases** com binários por OS; Tauri updater opcional.
- ⚠️ **Assinatura de código** (notarização Mac / signing Windows) é opcional e tem custo;
  sem ela os SOs avisam "app não verificado". Decisão adiada.

---

## 6. ⚠️ Pré-requisito crítico — engine no preview
O terminal hoje é um **app** (Vite), não uma **lib**. Para o preview usar o engine
real sem duplicar código (e consistente com a extração já feita do `rpg-prop-kit`):

- **Extrair um pacote `rpgterm-engine`** (filesystem + commands + crack/tracer/wordle)
  publicado no npm, consumido tanto pelo terminal quanto pelo editor.
- Isso também elimina o **risco de divergência de schema**: o editor importa o
  schema/parser do mesmo pacote, garantindo que os flags gerados são exatamente
  os que o terminal lê. CI valida com round-trip (gerar → carregar no engine → conferir).
- Alternativas piores: git submodule do terminal (acopla forte) ou vendorizar (deriva).

---

## 7. Riscos / decisões em aberto

| Risco / decisão | Encaminhamento |
|---|---|
| Engine não é lib | Extrair `rpgterm-engine` (Fase 0/1) |
| Schema dos flags pode divergir | Schema único vindo do engine + teste round-trip no CI |
| Assinatura de código (custo) | Adiar; releases não-assinadas no início |
| Nome do projeto | Confirmar (`scenario-forge`?) |
| Toolchain Rust no build | CI cuida; dev local precisa de Rust |

---

## 8. Roadmap em fases
- **Fase 0** ✅ — Scaffold Tauri+React+TS + CI build nos 3 OS. (Extração do `rpgterm-engine` adiada para a Fase 2, onde o preview a exige.)
- **Fase 1** ✅ — Modelo de dados (fiel ao engine) + árvore + editores md/dat + painel de flags + scenario.json + validação + export/import + testes de round-trip. Sem preview.
- **Fase 2** — Preview ao vivo (engine embutido). Pré-requisito: extrair `rpgterm-engine`.
- **Fase 3** — Import, templates, i18n avançado, polish, primeira release com binários.
