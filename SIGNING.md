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
3. Adicionar os secrets no GitHub (`SIGNPATH_API_TOKEN`, organization/project/policy IDs).
4. No `release.yml`, após o build do Windows, adicionar o passo
   [`signpath/github-action-submit-signing-request`](https://github.com/signpath/github-action-submit-signing-request)
   apontando para o artefato `.exe`/`.msi`.

> Enquanto o cadastro não sai, o build Windows continua não-assinado (sem quebrar nada).

## macOS — pago (adiado)
Exige conta **Apple Developer** (US$ 99/ano): certificado "Developer ID
Application" + notarização. O `release.yml` já tem os ganchos de env
(`APPLE_*`); preencha os secrets quando/se tiver a conta. Sem isso, fica sem assinar.

## Linux
AppImage/.deb não exigem assinatura para distribuição.
