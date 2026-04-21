---
read_when:
    - Executar testes localmente ou na CI
    - Adicionar regressões para bugs de modelo/provedor
    - Depurar comportamento do gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-21T05:38:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef5bf36f969a6334efd2e8373a0c8002f9e6461af53c4ff630b38ad8e37f73de
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bastante recurso: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira primeiro execuções direcionadas quando estiver iterando sobre uma única falha.
- Site de QA com Docker: `pnpm qa:lab:up`
- Lane de QA com VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer mais confiança:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (sondas de modelos + ferramentas/imagens do gateway): `pnpm test:live`
- Direcionar um arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado em `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você só precisa de um caso com falha, prefira restringir testes live com as variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das principais suítes de teste quando você precisa do realismo do qa-lab:

- `pnpm openclaw qa suite`
  - Executa cenários de QA do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers de gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela quantidade de cenários selecionados). Use `--concurrency <count>` para ajustar a quantidade de workers, ou `--concurrency 1` para a lane serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando quiser artifacts sem um código de saída com falha.
  - Suporta modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local baseado em AIMock para cobertura experimental de fixture e mock de protocolo sem substituir a lane `mock-openai` orientada a cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários de `qa suite` no host.
  - Reutiliza os mesmos flags de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas compatíveis de autenticação de QA que são práticas para a VM:
    chaves de provedor baseadas em env, o caminho de configuração de provedor live de QA e `CODEX_HOME` quando presente.
  - Diretórios de saída devem permanecer sob a raiz do repositório para que a VM possa gravar de volta por meio do workspace montado.
  - Grava o relatório + resumo normais de QA e também logs do Multipass em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com Docker para trabalho de QA no estilo operador.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor de provedor AIMock local para smoke direto de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane live de QA do Matrix contra um homeserver Tuwunel descartável com Docker.
  - Esse host de QA hoje é apenas para repositório/dev. Instalações empacotadas do OpenClaw não incluem `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner empacotado diretamente; nenhuma etapa separada de instalação de plugin é necessária.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo-filho de gateway de QA com o Plugin Matrix real como transporte do SUT.
  - Usa a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` por padrão. Sobrescreva com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar outra imagem.
  - O Matrix não expõe flags compartilhados de fonte de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório de QA do Matrix, resumo, artifact de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane live de QA do Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT a partir do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Suporta `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para ativar leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando quiser artifacts sem um código de saída com falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável entre bots, ative o Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artifact de mensagens observadas em `.artifacts/qa-e2e/...`.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não sofram desvio:

`qa-channel` continua sendo a suíte ampla de QA sintético e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Gate de menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Continuação em thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | -------------- | ------------------ | -------------------------- | ---------------------- | --------------------- | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x                  | x                          | x                      | x                     | x                    | x                    |              |
| Telegram | x      |                |                    |                            |                        |                       |                      |                      | x            |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) estiver habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool controlado por Convex, envia Heartbeat
desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Estrutura de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um secret para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção de função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` na CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id opcional de rastreamento)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos de administração do maintainer (adicionar/remover/listar pool) exigem
especificamente `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

Helpers de CLI para maintainers:

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
- `POST /admin/add` (apenas secret de maintainer)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (apenas secret de maintainer)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Guard de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (apenas secret de maintainer)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionar um canal ao QA

Adicionar um canal ao sistema de QA em Markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder controlar o fluxo.

`qa-lab` controla a mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artifacts
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Plugins de runner controlam o contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e estado de transporte normalizado são expostos
- como ações apoiadas por transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como controlador da raiz compartilhada `qa`.
2. Implementar o runner de transporte no seam compartilhado do host `qa-lab`.
3. Manter a mecânica específica de transporte dentro do Plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a execução lazy de CLI e runner deve permanecer atrás de entrypoints separados.
5. Criar ou adaptar cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é rígida:

- Se o comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se o comportamento depender de um transporte de canal, mantenha-o nesse Plugin de runner ou harness do plugin.
- Se um cenário precisar de uma nova capability que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

Nomes preferidos de helpers genéricos para novos cenários são:

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

