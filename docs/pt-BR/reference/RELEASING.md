---
read_when:
    - Procurando definições públicas de canais de lançamento
    - Procurando nomenclatura de versões e cadência
summary: Canais de lançamento públicos, nomenclatura de versões e cadência
title: Política de lançamento
x-i18n:
    generated_at: "2026-04-24T09:01:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2cba6cd02c6fb2380abd8d46e10567af2f96c7c6e45236689d69289348b829ce
    source_path: reference/RELEASING.md
    workflow: 15
---

O OpenClaw tem três linhas públicas de lançamento:

- stable: lançamentos com tag que publicam no npm `beta` por padrão, ou no npm `latest` quando solicitado explicitamente
- beta: tags de pré-lançamento que publicam no npm `beta`
- dev: a cabeça móvel de `main`

## Nomenclatura de versões

- Versão de lançamento stable: `YYYY.M.D`
  - Tag Git: `vYYYY.M.D`
- Versão de lançamento de correção stable: `YYYY.M.D-N`
  - Tag Git: `vYYYY.M.D-N`
- Versão de pré-lançamento beta: `YYYY.M.D-beta.N`
  - Tag Git: `vYYYY.M.D-beta.N`
- Não use zero à esquerda para mês ou dia
- `latest` significa o lançamento npm stable promovido atual
- `beta` significa o alvo de instalação beta atual
- Lançamentos stable e correções stable publicam no npm `beta` por padrão; operadores de lançamento podem direcionar para `latest` explicitamente, ou promover depois uma build beta validada
- Todo lançamento stable do OpenClaw envia juntos o pacote npm e o app do macOS;
  lançamentos beta normalmente validam e publicam primeiro o caminho do pacote/npm, com
  build/assinatura/notarização do app mac reservados para stable, salvo solicitação explícita

## Cadência de lançamento

- Os lançamentos seguem primeiro para beta
- Stable só vem depois que o beta mais recente é validado
- Mantenedores normalmente fazem lançamentos a partir de uma branch `release/YYYY.M.D` criada
  do `main` atual, para que validação e correções de lançamento não bloqueiem novo
  desenvolvimento em `main`
- Se uma tag beta já tiver sido enviada ou publicada e precisar de correção, os mantenedores criam
  a próxima tag `-beta.N` em vez de excluir ou recriar a tag beta antiga
- Procedimento detalhado de lançamento, aprovações, credenciais e notas de recuperação são
  apenas para mantenedores

## Verificações prévias de lançamento

- Execute `pnpm check:test-types` antes da verificação prévia de lançamento para que o TypeScript de teste continue
  coberto fora do gate local mais rápido `pnpm check`
- Execute `pnpm check:architecture` antes da verificação prévia de lançamento para que as verificações mais amplas
  de ciclo de importação e limites de arquitetura estejam verdes fora do gate local mais rápido
- Execute `pnpm build && pnpm ui:build` antes de `pnpm release:check` para que os
  artefatos de lançamento esperados em `dist/*` e o bundle da UI de Controle existam para a
  etapa de validação do pack
- Execute `pnpm release:check` antes de todo lançamento com tag
- As verificações de lançamento agora são executadas em um workflow manual separado:
  `OpenClaw Release Checks`
- `OpenClaw Release Checks` também executa o gate de paridade simulada do QA Lab, mais as
  lanes de QA ao vivo de Matrix e Telegram antes da aprovação do lançamento. As lanes ao vivo usam o
  ambiente `qa-live-shared`; o Telegram também usa leases de credenciais do Convex CI.
- A validação de runtime de instalação e atualização entre sistemas operacionais é disparada a partir do
  workflow chamador privado
  `openclaw/releases-private/.github/workflows/openclaw-cross-os-release-checks.yml`,
  que invoca o workflow público reutilizável
  `.github/workflows/openclaw-cross-os-release-checks-reusable.yml`
- Essa divisão é intencional: mantém o caminho real de lançamento npm curto,
  determinístico e focado em artefatos, enquanto verificações ao vivo mais lentas ficam em sua
  própria lane para não atrasar nem bloquear a publicação
- As verificações de lançamento devem ser disparadas a partir da ref de workflow `main` ou de uma
  ref de workflow `release/YYYY.M.D` para que a lógica do workflow e os segredos permaneçam
  controlados
- Esse workflow aceita uma tag de lançamento existente ou o SHA completo atual de 40 caracteres
  do commit da branch de workflow
- No modo SHA de commit, ele aceita apenas o HEAD atual da branch de workflow; use uma
  tag de lançamento para commits de lançamento mais antigos
