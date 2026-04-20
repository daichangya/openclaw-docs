---
read_when:
    - Executando testes localmente ou na CI
    - Adicionando testes de regressão para bugs de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-20T05:41:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88457038e2e2c7940d0348762d0ece187111a8c61fa9bad54b39eade4217ddbc
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
- Loop direto do Vitest em watch: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensões/canais: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando em uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Lane de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você mexe em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcionar um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você precisa apenas de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.

## Executores específicos de QA

Estes comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers isolados do gateway. `qa-channel` usa concorrência 4 por padrão (limitada pela quantidade de cenários selecionados). Use `--concurrency <count>` para ajustar a quantidade de workers, ou `--concurrency 1` para a lane serial antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando quiser artefatos sem um código de saída com falha.
  - Suporta os modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provedor com suporte de AIMock para cobertura experimental de fixtures e mocks de protocolo sem substituir a lane `mock-openai`, que é orientada a cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários de `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA suportadas que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME` quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio do workspace montado.
  - Grava o relatório e resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo operador.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para smoke tests diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Este host de QA é apenas para repositório/desenvolvimento hoje. Instalações empacotadas do OpenClaw não incluem `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner empacotado diretamente; nenhuma etapa separada de instalação de plugin é necessária.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo filho do gateway de QA com o plugin real do Matrix como transporte do SUT.
  - Usa a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` por padrão. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar outra imagem.
  - O Matrix não expõe flags compartilhadas de origem de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório de QA do Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Suporta `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases compartilhados.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando quiser artefatos sem um código de saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot do SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, ative o Bot-to-Bot Communication Mode em `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não se desviem:

`qa-channel` continua sendo a suíte ampla de QA sintética e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Gating por menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Follow-up em thread | Isolamento de thread | Observação de reação | Comando de ajuda |
| -------- | ------ | ----------------- | ------------------ | -------------------------- | ---------------------- | ------------------- | -------------------- | -------------------- | ---------------- |
| Matrix   | x      | x                 | x                  | x                          | x                      | x                   | x                    | x                    |                  |
| Telegram | x      |                   |                    |                            |                        |                     |                      |                      | x                |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) estiver ativado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte de Convex, envia Heartbeat desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Scaffold de projeto de referência do Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão do env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` na CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` em loopback para desenvolvimento apenas local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) requerem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Auxiliares de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato padrão do endpoint (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Proteção contra lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas segredo de mantenedor)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato do payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string com o id numérico do chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema de QA em markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder ser o dono do fluxo.

`qa-lab` é dono da mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
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
- como transcrições e estado normalizado do transporte são expostos
- como ações com suporte de transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o runner de transporte no seam compartilhado do host `qa-lab`.
3. Manter mecânicas específicas de transporte dentro do plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a execução lazy de CLI e runner deve permanecer atrás de entrypoints separados.
5. Criar ou adaptar cenários markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os auxiliares genéricos de cenário para novos cenários.
7. Manter os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é estrita:

- Se um comportamento puder ser expresso uma vez no `qa-lab`, coloque-o no `qa-lab`.
- Se um comportamento depender de um transporte de canal, mantenha-o naquele plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um auxiliar genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico daquele transporte e deixe isso explícito no contrato do cenário.

Os nomes preferidos de auxiliares genéricos para novos cenários são:

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