Novos trabalhos de canal devem usar os nomes genéricos dos helpers.
Os aliases de compatibilidade existem para evitar uma migração “flag day”, não como modelo para
autoria de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e também aumento de flakiness/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node permitidos de `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do gateway, roteamento, tooling, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda na CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem direcionamento agora executa onze configs menores de shard (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante de projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensões prejudique suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projetos da raiz nativa `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo de inicialização do projeto-raiz completo.
  - `pnpm test:changed` expande caminhos git alterados para as mesmas lanes com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de config/setup ainda recorrem à reexecução ampla do projeto-raiz.
  - `pnpm check:changed` é o gate local inteligente normal para trabalho restrito. Ele classifica o diff em core, testes do core, extensões, testes de extensões, apps, docs e tooling, depois executa as lanes correspondentes de typecheck/lint/teste. Mudanças públicas no Plugin SDK e em contratos de plugin incluem validação de extensões porque as extensões dependem desses contratos do core.
  - Testes unitários leves de importação em agentes, comandos, plugins, helpers de auto-reply, `plugin-sdk` e áreas similares de utilitários puros passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/runtime pesado permanecem nas lanes existentes.
  - Arquivos selecionados de helper de origem `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, então edições em helpers evitam reexecutar a suíte pesada completa desse diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre o runner embutido:
  - Quando você altera entradas de descoberta de ferramentas de mensagem ou contexto de runtime de Compaction,
    mantenha os dois níveis de cobertura.
  - Adicione regressões focadas de helper para boundaries puros de roteamento/normalização.
  - Mantenha também saudáveis as suítes de integração do runner embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam se ids com escopo e comportamento de Compaction continuam fluindo
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são
    um substituto suficiente para esses caminhos de integração.
- Observação sobre o pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projetos raiz, e2e e live.
  - A lane UI da raiz mantém sua configuração e otimizador de `jsdom`, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos-filho Node do Vitest para reduzir o churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
  - O hook de pre-commit executa `pnpm check:changed --staged` após formatação/lint do que está staged, então commits só do core não pagam o custo dos testes de extensões, a menos que toquem contratos públicos voltados a extensões.
  - `pnpm test:changed` roteia por lanes com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também reduz quando a carga média do host já está alta, então várias execuções simultâneas do Vitest causam menos dano por padrão.
  - A configuração base do Vitest marca os arquivos de projeto/configuração como `forceRerunTriggers` para que reexecuções em modo changed permaneçam corretas quando a fiação dos testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest mais saída de detalhamento de importações.
  - `pnpm test:perf:imports:changed` restringe a mesma visualização de profiling a arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto-raiz para esse diff com commit e imprime wall time mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` mede a árvore atual com modificações roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e a configuração raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivos desativado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, combinando com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir overhead de I/O de console.
- Sobrescritas úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada do console.
- Escopo:
  - Comportamento end-to-end do gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nós e rede mais pesada
- Expectativas:
  - Roda na CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` + execução SSH reais
  - Verifica comportamento de sistema de arquivos canônico remoto por meio da ponte fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e sandbox de teste
- Sobrescritas úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Captura mudanças de formato de provedor, particularidades de chamadas de ferramenta, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável na CI por definição (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa rate limits
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/autenticação para um home temporário de teste para que fixtures unit não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` somente quando quiser intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica do provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou sobrescrita por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas ao provedor fiquem visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso do provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Alterando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capability de nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando anunciado atualmente** por um nó Android conectado e validar o comportamento do contrato do comando.
- Escopo:
  - Configuração manual/com pré-condição (a suíte não instala/executa/emparelha o app).
  - Validação `node.invoke` do gateway, comando por comando, para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + emparelhado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capabilities que você espera aprovar.
- Sobrescritas opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [Android App](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave informada.
- “Smoke do gateway” nos diz se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar essa suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: store de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **somente o store de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: fluxos de replay de raciocínio + chamada de ferramenta do OpenAI Responses/Codex Responses)

### Camada 2: smoke do Gateway + agente dev (o que “@openclaw” realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway em processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (sobrescrita de modelo por execução)
  - Iterar por modelos-com-chave e verificar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (probe de leitura)
    - probes opcionais de ferramenta extra (probe de exec+read)
    - caminhos de regressão OpenAI (somente chamada de ferramenta → continuação) continuam funcionando
