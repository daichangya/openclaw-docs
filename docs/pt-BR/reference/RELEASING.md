---
read_when:
    - Procurando definições de canais públicos de release
    - Procurando nomenclatura de versão e cadência
summary: Canais públicos de release, nomenclatura de versão e cadência
title: Política de release
x-i18n:
    generated_at: "2026-04-23T05:43:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 979fd30ec717e107858ff812ef4b46060b9a00a0b5a3c23085d95b8fb81723b8
    source_path: reference/RELEASING.md
    workflow: 15
---

# Política de release

O OpenClaw tem três faixas públicas de release:

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
- Não adicione zero à esquerda em mês ou dia
- `latest` significa o release npm stable promovido atual
- `beta` significa o destino de instalação beta atual
- Releases stable e de correção stable publicam no npm `beta` por padrão; operadores de release podem direcionar para `latest` explicitamente, ou promover depois uma build beta validada
- Todo release stable do OpenClaw envia juntos o pacote npm e o app macOS;
  releases beta normalmente validam e publicam primeiro o caminho npm/pacote, com
  build/assinatura/notarização do app Mac reservados para stable, a menos que seja solicitado explicitamente

## Cadência de release

- Releases seguem beta-first
- Stable só vem depois que o beta mais recente é validado
- Mantenedores normalmente fazem releases a partir de uma branch `release/YYYY.M.D` criada
  a partir da `main` atual, para que validação e correções de release não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de release, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Preflight de release

- Execute `pnpm check:test-types` antes do preflight de release para que o TypeScript de teste permaneça
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes do preflight de release para que as verificações mais amplas de
  ciclos de importação e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os artefatos
  esperados de release `dist/*` e o bundle de Control UI existam para a etapa de
  validação do pack
- Execute `pnpm release:check` antes de todo release com tag
- As verificações de release agora rodam em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade simulado do QA Lab mais as faixas live
  de Matrix e Telegram antes da aprovação do release. As faixas live usam o ambiente
  `qa-live-shared`; o Telegram também usa leases de credenciais de CI do Convex.
- A validação de tempo de execução de instalação e upgrade cross-OS é disparada pelo
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: manter o caminho real de release npm curto,
  determinístico e focado em artefatos, enquanto verificações live mais lentas ficam em sua
  própria faixa para não atrasar nem bloquear a publicação
- As verificações de release precisam ser disparadas a partir da referência de workflow `main` ou de uma
  referência de workflow `release/YYYY.M.D` para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita uma tag de release existente ou o commit SHA completo de 40 caracteres da branch do workflow atual
- No modo commit-SHA, ele aceita apenas o HEAD atual da branch do workflow; use uma
  tag de release para commits de release mais antigos
- O preflight somente de validação de `OpenClaw NPM Release` também aceita o commit SHA completo de 40 caracteres da branch do workflow atual sem exigir uma tag enviada
- Esse caminho por SHA é apenas de validação e não pode ser promovido a uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados do
  pacote; a publicação real ainda exige uma tag de release real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados pelo GitHub, enquanto o caminho de validação sem mutação pode usar os runners Linux maiores do Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- O preflight de release npm não espera mais a faixa separada de verificações de release
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação publicado
  do registro em um prefixo temporário limpo
- A automação de release de mantenedores agora usa preflight-then-promote:
  - a publicação npm real precisa passar por um `preflight_run_id` npm bem-sucedido
  - a publicação npm real deve ser disparada a partir da mesma branch `main` ou
    `release/YYYY.M.D` da execução de preflight bem-sucedida
  - releases npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar `latest` explicitamente por entrada de workflow
  - a mutação de dist-tag npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação apenas com OIDC
  - `macOS Release` público é apenas de validação
  - a publicação privada real do Mac precisa passar por `preflight_run_id` e `validate_run_id`
    privados do Mac bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para releases de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de upgrade em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de release não deixem silenciosamente instalações globais antigas no
  payload stable base
- O preflight de release npm falha de forma fechada a menos que o tarball inclua tanto
  `dist/control-ui/index.html` quanto um payload não vazio `dist/control-ui/assets/`
  para que não enviemos novamente um painel de navegador vazio
- `pnpm test:install:smoke` também impõe o orçamento de `unpackedSize` do pack npm ao
  tarball candidato de atualização, para que o e2e do instalador capture aumento acidental do pack
  antes do caminho de publicação do release
- Se o trabalho de release tocar planejamento de CI, manifests de timing de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas da matriz de workflow
  `checks-node-extensions` pertencentes ao planejador a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de release não descrevam um layout de CI desatualizado
- A prontidão de release stable do macOS também inclui as superfícies do atualizador:
  - o release do GitHub deve terminar com os arquivos empacotados `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id sem debug, uma URL de feed Sparkle não vazia
    e um `CFBundleVersion` igual ou acima do piso canônico de build Sparkle
    para essa versão de release

## Entradas do workflow de NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de release obrigatória como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o commit SHA completo de 40 caracteres da branch do workflow atual para preflight apenas de validação
- `preflight_only`: `true` para apenas validação/build/package, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução de preflight bem-sucedida
- `npm_dist_tag`: tag npm de destino para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: tag de release existente ou o commit SHA completo de 40 caracteres da `main` atual
  para validar quando disparado a partir de `main`; a partir de uma branch de release, use uma
  tag de release existente ou o commit SHA completo de 40 caracteres da branch de release atual

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags beta de prerelease podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada de commit SHA completo é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre apenas de validação e também aceita o
  commit SHA atual da branch do workflow
- O modo commit-SHA das verificações de release também exige o HEAD atual da branch do workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante o preflight;
  o workflow verifica esses metadados antes de continuar a publicação

## Sequência de release npm stable

Ao criar um release npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o commit SHA completo atual da branch do workflow
     para uma execução de validação dry run do workflow de preflight
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   commit SHA completo atual da branch do workflow quando quiser cobertura live de cache de prompt,
   paridade de QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura live continue disponível sem
     reacoplar verificações longas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o release tiver sido publicado em `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o release tiver sido publicado intencionalmente diretamente em `latest` e `beta`
   precisar seguir imediatamente a mesma build stable, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe a sincronização automática agendada
   mover `beta` depois

A mutação de dist-tag fica no repositório privado por segurança, porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação apenas com OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis para o operador.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Os mantenedores usam os docs privados de release em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
como runbook real.
