---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-24T08:58:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto
de runners Docker. Este documento é um guia de "como testamos":

- O que cada suíte cobre (e o que deliberadamente _não_ cobre).
- Quais comandos executar para fluxos comuns (local, antes do push, depuração).
- Como os testes live descobrem credenciais e selecionam modelos/provedores.
- Como adicionar regressões para problemas reais de modelo/provedor.

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto para arquivo agora também roteia caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Lane de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondagens de ferramenta/imagem do gateway): `pnpm test:live`
- Direcionar um arquivo live em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura Docker de modelos live: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sondagem no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desative as sondagens extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas do provedor.
  - Cobertura em CI: as verificações diárias `OpenClaw Scheduled Live And E2E Checks` e as verificações manuais
    `OpenClaw Release Checks` chamam ambas o workflow reutilizável live/E2E com
    `include_live_suites: true`, que inclui jobs separados da matriz Docker live de modelos
    fragmentados por provedor.
  - Para reexecuções focadas no CI, despache `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos segredos de provedor de alto sinal em `scripts/ci-hydrate-live-auth.sh`
    mais `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores agendados/de release.
- Smoke nativo de chat vinculado do Codex: `pnpm test:docker:live-codex-bind`
  - Executa uma lane live em Docker no caminho do app-server do Codex, vincula uma DM sintética
    do Slack com `/codex bind`, exercita `/codex fast` e
    `/codex permissions`, depois verifica que uma resposta simples e um anexo de imagem
    passam pelo vínculo nativo do Plugin em vez de ACP.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado em relação a `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você precisa apenas de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

O CI executa o QA Lab em workflows dedicados. `Parity gate` é executado em PRs correspondentes e
a partir de despacho manual com provedores mock. `QA-Lab - All Lanes` é executado toda noite na
`main` e a partir de despacho manual com o parity gate mock, a lane live Matrix e a lane live Telegram gerenciada por Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas lanes antes da aprovação do release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    isolados do gateway. `qa-channel` usa por padrão concorrência 4 (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    contagem de workers, ou `--concurrency 1` para a antiga lane serial.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local com suporte de AIMock para cobertura experimental
    de fixtures e mocks de protocolo sem substituir a lane `mock-openai`
    orientada a cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e
    `CODEX_HOME`, quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio
    do workspace montado.
  - Grava o relatório + resumo normais de QA, além dos logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Gera um tarball npm a partir do checkout atual, instala-o globalmente em
    Docker, executa onboarding não interativo de chave de API da OpenAI, configura o Telegram
    por padrão, verifica se habilitar o Plugin instala dependências de runtime sob demanda,
    executa doctor e executa um turno de agente local contra um endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    lane de instalação empacotada com Discord.
- `pnpm test:docker:npm-telegram-live`
  - Instala um pacote publicado do OpenClaw em Docker, executa onboarding do pacote instalado,
    configura o Telegram por meio da CLI instalada e então reutiliza a lane de QA live do Telegram com esse pacote instalado como Gateway SUT.
  - Usa por padrão `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Usa as mesmas credenciais de Telegram via env ou a mesma fonte de credenciais Convex que
    `pnpm openclaw qa telegram`. Para automação de CI/release, defina
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` mais
    `OPENCLAW_QA_CONVEX_SITE_URL` e o segredo da role. Se
    `OPENCLAW_QA_CONVEX_SITE_URL` e um segredo de role Convex estiverem presentes no CI,
    o wrapper Docker seleciona Convex automaticamente.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` substitui a
    `OPENCLAW_QA_CREDENTIAL_ROLE` compartilhada apenas para esta lane.
  - O GitHub Actions expõe esta lane como o workflow manual para mantenedores
    `NPM Telegram Beta E2E`. Ela não é executada em merge. O workflow usa o
    ambiente `qa-live-shared` e leases de credenciais de CI do Convex.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw em Docker, inicia o Gateway
    com OpenAI configurado, então habilita channels/plugins integrados via edições de configuração.
  - Verifica se a descoberta de configuração mantém ausentes as dependências de runtime de Plugin não configuradas,
    se a primeira execução configurada do Gateway ou doctor instala as dependências de runtime
    de cada Plugin integrado sob demanda, e se uma segunda reinicialização não reinstala dependências que já foram ativadas.
  - Também instala uma baseline npm antiga conhecida, habilita o Telegram antes de executar
    `openclaw update --tag <candidate>`, e verifica se o doctor pós-atualização do
    candidato repara as dependências de runtime dos channels integrados sem um reparo pós-install do lado do harness.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes de smoke diretos
    de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA live do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Este host de QA hoje é apenas para repositório/desenvolvimento. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, portanto elas não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner integrado diretamente; nenhuma etapa separada de instalação de Plugin é necessária.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada, então inicia um processo filho de gateway de QA com o Plugin Matrix real como transporte SUT.
  - Usa por padrão a imagem Tuwunel estável fixada `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - Matrix não expõe flags compartilhadas de fonte de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório de QA Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane de QA live do Telegram contra um grupo privado real usando os tokens do bot driver e do bot SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O ID do grupo deve ser o ID numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável bot a bot, habilite o Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Os cenários de resposta incluem RTT desde a requisição de envio do driver até a resposta observada do SUT.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não se desalinhem:

`qa-channel` continua sendo a suíte ampla e sintética de QA e não faz parte da
matriz de cobertura de transporte live.

| Lane     | Canary | Controle por menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ------------------- | ------------------ | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                   | x                  | x                          | x                      | x                   | x                    | x                    |                  |
| Telegram | x      |                     |                    |                            |                        |                     |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte de Convex, mantém
Heartbeat desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Estrutura de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a role selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da role de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão no CI e `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (ID de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback local apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos CLI de administração para mantenedores (adicionar/remover/listar no pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato padrão de endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/repetível: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente com segredo de maintainer)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente com segredo de maintainer)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente com segredo de maintainer)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de ID de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema de QA em markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
controlar o fluxo.

