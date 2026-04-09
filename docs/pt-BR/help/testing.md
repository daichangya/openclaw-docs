---
read_when:
    - Executar testes localmente ou em CI
    - Adicionar regressões para bugs de modelo/provedor
    - Depurar comportamento de gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, executores Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-09T01:30:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 01117f41d8b171a4f1da11ed78486ee700e70ae70af54eb6060c57baf64ab21b
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de executores Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos de trabalho comuns (local, pré-push, depuração)
- Como os testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes do push): `pnpm build && pnpm check && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest: `pnpm test:watch`
- O direcionamento direto de arquivos agora também roteia caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Site de QA com suporte de Docker: `pnpm qa:lab:up`

Quando você mexe em testes ou quer confiança extra:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (exige credenciais reais):

- Suíte live (sondagens de modelos + gateway tool/image): `pnpm test:live`
- Direcione um único arquivo live silenciosamente: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você precisa apenas de um caso com falha, prefira restringir os testes live com as variáveis de ambiente de allowlist descritas abaixo.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e flakiness/custo crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: dez execuções sequenciais de shard (`vitest.full-*.config.ts`) sobre os projetos Vitest escopados já existentes
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes node em `ui` permitidos pela allowlist cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projetos:
  - `pnpm test` sem alvo agora executa onze configurações de shard menores (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) em vez de um único processo gigante do projeto raiz nativo. Isso reduz o pico de RSS em máquinas carregadas e evita que o trabalho de auto-reply/extension deixe outras suítes sem recursos.
  - `pnpm test --watch` ainda usa o grafo de projetos nativo da raiz em `vitest.config.ts`, porque um loop de watch com múltiplos shards não é prático.
  - `pnpm test`, `pnpm test:watch` e `pnpm test:perf:imports` roteiam alvos explícitos de arquivo/diretório primeiro por faixas escopadas, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` evita pagar o custo completo de inicialização do projeto raiz.
  - `pnpm test:changed` expande caminhos git alterados nas mesmas faixas escopadas quando o diff toca apenas arquivos-fonte/de teste roteáveis; edições de config/setup ainda voltam para a nova execução ampla do projeto raiz.
  - Alguns testes selecionados de `plugin-sdk` e `commands` também são roteados por faixas leves dedicadas que pulam `test/setup-openclaw-runtime.ts`; arquivos stateful/pesados em runtime permanecem nas faixas existentes.
  - Alguns arquivos auxiliares de `plugin-sdk` e `commands` também mapeiam execuções em modo changed para testes irmãos explícitos nessas faixas leves, para que edições em helpers evitem reexecutar a suíte pesada completa daquele diretório.
  - `auto-reply` agora tem três buckets dedicados: helpers core de nível superior, testes de integração `reply.*` de nível superior e a subárvore `src/auto-reply/reply/**`. Isso mantém o trabalho mais pesado do harness de reply fora dos testes baratos de status/chunk/token.
- Observação sobre o executor embutido:
  - Quando você altera entradas de descoberta de message-tool ou o contexto de runtime de compactação,
    mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas em helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do executor embutido:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que ids escopados e o comportamento de compactação ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes apenas de helper não são um
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o executor não isolado nos projetos raiz, e2e e live.
  - A faixa UI da raiz mantém sua configuração `jsdom` e otimizador, mas agora também roda no executor compartilhado não isolado.
  - Cada shard de `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração compartilhada do Vitest.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão aos processos Node filhos do Vitest para reduzir o churn de compilação do V8 durante grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se precisar comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` roteia por faixas escopadas quando os caminhos alterados mapeiam claramente para uma suíte menor.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm o mesmo comportamento de roteamento, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também reduz quando a média de carga do host já está alta, então múltiplas execuções simultâneas do Vitest causam menos impacto por padrão.
  - A configuração base do Vitest marca os projetos/arquivos de configuração como `forceRerunTriggers` para que novas execuções no modo changed permaneçam corretas quando o encadeamento dos testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local de cache explícito para profiling direto.
