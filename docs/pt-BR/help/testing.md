---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provider
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-21T13:36:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3290113f28dab37f4b6ceb0bda6ced70c7d2b24ad3fccac6488b6aab1ad65e52
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/providers
- Como adicionar regressões para problemas reais de modelo/provider

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bons recursos: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivo agora também encaminha caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando sobre uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Lane de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você mexer em testes ou quiser confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar providers/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramentas/imagens do gateway): `pnpm test:live`
- Direcione um arquivo live em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se o
  transcript do assistente armazena `usage.cost` normalizado.

Dica: quando você só precisar de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA baseados no repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    de gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    quantidade de workers, ou `--concurrency 1` para a lane serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provider `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provider com suporte de AIMock para cobertura experimental
    de fixtures e mocks de protocolo sem substituir a lane `mock-openai`
    com reconhecimento de cenário.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza os mesmos flags de seleção de provider/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA compatíveis que são práticas para o guest:
    chaves de provider baseadas em env, o caminho de configuração do provider live de QA e
    `CODEX_HOME` quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio
    do workspace montado.
  - Grava o relatório e resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala o build atual do OpenClaw no Docker, inicia o Gateway
    com o OpenAI configurado e depois habilita Telegram e Discord por meio de edições de config.
  - Verifica se a primeira reinicialização do Gateway instala, sob demanda, as dependências de runtime
    de cada Plugin de channel empacotado e se uma segunda reinicialização não reinstala
    dependências que já foram ativadas.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provider AIMock para smoke
    direto de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Atualmente, esse host de QA é apenas para repositório/dev. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner empacotado diretamente; não é necessária
    uma etapa separada de instalação de Plugin.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, e então inicia um processo filho de gateway de QA com o Plugin Matrix real como transporte do SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - O Matrix não expõe flags compartilhados de origem de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório de QA do Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos de env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases do pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando você
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot do SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Modo de Comunicação Bot-to-Bot em `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots do grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não se desviem:

`qa-channel` continua sendo a suíte ampla de QA sintético e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Gating de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinicialização | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ---------------- | ------------------ | -------------------------- | ----------------------------- | ------------------- | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                | x                  | x                          | x                             | x                   | x                    | x                    |                  |
| Telegram | x      |                  |                    |                            |                               |                     |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte de Convex, envia Heartbeat
desse lease enquanto a lane está em execução e libera o lease no desligamento.

