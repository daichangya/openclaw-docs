---
read_when:
    - Executar testes localmente ou no CI
    - Adicionar regressões para bugs de modelo/provedor
    - Depurar o comportamento do Gateway + agent
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Teste
x-i18n:
    generated_at: "2026-04-23T14:55:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: fbec4996699577321116c94f60c01d205d7594ed41aca27c821f1c3d65a7dca3
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes do Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos de trabalho comuns (local, antes de dar push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de dar push): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina com bastante recurso: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto por arquivo agora também encaminha caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Prefira execuções direcionadas primeiro quando estiver iterando sobre uma única falha.
- Site de QA com suporte a Docker: `pnpm qa:lab:up`
- Lane de QA com suporte a VM Linux: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Quando você altera testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (modelos + sondas de ferramenta/imagem do Gateway): `pnpm test:live`
- Direcione um arquivo live em silêncio: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Varredura live de modelos em Docker: `pnpm test:docker:live-models`
  - Cada modelo selecionado agora executa um turno de texto mais uma pequena sonda no estilo leitura de arquivo.
    Modelos cujos metadados anunciam entrada `image` também executam um pequeno turno de imagem.
    Desative as sondas extras com `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` ou
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0` ao isolar falhas do provedor.
  - Cobertura no CI: as rotinas diárias `OpenClaw Scheduled Live And E2E Checks` e a manual
    `OpenClaw Release Checks` chamam ambas o workflow reutilizável de live/E2E com
    `include_live_suites: true`, que inclui jobs separados da matriz de modelos live em Docker
    fragmentados por provedor.
  - Para reruns focados no CI, dispare `OpenClaw Live And E2E Checks (Reusable)`
    com `include_live_suites: true` e `live_models_only: true`.
  - Adicione novos secrets de provedor de alto sinal a `scripts/ci-hydrate-live-auth.sh`
    além de `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` e seus
    chamadores de rotina agendada/release.
- Smoke de custo Moonshot/Kimi: com `MOONSHOT_API_KEY` definido, execute
  `openclaw models list --provider moonshot --json`, depois execute um
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  isolado contra `moonshot/kimi-k2.6`. Verifique se o JSON informa Moonshot/K2.6 e se o
  transcript do assistente armazena `usage.cost` normalizado.

Dica: quando você só precisa de um caso com falha, prefira restringir os testes live por meio das variáveis de ambiente de allowlist descritas abaixo.

## Runners específicos de QA

Esses comandos ficam ao lado das suítes principais de teste quando você precisa do realismo do qa-lab:

O CI executa o QA Lab em workflows dedicados. `Parity gate` roda em PRs correspondentes e
a partir de acionamento manual com provedores mockados. `QA-Lab - All Lanes` roda à noite na
`main` e a partir de acionamento manual com o gate de paridade mockado, a lane live do Matrix e a
lane live do Telegram gerenciada pelo Convex como jobs paralelos. `OpenClaw Release Checks`
executa as mesmas lanes antes da aprovação do release.

- `pnpm openclaw qa suite`
  - Executa cenários de QA com suporte ao repositório diretamente no host.
  - Executa vários cenários selecionados em paralelo por padrão com workers do
    Gateway isolados. `qa-channel` usa concorrência 4 por padrão (limitada pela
    contagem de cenários selecionados). Use `--concurrency <count>` para ajustar a
    quantidade de workers, ou `--concurrency 1` para a antiga lane serial.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Oferece suporte aos modos de provedor `live-frontier`, `mock-openai` e `aimock`.
    `aimock` inicia um servidor de provedor local com suporte a AIMock para cobertura experimental
    de fixtures e mocks de protocolo sem substituir a lane `mock-openai` orientada por cenários.
- `pnpm openclaw qa suite --runner multipass`
  - Executa a mesma suíte de QA dentro de uma VM Linux Multipass descartável.
  - Mantém o mesmo comportamento de seleção de cenários de `qa suite` no host.
  - Reutiliza os mesmos sinalizadores de seleção de provedor/modelo de `qa suite`.
  - Execuções live encaminham as entradas de autenticação de QA com suporte que são práticas para o guest:
    chaves de provedor baseadas em env, o caminho de configuração do provedor live de QA e `CODEX_HOME`
    quando presente.
  - Os diretórios de saída precisam permanecer sob a raiz do repositório para que o guest possa gravar de volta por meio
    do workspace montado.
  - Grava o relatório e resumo normais de QA, além dos logs do Multipass, em
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Inicia o site de QA com suporte a Docker para trabalho de QA no estilo operador.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Gera um tarball npm a partir do checkout atual, instala-o globalmente em
    Docker, executa o onboarding não interativo com chave de API OpenAI, configura Telegram
    por padrão, verifica se habilitar o plugin instala dependências de runtime sob demanda,
    executa doctor e roda um turno de agent local contra um endpoint OpenAI mockado.
  - Use `OPENCLAW_NPM_ONBOARD_CHANNEL=discord` para executar a mesma lane de instalação empacotada
    com Discord.
- `pnpm test:docker:bundled-channel-deps`
  - Empacota e instala a build atual do OpenClaw em Docker, inicia o Gateway
    com OpenAI configurado, então habilita channels/plugins empacotados por meio de
    edições de configuração.
  - Verifica se a descoberta de setup mantém ausentes as dependências de runtime de plugins não configurados,
    se a primeira execução configurada do Gateway ou do doctor instala sob demanda as dependências de runtime
    de cada plugin empacotado e se um segundo reinício não reinstala dependências
    que já haviam sido ativadas.
  - Também instala uma baseline npm antiga conhecida, habilita Telegram antes de executar
    `openclaw update --tag <candidate>` e verifica se o doctor pós-atualização do
    candidato repara dependências de runtime de channels empacotados sem um reparo de postinstall
    do lado do harness.
- `pnpm openclaw qa aimock`
  - Inicia apenas o servidor de provedor AIMock local para smoke tests diretos de protocolo.
- `pnpm openclaw qa matrix`
  - Executa a lane de QA live do Matrix contra um homeserver Tuwunel descartável com suporte a Docker.
  - Este host de QA é apenas para repositório/desenvolvimento hoje. Instalações empacotadas do OpenClaw não incluem
    `qa-lab`, então não expõem `openclaw qa`.
  - Checkouts do repositório carregam o runner empacotado diretamente; não é necessário
    um passo separado de instalação do plugin.
  - Provisiona três usuários temporários do Matrix (`driver`, `sut`, `observer`) mais uma sala privada, depois inicia um processo filho de Gateway de QA com o plugin real do Matrix como transporte SUT.
  - Usa por padrão a imagem estável fixada do Tuwunel `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Substitua com `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` quando precisar testar outra imagem.
  - O Matrix não expõe sinalizadores compartilhados de fonte de credenciais porque a lane provisiona usuários descartáveis localmente.
  - Grava um relatório de QA do Matrix, resumo, artefato de eventos observados e log combinado de stdout/stderr em `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Executa a lane de QA live do Telegram contra um grupo privado real usando os tokens dos bots driver e SUT a partir do env.
  - Requer `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` e `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. O id do grupo deve ser o id numérico do chat do Telegram.
  - Oferece suporte a `--credential-source convex` para credenciais compartilhadas em pool. Use o modo env por padrão, ou defina `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` para optar por leases em pool.
  - Sai com código diferente de zero quando qualquer cenário falha. Use `--allow-failures` quando
    quiser artefatos sem um código de saída de falha.
  - Requer dois bots distintos no mesmo grupo privado, com o bot SUT expondo um nome de usuário do Telegram.
  - Para observação estável de bot para bot, habilite o modo Bot-to-Bot Communication Mode no `@BotFather` para ambos os bots e garanta que o bot driver possa observar o tráfego de bots no grupo.
  - Grava um relatório de QA do Telegram, resumo e artefato de mensagens observadas em `.artifacts/qa-e2e/...`. Cenários com resposta incluem RTT desde a requisição de envio do driver até a resposta observada do SUT.

