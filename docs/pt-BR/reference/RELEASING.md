---
read_when:
    - Procurando definições públicas de canais de release
    - Procurando nomenclatura de versão e cadência
summary: Canais públicos de release, nomenclatura de versão e cadência
title: Política de release
x-i18n:
    generated_at: "2026-04-21T05:43:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 356844708f6ecdae4acfcce853ce16ae962914a9fdd1cfc38a22ac4c439ba172
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de release

O OpenClaw tem três lanes públicas de release:

- stable: releases com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de prerelease que publicam no npm `beta`
- dev: o head móvel de `main`

## Nomenclatura de versão

- Versão de release stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de release de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de prerelease beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda no mês nem no dia
- `latest` significa o release npm stable promovido atual
- `beta` significa o alvo de instalação beta atual
- Releases stable e de correção stable publicam no npm `beta` por padrão; operadores de release podem direcionar explicitamente para `latest` ou promover depois um build beta validado
- Todo release stable do OpenClaw envia o pacote npm e o app macOS juntos;
  releases beta normalmente validam e publicam primeiro o caminho npm/package, com
  build/assinatura/notarização do app mac reservados para stable, salvo solicitação explícita

## Cadência de release

- Releases avançam primeiro por beta
- Stable vem somente depois que o beta mais recente é validado
- Os mantenedores normalmente criam releases a partir de um branch `release/YYYY.M.D` criado
  do `main` atual, para que a validação e as correções de release não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de deletar ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e observações de recuperação são
  somente para mantenedores

## Preflight de release

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de teste continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de
  ciclo de importação e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos esperados
  de release `dist/*` e o bundle da Control UI existam para a etapa de
  validação do pack
- Execute `pnpm release:check` antes de todo release com tag
- As verificações de release agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- A validação de runtime de instalação e upgrade entre sistemas operacionais é disparada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações ao vivo mais lentas ficam em sua
  própria lane para que não atrasem nem bloqueiem a publicação
- As verificações de release devem ser disparadas a partir da ref de workflow `main` ou de uma
  ref de workflow `release/YYYY.M.D`, para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita uma tag de release existente ou o SHA atual completo de 40 caracteres do commit do branch de workflow
- No modo commit-SHA, ele aceita apenas o HEAD atual do branch de workflow; use uma
  tag de release para commits de release mais antigos
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o SHA atual completo de 40 caracteres do commit do branch de workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido a uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub, enquanto o caminho de validação sem mutação pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os dois segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais pela lane separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação
  publicado no registro em um prefixo temporário novo
- A automação de release de mantenedor agora usa preflight-then-promote:
  - a publicação npm real deve passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir do mesmo branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar explicitamente para `latest` via input do workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda exige `NPM_TOKEN`, enquanto o
    repo público mantém publicação somente com OIDC
  - o `macOS Release` público é somente de validação
  - a publicação mac privada real deve passar por um `preflight_run_id` e um `validate_run_id`
    privados de mac bem-sucedidos
  - os caminhos de publicação reais promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`,
  para que correções de release não possam silenciosamente deixar instalações globais mais antigas no
  payload stable base
- O preflight de release npm falha de forma fechada, a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto uma carga não vazia de `dist/control-ui/assets/`,
  para que não enviemos novamente um dashboard de browser vazio
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do npm pack no tarball candidato de atualização, para que o e2e do instalador detecte aumento acidental do pack
  antes do caminho de publicação do release
- Se o trabalho de release tiver tocado no planejamento de CI, manifests de timing de extensão ou
  matrizes de teste de extensão, regenere e revise as saídas da matriz do workflow
  `checks-node-extensions` pertencente ao planejador a partir de `.github/workflows/ci.yml`
  antes da aprovação, para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão de release stable do macOS também inclui as superfícies de updater:
  - o release do GitHub deve terminar com o `.zip`, `.dmg` e `.dSYM.zip` empacotados
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id não debug, uma URL de feed Sparkle
    não vazia e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de release

## Inputs do workflow npm

`OpenClaw NPM Release` aceita estes inputs controlados pelo operador:

- `tag`: tag de release obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA atual completo
  de 40 caracteres do commit do branch de workflow para preflight somente de validação
- `preflight_only`: `true` para somente validação/build/package, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: dist-tag alvo do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estes inputs controlados pelo operador:

- `ref`: tag de release existente ou o SHA atual completo de 40 caracteres do commit de `main`
  para validar quando disparado a partir de `main`; a partir de um branch de release, use uma
  tag de release existente ou o SHA atual completo de 40 caracteres do commit do branch de release

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags de prerelease beta podem publicar somente em `beta`
- Para `OpenClaw NPM Release`, o input de SHA completo de commit é permitido somente quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre somente de validação e também aceita o
  SHA atual de commit do branch de workflow
- O modo commit-SHA de verificações de release também exige o HEAD atual do branch de workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de continuar a publicação

## Sequência de release npm stable

Ao criar um release npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA atual completo do commit do branch de workflow
     para uma execução de teste somente de validação do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` somente
   quando quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou com o
   SHA atual completo do commit do branch de workflow quando quiser cobertura ao vivo de prompt cache
   - Isso é separado de propósito, para que a cobertura ao vivo continue disponível sem
     reacoplar verificações longas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o release tiver ido para `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o release tiver sido publicado intencionalmente diretamente em `latest` e `beta`
   deva seguir imediatamente o mesmo build stable, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe que sua sincronização
   programada de autocorreção mova `beta` depois

A mutação de dist-tag fica no repo privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repo público mantém publicação somente com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis para o operador.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam a documentação privada de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o runbook real.
