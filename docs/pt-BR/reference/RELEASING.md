---
read_when:
    - Buscando definições públicas de canais de release
    - Buscando nomenclatura de versões e cadência
summary: Canais públicos de release, nomenclatura de versões e cadência
title: Política de Release
x-i18n:
    generated_at: "2026-04-05T12:52:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb52a13264c802395aa55404c6baeec5c7b2a6820562e7a684057e70cc85668f
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de Release

O OpenClaw tem três trilhas públicas de release:

- stable: releases com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de prerelease que publicam no npm `beta`
- dev: a ponta móvel de `main`

## Nomenclatura de versões

- Versão de release stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de release de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês ou no dia
- `latest` significa o release npm stable promovido atual
- `beta` significa o destino de instalação beta atual
- Releases stable e de correção stable publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente, ou promover depois um build beta validado
- Todo release do OpenClaw envia juntos o pacote npm e o app macOS

## Cadência de release

- Releases seguem primeiro para beta
- Stable vem depois, somente após o beta mais recente ser validado
- O procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  apenas para maintainers

## Preflight de release

- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os
  artefatos de release esperados em `dist/*` e o bundle da Control UI existam para a etapa
  de validação do pack
- Execute `pnpm release:check` antes de todo release com tag
- O preflight npm da branch main também executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  antes de empacotar o tarball, usando os secrets de workflow `OPENAI_API_KEY` e
  `ANTHROPIC_API_KEY`
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após publicar no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  publicado no registry em um prefixo temporário novo
- A automação de release dos maintainers agora usa preflight-then-promote:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - releases npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar para `latest` explicitamente via input do workflow
  - a promoção npm stable de `beta` para `latest` continua disponível como um modo manual explícito no workflow confiável `OpenClaw NPM Release`
  - esse modo de promoção ainda precisa de um `NPM_TOKEN` válido no ambiente `npm-release` porque o gerenciamento de `dist-tag` do npm é separado da publicação confiável
  - o `macOS Release` público é apenas de validação
  - a publicação privada real do mac deve passar por `preflight_run_id` e `validate_run_id` privados bem-sucedidos
  - os caminhos de publicação reais promovem artefatos preparados em vez de reconstruí-los novamente
- Para releases de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não possam silenciosamente deixar instalações globais
  mais antigas no payload stable base
- O preflight de release npm falha de forma fechada, a menos que o tarball inclua ambos
  `dist/control-ui/index.html` e um payload não vazio em `dist/control-ui/assets/`
  para que não enviemos novamente um dashboard de navegador vazio
- Se o trabalho de release tocou o planejamento de CI, manifests de timing de extensões ou matrizes rápidas
  de teste, regenere e revise as saídas da matriz do workflow `checks-fast-extensions`
  de propriedade do planner a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão do release stable do macOS também inclui as superfícies do atualizador:
  - o GitHub release deve terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed do Sparkle não vazia
    e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de release

## Inputs do workflow npm

`OpenClaw NPM Release` aceita estes inputs controlados pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`
- `preflight_only`: `true` para apenas validação/build/package, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado a partir do preflight bem-sucedido
- `npm_dist_tag`: tag de destino do npm para o caminho de publicação; padrão `beta`
- `promote_beta_to_latest`: `true` para pular a publicação e mover um build
  stable já publicado em `beta` para `latest`

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags beta de prerelease podem publicar apenas em `beta`
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de a publicação continuar
- O modo de promoção deve usar uma tag stable ou de correção, `preflight_only=false`,
  `preflight_run_id` vazio e `npm_dist_tag=beta`
- O modo de promoção também exige um `NPM_TOKEN` válido no ambiente `npm-release`
  porque `npm dist-tag add` ainda precisa de autenticação npm comum

## Sequência de release npm stable

Ao cortar um release npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você quiser intencionalmente uma publicação stable direta
3. Salve o `preflight_run_id` bem-sucedido
4. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
5. Se o release caiu em `beta`, execute `OpenClaw NPM Release` mais tarde com a
   mesma `tag` stable, `promote_beta_to_latest=true`, `preflight_only=false`,
   `preflight_run_id` vazio e `npm_dist_tag=beta` quando quiser mover esse
   build publicado para `latest`

O modo de promoção ainda exige a aprovação do ambiente `npm-release` e um
`NPM_TOKEN` válido nesse ambiente.

Isso mantém tanto o caminho de publicação direta quanto o caminho beta-first com promoção
documentados e visíveis para o operador.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Maintainers usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.