Scaffold de referência de projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção de função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão em CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos do mantenedor (adicionar/remover/listar pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Requisição: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (apenas segredo de mantenedor)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (apenas segredo de mantenedor)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção contra lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string com o id numérico do chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um channel ao QA

Adicionar um channel ao sistema de QA em Markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o channel.
2. Um pacote de cenários que exercite o contrato do channel.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
ser o dono do fluxo.

`qa-lab` é o dono da mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e teardown da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de runner são donos do contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcripts e estado de transporte normalizado são expostos
- como ações com suporte de transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barreira mínima de adoção para um novo channel é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o runner de transporte na seam compartilhada do host `qa-lab`.
3. Manter a mecânica específica de transporte dentro do Plugin de runner ou harness do channel.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; CLI lazy e execução do runner devem permanecer atrás de entrypoints separados.
5. Criar ou adaptar cenários em Markdown dentro dos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenários para novos cenários.
7. Manter os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja realizando uma migração intencional.

A regra de decisão é estrita:

- Se um comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um transporte de channel, mantenha-o nesse Plugin de runner ou harness do Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um channel possa usar, adicione um helper genérico em vez de um branch específico de channel em `suite.ts`.
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

Novos trabalhos de channel devem usar os nomes genéricos de helpers.
Os aliases de compatibilidade existem para evitar uma migração de tipo flag day, não como modelo para
autoria de novos cenários.

## Suítes de teste (o que roda em cada lugar)

Pense nas suítes como “realismo crescente” (e maior flakiness/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes Node de `ui` na allowlist cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (autenticação do gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações menores de shard (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extension prejudique suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo nativo de projetos da raiz em `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham alvos explícitos de arquivo/diretório primeiro por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo total de inicialização do projeto-raiz.
  - `pnpm test:changed` expande caminhos alterados do git para as mesmas lanes com escopo quando o diff toca apenas arquivos de código-fonte/teste roteáveis; edições de config/setup ainda fazem fallback para a nova execução ampla do projeto-raiz.
  - `pnpm check:changed` é o gate local inteligente normal para trabalho restrito. Ele classifica o diff em core, testes de core, extensions, testes de extension, apps, docs e tooling, e então executa as lanes correspondentes de typecheck/lint/test. Alterações no SDK público de Plugin e no contrato de plugin incluem validação de extension porque extensions dependem desses contratos core.
  - Testes unitários leves de importação vindos de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/runtime pesado permanecem nas lanes existentes.
  - Alguns arquivos de origem helper de `plugin-sdk` e `commands` também mapeiam execuções em modo alterado para testes irmãos explícitos nessas lanes leves, de forma que edições em helpers evitam reexecutar a suíte pesada completa daquele diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre runner embutido:
  - Quando você alterar entradas de descoberta da ferramenta de mensagem ou o contexto de runtime de Compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas de helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do runner embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e comportamento de Compaction ainda fluem
    pelos caminhos reais de `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projetos da raiz, e2e e live.
  - A lane `ui` da raiz mantém sua configuração `jsdom` e o otimizador, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
  - O hook de pre-commit executa `pnpm check:changed --staged` após formatação/lint dos arquivos staged, então commits apenas de core não pagam o custo de testes de extension, a menos que toquem contratos públicos voltados a extensions.
  - `pnpm test:changed` encaminha por lanes com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O escalonamento automático de workers locais agora é intencionalmente conservador e também recua quando a média de carga do host já está alta, para que várias execuções simultâneas do Vitest causem menos impacto por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers` para que novas execuções em modo alterado permaneçam corretas quando o wiring de teste muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` habilita relatório de duração de importação do Vitest mais saída detalhada de imports.
  - `pnpm test:perf:imports:changed` aplica o mesmo modo de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto-raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore atual com alterações, roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela config raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivo desativado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa Vitest `threads` com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de Node e networking mais pesado
- Expectativas:
  - Roda em CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` + exec SSH reais
  - Verifica o comportamento canônico do sistema de arquivos remoto por meio da bridge fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI local `openshell` e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário de CLI não padrão ou script wrapper

### Live (providers reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provider/modelo realmente funciona _hoje_ com credenciais reais?”
  - Captura mudanças de formato do provider, peculiaridades de chamada de ferramenta, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provider, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para uma home temporária de teste, para que fixtures unit não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você realmente quiser que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: ele mantém a saída de progresso `[live] ...`, mas suprime o aviso extra sobre `~/.profile` e silencia logs de bootstrap do gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chaves de API (específica por provider): defina `*_API_KEYS` com formato de vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas de provider apareçam como ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provider/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando networking do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provider / chamada de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capacidades de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um Node Android conectado e validar o comportamento do contrato do comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway, comando por comando, para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de profile)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos informa se o provider/modelo consegue responder de fato com a chave fornecida.
- “Smoke do gateway” nos informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta de modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar providers:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de profiles e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas o armazenamento de profiles**
- Por que isso existe:
  - Separa “a API do provider está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: smoke do Gateway + agente dev (o que o "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway in-process
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos com chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas opcionais de ferramenta extra (sonda de exec+read)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → follow-up) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e retornar o nonce.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce por `exec` em um arquivo temporário e depois lê-lo de volta com `read`.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras gateway modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar providers (evite “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ligadas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (visão geral):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia isso via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa os anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua config padrão.
- Os padrões de smoke específicos do backend ficam na definição `cli-backend.ts` da extension proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provider/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comportamento de comando/args/imagem vem dos metadados do Plugin proprietário do backend CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina `1` para forçar sua ativação quando o modelo selecionado suportar um alvo de troca).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Receitas Docker de provider único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Resolve os metadados de smoke da CLI a partir da extension proprietária e então instala o pacote Linux CLI correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele comprova `claude -p` diretamente no Docker e depois executa dois turnos do backend CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Essa lane de assinatura desabilita por padrão as sondas MCP/tool e de imagem do Claude porque o Claude atualmente roteia o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada da ferramenta MCP `cron` validada por meio da CLI do gateway.
- O smoke padrão do Claude também aplica patch da sessão de Sonnet para Opus e valida que a sessão retomada ainda lembra de uma anotação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de conversation-bind do ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no local uma conversa sintética de canal de mensagem
  - enviar um follow-up normal nessa mesma conversa
  - validar que o follow-up chega ao transcript da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Essa lane usa a superfície `chat.send` do gateway com campos de rota de origem sintética somente para admin, para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro integrado de agentes do Plugin `acpx` embutido para o agente de harness ACP selecionado.

Exemplo:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-acp-bind
```

Receitas Docker de agente único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Observações do Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP em sequência contra todos os agentes CLI live compatíveis: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara no contêiner o material de autenticação de CLI correspondente, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de ambiente do provider vindas do profile carregado.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness Codex de propriedade do Plugin por meio do método
  normal `agent` do gateway:
  - carregar o Plugin empacotado `codex`
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread
    do app-server pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/tool opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não passe silenciosamente por fallback para o PI.
- Auth: `OPENAI_API_KEY` do shell/profile, além de `~/.codex/auth.json` e
  `~/.codex/config.toml` copiados opcionalmente

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Receita Docker:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de auth
  da CLI Codex quando presentes, instala `@openai/codex` em um prefixo npm montado
  e gravável, prepara a árvore de código-fonte e então executa apenas o teste live do harness Codex.
- O Docker habilita as sondas de imagem e MCP/tool por padrão. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, em linha com a configuração
  do teste live, para que fallback para `openai-codex/*` ou PI não possa esconder uma
  regressão do harness Codex.

### Receitas live recomendadas

Allowlists restritas e explícitas são as mais rápidas e menos sujeitas a flakiness:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários providers:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a bridge OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (auth separado + peculiaridades de tooling).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (auth por chave de API / profile); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria auth e pode se comportar de forma diferente (streaming/suporte a ferramenta/defasagem de versão).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (chamada de ferramenta + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Linha de base: chamada de ferramenta (Read + Exec opcional)

Escolha pelo menos um por família de provider:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou o mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de ferramentas que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramenta depende do modo da API)

### Vision: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI com capacidade de visão etc.) para exercitar a sonda de imagem.

### Aggregators / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais providers que você pode incluir na matriz live (se tiver credenciais/config):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é aquilo que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “no creds”, depure do mesmo jeito que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de auth por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de profile” significa nos testes live)
- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de profile)
- Execuções live locais copiam por padrão a config ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de auth de CLI externos compatíveis para uma home temporária de teste; homes live preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho em `agents.*.workspace` / `agentDir` são removidas para que as sondas não usem seu workspace real do host.

Se você quiser depender de chaves de env (por exemplo, exportadas em seu `~/.profile`), execute testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram live (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro de Plugin

## Geração de imagem live

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todo Plugin de provider de geração de imagem registrado
  - Carrega variáveis de ambiente ausentes de provider a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora providers sem auth/profile/modelo utilizável
  - Executa as variantes padrão de geração de imagem por meio da capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Providers empacotados atualmente cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de profiles e ignorar substituições apenas de env

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provider de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente de provider a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora providers sem auth/profile/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas por prompt
    - `edit` quando o provider declara `capabilities.edit.enabled`
  - Cobertura atual da lane compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de profiles e ignorar substituições apenas de env

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provider de geração de vídeo
  - Usa por padrão o caminho smoke seguro para release: providers não FAL, uma solicitação text-to-video por provider, prompt de lagosta de um segundo e um limite de operação por provider vindo de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência de fila do lado do provider pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente de provider a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa por padrão chaves de API live/env antes de perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora providers sem auth/profile/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provider declara `capabilities.imageToVideo.enabled` e o provider/modelo selecionado aceita entrada de imagem local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provider declara `capabilities.videoToVideo.enabled` e o provider/modelo selecionado aceita entrada de vídeo local baseada em buffer na varredura compartilhada
  - Providers `imageToVideo` atualmente declarados, mas ignorados na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL remota de imagem
  - Cobertura específica de provider Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma lane `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - apenas `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Providers `videoToVideo` atualmente declarados, mas ignorados na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a lane compartilhada atual Gemini/Veo usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a lane compartilhada atual não tem garantias de acesso org-specific a video inpaint/remix
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todo provider na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provider em uma execução smoke agressiva
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de profiles e ignorar substituições apenas de env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Objetivo:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por meio de um entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente ausentes de provider a partir de `~/.profile`
  - Restringe automaticamente cada suíte, por padrão, aos providers que atualmente têm auth utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (verificações opcionais de "funciona em Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente de chaves de profile dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os runners live em Docker usam por padrão um limite smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura maior e exaustiva.
- `test:docker:all` constrói a imagem Docker live uma vez por meio de `test:docker:live-build` e depois a reutiliza para as duas lanes Docker live.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker de modelo live também fazem bind-mount apenas das homes de auth de CLI necessárias (ou de todas as compatíveis quando a execução não é restrita) e depois as copiam para a home do contêiner antes da execução, para que o OAuth de CLI externa possa renovar tokens sem alterar o armazenamento de auth do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking do gateway (dois contêineres, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge de channel MCP (Gateway preparado + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinicialização do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker de modelo live também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta e ainda executa o Vitest contra seu código-fonte/config locais exatos.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` do app ou
saída do Gradle, para que execuções live em Docker não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do gateway não iniciem
workers reais de channel Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura live
do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado de Open WebUI contra esse gateway, faz login por meio do
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat por meio do proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker talvez precise baixar a
imagem do Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de cold start.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner
Gateway preparado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcript, metadados de anexo,
comportamento de fila de eventos live, roteamento de envio de saída e notificações de channel +
permissão no estilo Claude sobre a bridge stdio MCP real. A verificação de notificação
inspeciona diretamente os frames brutos stdio MCP, para que o smoke valide o que a
bridge realmente emite, não apenas o que um SDK cliente específico por acaso expõe.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha esse script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validar roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes da execução dos testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts de auth de CLI externa
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos de auth de CLI externa sob `$HOME` são montados em modo somente leitura sob `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provider montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar providers dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em novas execuções que não precisem de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de profiles (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de docs após edições em documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando precisar de verificações de heading na página também: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem providers reais:

- Chamada de ferramenta do gateway (mock OpenAI, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, gravação forçada de config + auth): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade do agente”:

- Chamada de ferramenta simulada por meio do gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda está faltando para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args exigidos?
- **Contratos de workflow:** cenários de múltiplos turnos que validam ordem de ferramentas, persistência do histórico de sessão e limites de sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um runner de cenários usando providers simulados para validar chamadas de ferramenta + ordem, leituras de arquivo de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, injeção de prompt).
- Evals live opcionais (opt-in, controlados por env) apenas depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e channel)

Testes de contrato verificam se todo Plugin e channel registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os Plugins descobertos e executam uma suíte de
validações de formato e comportamento. A lane unit padrão de `pnpm test`
ignora intencionalmente esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de channel ou provider.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de channel: `pnpm test:contracts:channels`
- Apenas contratos de provider: `pnpm test:contracts:plugins`

### Contratos de channel

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de channel
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de channel
- **registry** - Formato do registro de Plugin

### Contratos de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de auth
- **auth-choice** - Escolha/seleção de auth
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugin
- **loader** - Carregamento de Plugin
- **runtime** - Runtime de provider
- **shape** - Formato/interface de Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um Plugin de channel ou provider
- Depois de refatorar o registro ou a descoberta de Plugins

Os testes de contrato rodam em CI e não requerem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provider/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provider simulado/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de auth), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira atingir a menor camada que captura o bug:
  - bug de conversão/replay de requisição do provider → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste simulado do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então valida que ids de exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
