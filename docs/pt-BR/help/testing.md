---
read_when:
    - Executando testes localmente ou no CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando o comportamento do Gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-23T05:39:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 059968e60173b86a101ffc1a24e5d6c2383caaef6b8d037abd7cc7c275a225d3
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

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bastante recurso: `pnpm test:max`
- Loop direto do Vitest em watch: `pnpm test:watch`
- O direcionamento direto por arquivo agora também roteia caminhos de extensão/canal: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com suporte de Docker: `pnpm qa:lab:up`
- Faixa de QA com suporte de VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte live (sondagens de modelos + ferramentas/imagens do Gateway): `pnpm test:live`
- Direcionar um arquivo live em silêncio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se a
  transcrição do assistente armazena `usage.cost` normalizado.

Dica: quando você precisar de apenas um caso com falha, prefira restringir os testes live pelas variáveis de ambiente de allowlist descritas abaixo.

## Executores específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

O CI executa o QA Lab em workflows dedicados. `Parity gate` é executado em PRs correspondentes e
a partir de disparo manual com provedores simulados. `QA-Lab - All Lanes` é executado diariamente em
`main` e a partir de disparo manual com o gate de paridade simulado, a faixa live de Matrix e a
faixa live de Telegram gerenciada por Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas faixas antes da aprovação de release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte do repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers
    isolados de Gateway. `qa-channel` usa concorrência 4 por padrão (limitada pela
    quantidade de cenários selecionados). Use `--concurrency <count>` para ajustar a contagem
    de workers, ou `--concurrency 1` para a faixa serial mais antiga.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor local de provedor com suporte de AIMock para cobertura
    experimental de fixtures e simulação de protocolo sem substituir a
    faixa `mock-openai` orientada por cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux descartável do Multipass.
  - Mantém o mesmo comportamento de seleção de cenários que `qa suite` no host.
  - Reutiliza as mesmas flags de seleção de provedor/modelo que `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA suportadas que são práticas para o guest:
    chaves de provedor por variável de ambiente, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Os diretórios de saída devem permanecer sob a raiz do repositório para que o guest possa gravar de volta
    pelo workspace montado.
  - Grava o relatório + resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte de Docker para trabalho de QA no estilo de operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Gera um tarball npm a partir do checkout atual, instala-o globalmente em
    Docker, executa onboarding não interativo de chave de API do OpenAI, configura Telegram
    por padrão, verifica se a habilitação do plugin instala dependências de tempo de execução sob demanda, executa
    doctor e executa um turno de agente local contra um endpoint OpenAI simulado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma
    faixa de instalação empacotada com Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw em Docker, inicia o Gateway
    com OpenAI configurado e então habilita canais/plugins empacotados por meio de
    edições na configuração.
  - Verifica se a descoberta da configuração deixa ausentes as dependências de tempo de execução do plugin não configurado, se a primeira execução configurada do Gateway ou doctor instala as dependências de tempo de execução de cada plugin empacotado sob demanda, e se uma segunda reinicialização não reinstala dependências que já foram ativadas.
  - Também instala uma baseline npm antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o
    doctor pós-atualização do candidato corrige dependências de tempo de execução de canais empacotados sem um
    reparo pós-install do lado do harness.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor local de provedor AIMock para smoke
    direto de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a faixa live de QA de Matrix contra um homeserver Tuwunel descartável com suporte de Docker.
  - Esse host de QA hoje é apenas para repositório/dev. Instalações empacotadas do OpenClaw não enviam
    `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o executor empacotado diretamente; nenhuma etapa separada de instalação de plugin é necessária.
  - Provisiona três usuários temporários de Matrix (`driver`, `sut`, `observer`) mais uma sala privada, então inicia um processo filho de gateway de QA com o plugin Matrix real como transporte SUT.
  - Usa a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1` por padrão. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar uma imagem diferente.
  - Matrix não expõe flags compartilhadas de origem de credenciais porque a faixa provisiona usuários descartáveis localmente.
  - Grava um relatório de QA de Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a faixa live de QA de Telegram contra um grupo privado real usando os tokens de bot do driver e do SUT vindos do ambiente.
  - Exige `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo por ambiente por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases compartilhados.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Exige dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o modo Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA de Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`.

As faixas de transporte live compartilham um contrato padrão para que novos transportes não desviem:

`qa-channel` continua sendo a suíte ampla de QA sintética e não faz parte da matriz de cobertura de transporte live.

| Faixa    | Canary | Controle por menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Continuação de thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ------------------- | ------------------ | -------------------------- | ---------------------- | --------------------- | ------------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x                  | x                          | x                      | x                     | x                   | x                    |              |
| Telegram | x      |                     |                    |                            |                        |                       |                     |                      | x            |

### Credenciais compartilhadas de Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte de Convex, envia Heartbeat
desse lease enquanto a faixa está em execução e libera o lease no encerramento.

Estrutura de projeto Convex de referência:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um segredo para o papel selecionado:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção do papel de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por ambiente: `OPENCLAW_QA_CREDENTIAL_ROLE` (o padrão é `ci` no CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Comandos administrativos de mantenedor (adicionar/remover/listar pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para mantenedores:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Use `--json` para saída legível por máquina em scripts e utilitários de CI.

Contrato de endpoint padrão (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Solicitação: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Sucesso: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Solicitação: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente segredo de mantenedor)
  - Solicitação: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente segredo de mantenedor)
  - Solicitação: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente segredo de mantenedor)
  - Solicitação: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string de id numérico de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionando um canal ao QA

Adicionar um canal ao sistema de QA em Markdown exige exatamente duas coisas:

1. Um adaptador de transporte para o canal.
2. Um pacote de cenários que exercite o contrato do canal.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
assumir o fluxo.

`qa-lab` é responsável pela mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e teardown da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Os plugins de runner são responsáveis pelo contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcrições e o estado normalizado do transporte são expostos
- como ações com suporte do transporte são executadas
- como o reset ou a limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo canal é:

1. Manter `qa-lab` como o proprietário da raiz compartilhada `qa`.
2. Implementar o runner de transporte na seam de host compartilhada `qa-lab`.
3. Manter a mecânica específica do transporte dentro do plugin de runner ou do harness do canal.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array `qaRunnerCliRegistrations` correspondente de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; a execução lazy de CLI e runner deve ficar atrás de entrypoints separados.
5. Criar ou adaptar cenários Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenário para novos cenários.
7. Manter aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é rígida:

- Se um comportamento puder ser expresso uma vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um transporte de canal, mantenha-o nesse plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um canal possa usar, adicione um helper genérico em vez de um branch específico de canal em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico desse transporte e deixe isso explícito no contrato do cenário.

Nomes preferidos de helpers genéricos para novos cenários:

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

Novos trabalhos de canal devem usar os nomes genéricos de helpers.
Os aliases de compatibilidade existem para evitar uma migração em dia único, não como modelo para
criação de novos cenários.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e aumento de instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest com escopo existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node de `ui` permitidos cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração em processo (autenticação do Gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda no CI
  - Não exige chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações menores de shard (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto-raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que trabalho de auto-reply/extensões prejudique suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projeto-raiz nativo `vitest.config.ts`, porque um loop watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam primeiro alvos explícitos de arquivo/diretório por faixas com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto-raiz.
  - `pnpm test:changed` expande caminhos Git alterados para as mesmas faixas com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de config/setup ainda recorrem à reexecução ampla do projeto-raiz.
  - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes core, extensões, testes de extensão, apps, docs, metadados de release e tooling, então executa as faixas correspondentes de typecheck/lint/teste. Mudanças no SDK público de Plugin e no contrato de plugin incluem validação de extensão porque extensões dependem desses contratos core. Bumps de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependências da raiz em vez da suíte completa, com uma proteção que rejeita mudanças de pacote fora do campo de versão de nível superior.
  - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas utilitárias puras semelhantes são roteados pela faixa `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com estado/tempo de execução pesado permanecem nas faixas existentes.
  - Arquivos-fonte auxiliares selecionados de `plugin-sdk` e `commands` também mapeiam execuções no modo changed para testes irmãos explícitos nessas faixas leves, então edições em helpers evitam rerodar a suíte pesada completa desse diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre runner embutido:
  - Quando você altera entradas de descoberta de ferramentas de mensagem ou contexto de tempo de execução de Compaction,
    mantenha os dois níveis de cobertura.
  - Adicione regressões focadas de helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do runner embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam se ids com escopo e o comportamento de compaction ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helpers não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado nos projetos-raiz, nas configs e2e e live.
  - A faixa UI da raiz mantém sua configuração `jsdom` e otimizador, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos Node filhos do Vitest para reduzir churn de compilação do V8 em grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm changed:lanes` mostra quais faixas arquiteturais um diff aciona.
  - O hook de pre-commit executa `pnpm check:changed --staged` após formatação/lint dos arquivos staged, então commits somente de core não pagam o custo de testes de extensão a menos que toquem contratos públicos voltados a extensões. Commits apenas de metadados de release ficam na faixa direcionada de versão/config/dependências da raiz.
  - Se o conjunto exato de mudanças staged já foi validado com gates equivalentes ou mais fortes, use `scripts/committer --fast "<message>" <files...>` para pular apenas a reexecução do hook de escopo alterado. A formatação/lint staged ainda roda. Mencione os gates concluídos no seu handoff. Isso também é aceitável após uma falha isolada e intermitente do hook ser reexecutada e passar com prova com escopo.
  - `pnpm test:changed` roteia por faixas com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também recua quando a média de carga do host já está alta, então várias execuções concorrentes do Vitest causam menos dano por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers` para que reexecuções no modo changed permaneçam corretas quando a infraestrutura de testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de desempenho:
  - `pnpm test:perf:imports` habilita relatório de duração de importação do Vitest mais saída de detalhamento de importação.
  - `pnpm test:perf:imports:changed` aplica o mesmo profiling com escopo aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto-raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore atual modificada roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração-raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unitária com paralelismo por arquivo desativado.

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçado para um worker
- Escopo:
  - Inicia um Gateway local loopback real com diagnósticos habilitados por padrão
  - Dirige churn sintético de mensagens, memória e payload grande do gateway pelo caminho de evento de diagnóstico
  - Consulta `diagnostics.stability` pelo WS RPC do Gateway
  - Cobre helpers de persistência do pacote de estabilidade de diagnóstico
  - Garante que o gravador permaneça limitado, que amostras sintéticas de RSS fiquem abaixo do orçamento de pressão e que profundidades de fila por sessão retornem a zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Faixa estreita para acompanhamento de regressão de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de tempo de execução:
  - Usa Vitest `threads` com `isolate: false`, acompanhando o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir overhead de E/S de console.