- Observação sobre depuração de desempenho:
  - `pnpm test:perf:imports` ativa relatórios de duração de importação do Vitest mais a saída de detalhamento de importação.
  - `pnpm test:perf:imports:changed` restringe a mesma visão de profiling a arquivos alterados desde `origin/main`.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` compara `test:changed` roteado com o caminho nativo do projeto raiz para esse diff commitado e imprime tempo total mais RSS máximo no macOS.
- `pnpm test:perf:changed:bench -- --worktree` faz benchmark da árvore local com alterações roteando a lista de arquivos alterados por `scripts/test-projects.mjs` e pela configuração raiz do Vitest.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para a sobrecarga de inicialização e transformação do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do executor para a suíte unit com paralelismo de arquivos desativado.

### E2E (smoke do gateway)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa `threads` do Vitest com `isolate: false`, alinhado ao restante do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir a sobrecarga de I/O no console.
- Overrides úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a quantidade de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar a saída detalhada do console.
- Escopo:
  - Comportamento end-to-end de gateway multi-instância
  - Superfícies WebSocket/HTTP, emparelhamento de nós e rede mais pesada
- Expectativas:
  - Roda em CI (quando ativado no pipeline)
  - Não requer chaves reais
  - Tem mais partes móveis do que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw sobre `sandbox ssh-config` + execução SSH reais
  - Verifica o comportamento canônico do sistema de arquivos remoto por meio da ponte fs do sandbox
- Expectativas:
  - Apenas opt-in; não faz parte da execução padrão de `pnpm test:e2e`
  - Requer uma CLI `openshell` local e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados e depois destrói o gateway e o sandbox de teste
- Overrides úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao executar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Detectar mudanças no formato do provedor, peculiaridades de tool-calling, problemas de autenticação e comportamento de limite de taxa
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais dos provedores, cotas, indisponibilidades)
  - Custa dinheiro / usa limites de taxa
  - Prefira executar subconjuntos restritos em vez de “tudo”
- Execuções live usam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para um diretório home temporário de teste, para que fixtures unit não possam modificar seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que os testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter do Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser recuperar os logs completos de inicialização.
- Rotação de chaves de API (específica por provedor): defina `*_API_KEYS` com formato separado por vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou override por live via `OPENCLAW_LIVE_*_KEY`; os testes tentam novamente em respostas de rate limit.
- Saída de progresso/heartbeat:
  - As suítes live agora emitem linhas de progresso em stderr para que chamadas longas ao provedor permaneçam visivelmente ativas mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso do provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se você mudou muita coisa)
- Tocando rede do gateway / protocolo WS / emparelhamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / tool calling: execute um `pnpm test:live` restrito

## Live: varredura de capacidades do nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todo comando anunciado atualmente** por um nó Android conectado e afirmar o comportamento do contrato de comando.
- Escopo:
  - Configuração prévia/manual (a suíte não instala/executa/emparelha o app).
  - Validação `node.invoke` do gateway, comando por comando, para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + emparelhado ao gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Overrides opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/pt-BR/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Os testes live são divididos em duas camadas para que possamos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave informada.
- “Smoke do gateway” nos diz se o pipeline completo de gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena completion por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) para realmente executar esta suíte; caso contrário ela é pulada para manter `pnpm test:live` focado no smoke do gateway
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para executar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
  - Varreduras modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de env
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para exigir **apenas o armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: OpenAI Responses/Codex Responses reasoning replay + fluxos de tool-call)

### Camada 2: smoke do gateway + agente dev (o que `@openclaw` realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway in-process
  - Criar/aplicar patch em uma sessão `agent:dev:*` (override de modelo por execução)
  - Iterar modelos-com-chaves e afirmar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (read probe)
    - sondagens opcionais extras de ferramenta (exec+read probe)
    - caminhos de regressão do OpenAI (somente tool-call → follow-up) continuam funcionando
- Detalhes das sondagens (para que você possa explicar falhas rapidamente):
  - Sondagem `read`: o teste grava um arquivo nonce no workspace e pede ao agente para `read` esse arquivo e ecoar o nonce de volta.
  - Sondagem `exec+read`: o teste pede ao agente para gravar um nonce em um arquivo temporário via `exec` e depois `read` esse arquivo.
  - Sondagem de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
  - Varreduras de gateway modern/all usam por padrão um limite curado de alto sinal; defina `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` para uma varredura moderna exaustiva ou um número positivo para um limite menor.
- Como selecionar provedores (evite “OpenRouter tudo”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- As sondagens de ferramenta + imagem estão sempre ativadas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (visão geral):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O gateway faz parsing dos attachments em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário ao modelo
    - Afirmação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são permitidos)

Dica: para ver o que você pode testar na sua máquina (e os ids exatos de `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke do backend CLI (Claude, Codex, Gemini ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline do Gateway + agente usando um backend CLI local, sem tocar na sua configuração padrão.
- Os padrões de smoke específicos de backend ficam na definição `cli-backend.ts` da extension proprietária.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se invocar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Provedor/modelo padrão: `claude-cli/claude-sonnet-4-6`
  - Comando/args/comportamento de imagem vêm dos metadados do plugin proprietário do backend CLI.
- Overrides (opcional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um attachment de imagem real (os caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como os args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0` para desativar a sonda padrão de continuidade de mesma sessão Claude Sonnet -> Opus (defina como `1` para forçá-la quando o modelo selecionado suportar um alvo de troca).

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
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Observações:

- O executor Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live do backend CLI dentro da imagem Docker do repositório como usuário não root `node`.
- Ele resolve metadados de smoke da CLI a partir da extension proprietária e então instala o pacote CLI Linux correspondente (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) em um prefixo gravável em cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- O smoke live do backend CLI agora exercita o mesmo fluxo end-to-end para Claude, Codex e Gemini: turno de texto, turno de classificação de imagem, depois chamada de ferramenta MCP `cron` verificada por meio da CLI do gateway.
- O smoke padrão do Claude também aplica patch na sessão de Sonnet para Opus e verifica que a sessão retomada ainda se lembra de uma anotação anterior.

## Live: smoke de bind ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular em lugar uma conversa sintética de canal de mensagem
  - enviar um follow-up normal nessa mesma conversa
  - verificar se o follow-up chega à transcrição da sessão ACP vinculada
- Ativar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agentes ACP em Docker: `claude,codex,gemini`
  - Agente ACP para `pnpm test:live ...` direto: `claude`
  - Canal sintético: contexto de conversa estilo DM do Slack
  - Backend ACP: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Observações:
  - Essa faixa usa a superfície `chat.send` do gateway com campos sintéticos de rota de origem somente para admin, para que os testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` não está definido, o teste usa o registro interno de agentes do plugin `acpx` embutido para o agente de harness ACP selecionado.

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
- Por padrão, ele executa o smoke de bind ACP contra todos os agentes CLI live suportados em sequência: `claude`, `codex` e depois `gemini`.
- Use `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` ou `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini` para restringir a matriz.
- Ele usa `~/.profile` como source, prepara o material de autenticação da CLI correspondente dentro do contêiner, instala `acpx` em um prefixo npm gravável e então instala a CLI live solicitada (`@anthropic-ai/claude-code`, `@openai/codex` ou `@google/gemini-cli`) se estiver ausente.
- Dentro do Docker, o executor define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que `acpx` mantenha variáveis de ambiente do provedor vindas do profile carregado disponíveis para a CLI filha do harness.

### Receitas live recomendadas

Allowlists explícitas e restritas são mais rápidas e menos sujeitas a falhas intermitentes:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, smoke do gateway:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool calling em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave da API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente no estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a CLI Gemini local na sua máquina (autenticação separada + peculiaridades de tooling).
- API Gemini vs CLI Gemini:
  - API: o OpenClaw chama a API Gemini hospedada pelo Google via HTTP (chave de API / autenticação de perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário local `gemini`; ele tem sua própria autenticação e pode se comportar de forma diferente (suporte a streaming/ferramentas/desalinhamento de versão).

## Live: matriz de modelos (o que cobrimos)

Não há uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto smoke moderno (tool calling + imagem)

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

Escolha pelo menos um por família de provedores:

- OpenAI: `openai/gpt-5.4` (ou `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (ou `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Cobertura adicional opcional (bom ter):

- xAI: `xai/grok-4` (ou a versão mais recente disponível)
- Mistral: `mistral/`… (escolha um modelo com capacidade de “tools” que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; o tool calling depende do modo da API)

### Visão: envio de imagem (attachment → mensagem multimodal)

Inclua pelo menos um modelo com suporte a imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (Claude/Gemini/variantes do OpenAI com capacidade de visão etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves ativadas, também oferecemos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos com capacidade de tool+image)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Embutidos: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (nuvem/API), além de qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Os testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, os testes live devem encontrar as mesmas chaves.
- Se um teste live disser “sem credenciais”, depure da mesma forma que depuraria `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “chaves de perfil” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para o home live preparado quando presente, mas não é o armazenamento principal de chaves de perfil)
- Execuções locais live copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação de CLI externa suportados para um diretório home temporário de teste; homes live preparados pulam `workspace/` e `sandboxes/`, e overrides de caminho `agents.*.workspace` / `agentDir` são removidos para que as sondagens fiquem longe do seu workspace real do host.

Se você quiser depender de chaves em env (por exemplo, exportadas no seu `~/.profile`), execute os testes locais após `source ~/.profile` ou use os executores Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram live (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Teste: `src/agents/byteplus.live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Override opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI workflow media live

- Teste: `extensions/comfy/comfy.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Escopo:
  - Exercita os caminhos embutidos de imagem, vídeo e `music_generate` do comfy
  - Pula cada capacidade a menos que `models.providers.comfy.<capability>` esteja configurado
  - Útil após mudar envio de workflow do comfy, polling, downloads ou registro de plugin

## Geração de imagem live

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Escopo:
  - Enumera cada plugin de provedor de geração de imagem registrado
  - Carrega variáveis de ambiente de provedor ausentes do seu shell de login (`~/.profile`) antes das sondagens
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não mascararem credenciais reais do shell
  - Pula provedores sem autenticação/perfil/modelo utilizáveis
  - Executa as variantes padrão de geração de imagem por meio da capacidade compartilhada de runtime:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Provedores embutidos atualmente cobertos:
  - `openai`
  - `google`
- Restrição opcional:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar overrides somente de env

## Geração de música live

- Teste: `extensions/music-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Escopo:
  - Exercita o caminho compartilhado embutido do provedor de geração de música
  - Atualmente cobre Google e MiniMax
  - Carrega variáveis de ambiente do provedor do seu shell de login (`~/.profile`) antes das sondagens
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não mascararem credenciais reais do shell
  - Pula provedores sem autenticação/perfil/modelo utilizáveis
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `edit` quando o provedor declara `capabilities.edit.enabled`
  - Cobertura atual da faixa compartilhada:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: arquivo live separado do Comfy, não esta varredura compartilhada
- Restrição opcional:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar overrides somente de env

## Geração de vídeo live

- Teste: `extensions/video-generation-providers.live.test.ts`
- Ativar: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Escopo:
  - Exercita o caminho compartilhado embutido do provedor de geração de vídeo
  - Carrega variáveis de ambiente do provedor do seu shell de login (`~/.profile`) antes das sondagens
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não mascararem credenciais reais do shell
  - Pula provedores sem autenticação/perfil/modelo utilizáveis
  - Executa ambos os modos de runtime declarados quando disponíveis:
    - `generate` com entrada somente de prompt
    - `imageToVideo` quando o provedor declara `capabilities.imageToVideo.enabled` e o provedor/modelo selecionado aceita entrada local baseada em buffer na varredura compartilhada
    - `videoToVideo` quando o provedor declara `capabilities.videoToVideo.enabled` e o provedor/modelo selecionado aceita entrada local baseada em buffer na varredura compartilhada
  - Provedores `imageToVideo` atualmente declarados, mas pulados, na varredura compartilhada:
    - `vydra` porque o `veo3` embutido é somente texto e o `kling` embutido exige uma URL remota de imagem
  - Cobertura específica do provedor Vydra:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - esse arquivo executa `veo3` text-to-video mais uma faixa `kling` que usa por padrão um fixture remoto de URL de imagem
  - Cobertura live atual de `videoToVideo`:
    - `runway` apenas quando o modelo selecionado é `runway/gen4_aleph`
  - Provedores `videoToVideo` atualmente declarados, mas pulados, na varredura compartilhada:
    - `alibaba`, `qwen`, `xai` porque esses caminhos atualmente exigem URLs de referência remotas `http(s)` / MP4
    - `google` porque a faixa compartilhada atual Gemini/Veo usa entrada local baseada em buffer e esse caminho não é aceito na varredura compartilhada
    - `openai` porque a faixa compartilhada atual não garante acesso específico da organização a inpaint/remix de vídeo
- Restrição opcional:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação do armazenamento de perfis e ignorar overrides somente de env

## Harness live de mídia

- Comando: `pnpm test:live:media`
- Finalidade:
  - Executa as suítes live compartilhadas de imagem, música e vídeo por um único entrypoint nativo do repositório
  - Carrega automaticamente variáveis de ambiente de provedor ausentes de `~/.profile`
  - Restringe automaticamente por padrão cada suíte aos provedores que atualmente têm autenticação utilizável
  - Reutiliza `scripts/test-live.mjs`, para que heartbeat e comportamento de modo silencioso permaneçam consistentes
- Exemplos:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Executores Docker (verificações opcionais de “funciona em Linux”)

Esses executores Docker se dividem em dois grupos:

- Executores de modelo live: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu respectivo arquivo live de chave de perfil dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e usando `~/.profile` como source se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Os executores Docker live usam por padrão um limite de smoke menor para que uma varredura Docker completa permaneça prática:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis de ambiente quando
  quiser explicitamente a varredura exaustiva maior.
- `test:docker:all` cria a imagem Docker live uma vez via `test:docker:live-build` e depois a reutiliza para as duas faixas Docker live.
- Executores smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` inicializam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os executores Docker de modelo live também fazem bind-mount apenas dos diretórios home de autenticação CLI necessários (ou de todos os suportados quando a execução não está restrita), depois os copiam para o home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem modificar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- Smoke de bind ACP: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- Smoke de backend CLI: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Smoke live do Open WebUI: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Rede do gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway preparado + ponte stdio + smoke bruto de frame de notificação Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício de pacote Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os executores Docker de modelo live também fazem bind-mount do checkout atual somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta, mas ainda executa o Vitest exatamente sobre seu código/configuração local.
A etapa de preparação pula caches grandes apenas locais e saídas de build de apps, como
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` e diretórios locais de `.build` ou
saída do Gradle, para que execuções live no Docker não passem minutos copiando
artefatos específicos da máquina.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que as sondagens live do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então repasse
`OPENCLAW_LIVE_GATEWAY_*` também quando precisar restringir ou excluir a cobertura live
do gateway dessa faixa Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner Open WebUI fixado contra esse gateway, faz login por meio
do Open WebUI, verifica se `/api/models` expõe `openclaw/default` e então envia uma
requisição real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser perceptivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração de cold-start.
Essa faixa espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a principal forma de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicializa um contêiner de Gateway
preparado, inicia um segundo contêiner que sobe `openclaw mcp serve` e então
verifica descoberta de conversa roteada, leituras de transcrição, metadados de attachment,
comportamento da fila de eventos live, roteamento de envio de saída e notificações
de canal + permissão no estilo Claude sobre a ponte stdio MCP real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, para que o smoke valide o que a
ponte realmente emite, não apenas o que uma SDK cliente específica por acaso expõe.

Smoke manual de thread ACP em linguagem natural (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha este script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e usado como source antes de executar os testes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações de CLI em cache dentro do Docker
- Diretórios/arquivos de autenticação de CLI externa sob `$HOME` são montados somente leitura sob `/host-auth...` e depois copiados para `/home/node/...` antes do início dos testes
  - Diretórios padrão: `.minimax`
  - Arquivos padrão: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Execuções restritas por provedor montam apenas os diretórios/arquivos necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que as credenciais venham do armazenamento de perfis (não de env)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag de imagem fixada do Open WebUI

## Sanidade da documentação

Execute verificações de docs após edições em docs: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar verificar headings na própria página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Tool calling do gateway (OpenAI simulado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + auth aplicado): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Avaliações de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “avaliações de confiabilidade do agente”:

- Tool-calling simulado pelo gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam encadeamento de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (consulte [Skills](/pt-BR/tools/skills)):

- **Tomada de decisão:** quando as Skills são listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes do uso e segue as etapas/args exigidos?
- **Contratos de fluxo de trabalho:** cenários multi-turno que afirmam ordem de ferramentas, persistência do histórico da sessão e limites de sandbox.

Avaliações futuras devem permanecer determinísticas primeiro:

- Um executor de cenários usando provedores simulados para afirmar chamadas de ferramenta + ordem, leituras de arquivo de Skill e encadeamento de sessão.
- Uma pequena suíte de cenários focados em Skill (usar vs evitar, gating, prompt injection).
- Avaliações live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver implementada.

## Testes de contrato (forma de plugin e channel)

Os testes de contrato verificam que todo plugin e channel registrado está em conformidade com seu
contrato de interface. Eles iteram sobre todos os plugins descobertos e executam uma suíte de
afirmações de forma e comportamento. A faixa unit padrão de `pnpm test` intencionalmente
pula esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando tocar superfícies compartilhadas de channel ou provider.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de channel: `pnpm test:contracts:channels`
- Apenas contratos de provider: `pnpm test:contracts:plugins`

### Contratos de channel

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, name, capabilities)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de vínculo de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagem de entrada
- **actions** - Handlers de ação de channel
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status do provider

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondagens de status de channel
- **registry** - Forma do registro de plugins

### Contratos de provider

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato de fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Runtime do provider
- **shape** - Forma/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exportações ou subpaths de plugin-sdk
- Após adicionar ou modificar um plugin de channel ou provider
- Após refatorar registro ou descoberta de plugins

Os testes de contrato rodam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provider/model descoberto em live:

- Adicione uma regressão segura para CI, se possível (provider simulado/stub, ou capture a transformação exata do formato da requisição)
- Se for inerentemente apenas live (limites de taxa, políticas de autenticação), mantenha o teste live restrito e opt-in via variáveis de ambiente
- Prefira mirar a menor camada que detecta o bug:
  - bug de conversão/replay de requisição do provider → teste de modelos diretos
  - bug de pipeline de sessão/histórico/ferramenta do gateway → smoke live do gateway ou teste simulado do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe SecretRef a partir dos metadados do registro (`listSecretTargetRegistryEntries()`), depois afirma que ids de exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em ids de alvo não classificados para que novas classes não sejam puladas silenciosamente.