As lanes de transporte live compartilham um contrato padrão para que novos transportes não se desviem:

`qa-channel` continua sendo a ampla suíte sintética de QA e não faz parte da matriz de cobertura de transporte live.

| Lane     | Canary | Bloqueio por menção | Bloco de allowlist | Resposta de nível superior | Retomada após reinício | Continuação na thread | Isolamento de thread | Observação de reação | Comando help |
| -------- | ------ | ------------------- | ------------------ | -------------------------- | ---------------------- | --------------------- | -------------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x                  | x                          | x                      | x                     | x                    | x                    |              |
| Telegram | x      |                     |                    |                            |                        |                       |                      |                      | x            |

### Credenciais compartilhadas do Telegram via Convex (v1)

Quando `--credential-source convex` (ou `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) está habilitado para
`openclaw qa telegram`, o QA lab adquire um lease exclusivo de um pool com suporte a Convex, envia Heartbeat
desse lease enquanto a lane está em execução e libera o lease ao encerrar.

Estrutura de referência do projeto Convex:

- `qa/convex-credential-broker/`

Variáveis de ambiente obrigatórias:

- `OPENCLAW_QA_CONVEX_SITE_URL` (por exemplo `https://your-deployment.convex.site`)
- Um secret para a função selecionada:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` para `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` para `ci`
- Seleção da função de credencial:
  - CLI: `--credential-role maintainer|ci`
  - Padrão por env: `OPENCLAW_QA_CREDENTIAL_ROLE` (usa `ci` por padrão no CI, `maintainer` caso contrário)

Variáveis de ambiente opcionais:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (padrão `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (padrão `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (padrão `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (padrão `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (padrão `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (id de rastreamento opcional)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` permite URLs Convex `http://` de loopback apenas para desenvolvimento local.

`OPENCLAW_QA_CONVEX_SITE_URL` deve usar `https://` em operação normal.

Os comandos administrativos do maintainer (adicionar/remover/listar pool) exigem
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` especificamente.

Helpers de CLI para maintainers:

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
  - Esgotado/tentável novamente: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /release`
  - Requisição: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Sucesso: `{ status: "ok" }` (ou `2xx` vazio)
- `POST /admin/add` (somente secret de maintainer)
  - Requisição: `{ kind, actorId, payload, note?, status? }`
  - Sucesso: `{ status: "ok", credential }`
- `POST /admin/remove` (somente secret de maintainer)
  - Requisição: `{ credentialId, actorId }`
  - Sucesso: `{ status: "ok", changed, credential }`
  - Proteção de lease ativo: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (somente secret de maintainer)
  - Requisição: `{ kind?, status?, includePayload?, limit? }`
  - Sucesso: `{ status: "ok", credentials, count }`

Formato de payload para o tipo Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` deve ser uma string numérica de id de chat do Telegram.
- `admin/add` valida esse formato para `kind: "telegram"` e rejeita payloads malformados.

### Adicionar um channel ao QA

Adicionar um channel ao sistema de QA em Markdown requer exatamente duas coisas:

1. Um adaptador de transporte para o channel.
2. Um pacote de cenários que exercite o contrato do channel.

Não adicione uma nova raiz de comando de QA de nível superior quando o host compartilhado `qa-lab` puder
ser dono do fluxo.

`qa-lab` é dono da mecânica compartilhada do host:

- a raiz de comando `openclaw qa`
- inicialização e encerramento da suíte
- concorrência de workers
- gravação de artefatos
- geração de relatórios
- execução de cenários
- aliases de compatibilidade para cenários antigos de `qa-channel`

Os plugins de runner são donos do contrato de transporte:

- como `openclaw qa <runner>` é montado sob a raiz compartilhada `qa`
- como o Gateway é configurado para esse transporte
- como a prontidão é verificada
- como eventos de entrada são injetados
- como mensagens de saída são observadas
- como transcripts e o estado normalizado do transporte são expostos
- como ações com suporte do transporte são executadas
- como reset ou limpeza específicos do transporte são tratados

A barra mínima de adoção para um novo channel é:

1. Manter `qa-lab` como dono da raiz compartilhada `qa`.
2. Implementar o runner de transporte na interface compartilhada de host `qa-lab`.
3. Manter a mecânica específica do transporte dentro do plugin de runner ou do harness do channel.
4. Montar o runner como `openclaw qa <runner>` em vez de registrar uma raiz de comando concorrente.
   Os plugins de runner devem declarar `qaRunners` em `openclaw.plugin.json` e exportar um array correspondente `qaRunnerCliRegistrations` de `runtime-api.ts`.
   Mantenha `runtime-api.ts` leve; CLI lazy e execução do runner devem ficar atrás de entrypoints separados.
5. Criar ou adaptar cenários em Markdown nos diretórios temáticos `qa/scenarios/`.
6. Usar os helpers genéricos de cenários para novos cenários.
7. Manter os aliases de compatibilidade existentes funcionando, a menos que o repositório esteja fazendo uma migração intencional.

A regra de decisão é rígida:

- Se um comportamento puder ser expresso uma única vez em `qa-lab`, coloque-o em `qa-lab`.
- Se um comportamento depender de um transporte de channel, mantenha-o nesse plugin de runner ou harness de plugin.
- Se um cenário precisar de uma nova capacidade que mais de um channel possa usar, adicione um helper genérico em vez de um branch específico de channel em `suite.ts`.
- Se um comportamento só fizer sentido para um transporte, mantenha o cenário específico do transporte e deixe isso explícito no contrato do cenário.

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

Os aliases de compatibilidade continuam disponíveis para cenários existentes, incluindo:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

O trabalho em novos channels deve usar os nomes genéricos de helper.
Os aliases de compatibilidade existem para evitar uma migração em flag day, não como modelo para
a criação de novos cenários.

## Suítes de teste (o que executa onde)

Pense nas suítes como “realismo crescente” (e aumento de instabilidade/custo):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: execuções sem alvo usam o conjunto de shards `vitest.full-*.config.ts` e podem expandir shards de múltiplos projetos em configurações por projeto para agendamento paralelo
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes Node com allowlist em `ui` cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (auth do Gateway, roteamento, ferramentas, parsing, config)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Executa no CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa doze configurações de shard menores (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo nativo gigante de projeto raiz. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extensions prejudique suítes não relacionadas.
  - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz em `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` encaminham primeiro alvos explícitos de arquivo/diretório por lanes com escopo, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo total de inicialização do projeto raiz.
  - `pnpm test:changed` expande caminhos git alterados nas mesmas lanes com escopo quando o diff toca apenas arquivos de origem/teste roteáveis; edições de config/setup ainda voltam para a reexecução ampla do projeto raiz.
  - `pnpm check:changed` é o gate local inteligente normal para trabalho estreito. Ele classifica o diff em core, testes do core, extensions, testes de extension, apps, docs, metadados de release e tooling, então executa as lanes correspondentes de typecheck/lint/test. Alterações no SDK público de Plugin e no contrato de plugin incluem validação de extensions porque extensions dependem desses contratos do core. Aumentos de versão apenas em metadados de release executam verificações direcionadas de versão/config/dependências raiz em vez da suíte completa, com uma proteção que rejeita alterações de pacote fora do campo de versão de nível superior.
  - Testes unitários leves de importação de agents, commands, plugins, helpers de auto-reply, `plugin-sdk` e áreas semelhantes de utilidades puras passam pela lane `unit-fast`, que ignora `test/setup-openclaw-runtime.ts`; arquivos com muito estado/runtime permanecem nas lanes existentes.
  - Arquivos helper de origem selecionados de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas lanes leves, para que edições em helpers evitem rerodar a suíte pesada completa daquele diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers do core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre runner embutido:
  - Ao alterar entradas de descoberta de ferramentas de mensagem ou o contexto de runtime de Compaction,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões de helper focadas para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do runner embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids com escopo e o comportamento de Compaction ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado em todos os projetos da raiz, nas configurações e2e e live.
  - A lane UI da raiz mantém sua configuração e otimizador `jsdom`, mas agora também roda no runner compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir a rotatividade de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm changed:lanes` mostra quais lanes arquiteturais um diff aciona.
  - O hook de pre-commit executa `pnpm check:changed --staged` após format/lint dos arquivos staged, então commits apenas de core não pagam o custo de testes de extension, a menos que toquem contratos públicos voltados a extensions. Commits apenas de metadados de release ficam na lane direcionada de versão/config/dependências raiz.
  - Se o conjunto exato de alterações staged já foi validado com gates equivalentes ou mais fortes, use `scripts/committer --fast "<message>" <files...>` para pular apenas a rerun do hook com escopo changed. Format/lint dos arquivos staged ainda executam. Mencione os gates concluídos no seu handoff. Isso também é aceitável depois que uma falha isolada e instável do hook é rerodada e passa com prova de escopo.
  - `pnpm test:changed` encaminha por lanes com escopo quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também reduz quando a média de carga do host já está alta, então várias execuções concorrentes do Vitest causam menos impacto por padrão.
  - A configuração base do Vitest marca os arquivos de projetos/config como `forceRerunTriggers`, para que reruns no modo changed permaneçam corretos quando o wiring de testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` habilitado em hosts com suporte; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` habilita relatórios de duração de importação do Vitest mais a saída de detalhamento de importação.
  - `pnpm test:perf:imports:changed` limita a mesma visualização de profiling aos arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore atual suja roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para overhead de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo por arquivo desabilitado.

### Estabilidade (Gateway)

- Comando: `pnpm test:stability:gateway`
- Configuração: `vitest.gateway.config.ts`, forçada para um worker
- Escopo:
  - Inicia um Gateway loopback real com diagnósticos habilitados por padrão
  - Envia rotatividade sintética de mensagens do gateway, memória e payload grande pelo caminho de evento de diagnóstico
  - Consulta `diagnostics.stability` via WS RPC do Gateway
  - Cobre helpers de persistência do bundle de estabilidade de diagnóstico
  - Garante que o recorder permaneça limitado, que amostras sintéticas de RSS fiquem abaixo do orçamento de pressão e que as profundidades de fila por sessão drenem de volta para zero
- Expectativas:
  - Seguro para CI e sem chaves
  - Lane estreita para acompanhamento de regressões de estabilidade, não um substituto para a suíte completa do Gateway

### E2E (smoke do Gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` e testes E2E de plugins empacotados em `extensions/`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, em linha com o restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Executa em modo silencioso por padrão para reduzir o overhead de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reabilitar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end de múltiplas instâncias do Gateway
  - Superfícies WebSocket/HTTP, emparelhamento de Node e rede mais pesada
- Expectativas:
  - Executa no CI (quando habilitado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `extensions/openshell/src/backend.e2e.test.ts`
- Escopo:
  - Inicia um Gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw por meio de `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento canônico remoto do sistema de arquivos por meio da bridge fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI local `openshell` e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, então destrói o Gateway de teste e o sandbox
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para habilitar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` e testes live de plugins empacotados em `extensions/`
- Padrão: **habilitado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Este provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças de formato do provedor, peculiaridades de chamada de ferramenta, problemas de auth e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um home de teste temporário, para que fixtures unit não possam alterar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando precisar intencionalmente que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: ele mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do Gateway/conversas Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live com `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de limite de taxa.
- Saída de progresso/Heartbeat:
  - As suítes live agora emitem linhas de progresso para stderr para que chamadas longas a provedores apareçam como ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desabilita a interceptação de console do Vitest para que linhas de progresso de provedor/Gateway sejam exibidas imediatamente durante execuções live.
  - Ajuste Heartbeat de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste Heartbeat de Gateway/sonda com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Ao editar lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Ao tocar em rede do Gateway / protocolo WS / emparelhamento: adicione `pnpm test:e2e`
- Ao depurar “meu bot caiu” / falhas específicas de provedor / chamada de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capacidades do Node Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos anunciados atualmente** por um Node Android conectado e validar o comportamento do contrato dos comandos.
- Escopo:
  - Configuração prévia/manual (a suíte não instala/executa/emparelha o app).
  - Validação `node.invoke` do Gateway comando por comando para o Node Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + emparelhado ao Gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos da configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com aquela chave.
- “Smoke do Gateway” nos diz se todo o pipeline gateway+agent funciona para aquele modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem Gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias para modern) para realmente executar esta suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no smoke do Gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist modern
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura modern exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks por env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **apenas armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agent no Gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio OpenAI Responses/Codex Responses + fluxos de chamada de ferramenta)

### Camada 2: smoke do Gateway + agent dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Iniciar um Gateway in-process
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar modelos-com-chaves e garantir:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas extras opcionais de ferramenta (sonda exec+read)
    - caminhos de regressão OpenAI (apenas chamada de ferramenta → continuação) continuam funcionando
- Detalhes das sondas (para que você possa explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agent para `read` esse arquivo e devolver o nonce.
  - sonda `exec+read`: o teste pede ao agent para gravar um nonce via `exec` em um arquivo temporário e depois `read` esse arquivo.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist modern (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist modern
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras modern/all do Gateway usam por padrão um limite selecionado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura modern exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “tudo do OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ligadas neste teste live:
  - sonda `read` + sonda `exec+read` (stress de ferramenta)
  - a sonda de imagem executa quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia por meio de `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O Gateway faz parse dos anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agent embutido encaminha uma mensagem multimodal do usuário ao modelo
    - Asserção: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline Gateway + agent usando um backend CLI local, sem tocar na sua config padrão.
- Os padrões de smoke específicos do backend ficam na definição `cli-backend.ts` da extension proprietária.
- Habilitar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se estiver invocando o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - O comportamento de comando/args/imagem vem dos metadados do plugin proprietário do backend CLI.
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivos de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desabilitar a sonda padrão de continuidade na mesma sessão Claude Sonnet -> Opus (defina como `1` para forçá-la quando o modelo selecionado oferecer suporte a um alvo de troca).

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
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como o usuário não root `node`.
- Ele resolve os metadados do smoke da CLI a partir da extension proprietária e depois instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável com cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` requer OAuth portátil da assinatura do Claude Code por meio de `~/.claude/.credentials.json` com `claudeAiOauth.subscriptionType` ou `CLAUDE_CODE_OAUTH_TOKEN` de `claude setup-token`. Primeiro ele prova `claude -p` direto no Docker e depois executa dois turnos do backend CLI do Gateway sem preservar variáveis de ambiente de chave de API da Anthropic. Essa lane de assinatura desabilita por padrão as sondas MCP/tool e de imagem do Claude porque o Claude atualmente roteia o uso de apps de terceiros por cobrança de uso extra em vez dos limites normais do plano de assinatura.
- O smoke live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem, depois chamada da ferramenta MCP `cron` verificada pela CLI do Gateway.
- O smoke padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica se a sessão retomada ainda lembra de uma anotação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agent ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular no lugar uma conversa sintética de canal de mensagem
  - enviar uma continuação normal nessa mesma conversa
  - verificar se a continuação chega ao transcript da sessão ACP vinculada
- Habilitar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agents ACP em Docker: `claude,codex,gemini`
  - Agent ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa no estilo DM do Slack
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
  - `OPENCLAW_LIVE_ACP_BIND_CODEX_MODEL=gpt-5.4`
- Observações:
  - Essa lane usa a superfície `chat.send` do Gateway com campos sintéticos de rota de origem apenas para admin, para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro embutido de agents do plugin `acpx` selecionado para o agent de harness ACP.

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

Receitas Docker de agent único:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Por padrão, ele executa o smoke de bind ACP contra todos os agents CLI live suportados em sequência: `claude`, `codex`, depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele carrega `~/.profile`, prepara no contêiner o material de auth da CLI correspondente, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha disponíveis para a CLI filha do harness as variáveis de ambiente do provedor vindas do profile carregado.

## Live: smoke do harness app-server do Codex

- Objetivo: validar o harness do Codex, de propriedade do plugin, pelo método
  `agent` normal do Gateway:
  - carregar o plugin empacotado `codex`
  - selecionar `OPENCLAW_AGENT_RUNTIME=codex`
  - enviar um primeiro turno do agent do Gateway para `codex/gpt-5.4`
  - enviar um segundo turno para a mesma sessão OpenClaw e verificar se a thread
    do app-server consegue ser retomada
  - executar `/codex status` e `/codex models` pelo mesmo caminho de comando
    do Gateway
  - opcionalmente executar duas sondas de shell escaladas e revisadas pelo Guardian: um comando benigno
    que deve ser aprovado e um upload de secret falso que deve ser
    negado para que o agent peça confirmação
- Teste: `src/gateway/gateway-codex-harness.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Modelo padrão: `codex/gpt-5.4`
- Sonda opcional de imagem: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Sonda opcional de MCP/tool: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Sonda opcional do Guardian: `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=1`
- O smoke define `OPENCLAW_AGENT_HARNESS_FALLBACK=none` para que um harness Codex
  quebrado não passe silenciosamente por fallback para PI.
- Auth: `OPENAI_API_KEY` do shell/profile, além de opcionais
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
- Ele carrega o `~/.profile` montado, passa `OPENAI_API_KEY`, copia arquivos de auth da CLI Codex
  quando presentes, instala `@openai/codex` em um prefixo npm montado e gravável,
  prepara a árvore de origem e então executa apenas o teste live do harness Codex.
- O Docker habilita por padrão as sondas de imagem, MCP/tool e Guardian. Defina
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0` ou
  `OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0` quando precisar de uma execução
  de depuração mais restrita.
- O Docker também exporta `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, em linha com a configuração do teste
  live para que fallback para `openai-codex/*` ou PI não possa esconder uma regressão
  do harness Codex.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do Gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agent no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI local Gemini na sua máquina (auth separada + particularidades de tooling).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada do Google via HTTP (auth por chave de API / perfil); isso é o que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria auth e pode se comportar de forma diferente (streaming/suporte a ferramentas/descompasso de versão).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos do CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto de smoke modern (chamada de ferramenta + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute o smoke do Gateway com ferramentas + imagem:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: chamada de ferramenta (Read + Exec opcional)

Escolha pelo menos um por família de provedor:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de ferramentas que você tenha habilitado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramenta depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo com capacidade de imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes OpenAI com visão etc.) para exercitar a sonda de imagem.

### Agregadores / Gateways alternativos

Se você tiver chaves habilitadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de ferramenta+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (auth via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/config):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é aquilo que `discoverModels(...)` retorna na sua máquina + as chaves que estiverem disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que você depuraria `openclaw models list` / seleção de modelo.

- Perfis de auth por agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Config: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções live locais copiam por padrão a config ativa, arquivos `auth-profiles.json` por agent, `credentials/` legados e diretórios de auth de CLI externa com suporte para um home de teste temporário; homes live preparados ignoram `workspace/` e `sandboxes/`, e substituições de caminho `agents.*.workspace` / `agentDir` são removidas para que as sondas não atinjam seu workspace real no host.

Se quiser depender de chaves por env (por exemplo, exportadas em `~/.profile`), execute os testes locais após `source ~/.profile` ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Live Deepgram (transcrição de áudio)

- Teste: `extensions/deepgram/audio.live.test.ts`
- Habilitar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live extensions/deepgram/audio.live.test.ts`

## Live do plano de codificação BytePlus

- Teste: `extensions/byteplus/live.test.ts`
- Habilitar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live extensions/byteplus/live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Live de mídia de workflow ComfyUI

- Teste: `extensions/comfy/comfy.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos empacotados de imagem, vídeo e `music_generate` do comfy
  - Ignora cada capacidade, a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após alterar envio de workflow comfy, polling, downloads ou registro do plugin

## Geração de imagem live

- Teste: `test/image-generation.runtime.live.test.ts`
- Comando: `pnpm test:live test/image-generation.runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera todos os plugins de provedor de geração de imagem registrados
  - Carrega variáveis de ambiente de provedor ausentes do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa as variantes padrão de geração de imagem por meio da capacidade de runtime compartilhada:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores empacotados cobertos atualmente:
  - `fal`
  - `google`
  - `minimax`
  - `openai`
  - `vydra`
  - `xai`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google,xai"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview,xai/grok-imagine-image"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit,xai:default-generate,xai:default-edit"`
- Comportamento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado do provedor de geração de música empacotado
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente de provedor do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
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
- Comportamento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Habilitar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado do provedor de geração de vídeo empacotado
  - Usa por padrão o caminho de smoke seguro para release: provedores não-FAL, uma requisição text-to-video por provedor, prompt de lagosta de um segundo e um limite de operação por provedor de `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` por padrão)
  - Ignora FAL por padrão porque a latência da fila no lado do provedor pode dominar o tempo de release; passe `--video-providers fal` ou `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"` para executá-lo explicitamente
  - Carrega variáveis de ambiente de provedor do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes dos perfis de auth armazenados, para que chaves de teste desatualizadas em `auth-profiles.json` não escondam credenciais reais do shell
  - Ignora provedores sem auth/perfil/modelo utilizável
  - Executa apenas `generate` por padrão
  - Defina `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` para também executar modos de transformação declarados quando disponíveis:
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de imagem com suporte a buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local de vídeo com suporte a buffer na varredura compartilhada
  - Provedores atuais `imageToVideo` declarados, mas ignorados na varredura compartilhada:
    - `vydra` porque o `veo3` empacotado é apenas de texto e o `kling` empacotado requer uma URL de imagem remota
  - Cobertura Vydra específica por provedor:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video e uma lane `kling` que usa por padrão uma fixture de URL de imagem remota
  - Cobertura atual live de `videoToVideo`:
    - `runway` apenas quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores atuais `videoToVideo` declarados, mas ignorados na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a lane compartilhada atual Gemini/Veo usa entrada local com suporte a buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a lane compartilhada atual não garante acesso específico por organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""` para incluir todos os provedores na varredura padrão, inclusive FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000` para reduzir o limite de operação de cada provedor em uma execução smoke agressiva
- Comportamento de auth opcional:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar auth do armazenamento de perfis e ignorar substituições apenas por env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por meio de um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes de `~/.profile`
  - Restringe automaticamente por padrão cada suíte aos provedores que atualmente têm auth utilizável
  - Reutiliza `scripts/test-live.mjs`, para que o comportamento de Heartbeat e modo silencioso permaneça consistente
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Runners Docker (verificações opcionais de "funciona em Linux")

Esses runners Docker se dividem em dois grupos:

- Runners de modelos live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente com chaves de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de config e workspace (e carregando `~/.profile` se estiver montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os runners Docker live usam por padrão um limite smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12` e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` cria a imagem Docker live uma vez via `test:docker:live-build`, depois a reutiliza para as duas lanes Docker live. Ele também cria uma imagem compartilhada `scripts/e2e/Dockerfile` via `test:docker:e2e-build` e a reutiliza para os runners smoke E2E em contêiner que exercitam o app construído.
- Runners smoke em contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` e `test:docker:config-reload` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível superior.

Os runners Docker de modelos live também fazem bind-mount apenas dos homes de auth de CLI necessários (ou de todos os suportados quando a execução não está restrita) e depois os copiam para o home do contêiner antes da execução para que o OAuth de CLI externa possa atualizar tokens sem alterar o armazenamento de auth do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Smoke do harness app-server do Codex: `pnpm test:docker:live-codex-harness` (script: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + agent dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Smoke de onboarding/channel/agent com tarball npm: `pnpm test:docker:npm-onboard-channel-agent` instala globalmente no Docker o tarball empacotado do OpenClaw, configura OpenAI via onboarding por referência de env mais Telegram por padrão, verifica se habilitar o plugin instala suas dependências de runtime sob demanda, executa doctor e roda um turno de agent OpenAI mockado. Reutilize um tarball pré-construído com `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, ignore a rebuild no host com `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` ou troque o channel com `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Rede do Gateway (dois contêineres, auth WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Regressão mínima de raciocínio `web_search` do OpenAI Responses: `pnpm test:docker:openai-web-search-minimal` (script: `scripts/e2e/openai-web-search-minimal-docker.sh`) executa um servidor OpenAI mockado via Gateway, verifica se `web_search` eleva `reasoning.effort` de `minimal` para `low`, depois força a rejeição do schema do provedor e verifica se o detalhe bruto aparece nos logs do Gateway.
- Bridge de channel MCP (Gateway preparado + bridge stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Ferramentas MCP do bundle Pi (servidor MCP stdio real + smoke de allow/deny do perfil Pi embutido): `pnpm test:docker:pi-bundle-mcp-tools` (script: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Limpeza de MCP Cron/subagent (Gateway real + encerramento do processo filho MCP stdio após execuções isoladas de cron e subagent one-shot): `pnpm test:docker:cron-mcp-cleanup` (script: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício do bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)
- Smoke de update de plugin sem alterações: `pnpm test:docker:plugin-update` (script: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke de metadados de recarga de config: `pnpm test:docker:config-reload` (script: `scripts/e2e/config-reload-source-docker.sh`)
- Dependências de runtime de plugins empacotados: `pnpm test:docker:bundled-channel-deps` cria por padrão uma imagem pequena de runner Docker, constrói e empacota o OpenClaw uma vez no host e então monta esse tarball em cada cenário de instalação Linux. Reutilize a imagem com `OPENCLAW_SKIP_DOCKER_BUILD=1`, ignore a rebuild no host após uma build local recente com `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` ou aponte para um tarball existente com `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz`.
- Restrinja as dependências de runtime de plugins empacotados durante a iteração desabilitando cenários não relacionados, por exemplo:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Para pré-construir e reutilizar manualmente a imagem compartilhada do app construído:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Substituições de imagem específicas da suíte, como `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE`, ainda têm precedência quando definidas. Quando `OPENCLAW_SKIP_DOCKER_BUILD=1` aponta para uma imagem compartilhada remota, os scripts fazem pull dela se ainda não estiver localmente. Os testes Docker de QR e instalador mantêm seus próprios Dockerfiles porque validam comportamento de pacote/instalação em vez do runtime compartilhado do app construído.

Os runners Docker de modelos live também fazem bind-mount do checkout atual em modo somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta e, ao mesmo tempo, executa o Vitest contra sua origem/config local exata.
A etapa de preparação ignora caches locais grandes e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de saída
`.build` ou Gradle, para que execuções live no Docker não gastem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1`, para que as sondas live do Gateway não iniciem
workers reais de channels Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então também passe
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura live do Gateway
nessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível superior: ele inicia um
contêiner Gateway do OpenClaw com os endpoints HTTP compatíveis com OpenAI habilitados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login pelo
Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar fazer pull da
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de inicialização a frio.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner Gateway
preparado, inicia um segundo contêiner que executa `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcript, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações
de channel + permissão no estilo Claude pela bridge stdio MCP real. A verificação de notificações
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
bridge realmente emite, e não apenas o que um SDK cliente específico por acaso expõe.
`test:docker:pi-bundle-mcp-tools` é determinístico e não precisa de uma chave de modelo live.
Ele cria a imagem Docker do repositório, inicia um servidor de sonda MCP stdio real
dentro do contêiner, materializa esse servidor pelo runtime MCP do bundle Pi embutido,
executa a ferramenta e então verifica se `coding` e `messaging` mantêm ferramentas
`bundle-mcp`, enquanto `minimal` e `tools.deny: ["bundle-mcp"]` as filtram.
`test:docker:cron-mcp-cleanup` é determinístico e não precisa de uma chave de modelo live.
Ele inicia um Gateway preparado com um servidor de sonda MCP stdio real, executa um
turno isolado de cron e um turno filho one-shot de `/subagents spawn`, e então verifica
se o processo filho MCP é encerrado após cada execução.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode voltar a ser necessário para validação de roteamento de threads ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de executar os testes
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1` para verificar apenas variáveis de ambiente carregadas de `OPENCLAW_PROFILE_FILE`, usando diretórios temporários de config/workspace e sem mounts de auth de CLI externa
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI com cache dentro do Docker
- Diretórios/arquivos de auth de CLI externa sob `$HOME` são montados em modo somente leitura sob `/host-auth...` e então copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções com provedores restritos montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_SKIP_DOCKER_BUILD=1` para reutilizar uma imagem `openclaw:local-live` existente em reruns que não precisem de rebuild
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não do env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Sanidade da documentação

Execute verificações da documentação após editar docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar headings na página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do Gateway (OpenAI mockado, gateway real + loop de agent): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do Gateway (WS `wizard.start`/`wizard.next`, gravação de config + auth aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade de agent (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade de agent”:

- Chamada de ferramenta mockada pelo gateway real + loop de agent (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de config (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando Skills estão listadas no prompt, o agent escolhe a Skill correta (ou evita as irrelevantes)?
- **Conformidade:** o agent lê `SKILL.md` antes do uso e segue as etapas/args exigidos?
- **Contratos de fluxo de trabalho:** cenários de múltiplos turnos que validam ordem de ferramentas, continuidade do histórico da sessão e limites do sandbox.

As futuras avaliações devem permanecer determinísticas primeiro:

- Um runner de cenários usando provedores mockados para validar chamadas de ferramenta + ordem, leituras de arquivos de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skills (usar vs evitar, gating, prompt injection).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (formato de plugin e channel)

Os testes de contrato verificam se todo plugin e channel registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam um conjunto de
asserções de formato e comportamento. A lane unit padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de interface e smoke; execute explicitamente
os comandos de contrato quando tocar em superfícies compartilhadas de channel ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de channel: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de channel

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Formato básico do plugin (id, nome, capacidades)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagens de entrada
- **actions** - Manipuladores de ação do channel
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista de participantes
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status do channel
- **registry** - Formato do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de auth
- **auth-choice** - Escolha/seleção de auth
- **catalog** - API do catálogo de modelos
- **discovery** - Descoberta de plugins
- **loader** - Carregamento de plugins
- **runtime** - Runtime do provedor
- **shape** - Formato/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Depois de alterar exports ou subpaths do plugin-sdk
- Depois de adicionar ou modificar um plugin de channel ou provedor
- Depois de refatorar registro ou descoberta de plugin

Os testes de contrato executam no CI e não requerem chaves de API reais.

## Adicionar regressões (orientação)

Ao corrigir um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI, se possível (provedor mockado/stubado ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de auth), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira direcionar a menor camada que detecta o bug:
  - bug de conversão/replay de requisição do provedor → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do Gateway → smoke live do Gateway ou teste mockado do Gateway seguro para CI
- Proteção de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo de amostra por classe de SecretRef dos metadados do registro (`listSecretTargetRegistryEntries()`), então valida que ids de execução de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