- Detalhes dos probes (para que você possa explicar falhas rapidamente):
  - probe `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e devolver o nonce.
  - probe `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário com `exec`, depois lê-lo de volta com `read`.
  - probe de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do gateway usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “OpenRouter para tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Probes de ferramenta + imagem estão sempre ativados neste teste live:
  - probe `read` + probe `exec+read` (stress de ferramenta)
  - o probe de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O gateway analisa os anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário ao modelo
    - Verificação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos do backend vivem na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do Plugin de backend CLI proprietário.
- Sobrescritas opcionais:
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como argumentos da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como argumentos de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar o probe padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina `1` para forçá-lo quando o modelo selecionado suportar um alvo de troca).

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

- O runner Docker está em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados de smoke da CLI a partir da extensão proprietária e depois instala o pacote Linux CLI correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele comprova `claude -p` direto no Docker, depois executa dois turnos do Gateway CLI-backend sem preservar variáveis de ambiente da chave de API da Anthropic. Essa lane de assinatura desabilita por padrão os probes de Claude MCP/tool e de imagem porque o Claude atualmente roteia o uso de app de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live de backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada de ferramenta MCP `cron` verificada pela CLI do gateway.
- O smoke padrão do Claude também aplica patch da sessão de Sonnet para Opus e verifica se a sessão retomada ainda lembra uma nota anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - associar em tempo real uma conversa sintética de canal de mensagem
  - enviar uma continuação normal nessa mesma conversa
  - verificar se a continuação chega à transcrição da sessão ACP associada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP no Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Sobrescritas:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Essa lane usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem exclusivos para admin para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do Plugin `acpx` para o agente harness ACP selecionado.

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

Receitas Docker por agente:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Observações do Docker:

- O runner Docker está em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes CLI live compatíveis em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara o material correspondente de autenticação da CLI no contêiner, instala `acpx` em um prefixo npm gravável e depois instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha variáveis de ambiente do provedor vindas do profile carregado disponíveis para a CLI harness filha.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness do Codex controlado por plugin pelo método
  `agent` normal do gateway:
  - carregar o Plugin `codex` empacotado
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão do OpenClaw e verificar se a
    thread do app-server pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do gateway
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Probe de imagem opcional: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Probe MCP/tool opcional: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness
  Codex quebrado não passe silenciosamente por fallback para PI.
- Autenticação: `OPENAI_API_KEY` do shell/profile, além de `~/.codex/auth.json`
  e `~/.codex/config.toml` copiados opcionalmente

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

Observações do Docker:

