---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-18T05:24:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cdd2048ba58e606fd68703977c2b33000abdb1826b6589ce25a35c53468726a
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de executores Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bastante recurso: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Faixa de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (sondagens de modelos + ferramentas/imagens do Gateway): `pnpm test:live`
- Direcione um arquivo live em modo silencioso: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você só precisa de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.

## Executores específicos de QA

Esses comandos ficam ao lado das suítes de teste principais quando você precisa do realismo do QA-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers isolados do Gateway, até 64 workers ou a contagem de cenários selecionados. Use `--concurrency <count>` para ajustar a contagem de workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Suporta os modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provedor com suporte do AIMock para cobertura experimental de fixture e simulação de protocolo sem substituir a faixa `mock-openai` sensível ao cenário.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA suportadas que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME` quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta pelo workspace montado.
  - Grava o relatório + resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo de operador.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para testes de fumaça diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa de QA live do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Esse host de QA é apenas para repositório/dev hoje. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, portanto não expõem `openclaw qa`.
  - Checkouts do repositório carregam o executor empacotado diretamente; nenhuma etapa separada de instalação de Plugin é necessária.
  - Provisiona três usuários Matrix temporários (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo filho do Gateway de QA com o Plugin Matrix real como transporte do SUT.
  - Usa a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` por padrão. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - O Matrix não expõe flags compartilhadas de origem de credenciais porque a faixa provisiona usuários descartáveis localmente.
  - Grava um relatório de QA do Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a faixa de QA live do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Suporta `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o Modo de Comunicação Bot-to-Bot no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`.

As faixas de transporte live compartilham um contrato padrão para que novos transportes não sofram desvios:

`qa-channel` continua sendo a suíte ampla de QA sintético e não faz parte da matriz de cobertura de transporte live.

| Faixa    | Canary | Gating de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Acompanhamento em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ---------------- | ------------------ | -------------------------- | ---------------------- | ------------------------ | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                | x                  | x                          | x                      | x                        | x                    | x                    |                  |
| Telegram | x      |                  |                    |                            |                        |                          |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte do Convex, envia Heartbeat
desse lease enquanto a faixa está em execução e libera o lease no desligamento.

Estrutura de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão no env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `maintainer`)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos do mantenedor (adicionar/remover/listar no pool) requerem
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
- `POST /admin/add` (apenas segredo de mantenedor)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (apenas segredo de mantenedor)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema de QA em Markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
ser dono do fluxo.

`qa-lab` é dono da mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e desligamento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de executor são donos do contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado normalizado do transporte são expostos
- como ações com suporte do transporte são executadas
- como redefinição ou limpeza específica do transporte é tratada

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o executor de transporte na costura de host compartilhada `qa-lab`.
3. Manter a mecânica específica do transporte dentro do Plugin de executor ou do harness do Plugin.
4. Montar o executor como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de executor devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a execução lazy de CLI e de executor deve permanecer atrás de entrypoints separados.
5. Criar ou adaptar cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter funcionando os aliases de compatibilidade existentes, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin de executor ou harness do Plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