- Overrides úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada de console.
- Escopo:
  - Comportamento end-to-end de Gateway com múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de Node e rede mais pesada
- Expectativas:
  - Roda no CI (quando habilitado no pipeline)
  - Não exige chaves reais
  - Mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` real + execução SSH
  - Verifica o comportamento canônico de filesystem remoto pela bridge fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Exige um CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o gateway e sandbox de teste
- Overrides úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Captura mudanças de formato do provedor, particularidades de chamada de ferramenta, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável para CI por design (redes reais, políticas reais de provedor, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live usam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/autenticação para um diretório home de teste temporário, para que fixtures unitários não alterem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando precisar intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas oculta o aviso extra sobre `~/.profile` e silencia logs de bootstrap do gateway/ruído de Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de inicialização de volta.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` em formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou faça override por live com `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - Suítes live agora emitem linhas de progresso para stderr para que chamadas longas de provedor permaneçam visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/gateway fluam imediatamente durante execuções live.
  - Ajuste os Heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste os Heartbeats de gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou bastante coisa)
- Alterando rede do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capacidade de Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando atualmente anunciado** por um Node Android conectado e validar o comportamento do contrato do comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/faz pareamento do app).
  - Validação `node.invoke` do gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Overrides opcionais de destino:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” informa se o provedor/modelo consegue responder com a chave fornecida.
- “Smoke do Gateway” informa se o pipeline completo gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar os modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar essa suíte; caso contrário, ela é ignorada para manter `pnpm test:live` focado no smoke do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgula)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgula)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks por variável de ambiente
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas o armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio de OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: smoke do Gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway em processo
  - Criar/aplicar patch em uma sessão `agent:dev:*` (override de modelo por execução)
  - Iterar pelos modelos com chaves e garantir:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas extras opcionais de ferramenta (sonda de exec+read)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → continuação) continuam funcionando
- Detalhes da sonda (para que você consiga explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente que faça `read` nele e ecoe o nonce de volta.
  - sonda `exec+read`: o teste pede ao agente que use `exec` para gravar um nonce em um arquivo temporário e depois faça `read` nele.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modernas/all do gateway usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evitar “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- As sondas de ferramenta + imagem estão sempre ativadas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia isso via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway faz parsing dos anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal de usuário para o modelo
    - Garantia: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você consegue testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outros CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agente usando um backend CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos do backend ficam na definição `cli-backend.ts` da extensão proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` ao invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do plugin proprietário do backend CLI.