- A verificação prévia somente de validação de `OpenClaw NPM Release` também aceita o SHA completo
  atual de 40 caracteres do commit da branch de workflow sem exigir uma tag enviada
- Esse caminho por SHA é somente de validação e não pode ser promovido para uma publicação real
- No modo SHA, o workflow sintetiza `v<package.json version>` apenas para a verificação de metadados
  do pacote; a publicação real ainda exige uma tag de lançamento real
- Ambos os workflows mantêm o caminho real de publicação e promoção em runners hospedados no GitHub,
  enquanto o caminho de validação sem mutação pode usar os runners Linux maiores do
  Blacksmith
- Esse workflow executa
  `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache`
  usando os segredos de workflow `OPENAI_API_KEY` e `ANTHROPIC_API_KEY`
- A verificação prévia de lançamento npm não espera mais pela lane separada de verificações de lançamento
- Execute `RELEASE_TAG=vYYYY.M.D node --import tsx scripts/openclaw-npm-release-check.ts`
  (ou a tag beta/correção correspondente) antes da aprovação
- Após a publicação no npm, execute
  `node --import tsx scripts/openclaw-npm-postpublish-verify.ts YYYY.M.D`
  (ou a versão beta/correção correspondente) para verificar o caminho de instalação do registro publicado
  em um prefixo temporário novo
- Após uma publicação beta, execute `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@YYYY.M.D-beta.N OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci pnpm test:docker:npm-telegram-live`
  para verificar onboarding de pacote instalado, setup do Telegram e E2E real de Telegram
  contra o pacote npm publicado usando o pool compartilhado de credenciais alugadas do Telegram.
  Casos pontuais locais de mantenedores podem omitir as variáveis do Convex e passar diretamente as três
  credenciais env `OPENCLAW_QA_TELEGRAM_*`.
- Mantenedores podem executar a mesma verificação pós-publicação a partir do GitHub Actions via o
  workflow manual `NPM Telegram Beta E2E`. Ele é intencionalmente apenas manual e
  não roda em todo merge.