Os nomes preferidos de helper genérico para novos cenários são:

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
Os aliases de compatibilidade existem para evitar uma migração em “flag day”, não como modelo para
a criação de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e aumento de instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shards (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda no CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações de shard menores (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensão sufoque suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz em `vitest.config.ts`, porque um loop watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro alvos explícitos de arquivo/diretório por faixas com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
  - `pnpm test:changed` expande caminhos alterados no git para as mesmas faixas com escopo quando o diff toca apenas arquivos de código/teste roteáveis; edições de config/setup ainda recorrem à reexecução ampla do projeto raiz.
  - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela faixa `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado pesado/runtime permanecem nas faixas existentes.
  - Alguns arquivos-fonte helper de `plugin-sdk` e `commands` também mapeiam execuções no modo changed para testes irmãos explícitos nessas faixas leves, para que edições de helpers evitem reexecutar a suíte pesada completa desse diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre o executor embutido:
  - Quando você altera entradas de descoberta de ferramentas de mensagem ou o contexto de runtime de Compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas em helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do executor embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e o comportamento de Compaction ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o executor não isolado nos projetos raiz, e2e e live.
  - A faixa UI da raiz mantém sua configuração e otimizador `jsdom`, mas agora também roda no executor compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos Node filhos do Vitest, para reduzir churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` passa por faixas com escopo quando os caminhos alterados mapeiam de forma limpa para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente mais conservador e também recua quando a média de carga do host já está alta, para que várias execuções concorrentes do Vitest causem menos impacto por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/configuração como `forceRerunTriggers` para que reexecuções no modo changed permaneçam corretas quando o wiring dos testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação de depuração de performance:
  - `pnpm test:perf:imports` habilita o relatório de duração de importação do Vitest mais a saída de detalhamento de importações.
  - `pnpm test:perf:imports:changed` aplica a mesma visão de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para a suíte unit com paralelismo de arquivos desabilitado.

### E2E (teste de fumaça do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir o overhead de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar a saída verbosa no console.
- Escopo:
  - Comportamento end-to-end do gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nós e networking mais pesado
- Expectativas:
  - Roda no CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis que testes unitários (pode ser mais lento)

### E2E: teste de fumaça do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução por SSH
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da ponte fs do sandbox
- Expectativas:
  - Opt-in apenas; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer um CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI ou script wrapper fora do padrão

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato do provedor, peculiaridades de chamada de ferramentas, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável em CI por definição (redes reais, políticas reais de provedor, cotas, indisponibilidades)
  - Custa dinheiro / consome rate limits
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções live leem `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para uma home temporária de teste, para que fixtures unitárias não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando quiser intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou use a substituição por live `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso em stderr para que chamadas longas de provedor permaneçam visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte eu devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou bastante coisa)
- Alterando networking do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramentas: execute um `pnpm test:live` reduzido

## Live: varredura de capacidades de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos atualmente anunciados** por um Node Android conectado e verificar o comportamento contratual dos comandos.
- Escopo:
  - Pré-condicionado/configuração manual (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: teste de fumaça de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos informa se o provedor/modelo consegue responder com a chave informada.
- “Teste de fumaça do gateway” nos informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no teste de fumaça do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfil e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas** o armazenamento de perfil
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de reasoning do OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: teste de fumaça do Gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway em processo
  - Criar/atualizar uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar por modelos com chaves e verificar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas opcionais extras de ferramenta (sonda exec+read)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → continuação) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e retornar o nonce.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário com `exec` e depois lê-lo de volta com `read`.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do gateway usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “tudo do OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- As sondas de ferramenta + imagem estão sempre ativas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um pequeno PNG com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway faz o parse dos anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem de usuário multimodal ao modelo
    - Verificação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: teste de fumaça do backend CLI (Claude, Codex, Gemini ou outros CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua config padrão.
- Os padrões de teste de fumaça específicos do backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - O comportamento de comando/args/imagem vem dos metadados do Plugin de backend CLI proprietário.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar uma segunda rodada e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina `1` para forçá-la quando o modelo selecionado suportar um alvo de troca).

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

Receitas Docker de provedor único:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O executor Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o teste de fumaça live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve os metadados do teste de fumaça da CLI a partir da extensão proprietária e então instala o pacote Linux CLI correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker, depois executa duas rodadas do backend CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Essa faixa de assinatura desabilita por padrão as sondas de ferramenta MCP e imagem do Claude porque o Claude atualmente roteia o uso de aplicativos de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O teste de fumaça live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: rodada de texto, rodada de classificação de imagem e depois chamada da ferramenta MCP `cron`, verificada pela CLI do gateway.
- O teste de fumaça padrão do Claude também atualiza a sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma observação anterior.

## Live: teste de fumaça de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular in-place uma conversa sintética de canal de mensagem
  - enviar uma continuação normal nessa mesma conversa
  - verificar que a continuação chega na transcrição da sessão ACP vinculada
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
  - Essa faixa usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem apenas para admin, para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do Plugin `acpx` embutido para o agente de harness ACP selecionado.

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

Observações sobre Docker:

- O executor Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o teste de fumaça de bind ACP contra todos os agentes CLI live suportados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele lê `~/.profile`, prepara o material de autenticação CLI correspondente dentro do contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se ela estiver ausente.
- Dentro do Docker, o executor define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de ambiente do provedor vindas do profile carregado.

## Live: teste de fumaça do harness app-server do Codex

- Objetivo: validar o harness do Codex pertencente ao Plugin por meio do método
  `agent` normal do gateway:
  - carregar o Plugin `codex` empacotado
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar uma primeira rodada do agente do gateway para `codex/gpt-5.4`
  - enviar uma segunda rodada para a mesma sessão OpenClaw e verificar se a thread do app-server
    pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de
    comando do gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda MCP/ferramenta opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O teste de fumaça define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não possa passar silenciosamente ao fazer fallback para PI.
- Autenticação: `OPENAI_API_KEY` do shell/profile, mais opcionais copiados
  `~/.codex/auth.json` e `~/.codex/config.toml`

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

- O executor Docker fica em `scripts/test-live-codex-harness-docker.sh`.
- Ele lê o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI do Codex
  quando presentes, instala `@openai/codex` em um prefixo npm montado e gravável,
  prepara a árvore de código-fonte e então executa apenas o teste live do harness do Codex.
- O Docker habilita por padrão as sondas de imagem e MCP/ferramenta. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, em linha com a configuração do
  teste live, para que o fallback `openai-codex/*` ou PI não possa ocultar uma regressão do
  harness do Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, teste de fumaça do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramentas em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave da API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google via HTTP (autenticação por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria autenticação e pode se comportar de maneira diferente (streaming/suporte a ferramentas/desalinhamento de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos do CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de smoke (chamada de ferramentas + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o teste de fumaça do gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chamada de ferramentas (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de `tools` que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramentas depende do modo da API)

### Vision: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com suporte a visão do Claude/Gemini/OpenAI etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/config):

- Embutidos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente codificar “todos os modelos” na documentação. A lista autoritativa é tudo o que `discoverModels(...)` retornar na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home live preparada quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legados e diretórios de autenticação de CLI externa suportados para uma home temporária de teste; as homes live preparadas ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas fiquem fora do seu workspace real do host.

Se quiser depender de chaves em env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile`, ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live do Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live do plano de codificação do BytePlus

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro do Plugin

## Live de geração de imagem

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os Plugins de provedor de geração de imagem registrados
  - Carrega variáveis de ambiente ausentes de provedores a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem pela capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atuais cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições apenas de env

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente de provedores do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições apenas de env

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores sem FAL, uma solicitação de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo da release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente de provedores do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local com suporte de buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local com suporte de buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota
  - Cobertura Vydra específica do provedor:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` de texto para vídeo, mais uma faixa `kling` que usa por padrão uma fixture de URL de imagem remota
  - Cobertura live atual de `videoToVideo`:
    - `runway` apenas quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a faixa compartilhada atual Gemini/Veo usa entrada local com suporte de buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não garante acesso específico da organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução de smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfil e ignorar substituições apenas de env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente ausentes de provedores a partir de `~/.profile`
  - Restringe automaticamente cada suíte aos provedores que atualmente têm autenticação utilizável por padrão
  - Reutiliza `scripts/test-live.mjs`, então o comportamento de Heartbeat e modo silencioso permanece consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Executores Docker (verificações opcionais de “funciona no Linux”)

Esses executores Docker se dividem em dois grupos:

- Executores live de modelos: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live de chave de perfil correspondente dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker live usam por padrão um limite de smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build` e depois a reutiliza para as duas faixas Docker live.
- Executores de smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker live de modelos também fazem bind-mount apenas dos homes de autenticação CLI necessários (ou de todos os suportados quando a execução não está restrita), e então os copiam para o home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway inicializado com seed + ponte stdio + smoke bruto de quadro de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os executores Docker live de modelos também fazem bind-mount do checkout atual somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a imagem de runtime
leve e ainda assim executa o Vitest exatamente sobre seu código-fonte/config local.
A etapa de preparação ignora caches locais grandes e saídas de build de app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais do app `.build` ou
saídas do Gradle, para que execuções live no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que sondas live do gateway não iniciem
workers reais de canais como Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura live
do gateway nessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway do OpenClaw com endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner do Open WebUI fixado apontando para esse gateway, faz login por
meio do Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o próprio Open WebUI pode precisar concluir sua configuração inicial.
Essa faixa espera uma chave live de modelo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner de Gateway
com seed, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte stdio MCP real. A verificação de notificação
inspeciona diretamente os quadros MCP brutos do stdio para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK cliente específico por acaso expõe.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, portanto não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem montagens de autenticação CLI externa
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios/arquivos de autenticação CLI externa sob `$HOME` são montados somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedor restrito montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfil (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Verificação da documentação

Execute verificações da documentação após editar docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramentas do Gateway (mock OpenAI, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, grava config + autenticação exigida): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade do agente”:

- Chamada simulada de ferramentas pelo loop real do gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de múltiplas rodadas que verificam ordem de ferramentas, continuidade do histórico da sessão e limites de sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um executor de cenários usando provedores simulados para verificar chamadas de ferramentas + ordem, leituras de arquivos de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, prompt injection).
- Evals live opcionais (opt-in, controlados por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de Plugin e canal)

Testes de contrato verificam que todo Plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os Plugins descobertos e executam uma suíte de
verificações de formato e comportamento. A faixa unit padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando alterar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do Plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vinculação de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Handlers de ação de canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Formato do registro de Plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de Plugins
- **loader** - Carregamento de Plugins
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do Plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um Plugin de canal ou provedor
- Depois de refatorar registro ou descoberta de Plugins

Os testes de contrato rodam no CI e não exigem chaves reais de API.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (rate limits, políticas de autenticação), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira atingir a menor camada que detecta o bug:
  - bug de conversão/replay de requisição do provedor → teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), depois verifica que ids exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