- Overrides (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args de CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
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

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live de backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve metadados de smoke de CLI a partir da extensão proprietária e então instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` exige OAuth portátil de assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker, depois executa dois turnos do Gateway CLI-backend sem preservar variáveis de ambiente de chave de API da Anthropic. Essa faixa de assinatura desabilita por padrão as sondas Claude MCP/tool e de imagem porque o Claude atualmente roteia uso de aplicativos de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live de backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem e depois chamada de ferramenta MCP `cron` verificada pelo gateway CLI.
- O smoke padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma anotação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular em lugar uma conversa sintética de canal de mensagens
  - enviar um follow-up normal nessa mesma conversa
  - verificar se o follow-up chega na transcrição da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP em Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Observações:
  - Essa faixa usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem apenas para admin para que os testes possam anexar contexto de canal de mensagens sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agentes do plugin `acpx` para o agente de harness ACP selecionado.

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

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes CLI live suportados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele usa `~/.profile`, prepara o material de autenticação CLI correspondente dentro do contêiner, instala `acpx` em um prefixo npm gravável e então instala o CLI live solicitado (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para o harness CLI filho as variáveis de ambiente do provedor vindas do profile carregado.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness do Codex pertencente ao plugin pelo método
  `agent` normal do gateway:
  - carregar o plugin `codex` empacotado
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno de agente do gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a
    thread do app-server pode ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando do gateway
  - opcionalmente executar duas sondas escaladas de shell revisadas pelo Guardian: um comando benigno
    que deve ser aprovado e um upload de segredo falso que deve ser
    negado para que o agente peça confirmação
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional MCP/ferramenta: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda opcional Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não passe silenciosamente por fallback para PI.
- Autenticação: `OPENAI_API_KEY` do shell/profile, além de opcionais
  `~/.codex/auth.json` e `~/.codex/config.toml` copiados

Receita local:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1 \
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
- Ele usa o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de autenticação do CLI Codex
  quando presentes, instala `@openai/codex` em um prefixo npm montado e gravável,
  prepara a árvore-fonte e então executa apenas o teste live do harness Codex.
- O Docker habilita por padrão as sondas de imagem, MCP/ferramenta e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma
  execução de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, alinhado com a configuração do teste live para que fallback para `openai-codex/*` ou PI não esconda uma regressão no harness Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco no Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa o Gemini CLI local na sua máquina (autenticação separada + particularidades de tooling).
- API Gemini vs Gemini CLI:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (autenticação por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem autenticação própria e pode se comportar de forma diferente (streaming/suporte a ferramentas/diferenças de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (chamada de ferramenta + imagem)

Essa é a execução de “modelos comuns” que esperamos manter funcionando:

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
- LM Studio: `lmstudio/`… (local; a chamada de ferramenta depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com suporte a imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes com visão de Claude/Gemini/OpenAI etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com suporte a ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Embutidos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “profile keys” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não para o armazenamento principal de chaves de perfil)
- Execuções locais live copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, o diretório legado `credentials/` e diretórios externos de autenticação de CLI compatíveis para um home de teste temporário; homes live preparados ignoram `workspace/` e `sandboxes/`, e overrides de caminho `agents.*.workspace` / `agentDir` são removidos para que as sondas não toquem seu workspace real do host.

Se quiser depender de chaves por ambiente (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile` ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live Deepgram (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## Live BytePlus coding plan

- Teste: `src/agents/byteplus.live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow do ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos de imagem, vídeo e `music_generate` do comfy empacotado
  - Ignora cada capacidade a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow do comfy, polling, downloads ou registro do plugin

## Live de geração de imagem

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todo plugin de provedor de geração de imagem registrado
  - Carrega variáveis de ambiente ausentes do provedor a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem pela capacidade compartilhada de tempo de execução:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados atualmente cobertos:
  - `openai`
  - `google`
  - `xai`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar overrides apenas por ambiente

## Live de geração de música

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado de provedor empacotado de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa ambos os modos declarados de tempo de execução quando disponíveis:
    - `generate` com entrada apenas por prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar overrides apenas por ambiente

## Live de geração de vídeo

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado de provedor empacotado de geração de vídeo
  - Usa por padrão o caminho smoke seguro para release: provedores que não são FAL, uma solicitação de texto para vídeo por provedor, prompt de lagosta de um segundo e um limite de operação por provedor vindo de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila do lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente do provedor a partir do seu shell de login (`~/.profile`) antes das sondas
  - Usa chaves de API live/env antes dos perfis de autenticação armazenados por padrão, para que chaves de teste antigas em `auth-profiles.json` não ocultem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada de imagem local com buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada de vídeo local com buffer na varredura compartilhada
  - Provedores atuais de `imageToVideo` declarados, mas ignorados, na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é apenas texto e o `kling` empacotado exige uma URL remota de imagem
  - Cobertura específica de provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` texto para vídeo mais uma faixa `kling` que usa por padrão uma fixture de URL remota de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` apenas quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atuais de `videoToVideo` declarados, mas ignorados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a faixa compartilhada atual de Gemini/Veo usa entrada local com buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não garante acesso específico da organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todo provedor na varredura padrão, incluindo FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar overrides apenas por ambiente

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Objetivo:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente ausentes do provedor a partir de `~/.profile`
  - Restringe automaticamente cada suíte por padrão aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Executores Docker (verificações opcionais de "funciona no Linux")

Esses executores Docker se dividem em dois grupos:

- Executores live de modelo: `test:docker:live-models` e `test:docker:live-gateway` executam apenas o arquivo live correspondente de chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Executores live Docker usam por padrão um limite smoke menor para que uma varredura Docker completa continue prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` cria a imagem Docker live uma vez por `test:docker:live-build`, depois a reutiliza nas duas faixas live Docker. Também cria uma imagem compartilhada `scripts/e2e/Dockerfile` por `test:docker:e2e-build` e a reutiliza nos executores smoke E2E em contêiner que exercitam o app construído.
- Executores smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os executores Docker live de modelo também montam por bind apenas os homes de autenticação CLI necessários (ou todos os suportados quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução para que o OAuth da CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/canal/agente com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente em Docker o tarball empacotado do OpenClaw, configura OpenAI por meio de onboarding por referência de env mais Telegram por padrão, verifica se a habilitação do plugin instala suas dependências de tempo de execução sob demanda, executa doctor e roda um turno simulado de agente OpenAI. Reutilize um tarball pré-construído com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, pule a reconstrução no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o canal com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Rede do Gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway preparado + ponte stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do pacote Pi (servidor MCP stdio real + smoke de allow/deny de perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza de MCP Cron/subagent (Gateway real + teardown de processo filho MCP stdio após execuções isoladas de cron e subagent de execução única): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke de atualização de plugin sem mudanças: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarga de configuração: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de tempo de execução de plugins empacotados: `pnpm test:docker:bundled-channel-deps` cria por padrão uma imagem pequena de runner Docker, constrói e empacota o OpenClaw uma vez no host e depois monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, pule a reconstrução no host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restrinja as dependências de tempo de execução de plugins empacotados durante iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-construir e reutilizar manualmente a imagem compartilhada do app construído:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Overrides de imagem específicos de suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda prevalecem quando definidos. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ainda não estiver localmente. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do tempo de execução compartilhado do app construído.

Os executores Docker live de modelo também montam por bind o checkout atual em modo somente leitura e
o preparam em um diretório de trabalho temporário dentro do contêiner. Isso mantém a
imagem de tempo de execução enxuta, ao mesmo tempo em que ainda executa o Vitest contra seu código/configuração local exato.
A etapa de preparação ignora caches grandes apenas locais e saídas de build de app como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` de app ou
saída do Gradle para que execuções live em Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que as sondas live do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir a cobertura
live do gateway dessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner do Gateway OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner fixado do Open WebUI contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker talvez precise baixar a
imagem do Open WebUI e o Open WebUI talvez precise concluir sua própria configuração de inicialização a frio.
Essa faixa espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções em Docker.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner
de Gateway preparado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexo,
comportamento da fila de eventos live, roteamento de envio de saída e notificações de canal +
permissão no estilo Claude pela ponte stdio MCP real. A verificação de notificação
inspeciona diretamente os frames MCP brutos de stdio para que o smoke valide o que a
ponte realmente emite, não apenas o que um SDK cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de
modelo live. Ele constrói a imagem Docker do repositório, inicia um servidor sonda MCP stdio real
dentro do contêiner, materializa esse servidor pelo tempo de execução MCP do pacote Pi embutido,
executa a ferramenta e então verifica que `coding` e `messaging` mantêm
ferramentas `bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo
live. Ele inicia um Gateway preparado com um servidor sonda MCP stdio real, executa um
turno isolado de Cron e um turno filho de execução única `/subagents spawn`, e então verifica
que o processo filho MCP é encerrado após cada execução.

Smoke manual ACP em thread com linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode voltar a ser necessário para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts externos de autenticação CLI
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos de autenticação CLI externos em `$HOME` são montados em modo somente leitura em `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Faça override manual com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas, como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reexecuções que não precisem de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Validação de documentação

Execute verificações de docs após editar documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar headings na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do gateway (OpenAI simulado, gateway real + loop de agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava configuração + autenticação obrigatória): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Chamada simulada de ferramenta pelo loop real de gateway + agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills são listadas no prompt, o agente escolhe a skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue as etapas/args obrigatórios?
- **Contratos de fluxo de trabalho:** cenários com vários turnos que garantem ordem de ferramentas, continuidade do histórico da sessão e limites do sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores simulados para garantir chamadas de ferramenta + ordem, leituras de arquivo de skill e wiring de sessão.
- Uma pequena suíte de cenários focados em skill (usar vs evitar, controles, injeção de prompt).
- Avaliações live opcionais (opt-in, controladas por ambiente) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e canal)

Os testes de contrato verificam se todo plugin e canal registrados estão em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam um conjunto de
garantias de formato e comportamento. A faixa unitária padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute explicitamente
os comandos de contrato quando tocar superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura de payload de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Manipuladores de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do canal
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Tempo de execução do provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exportações ou subcaminhos do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugin

Os testes de contrato rodam no CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor simulado/stub ou capture a transformação exata do formato da solicitação)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira mirar a menor camada que capture o bug:
  - bug de conversão/replay de solicitação do provedor → teste direto de modelos
  - bug de pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste simulado seguro para CI do gateway
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um destino amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), então garante que ids de execução de segmento de travessia sejam rejeitados.
  - Se você adicionar uma nova família de destino SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de destino não classificados para que novas classes não possam ser ignoradas silenciosamente.