- O runner Docker está em `scripts/test-live-codex-harness-docker.sh`.
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação da CLI do Codex quando presentes, instala `@openai/codex` em um prefixo npm gravável montado, prepara a árvore de código-fonte e depois executa apenas o teste live do harness Codex.
- O Docker habilita por padrão os probes de imagem e MCP/tool. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` quando precisar de uma execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, combinando com a configuração do teste live para que fallback para `openai-codex/*` ou PI não possa esconder uma regressão no harness Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos sujeitas a flakiness:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API do Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa o Gemini CLI local na sua máquina (autenticação + particularidades de tooling separadas).
- API Gemini vs Gemini CLI:
  - API: o OpenClaw chama a API Gemini hospedada do Google via HTTP (autenticação por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local; ele tem sua própria autenticação e pode se comportar de forma diferente (streaming/suporte a ferramentas/defasagem de versão).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos da CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de smoke (chamada de ferramenta + imagem)

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

### Base: chamada de ferramenta (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

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

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar o probe de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramentas+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente codificar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o store principal de chaves de perfil)
- Execuções live locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, o `credentials/` legado e diretórios suportados de autenticação de CLI externa para um home temporário de teste; homes live preparados ignoram `workspace/` e `sandboxes/`, e sobrescritas de caminho `agents.*.workspace` / `agentDir` são removidas para que os probes não toquem seu workspace real do host.

Se quiser depender de chaves de env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Sobrescrita opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capability a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro de plugin

## Live de geração de imagem

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera cada Plugin de provedor de geração de imagem registrado
  - Carrega variáveis de ambiente ausentes do provedor a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem por meio da capability compartilhada de runtime:
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
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação por store de perfis e ignorar sobrescritas só de env

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da lane compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação por store de perfis e ignorar sobrescritas só de env

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado empacotado de provedor de geração de vídeo
  - Usa por padrão o caminho de smoke seguro para release: provedores que não são FAL, uma requisição de texto para vídeo por provedor, prompt curto de lagosta de um segundo e um limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo da release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste antigas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local em buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é somente texto e o `kling` empacotado exige uma URL remota de imagem
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa texto para vídeo em `veo3` mais uma lane `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` somente quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a lane compartilhada atual de Gemini/Veo usa entrada local em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a lane compartilhada atual não garante acesso específico de organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação por store de perfis e ignorar sobrescritas só de env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por meio de um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes a partir de `~/.profile`
  - Restringe automaticamente cada suíte por padrão aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, então o comportamento de Heartbeat e modo silencioso permanece consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (verificações opcionais de “funciona em Linux”)

Esses runners Docker se dividem em dois grupos:

- Runners live de modelo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente de chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os runners Docker live usam por padrão um limite menor de smoke para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Sobrescreva essas variáveis de ambiente quando
  quiser explicitamente a varredura maior e exaustiva.
- `test:docker:all` compila uma vez a imagem Docker live por meio de `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker live de modelo também fazem bind-mount apenas dos homes de autenticação CLI necessários (ou de todos os compatíveis quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução para que o OAuth de CLI externa possa atualizar tokens sem modificar o store de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Rede do gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway semeado + ponte stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker live de modelo também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta enquanto ainda executa o Vitest exatamente contra seu código-fonte/configuração local.
A etapa de preparação ignora caches locais grandes e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de saída `.build` de apps ou Gradle, para que execuções live em Docker não passem minutos copiando artifacts específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que probes live do gateway não iniciem
workers reais de canal Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então passe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura
live de gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, entra no sistema via
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de cold start.
Essa lane espera uma chave live de modelo utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções com Docker.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner seeded do Gateway,
inicia um segundo contêiner que executa `openclaw mcp serve` e depois
verifica descoberta de conversa roteada, leitura de transcrição, metadados de anexo,
comportamento de fila de eventos live, roteamento de envio de saída e notificações de
canal + permissão no estilo Claude sobre a ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK cliente específico resolve expor.

Smoke manual ACP de thread em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha esse script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem montagens externas de autenticação CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios/arquivos externos de autenticação CLI sob `$HOME` são montados em modo somente leitura sob `/host-auth...`, depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Sobrescreva manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisem de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do store de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para sobrescrever o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para sobrescrever a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de docs após edições em docs: `pnpm check:docs`.
Execute validação completa de âncoras do Mintlify quando também precisar de verificações de heading na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do gateway (mock OpenAI, loop real de gateway + agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + autenticação aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade do agente”:

- Chamada de ferramenta simulada pelo loop real de gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam a ligação da sessão e os efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda está faltando para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args obrigatórios?
- **Contratos de fluxo de trabalho:** cenários de vários turnos que verificam ordem de ferramentas, persistência de histórico de sessão e boundaries de sandbox.

Evals futuros devem permanecer determinísticos primeiro:

- Um runner de cenários usando provedores simulados para verificar chamadas de ferramenta + ordem, leituras de arquivo de Skill e ligação de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, injeção de prompt).
- Evals live opcionais (opt-in, controlados por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
verificações de formato e comportamento. A lane unit padrão `pnpm test`
ignora intencionalmente esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando tocar em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Somente contratos de canal: `pnpm test:contracts:channels`
- Somente contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capabilities)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Manipulação de mensagem de entrada
- **actions** - Manipuladores de ação do canal
- **threading** - Manipulação de ID de thread
- **directory** - API de diretório/roster
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Formato do registry de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do Plugin SDK
- Após adicionar ou modificar um canal ou Plugin de provedor
- Após refatorar registro ou descoberta de plugin

Os testes de contrato rodam na CI e não exigem chaves reais de API.

## Adicionando regressões (orientação)

Quando você corrigir um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor mock/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (rate limits, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira mirar a menor camada que detecta o bug:
  - bug de conversão/replay de requisição do provedor → teste direto de modelos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste mock seguro para CI do gateway
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe de SecretRef a partir de metadados do registry (`listSecretTargetRegistryEntries()`), depois verifica se ids de exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