`qa-lab` controla a mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e desligamento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de runner controlam o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado normalizado do transporte são expostos
- como ações com suporte do transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como o controlador da raiz compartilhada `qa`.
2. Implementar o runner de transporte na interface de host compartilhada do `qa-lab`.
3. Manter a mecânica específica do transporte dentro do Plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Os Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` em `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; CLI lazy e execução do runner devem ficar atrás de entrypoints separados.
5. Criar ou adaptar cenários markdown sob os diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter funcionando os aliases de compatibilidade existentes, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é rígida:

- Se um comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um transporte de canal, mantenha-o nesse Plugin de runner ou harness do Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico desse transporte e deixe isso explícito no contrato do cenário.

Os nomes preferidos de helpers genéricos para novos cenários são:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Aliases de compatibilidade continuam disponíveis para cenários existentes, incluindo:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Novos trabalhos de canal devem usar os nomes genéricos de helper.
Os aliases de compatibilidade existem para evitar uma migração obrigatória de uma vez só, não como modelo para
a autoria de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e crescente instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: execuções não direcionadas usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards de múltiplos projetos em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node em `ui` incluídos na allowlist cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (autenticação do gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa no CI
  - Não requer chaves reais
  - Deve ser rápido e estável
    <AccordionGroup>
    <Accordion title="Projetos, shards e lanes com escopo"> - `pnpm test` sem alvo executa doze configurações menores de shard (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante de projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensions prejudique suítes não relacionadas. - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático. - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização do projeto-raiz completo. - `pnpm test:changed` expande caminhos alterados no git para as mesmas lanes com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de configuração/setup ainda voltam para a reexecução ampla do projeto-raiz. - `pnpm check:changed` é o gate local inteligente normal para trabalho restrito. Ele classifica o diff em core, testes de core, extensions, testes de extension, apps, docs, metadados de release e tooling, depois executa as lanes correspondentes de typecheck/lint/test. Alterações no SDK público de Plugin e em contratos de Plugin incluem uma validação de extension porque extensions dependem desses contratos centrais. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependência raiz em vez da suíte completa, com uma proteção que rejeita mudanças em package fora do campo de versão de nível superior. - Testes unitários leves em import de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes são roteados pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos pesados em runtime/com estado permanecem nas lanes existentes. - Alguns arquivos helper de origem em `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, assim edições em helpers evitam reexecutar a suíte pesada completa daquele diretório. - `auto-reply` tem três buckets dedicados: helpers centrais de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
    </Accordion>

      <Accordion title="Cobertura do runner embutido">
        - Quando você altera entradas de descoberta de ferramentas de mensagem ou o
          contexto de runtime de Compaction, mantenha ambos os níveis de cobertura.
        - Adicione regressões focadas em helpers para limites puros de roteamento e normalização.
        - Mantenha saudáveis as suítes de integração do runner embutido:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Essas suítes verificam que IDs com escopo e o comportamento de Compaction continuam fluindo
          pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper
          não são substituto suficiente para esses caminhos de integração.
      </Accordion>

      <Accordion title="Padrões de pool e isolamento do Vitest">
        - A configuração base do Vitest usa por padrão `threads`.
        - A configuração compartilhada do Vitest fixa `isolate: false` e usa o
          runner não isolado nos projetos raiz, configs e2e e live.
        - A lane UI da raiz mantém seu setup `jsdom` e otimizador, mas também roda no
          runner não isolado compartilhado.
        - Cada shard de `pnpm test` herda os mesmos padrões
          `threads` + `isolate: false` da configuração compartilhada do Vitest.
        - `scripts/run-vitest.mjs` adiciona `--no-maglev` por padrão para processos
          Node filho do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais.
          Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` para comparar com o
          comportamento padrão do V8.
      </Accordion>

      <Accordion title="Iteração local rápida">
        - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
        - O hook pre-commit é apenas de formatação. Ele volta a stagear arquivos formatados e
          não executa lint, typecheck nem testes.
        - Execute `pnpm check:changed` explicitamente antes de repassar ou fazer push quando você
          precisar do gate local inteligente. Alterações no SDK público de Plugin e em contratos de Plugin
          incluem uma validação de extension.
        - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados
          mapeiam claramente para uma suíte menor.
        - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento,
          apenas com um limite maior de workers.
        - O autoescalonamento local de workers é intencionalmente conservador e reduz
          quando a média de carga do host já está alta, então múltiplas execuções concorrentes
          do Vitest causam menos danos por padrão.
        - A configuração base do Vitest marca os arquivos de projetos/config como
          `forceRerunTriggers` para que reexecuções em modo changed permaneçam corretas quando
          a ligação dos testes muda.
        - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em
          hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser
          um local de cache explícito para profiling direto.
      </Accordion>

      <Accordion title="Depuração de performance">
        - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest mais
          saída detalhada de imports.
        - `pnpm test:perf:imports:changed` limita a mesma visão de profiling a
          arquivos alterados desde `origin/main`.
        - Quando um teste quente ainda gasta a maior parte do tempo em imports de inicialização,
          mantenha dependências pesadas atrás de uma interface local estreita `*.runtime.ts` e
          faça mock dessa interface diretamente em vez de fazer deep-import de helpers de runtime apenas
          para repassá-los via `vi.mock(...)`.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` compara o
          `test:changed` roteado com o caminho nativo do projeto-raiz para esse diff commitado
          e imprime tempo total mais RSS máximo no macOS.
        - `pnpm test:perf:changed:bench -- --worktree` mede a árvore atual com alterações
          roteando a lista de arquivos alterados por
          `scripts/test-projects.mjs` e a configuração raiz do Vitest.
        - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para
          sobrecarga de inicialização e transformação do Vitest/Vite.
        - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a
          suíte unit com paralelismo por arquivo desabilitado.
      </Accordion>
    </AccordionGroup>

### Estabilidade (gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçado a um worker
- Escopo:
  - Inicia um Gateway local loopback real com diagnósticos habilitados por padrão
  - Conduz churn sintético de mensagens, memória e payloads grandes do gateway pelo caminho de eventos de diagnóstico
  - Consulta `diagnostics.stability` via WS RPC do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnóstico
  - Verifica que o recorder permanece limitado, que amostras sintéticas de RSS ficam abaixo do orçamento de pressão e que profundidades de fila por sessão drenam de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressões de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de Plugins integrados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir a sobrecarga de I/O do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de Node e rede mais pesada
- Expectativas:
  - Executa no CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria uma sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por meio de `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge fs da sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway de teste e a sandbox
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI ou script wrapper fora do padrão

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de Plugins integrados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Captura mudanças de formato do provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um diretório home temporário de teste para que fixtures unit não alterem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra sobre `~/.profile` e silencia logs de bootstrap do gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live específica via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas a provedores fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso do provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` restrito

## Testes live (com toque de rede)

Para a matriz de modelos live, smokes de backend da CLI, smokes de ACP, harness
do app-server do Codex e todos os testes live de provedores de mídia (Deepgram, BytePlus, ComfyUI, image,
music, video, media harness) — além do tratamento de credenciais para execuções live — consulte
[Testes — suítes live](/pt-BR/help/testing-live).

## Runners Docker (verificações opcionais de "funciona no Linux")

Esses runners Docker se dividem em dois grupos:

- Runners live de modelos: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live com a chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker live usam por padrão um limite menor de smoke para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker live uma vez por meio de `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live. Também constrói uma imagem compartilhada `scripts/e2e/Dockerfile` via `test:docker:e2e-build` e a reutiliza para os runners smoke em contêiner E2E que exercitam o app compilado.
- Runners smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os runners Docker live de modelos também fazem bind-mount apenas dos homes de autenticação de CLI necessários (ou de todos os compatíveis quando a execução não está restrita), depois os copiam para o diretório home do contêiner antes da execução para que o OAuth da CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de vínculo ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend da CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente de desenvolvimento: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente em Docker o tarball empacotado do OpenClaw, configura OpenAI via onboarding com referência de env mais Telegram por padrão, verifica se o doctor repara dependências de runtime de Plugin ativadas e executa um turno de agente OpenAI mockado. Reutilize um tarball pré-compilado com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a recompilação no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque de canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke de instalação global do Bun: `bash scripts/e2e/bun-global-install-smoke.sh` empacota a árvore atual, instala com `bun install -g` em um diretório home isolado e verifica se `openclaw infer image providers --json` retorna provedores de imagem integrados em vez de travar. Reutilize um tarball pré-compilado com `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a build no host com `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` ou copie `dist/` de uma imagem Docker já compilada com `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Smoke Docker do instalador: `bash scripts/test-install-sh-docker.sh` compartilha um único cache npm entre seus contêineres root, update e direct-npm. O smoke de update usa por padrão o npm `latest` como baseline estável antes de atualizar para o tarball candidato. As verificações do instalador sem root mantêm um cache npm isolado para que entradas de cache com proprietário root não mascarem o comportamento de instalação local do usuário. Defina `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache` para reutilizar o cache root/update/direct-npm em reexecuções locais.
- O CI de Install Smoke ignora a atualização global duplicada de direct-npm com `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; execute o script localmente sem esse env quando a cobertura direta de `npm install -g` for necessária.
- Rede do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressão de raciocínio mínimo de `web_search` no OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI mockado por meio do Gateway, verifica se `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e verifica se o detalhe bruto aparece nos logs do Gateway.
- Bridge de canal MCP (Gateway semeado + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke de permissão/negação do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza de MCP Cron/subagent (Gateway real + teardown de processo filho MCP stdio após Cron isolado e execuções one-shot de subagent): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke de update de Plugin sem alterações: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de Plugin integrado: `pnpm test:docker:bundled-channel-deps` por padrão compila uma pequena imagem Docker de runner, compila e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignore a recompilação no host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restrinja dependências de runtime de Plugin integrado durante iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-compilar e reutilizar manualmente a imagem compartilhada do app compilado:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm prioridade quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ainda não estiver localmente disponível. Os testes Docker de QR e do instalador mantêm seus próprios Dockerfiles porque validam o comportamento de pacote/instalação, não o runtime compartilhado do app compilado.

Os runners Docker live de modelos também fazem bind-mount somente leitura do checkout atual e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, ao mesmo tempo em que ainda executa o Vitest exatamente contra sua source/config local.
A etapa de preparação ignora grandes caches apenas locais e saídas de build de apps como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` ou
saída do Gradle, para que execuções Docker live não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, portanto passe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura
live do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner Gateway do OpenClaw com endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login via
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição de chat real por meio do proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração inicial a frio.
Esta lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner Gateway
semeado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversas roteadas, leituras de transcrição, metadados de anexo,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude por meio da bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, de modo que o smoke valida o que a
bridge realmente emite, e não apenas o que um SDK de cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma
chave de modelo live. Ele compila a imagem Docker do repositório, inicia um servidor de sonda MCP stdio real
dentro do contêiner, materializa esse servidor por meio do runtime MCP
do bundle Pi embutido, executa a ferramenta e então verifica se `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma
chave de modelo live. Ele inicia um Gateway semeado com um servidor de sonda MCP stdio real, executa um
turno Cron isolado e um turno filho one-shot de `/subagents spawn`, então verifica
que o processo filho MCP encerra após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem montagens externas de autenticação de CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação de CLI em `$HOME` são montados somente leitura em `/host-auth...`, depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam somente os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisem de recompilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do armazenamento de perfil (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Verificação básica da documentação

Execute verificações de docs após edições na documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar headings na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramentas do Gateway (OpenAI mockado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + auth obrigatórios): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada de ferramentas mockada por meio do loop real do gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam ligação de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/argumentos obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que verifiquem ordem de ferramentas, persistência do histórico da sessão e limites do sandbox.

Futuras avaliações devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores mock para verificar chamadas de ferramentas + ordem, leituras de arquivo de Skill e ligação de sessão.
- Um pequeno conjunto de cenários focados em Skills (usar vs evitar, controle, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e canal)

Os testes de contrato verificam que todo Plugin e canal registrado esteja em conformidade com seu
contrato de interface. Eles iteram sobre todos os Plugins descobertos e executam um conjunto de
verificações de formato e comportamento. A lane unit padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de interface e smoke; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canal: `pnpm test:contracts:channels`
- Somente contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capabilities)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de ligação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação da política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Formato do registro de Plugin

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um canal ou Plugin de provedor
- Após refatorar o registro ou a descoberta de Plugin

Os testes de contrato executam no CI e não exigem chaves reais de API.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mock/stub ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por meio de variáveis de ambiente
- Prefira direcionar a menor camada que capture o bug:
  - bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mockado do gateway seguro para CI
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então verifica que IDs de execução com segmento de travessia sejam rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em IDs de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.

## Relacionado

- [Testing live](/pt-BR/help/testing-live)
- [CI](/pt-BR/ci)
