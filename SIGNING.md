# Assinatura de código (code signing)

Política atual: **assinar só se for de graça; caso contrário, distribuir sem
assinatura.** Hoje os builds saem **não-assinados** — ao instalar, o SO avisa
"editor desconhecido" (Windows SmartScreen / macOS Gatekeeper). É seguro:
"Mais informações → Executar assim mesmo" (Windows) ou clique-direito → Abrir (macOS).

## Windows — grátis via SignPath Foundation (OSS)
[SignPath](https://signpath.org/) assina projetos open-source de graça. Como o
scenario-forge é público/MIT, qualifica. Passos:

1. Cadastrar o projeto no programa **SignPath Foundation** (aprovação manual).
2. Criar um *signing policy* + *project* no painel do SignPath e ligar ao repo.
3. Adicionar os secrets no GitHub:
   `SIGNPATH_API_TOKEN`, `SIGNPATH_ORGANIZATION_ID`,
   `SIGNPATH_PROJECT_SLUG`, `SIGNPATH_POLICY_SLUG`.
4. No `release.yml`, **depois** do `tauri-apps/tauri-action`, acrescentar
   (só Windows, e só se o token existir — o release sem secrets continua
   não-assinado):

```yaml
- name: Submit Windows artifact to SignPath
  if: matrix.platform == 'windows-latest' && secrets.SIGNPATH_API_TOKEN != ''
  uses: signpath/github-action-submit-signing-request@v1
  with:
    api-token: ${{ secrets.SIGNPATH_API_TOKEN }}
    organization-id: ${{ secrets.SIGNPATH_ORGANIZATION_ID }}
    project-slug: ${{ secrets.SIGNPATH_PROJECT_SLUG }}
    signing-policy-slug: ${{ secrets.SIGNPATH_POLICY_SLUG }}
    github-artifact-id: <id do artefato .msi/.exe do tauri-action>
    wait-for-completion: true
```

> O passo **não** está ligado no workflow de propósito: sem o cadastro no
> SignPath um `github-artifact-id` inventado quebraria o release Windows.
> Enquanto o cadastro não sai, o build continua não-assinado.

## macOS — pago (adiado)
Exige conta **Apple Developer** (US$ 99/ano): certificado "Developer ID
Application" + notarização. Para ligar, **adicione** as env `APPLE_CERTIFICATE`,
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`,
`APPLE_PASSWORD`, `APPLE_TEAM_ID` (preenchidas) ao step de release. ⚠️ Não as
deixe vazias — env de assinatura vazia faz o tauri tentar assinar com cert
vazio e o build do macOS falha em `security import`. Sem assinar é o padrão atual.

## Linux
AppImage/.deb não exigem assinatura para distribuição.