Novos trabalhos de canal devem usar os nomes genéricos de auxiliares.
Aliases de compatibilidade existem para evitar uma migração de uma só vez, não como modelo para criação de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e aumento de instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes `ui` de node permitidos cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes puramente unitários
  - Testes de integração in-process (autenticação do gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda na CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações menores de shard (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo root-project nativo gigante. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões prejudique suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projeto nativo do root `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita o custo de inicialização do projeto root completo.
  - `pnpm test:changed` expande caminhos git alterados nas mesmas lanes com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições em config/setup ainda recorrem à reexecução ampla do projeto root.
  - Testes unitários leves de importação de agents, commands, plugins, auxiliares de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos stateful/com runtime pesado permanecem nas lanes existentes.
  - Alguns arquivos auxiliares de origem de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, de modo que edições em auxiliares evitam reexecutar a suíte pesada completa desse diretório.
  - `auto-reply` agora tem três buckets dedicados: auxiliares core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre embedded runner:
  - Quando você altera entradas de descoberta de ferramentas de mensagem ou o contexto de runtime de Compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas em auxiliares para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e o comportamento de Compaction continuam fluindo pelos caminhos reais de `run.ts` / `compact.ts`; testes só de auxiliares não são um substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projetos root, configs e2e e live.
  - A lane root de UI mantém sua configuração `jsdom` e o otimizador, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir a agitação de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também reduz quando a média de carga do host já está alta, para que múltiplas execuções simultâneas do Vitest causem menos impacto por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers` para que reexecuções em modo changed continuem corretas quando a fiação de testes mudar.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` ativa relatórios de duração de importação do Vitest mais a saída de detalhamento de importações.
  - `pnpm test:perf:imports:changed` aplica a mesma visão de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto root para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore suja atual roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e a configuração root do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de startup e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivos desativado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, alinhado com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir o overhead de E/S do console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar a saída detalhada do console.
- Escopo:
  - Comportamento end-to-end de gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, emparelhamento de Node e rede mais pesada
- Expectativas:
  - Roda na CI (quando ativado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge fs do sandbox
- Expectativas:
  - Opt-in apenas; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer um CLI `openshell` local mais um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o gateway e sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Capturar mudanças de formato de provedor, peculiaridades de tool calling, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedor, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos reduzidos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um home temporário de teste, para que fixtures unitárias não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando quiser intencionalmente que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas oculta o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser de volta os logs completos de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas ao provedor mostrem atividade visível mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso do provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Alterando rede do gateway / protocolo WS / emparelhamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / tool calling: execute um `pnpm test:live` reduzido

## Live: varredura de capacidades de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um Node Android conectado e validar o comportamento do contrato de comando.
- Escopo:
  - Setup manual/com pré-condições (a suíte não instala/executa/emparelha o app).
  - Validação `node.invoke` do gateway, comando por comando, para o Node Android selecionado.
- Pré-setup obrigatório:
  - App Android já conectado e emparelhado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de setup do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para podermos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com aquela chave.
- “Smoke do gateway” nos diz se o pipeline completo de gateway+agente funciona para aquele modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - As varreduras modern/all usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **somente armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: fluxos de replay de reasoning + tool-call do OpenAI Responses/Codex Responses)

### Camada 2: smoke do Gateway + agente dev (o que o "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway in-process
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos-com-chaves e validar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas opcionais extras de ferramenta (sonda exec+read)
    - caminhos de regressão do OpenAI (somente tool-call → follow-up) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e retornar o nonce.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário com `exec` e depois fazer `read` dele.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - As varreduras de gateway modern/all usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ativadas neste teste live:
  - sonda `read` + sonda `exec+read` (stress de ferramenta)
  - a sonda de imagem é executada quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um pequeno PNG com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway analisa anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embarcado encaminha uma mensagem multimodal do usuário para o modelo
    - Validação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outros CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua config padrão.
- Os padrões de smoke específicos de backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - O comportamento de comando/args/imagem vem dos metadados do plugin proprietário do backend CLI.
- Substituições opcionais:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivos de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desativar a sonda padrão de continuidade na mesma sessão de Claude Sonnet -> Opus (defina `1` para forçar a ativação quando o modelo selecionado suportar um alvo de troca).

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

- O executor Docker está em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live de backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve os metadados de smoke da CLI a partir da extensão proprietária e então instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele comprova `claude -p` direto no Docker, depois executa dois turnos do Gateway CLI-backend sem preservar variáveis de ambiente de chave de API da Anthropic. Esta lane de assinatura desativa por padrão as sondas MCP/ferramenta e imagem do Claude porque o Claude atualmente roteia o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live de backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada da ferramenta MCP `cron` verificada pelo gateway CLI.
- O smoke padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma anotação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular uma conversa sintética de canal de mensagens no lugar
  - enviar um follow-up normal nessa mesma conversa
  - verificar que o follow-up chega na transcrição da sessão ACP vinculada
- Ativar:
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
  - Esta lane usa a superfície `chat.send` do gateway com campos admin-only sintéticos de originating-route para que os testes possam anexar contexto de canal de mensagens sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro de agentes embutido do plugin `acpx` incorporado para o agente de harness ACP selecionado.

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

- O executor Docker está em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes CLI live suportados em sequência: `claude`, `codex`, depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material de autenticação da CLI correspondente dentro do contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o executor define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de ambiente do provedor vindas do profile carregado.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness do Codex pertencente ao plugin por meio do método
  `agent` normal do gateway:
  - carregar o plugin `codex` empacotado
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno do agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão do OpenClaw e verificar se a thread
    do app-server consegue ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Ativar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional de MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness
  Codex quebrado não passe ao recorrer silenciosamente ao PI.
- Auth: `OPENAI_API_KEY` do shell/profile, além de cópias opcionais de
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
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de
  auth da CLI Codex quando presentes, instala `@openai/codex` em um prefixo npm
  gravável montado, prepara a árvore de código-fonte e então executa apenas o teste live do harness Codex.
- O Docker ativa por padrão as sondas de imagem e MCP/ferramenta. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, alinhado com a configuração
  do teste live para que o fallback para `openai-codex/*` ou PI não possa ocultar uma regressão no harness Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API do Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI local do Gemini na sua máquina (auth separado + peculiaridades de ferramentas).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (auth por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria auth e pode se comportar de forma diferente (streaming/suporte a ferramentas/diferenças de versão).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista de modelos de CI” fixa (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto de smoke moderno (tool calling + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Base: tool calling (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a versão mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de ferramentas que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; o tool calling depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/config):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + quaisquer chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de auth por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções locais live copiam por padrão a config ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios externos de auth de CLI suportados para um home temporário de teste; homes live preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas não atinjam seu workspace real do host.

Se quiser depender de chaves do env (por exemplo exportadas no seu `~/.profile`), execute testes locais após `source ~/.profile`, ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live do Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live do plano de codificação BytePlus

- Teste: `src/agents/byteplus.live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil depois de alterar envio de workflow do comfy, polling, downloads ou registro de plugin

## Live de geração de imagem

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis de ambiente de provedor ausentes do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem pela capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atualmente cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth via armazenamento de perfis e ignorar substituições somente por env

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente de provedor do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada apenas de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da lane compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth via armazenamento de perfis e ignorar substituições somente por env

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores que não são FAL, uma solicitação de texto para vídeo por provedor, prompt lobster de um segundo e um limite de operação por provedor a partir de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência de fila do lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente do provedor do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de auth armazenados por padrão, para que chaves de teste obsoletas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local com suporte de buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local com suporte de buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL de imagem remota
  - Cobertura específica de provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` de texto para vídeo mais uma lane `kling` que usa por padrão uma fixture com URL de imagem remota
  - Cobertura live atual de `videoToVideo`:
    - apenas `runway` quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a lane compartilhada atual de Gemini/Veo usa entrada local com suporte de buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a lane compartilhada atual não tem garantias de acesso específicas da organização para inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução de smoke agressiva
- Comportamento opcional de auth:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth via armazenamento de perfis e ignorar substituições somente por env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes de `~/.profile`
  - Restringe automaticamente cada suíte por padrão aos provedores que atualmente têm auth utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores live de modelo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live correspondente de chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker live usam por padrão um limite menor de smoke para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` compila a imagem Docker live uma vez por `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live.
- Executores de smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker live de modelo também fazem bind-mount apenas dos homes de auth de CLI necessários (ou de todos os suportados quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução para que o OAuth da CLI externa possa renovar tokens sem alterar o armazenamento de auth do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Rede do gateway (dois contêineres, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Bridge de canal MCP (Gateway semeado + bridge stdio + smoke bruto de notification-frame do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os executores Docker live de modelo também fazem bind-mount do checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, ao mesmo tempo em que executa o Vitest exatamente com seu código-fonte/config locais.
A etapa de preparação ignora caches locais grandes e saídas de build do app, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios de saída locais de `.build` do app ou
Gradle, para que execuções live em Docker não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que as sondas live do gateway não iniciem
workers reais de canais do Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura live do gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker talvez precise baixar a
imagem do Open WebUI e o Open WebUI talvez precise terminar sua própria configuração de cold start.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções com Docker.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner de Gateway
semeado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo,
comportamento de fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela bridge MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, assim o smoke valida o que a
bridge realmente emite, não apenas o que um SDK cliente específico por acaso expõe.

Smoke manual de thread em linguagem natural ACP (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts de auth de CLI externa
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos externos de auth de CLI sob `$HOME` são montados como somente leitura sob `/host-auth...` e depois copiados para `/home/node/...` antes de os testes começarem
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedor restrito montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisam de recompilação
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de docs após edições na documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar títulos na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Tool calling do gateway (mock OpenAI, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + auth aplicado): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade de agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade de agente”:

- Mock de tool-calling pelo gateway real + loop de agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam a fiação da sessão e os efeitos na config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args exigidos?
- **Contratos de fluxo de trabalho:** cenários multi-turno que validam ordem de ferramentas, continuidade do histórico da sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores mock para validar chamadas de ferramenta + ordem, leituras de arquivos de Skill e fiação de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, prompt injection).
- Avaliações live opcionais (opt-in, protegidas por env) somente depois que a suíte segura para CI estiver implementada.

## Testes de contrato (formato de plugin e canal)

Os testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
validações de formato e comportamento. A lane unit padrão de `pnpm test`
ignora intencionalmente esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando alterar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura da carga útil da mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Handlers de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação da política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de auth
- **auth-choice** - Escolha/seleção de auth
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugin
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths de plugin-sdk
- Depois de adicionar ou modificar um plugin de canal ou provedor
- Depois de refatorar o registro ou a descoberta de plugins

Os testes de contrato rodam na CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor mock/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de auth), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira mirar na menor camada que capture o bug:
  - bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock do gateway seguro para CI
- Proteção para travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então valida que ids de exec com segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvos SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