- A automação de lançamento dos mantenedores agora usa preflight-then-promote:
  - a publicação real no npm deve passar por um `preflight_run_id` bem-sucedido
  - a publicação real no npm deve ser disparada da mesma branch `main` ou
    `release/YYYY.M.D` da execução preflight bem-sucedida
  - lançamentos npm stable usam `beta` por padrão
  - a publicação npm stable pode direcionar `latest` explicitamente por entrada do workflow
  - a mutação de dist-tag do npm baseada em token agora fica em
    `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
    por segurança, porque `npm dist-tag add` ainda precisa de `NPM_TOKEN`, enquanto o
    repositório público mantém publicação somente por OIDC
  - `macOS Release` público é apenas de validação
  - a publicação real privada do mac deve passar por `preflight_run_id`
    e `validate_run_id` privados bem-sucedidos
  - os caminhos de publicação real promovem artefatos preparados em vez de reconstruí-los
    novamente
- Para lançamentos de correção stable como `YYYY.M.D-N`, o verificador pós-publicação
  também verifica o mesmo caminho de atualização em prefixo temporário de `YYYY.M.D` para `YYYY.M.D-N`
  para que correções de lançamento não deixem silenciosamente instalações globais mais antigas no
  payload stable base
- A verificação prévia de lançamento npm falha em modo fechado a menos que o tarball inclua ambos
  `dist/control-ui/index.html` e um payload não vazio em `dist/control-ui/assets/`
  para que não enviemos novamente um dashboard do navegador vazio
- A verificação pós-publicação também verifica se a instalação publicada do registro
  contém dependências de runtime de plugins empacotados não vazias sob o layout raiz `dist/*`.
  Um lançamento enviado com payloads de dependência de plugin empacotado ausentes ou vazios
  falha no verificador pós-publicação e não pode ser promovido
  para `latest`.
- `pnpm test:install:smoke` também aplica o orçamento de `unpackedSize` do `npm pack` ao
  tarball de atualização candidato, então o e2e do instalador detecta aumento acidental do pack
  antes do caminho de publicação do lançamento
- Se o trabalho de lançamento tocou no planejamento de CI, manifestos de tempo de extensões ou
  matrizes de teste de extensões, regenere e revise as saídas de matriz do workflow
  `checks-node-extensions` controladas pelo planejador a partir de `.github/workflows/ci.yml`
  antes da aprovação para que as notas de lançamento não descrevam um layout de CI desatualizado
- A prontidão de lançamento stable do macOS também inclui as superfícies do atualizador:
  - o lançamento no GitHub deve terminar com os pacotes `.zip`, `.dmg` e `.dSYM.zip`
  - `appcast.xml` em `main` deve apontar para o novo zip stable após a publicação
  - o app empacotado deve manter um bundle id sem debug, uma URL de feed do Sparkle não vazia
    e um `CFBundleVersion` igual ou superior ao piso canônico de build do Sparkle
    para essa versão de lançamento

## Entradas do workflow NPM

`OpenClaw NPM Release` aceita estas entradas controladas pelo operador:

- `tag`: tag de lançamento obrigatória, como `v2026.4.2`, `v2026.4.2-1` ou
  `v2026.4.2-beta.1`; quando `preflight_only=true`, também pode ser o SHA completo
  atual de 40 caracteres do commit da branch de workflow para verificação prévia apenas de validação
- `preflight_only`: `true` para apenas validação/build/pacote, `false` para o
  caminho de publicação real
- `preflight_run_id`: obrigatório no caminho de publicação real para que o workflow reutilize
  o tarball preparado da execução preflight bem-sucedida
- `npm_dist_tag`: tag alvo do npm para o caminho de publicação; o padrão é `beta`

`OpenClaw Release Checks` aceita estas entradas controladas pelo operador:

- `ref`: tag de lançamento existente ou o SHA completo atual de 40 caracteres do commit de `main`
  para validar quando disparado a partir de `main`; a partir de uma branch de lançamento, use uma
  tag de lançamento existente ou o SHA completo atual de 40 caracteres do commit da branch de lançamento

Regras:

- Tags stable e de correção podem publicar em `beta` ou `latest`
- Tags beta de pré-lançamento podem publicar apenas em `beta`
- Para `OpenClaw NPM Release`, entrada com SHA completo de commit é permitida apenas quando
  `preflight_only=true`
- `OpenClaw Release Checks` é sempre apenas de validação e também aceita o
  SHA atual do commit da branch de workflow
- O modo de SHA de commit das verificações de lançamento também exige o HEAD atual da branch de workflow
- O caminho de publicação real deve usar o mesmo `npm_dist_tag` usado durante a verificação prévia;
  o workflow verifica esses metadados antes de continuar a publicação

## Sequência de lançamento npm stable

Ao criar um lançamento npm stable:

1. Execute `OpenClaw NPM Release` com `preflight_only=true`
   - Antes de existir uma tag, você pode usar o SHA completo atual do commit da branch de workflow
     para uma execução de ensaio apenas de validação do workflow de verificação prévia
2. Escolha `npm_dist_tag=beta` para o fluxo normal beta-first, ou `latest` apenas
   quando você quiser intencionalmente uma publicação stable direta
3. Execute `OpenClaw Release Checks` separadamente com a mesma tag ou o
   SHA completo atual da branch de workflow quando quiser cobertura ao vivo de cache de prompt,
   paridade do QA Lab, Matrix e Telegram
   - Isso é separado de propósito para que a cobertura ao vivo continue disponível sem
     reacoplar verificações demoradas ou instáveis ao workflow de publicação
4. Salve o `preflight_run_id` bem-sucedido
5. Execute `OpenClaw NPM Release` novamente com `preflight_only=false`, a mesma
   `tag`, o mesmo `npm_dist_tag` e o `preflight_run_id` salvo
6. Se o lançamento foi para `beta`, use o workflow privado
   `openclaw/releases-private/.github/workflows/openclaw-npm-dist-tags.yml`
   para promover essa versão stable de `beta` para `latest`
7. Se o lançamento foi publicado intencionalmente diretamente em `latest` e `beta`
   deve seguir imediatamente a mesma build stable, use esse mesmo workflow privado
   para apontar ambas as dist-tags para a versão stable, ou deixe a sincronização automática
   agendada movê-lo para `beta` depois

A mutação de dist-tag fica no repositório privado por segurança porque ainda
exige `NPM_TOKEN`, enquanto o repositório público mantém publicação somente por OIDC.

Isso mantém tanto o caminho de publicação direta quanto o caminho de promoção beta-first
documentados e visíveis para o operador.

## Referências públicas

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`.github/workflows/openclaw-release-checks.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-release-checks.yml)
- [`.github/workflows/openclaw-cross-os-release-checks-reusable.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-cross-os-release-checks-reusable.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)
- [`scripts/package-mac-dist.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-dist.sh)
- [`scripts/make_appcast.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/make_appcast.sh)

Mantenedores usam a documentação privada de lançamento em
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
para o guia operacional real.

## Relacionado

- [Canais de lançamento](/pt-BR/install/development-channels)
