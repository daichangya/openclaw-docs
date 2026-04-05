---
read_when:
    - Executando testes localmente ou em CI
    - Adicionando regressões para bugs de modelo/provedor
    - Depurando comportamento de gateway + agente
summary: 'Kit de testes: suítes unit/e2e/live, runners Docker e o que cada teste cobre'
title: Testes
x-i18n:
    generated_at: "2026-04-05T12:45:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 854a39ae261d8749b8d8d82097b97a7c52cf2216d1fe622e302d830a888866ab
    source_path: help/testing.md
    workflow: 15
---

# Testes

O OpenClaw tem três suítes Vitest (unit/integration, e2e, live) e um pequeno conjunto de runners Docker.

Este documento é um guia de “como testamos”:

- O que cada suíte cobre (e o que ela deliberadamente _não_ cobre)
- Quais comandos executar para fluxos comuns (local, antes de push, depuração)
- Como testes live descobrem credenciais e selecionam modelos/provedores
- Como adicionar regressões para problemas reais de modelo/provedor

## Início rápido

Na maioria dos dias:

- Gate completo (esperado antes de push): `pnpm build && pnpm check && pnpm test`
- Execução local mais rápida da suíte completa em uma máquina folgada: `pnpm test:max`
- Loop direto de watch do Vitest (configuração moderna de projects): `pnpm test:watch`
- Direcionamento direto por arquivo agora também roteia caminhos de extension/channel: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`

Quando você mexe em testes ou quer mais confiança:

- Gate de cobertura: `pnpm test:coverage`
- Suíte E2E: `pnpm test:e2e`

Ao depurar provedores/modelos reais (requer credenciais reais):

- Suíte live (sondagens de modelos + ferramentas/imagens do gateway): `pnpm test:live`
- Direcionar silenciosamente um arquivo live: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Dica: quando você precisa apenas de um caso com falha, prefira restringir testes live pelas variáveis de ambiente de allowlist descritas abaixo.

## Suítes de teste (o que roda onde)

Pense nas suítes como “realismo crescente” (e instabilidade/custo crescentes):

### Unit / integration (padrão)

- Comando: `pnpm test`
- Configuração: `projects` nativos do Vitest via `vitest.config.ts`
- Arquivos: inventários core/unit em `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` e os testes de nó `ui` na allowlist cobertos por `vitest.unit.config.ts`
- Escopo:
  - Testes unitários puros
  - Testes de integração in-process (autenticação do gateway, roteamento, ferramentas, parsing, configuração)
  - Regressões determinísticas para bugs conhecidos
- Expectativas:
  - Roda em CI
  - Não requer chaves reais
  - Deve ser rápido e estável
- Observação sobre projects:
  - `pnpm test`, `pnpm test:watch` e `pnpm test:changed` agora usam a mesma configuração root nativa de `projects` do Vitest.
  - Filtros diretos por arquivo passam nativamente pelo grafo de projects da raiz, então `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` funciona sem um wrapper customizado.
- Observação sobre embedded runner:
  - Quando você alterar entradas de descoberta da message-tool ou o contexto de runtime da compactação, mantenha ambos os níveis de cobertura.
  - Adicione regressões focadas de helpers para limites puros de roteamento/normalização.
  - Também mantenha saudáveis as suítes de integração do embedded runner:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` e
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Essas suítes verificam que IDs com escopo e o comportamento de compactação ainda fluem
    pelos caminhos reais `run.ts` / `compact.ts`; testes somente de helper não são
    substituto suficiente para esses caminhos de integração.
- Observação sobre pool:
  - A configuração base do Vitest agora usa `threads` por padrão.
  - A configuração compartilhada do Vitest também fixa `isolate: false` e usa o runner não isolado em root projects, e2e e live.
  - A lane root de UI mantém sua configuração `jsdom` e otimizador, mas agora também roda no runner compartilhado não isolado.
  - `pnpm test` herda os mesmos padrões `threads` + `isolate: false` da configuração de `projects` em `vitest.config.ts`.
  - O launcher compartilhado `scripts/run-vitest.mjs` agora também adiciona `--no-maglev` por padrão para processos Node filhos do Vitest para reduzir churn de compilação do V8 em grandes execuções locais. Defina `OPENCLAW_VITEST_ENABLE_MAGLEV=1` se quiser comparar com o comportamento padrão do V8.
- Observação sobre iteração local rápida:
  - `pnpm test:changed` executa a configuração nativa de projects com `--changed origin/main`.
  - `pnpm test:max` e `pnpm test:changed:max` mantêm a mesma configuração nativa de projects, apenas com um limite maior de workers.
  - O autoescalonamento local de workers agora é intencionalmente conservador e também reduz quando a carga média do host já está alta, então múltiplas execuções simultâneas do Vitest causam menos dano por padrão.
  - A configuração base do Vitest marca os arquivos de projects/config como `forceRerunTriggers` para que reruns em modo changed permaneçam corretos quando o wiring dos testes muda.
  - A configuração mantém `OPENCLAW_VITEST_FS_MODULE_CACHE` ativado em hosts compatíveis; defina `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path` se quiser um local explícito de cache para profiling direto.
- Observação sobre depuração de performance:
  - `pnpm test:perf:imports` ativa relatórios de duração de import do Vitest e saída de detalhamento de import.
  - `pnpm test:perf:imports:changed` limita a mesma visão de profiling a arquivos alterados desde `origin/main`.
  - `pnpm test:perf:profile:main` grava um perfil de CPU da thread principal para a sobrecarga de startup e transform do Vitest/Vite.
  - `pnpm test:perf:profile:runner` grava perfis de CPU+heap do runner para a suíte unit com paralelismo de arquivo desativado.

### E2E (gateway smoke)

- Comando: `pnpm test:e2e`
- Configuração: `vitest.e2e.config.ts`
- Arquivos: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Padrões de runtime:
  - Usa Vitest `threads` com `isolate: false`, combinando com o resto do repositório.
  - Usa workers adaptativos (CI: até 2, local: 1 por padrão).
  - Roda em modo silencioso por padrão para reduzir a sobrecarga de I/O no console.
- Substituições úteis:
  - `OPENCLAW_E2E_WORKERS=<n>` para forçar a contagem de workers (limitada a 16).
  - `OPENCLAW_E2E_VERBOSE=1` para reativar saída detalhada no console.
- Escopo:
  - Comportamento end-to-end do gateway em múltiplas instâncias
  - Superfícies WebSocket/HTTP, pareamento de nó e networking mais pesado
- Expectativas:
  - Roda em CI (quando ativado no pipeline)
  - Não requer chaves reais
  - Mais partes móveis que testes unitários (pode ser mais lento)

### E2E: smoke do backend OpenShell

- Comando: `pnpm test:e2e:openshell`
- Arquivo: `test/openshell-sandbox.e2e.test.ts`
- Escopo:
  - Inicia um gateway OpenShell isolado no host via Docker
  - Cria um sandbox a partir de um Dockerfile local temporário
  - Exercita o backend OpenShell do OpenClaw via `sandbox ssh-config` + exec SSH reais
  - Verifica comportamento de filesystem canônico remoto por meio da ponte fs do sandbox
- Expectativas:
  - Somente opt-in; não faz parte da execução padrão `pnpm test:e2e`
  - Requer uma CLI local `openshell` e um daemon Docker funcional
  - Usa `HOME` / `XDG_CONFIG_HOME` isolados, depois destrói o gateway e o sandbox de teste
- Substituições úteis:
  - `OPENCLAW_E2E_OPENSHELL=1` para ativar o teste ao rodar manualmente a suíte e2e mais ampla
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell` para apontar para um binário CLI não padrão ou script wrapper

### Live (provedores reais + modelos reais)

- Comando: `pnpm test:live`
- Configuração: `vitest.live.config.ts`
- Arquivos: `src/**/*.live.test.ts`
- Padrão: **ativado** por `pnpm test:live` (define `OPENCLAW_LIVE_TEST=1`)
- Escopo:
  - “Esse provedor/modelo realmente funciona _hoje_ com credenciais reais?”
  - Captura mudanças de formato do provedor, peculiaridades de chamadas de ferramenta, problemas de autenticação e comportamento de rate limit
- Expectativas:
  - Não é estável em CI por design (redes reais, políticas reais de provedor, cotas, indisponibilidades)
  - Custa dinheiro / usa rate limits
  - Prefira executar subconjuntos limitados em vez de “tudo”
- Execuções live carregam `~/.profile` para obter chaves de API ausentes.
- Por padrão, execuções live ainda isolam `HOME` e copiam material de config/auth para uma home temporária de teste para que fixtures unitários não alterem seu `~/.openclaw` real.
- Defina `OPENCLAW_LIVE_USE_REAL_HOME=1` apenas quando você intencionalmente precisar que testes live usem seu diretório home real.
- `pnpm test:live` agora usa por padrão um modo mais silencioso: mantém a saída de progresso `[live] ...`, mas suprime o aviso extra de `~/.profile` e silencia logs de bootstrap do gateway/chatter Bonjour. Defina `OPENCLAW_LIVE_TEST_QUIET=0` se quiser os logs completos de startup de volta.
- Rotação de chave de API (específica por provedor): defina `*_API_KEYS` com formato vírgula/ponto e vírgula ou `*_API_KEY_1`, `*_API_KEY_2` (por exemplo `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) ou substituição por live via `OPENCLAW_LIVE_*_KEY`; testes tentam novamente em respostas de rate limit.
- Saída de progresso/heartbeat:
  - Suítes live agora emitem linhas de progresso em stderr para que chamadas longas a provedores mostrem atividade visível mesmo quando a captura de console do Vitest está silenciosa.
  - `vitest.live.config.ts` desativa a interceptação de console do Vitest para que linhas de progresso de provedor/gateway sejam transmitidas imediatamente durante execuções live.
  - Ajuste heartbeats de modelo direto com `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Ajuste heartbeats de gateway/probe com `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Qual suíte devo executar?

Use esta tabela de decisão:

- Editando lógica/testes: execute `pnpm test` (e `pnpm test:coverage` se mudou muita coisa)
- Tocando networking do gateway / protocolo WS / pareamento: adicione `pnpm test:e2e`
- Depurando “meu bot caiu” / falhas específicas de provedor / chamadas de ferramenta: execute um `pnpm test:live` restrito

## Live: varredura de capacidades de nó Android

- Teste: `src/gateway/android-node.capabilities.live.test.ts`
- Script: `pnpm android:test:integration`
- Objetivo: invocar **todos os comandos atualmente anunciados** por um nó Android conectado e verificar o comportamento do contrato do comando.
- Escopo:
  - Configuração manual/pré-condicionada (a suíte não instala/executa/pareia o app).
  - Validação `node.invoke` do gateway comando por comando para o nó Android selecionado.
- Pré-configuração obrigatória:
  - App Android já conectado + pareado com o gateway.
  - App mantido em primeiro plano.
  - Permissões/consentimento de captura concedidos para as capacidades que você espera que passem.
- Substituições opcionais de alvo:
  - `OPENCLAW_ANDROID_NODE_ID` ou `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Detalhes completos de configuração do Android: [App Android](/platforms/android)

## Live: smoke de modelo (chaves de perfil)

Testes live são divididos em duas camadas para podermos isolar falhas:

- “Modelo direto” nos diz se o provedor/modelo consegue responder com a chave fornecida.
- “Gateway smoke” nos diz se todo o pipeline gateway+agente funciona para esse modelo (sessões, histórico, ferramentas, política de sandbox etc.).

### Camada 1: conclusão direta do modelo (sem gateway)

- Teste: `src/agents/models.profiles.live.test.ts`
- Objetivo:
  - Enumerar modelos descobertos
  - Usar `getApiKeyForModel` para selecionar modelos para os quais você tem credenciais
  - Executar uma pequena conclusão por modelo (e regressões direcionadas quando necessário)
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
- Defina `OPENCLAW_LIVE_MODELS=modern` (ou `all`, alias de modern) para realmente executar esta suíte; caso contrário ela é ignorada para manter `pnpm test:live` focado no gateway smoke
- Como selecionar modelos:
  - `OPENCLAW_LIVE_MODELS=modern` para rodar a allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` é um alias para a allowlist moderna
  - ou `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (allowlist separada por vírgulas)
- Como selecionar provedores:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (allowlist separada por vírgulas)
- De onde vêm as chaves:
  - Por padrão: armazenamento de perfis e fallbacks de ambiente
  - Defina `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para impor **somente o armazenamento de perfis**
- Por que isso existe:
  - Separa “a API do provedor está quebrada / a chave é inválida” de “o pipeline do agente do gateway está quebrado”
  - Contém regressões pequenas e isoladas (exemplo: replay de raciocínio + fluxos de chamada de ferramenta em OpenAI Responses/Codex Responses)

### Camada 2: gateway + smoke do agente dev (o que "@openclaw" realmente faz)

- Teste: `src/gateway/gateway-models.profiles.live.test.ts`
- Objetivo:
  - Subir um gateway in-process
  - Criar/aplicar patch em uma sessão `agent:dev:*` (substituição de modelo por execução)
  - Iterar por modelos com chaves e verificar:
    - resposta “significativa” (sem ferramentas)
    - uma invocação real de ferramenta funciona (sonda de leitura)
    - sondas opcionais extras de ferramenta (exec+read probe)
    - caminhos de regressão do OpenAI (somente chamada de ferramenta → follow-up) continuam funcionando
- Detalhes das sondas (para você conseguir explicar falhas rapidamente):
  - sonda `read`: o teste grava um arquivo nonce no workspace e pede ao agente para fazer `read` dele e ecoar o nonce de volta.
  - sonda `exec+read`: o teste pede ao agente para gravar um nonce via `exec` em um arquivo temporário e depois lê-lo de volta.
  - sonda de imagem: o teste anexa um PNG gerado (gato + código aleatório) e espera que o modelo retorne `cat <CODE>`.
  - Referência de implementação: `src/gateway/gateway-models.profiles.live.test.ts` e `src/gateway/live-image-probe.ts`.
- Como ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
- Como selecionar modelos:
  - Padrão: allowlist moderna (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` é um alias para a allowlist moderna
  - Ou defina `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (ou lista separada por vírgulas) para restringir
- Como selecionar provedores (evitar “tudo do OpenRouter”):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (allowlist separada por vírgulas)
- Sondas de ferramenta + imagem estão sempre ativadas neste teste live:
  - sonda `read` + sonda `exec+read` (estresse de ferramenta)
  - a sonda de imagem roda quando o modelo anuncia suporte a entrada de imagem
  - Fluxo (alto nível):
    - O teste gera um PNG minúsculo com “CAT” + código aleatório (`src/gateway/live-image-probe.ts`)
    - Envia via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - O gateway converte anexos em `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - O agente embutido encaminha uma mensagem multimodal do usuário para o modelo
    - Verificação: a resposta contém `cat` + o código (tolerância de OCR: pequenos erros são aceitos)

Dica: para ver o que você pode testar na sua máquina (e os IDs exatos `provider/model`), execute:

```bash
openclaw models list
openclaw models list --json
```

## Live: smoke de backend CLI (Claude CLI ou outras CLIs locais)

- Teste: `src/gateway/gateway-cli-backend.live.test.ts`
- Objetivo: validar o pipeline gateway + agente usando um backend CLI local, sem tocar na sua configuração padrão.
- Ativar:
  - `pnpm test:live` (ou `OPENCLAW_LIVE_TEST=1` se chamar o Vitest diretamente)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Padrões:
  - Modelo: `claude-cli/claude-sonnet-4-6`
  - Comando: `claude`
  - Args: `["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]`
- Substituições (opcionais):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-opus-4-6"`
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/claude"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["-p","--output-format","stream-json","--include-partial-messages","--verbose","--permission-mode","bypassPermissions"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_CLEAR_ENV='["ANTHROPIC_API_KEY","ANTHROPIC_API_KEY_OLD"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1` para enviar um anexo de imagem real (caminhos são injetados no prompt).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"` para passar caminhos de arquivo de imagem como args da CLI em vez de injeção no prompt.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (ou `"list"`) para controlar como args de imagem são passados quando `IMAGE_ARG` está definido.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1` para enviar um segundo turno e validar o fluxo de retomada.
- `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0` para manter a configuração MCP do Claude CLI ativada (o padrão injeta um `--mcp-config` vazio e estrito temporário para manter servidores MCP globais/ambientes desativados durante o smoke).

Exemplo:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="claude-cli/claude-sonnet-4-6" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Receita Docker:

```bash
pnpm test:docker:live-cli-backend
```

Observações:

- O runner Docker fica em `scripts/test-live-cli-backend-docker.sh`.
- Ele executa o smoke live de backend CLI dentro da imagem Docker do repositório como o usuário não root `node`, porque o Claude CLI rejeita `bypassPermissions` quando invocado como root.
- Para `claude-cli`, ele instala o pacote Linux `@anthropic-ai/claude-code` em um prefixo gravável com cache em `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (padrão: `~/.cache/openclaw/docker-cli-tools`).
- Para `claude-cli`, o smoke live injeta uma configuração MCP vazia e estrita, a menos que você defina `OPENCLAW_LIVE_CLI_BACKEND_DISABLE_MCP_CONFIG=0`.
- Ele copia `~/.claude` para o contêiner quando disponível, mas em máquinas onde a autenticação do Claude é baseada em `ANTHROPIC_API_KEY`, ele também preserva `ANTHROPIC_API_KEY` / `ANTHROPIC_API_KEY_OLD` para o Claude CLI filho por meio de `OPENCLAW_LIVE_CLI_BACKEND_PRESERVE_ENV`.

## Live: smoke de binding ACP (`/acp spawn ... --bind here`)

- Teste: `src/gateway/gateway-acp-bind.live.test.ts`
- Objetivo: validar o fluxo real de bind de conversa ACP com um agente ACP live:
  - enviar `/acp spawn <agent> --bind here`
  - vincular uma conversa sintética de canal de mensagem no lugar
  - enviar um follow-up normal nessa mesma conversa
  - verificar que o follow-up cai na transcrição da sessão ACP vinculada
- Ativar:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Padrões:
  - Agente ACP: `claude`
  - Canal sintético: contexto de conversa em estilo Slack DM
  - Backend ACP: `acpx`
- Substituições:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=/full/path/to/acpx`
- Observações:
  - Essa lane usa a superfície `chat.send` do gateway com campos admin-only de rota de origem sintética para que testes possam anexar contexto de canal de mensagem sem fingir entrega externa.
  - Quando `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND` não está definido, o teste usa o comando `acpx` configurado/empacotado. Se a autenticação do seu harness depende de vars de ambiente de `~/.profile`, prefira um comando `acpx` customizado que preserve o env do provedor.

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

Observações sobre Docker:

- O runner Docker fica em `scripts/test-live-acp-bind-docker.sh`.
- Ele carrega `~/.profile`, copia a home de autenticação CLI correspondente (`~/.claude` ou `~/.codex`) para o contêiner, instala `acpx` em um prefixo npm gravável e depois instala a CLI live solicitada (`@anthropic-ai/claude-code` ou `@openai/codex`) se estiver ausente.
- Dentro do Docker, o runner define `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx` para que o acpx mantenha variáveis de ambiente do provedor vindas do profile carregado disponíveis para a CLI harness filha.

### Receitas live recomendadas

Allowlists estreitas e explícitas são mais rápidas e menos instáveis:

- Modelo único, direto (sem gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Modelo único, gateway smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Chamada de ferramenta em vários provedores:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Foco em Google (chave de API Gemini + Antigravity):
  - Gemini (chave de API): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Observações:

- `google/...` usa a API Gemini (chave de API).
- `google-antigravity/...` usa a ponte OAuth Antigravity (endpoint de agente estilo Cloud Code Assist).
- `google-gemini-cli/...` usa a Gemini CLI local na sua máquina (autenticação separada + peculiaridades de tooling).
- Gemini API vs Gemini CLI:
  - API: o OpenClaw chama a API hospedada Gemini do Google por HTTP (autenticação por chave de API / perfil); é isso que a maioria dos usuários quer dizer com “Gemini”.
  - CLI: o OpenClaw executa um binário `gemini` local; ele tem sua própria autenticação e pode se comportar de forma diferente (streaming/suporte a ferramentas/incompatibilidade de versões).

## Live: matriz de modelos (o que cobrimos)

Não existe uma “lista fixa de modelos de CI” (live é opt-in), mas estes são os modelos **recomendados** para cobrir regularmente em uma máquina de desenvolvimento com chaves.

### Conjunto moderno de smoke (chamada de ferramenta + imagem)

Esta é a execução de “modelos comuns” que esperamos manter funcionando:

- OpenAI (não-Codex): `openai/gpt-5.4` (opcional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (ou `anthropic/claude-sonnet-4-6`)
- Google (API Gemini): `google/gemini-3.1-pro-preview` e `google/gemini-3-flash-preview` (evite modelos Gemini 2.x mais antigos)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` e `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Execute gateway smoke com ferramentas + imagem:
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
- Mistral: `mistral/`… (escolha um modelo compatível com “tools” que você tenha ativado)
- Cerebras: `cerebras/`… (se você tiver acesso)
- LM Studio: `lmstudio/`… (local; a chamada de ferramenta depende do modo da API)

### Visão: envio de imagem (anexo → mensagem multimodal)

Inclua pelo menos um modelo compatível com imagem em `OPENCLAW_LIVE_GATEWAY_MODELS` (variantes compatíveis com visão de Claude/Gemini/OpenAI etc.) para exercitar a sonda de imagem.

### Agregadores / gateways alternativos

Se você tiver chaves ativadas, também temos suporte a testes via:

- OpenRouter: `openrouter/...` (centenas de modelos; use `openclaw models scan` para encontrar candidatos compatíveis com ferramentas+imagem)
- OpenCode: `opencode/...` para Zen e `opencode-go/...` para Go (autenticação via `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Mais provedores que você pode incluir na matriz live (se tiver credenciais/configuração):

- Integrados: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Via `models.providers` (endpoints personalizados): `minimax` (cloud/API), mais qualquer proxy compatível com OpenAI/Anthropic (LM Studio, vLLM, LiteLLM etc.)

Dica: não tente fixar “todos os modelos” na documentação. A lista autoritativa é o que `discoverModels(...)` retorna na sua máquina + as chaves disponíveis.

## Credenciais (nunca faça commit)

Testes live descobrem credenciais da mesma forma que a CLI. Implicações práticas:

- Se a CLI funciona, testes live devem encontrar as mesmas chaves.
- Se um teste live disser “no creds”, depure da mesma forma que faria com `openclaw models list` / seleção de modelo.

- Perfis de autenticação por agente: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (é isso que “profile keys” significa nos testes live)
- Configuração: `~/.openclaw/openclaw.json` (ou `OPENCLAW_CONFIG_PATH`)
- Diretório de estado legado: `~/.openclaw/credentials/` (copiado para a home staged live quando presente, mas não é o armazenamento principal de profile keys)
- Execuções live locais copiam por padrão a configuração ativa, arquivos `auth-profiles.json` por agente, `credentials/` legado e diretórios de autenticação de CLI externa compatíveis para uma home temporária de teste; substituições de caminho `agents.*.workspace` / `agentDir` são removidas nessa configuração staged para que probes fiquem longe do workspace real do host.

Se quiser depender de chaves de ambiente (por exemplo exportadas no seu `~/.profile`), execute testes locais após `source ~/.profile`, ou use os runners Docker abaixo (eles podem montar `~/.profile` no contêiner).

## Deepgram live (transcrição de áudio)

- Teste: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Ativar: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus coding plan live

- Teste: `src/agents/byteplus.live.test.ts`
- Ativar: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Substituição opcional de modelo: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## Geração de imagem live

- Teste: `src/image-generation/runtime.live.test.ts`
- Comando: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Escopo:
  - Enumera todos os plugins registrados de provedores de geração de imagem
  - Carrega variáveis de ambiente ausentes de provedores a partir do seu shell de login (`~/.profile`) antes de sondar
  - Usa por padrão chaves de API live/env antes de perfis de autenticação armazenados, para que chaves de teste obsoletas em `auth-profiles.json` não mascarem credenciais reais do shell
  - Ignora provedores sem autenticação/perfil/modelo utilizável
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
- Comportamento opcional de autenticação:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para forçar autenticação pelo armazenamento de perfis e ignorar substituições somente de ambiente

## Runners Docker (verificações opcionais “funciona em Linux”)

Esses runners Docker se dividem em dois grupos:

- Runners live-model: `test:docker:live-models` e `test:docker:live-gateway` executam apenas seu arquivo live correspondente de profile-key dentro da imagem Docker do repositório (`src/agents/models.profiles.live.test.ts` e `src/gateway/gateway-models.profiles.live.test.ts`), montando seu diretório local de configuração e workspace (e carregando `~/.profile` se montado). Os entrypoints locais correspondentes são `test:live:models-profiles` e `test:live:gateway-profiles`.
- Runners Docker live usam por padrão um limite menor de smoke para manter viável uma varredura Docker completa:
  `test:docker:live-models` usa por padrão `OPENCLAW_LIVE_MAX_MODELS=12`, e
  `test:docker:live-gateway` usa por padrão `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` e
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Substitua essas variáveis quando
  você quiser explicitamente a varredura maior e exaustiva.
- `test:docker:all` constrói a imagem Docker live uma vez via `test:docker:live-build`, depois a reutiliza nas duas lanes Docker live.
- Runners smoke de contêiner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` e `test:docker:plugins` iniciam um ou mais contêineres reais e verificam caminhos de integração de nível mais alto.

Os runners Docker live-model também fazem bind-mount apenas das homes de autenticação CLI necessárias (ou de todas as compatíveis quando a execução não está restrita), depois as copiam para a home do contêiner antes da execução para que OAuth de CLI externa possa atualizar tokens sem alterar o armazenamento de autenticação do host:

- Modelos diretos: `pnpm test:docker:live-models` (script: `scripts/test-live-models-docker.sh`)
- ACP bind smoke: `pnpm test:docker:live-acp-bind` (script: `scripts/test-live-acp-bind-docker.sh`)
- CLI backend smoke: `pnpm test:docker:live-cli-backend` (script: `scripts/test-live-cli-backend-docker.sh`)
- Gateway + agente dev: `pnpm test:docker:live-gateway` (script: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI live smoke: `pnpm test:docker:openwebui` (script: `scripts/e2e/openwebui-docker.sh`)
- Assistente de onboarding (TTY, scaffolding completo): `pnpm test:docker:onboard` (script: `scripts/e2e/onboard-docker.sh`)
- Networking do gateway (dois contêineres, autenticação WS + health): `pnpm test:docker:gateway-network` (script: `scripts/e2e/gateway-network-docker.sh`)
- Ponte de canal MCP (Gateway seeded + ponte stdio + smoke bruto de frame de notificação do Claude): `pnpm test:docker:mcp-channels` (script: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (smoke de instalação + alias `/plugin` + semântica de reinício de bundle Claude): `pnpm test:docker:plugins` (script: `scripts/e2e/plugins-docker.sh`)

Os runners Docker live-model também fazem bind-mount do checkout atual como somente leitura e
o preparam em um workdir temporário dentro do contêiner. Isso mantém a imagem de runtime
enxuta enquanto ainda executa o Vitest exatamente no seu source/config local.
Eles também definem `OPENCLAW_SKIP_CHANNELS=1` para que probes live do gateway não iniciem
workers reais de canais Telegram/Discord/etc. dentro do contêiner.
`test:docker:live-models` ainda executa `pnpm test:live`, então passe também
`OPENCLAW_LIVE_GATEWAY_*` quando precisar restringir ou excluir cobertura live
de gateway dessa lane Docker.
`test:docker:openwebui` é um smoke de compatibilidade de nível mais alto: ele inicia um
contêiner de gateway OpenClaw com endpoints HTTP compatíveis com OpenAI ativados,
inicia um contêiner Open WebUI fixado apontando para esse gateway, faz login pelo
Open WebUI, verifica que `/api/models` expõe `openclaw/default`, depois envia uma
solicitação real de chat pelo proxy `/api/chat/completions` do Open WebUI.
A primeira execução pode ser visivelmente mais lenta porque o Docker pode precisar baixar a
imagem do Open WebUI e o Open WebUI pode precisar concluir sua própria configuração inicial.
Essa lane espera uma chave de modelo live utilizável, e `OPENCLAW_PROFILE_FILE`
(`~/.profile` por padrão) é a forma principal de fornecê-la em execuções Dockerizadas.
Execuções bem-sucedidas imprimem um pequeno payload JSON como `{ "ok": true, "model":
"openclaw/default", ... }`.
`test:docker:mcp-channels` é intencionalmente determinístico e não precisa de uma
conta real de Telegram, Discord ou iMessage. Ele inicia um contêiner Gateway seeded,
inicia um segundo contêiner que executa `openclaw mcp serve` e depois
verifica descoberta de conversa roteada, leituras de transcrição, metadados de anexos,
comportamento da fila de eventos live, roteamento de envio de saída e notificações em estilo Claude de canal +
permissão pela ponte MCP stdio real. A verificação de notificação
inspeciona diretamente os frames MCP stdio brutos, então o smoke valida o que a
ponte realmente emite, não apenas o que um SDK específico de cliente por acaso expõe.

Smoke manual de thread ACP em linguagem simples (não CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Mantenha esse script para fluxos de regressão/depuração. Ele pode ser necessário novamente para validação de roteamento de thread ACP, então não o exclua.

Variáveis de ambiente úteis:

- `OPENCLAW_CONFIG_DIR=...` (padrão: `~/.openclaw`) montado em `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (padrão: `~/.openclaw/workspace`) montado em `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (padrão: `~/.profile`) montado em `/home/node/.profile` e carregado antes de rodar os testes
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (padrão: `~/.cache/openclaw/docker-cli-tools`) montado em `/home/node/.npm-global` para instalações CLI em cache dentro do Docker
- Diretórios de autenticação de CLI externa sob `$HOME` são montados como somente leitura em `/host-auth/...`, depois copiados para `/home/node/...` antes do início dos testes
  - Padrão: monta todos os diretórios compatíveis (`.codex`, `.claude`, `.minimax`)
  - Execuções restritas por provedor montam apenas os diretórios necessários inferidos de `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Substitua manualmente com `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` ou uma lista separada por vírgulas, como `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...` para restringir a execução
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...` para filtrar provedores dentro do contêiner
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1` para garantir que credenciais venham do armazenamento de perfis (não do ambiente)
- `OPENCLAW_OPENWEBUI_MODEL=...` para escolher o modelo exposto pelo gateway para o smoke do Open WebUI
- `OPENCLAW_OPENWEBUI_PROMPT=...` para substituir o prompt de verificação de nonce usado pelo smoke do Open WebUI
- `OPENWEBUI_IMAGE=...` para substituir a tag fixada da imagem do Open WebUI

## Verificação básica de docs

Execute verificações de docs após edições em documentação: `pnpm check:docs`.
Execute a validação completa de âncoras do Mintlify quando também precisar de verificações de heading na própria página: `pnpm docs:check-links:anchors`.

## Regressão offline (segura para CI)

Estas são regressões de “pipeline real” sem provedores reais:

- Chamada de ferramenta do gateway (OpenAI mockado, gateway real + loop do agente): `src/gateway/gateway.test.ts` (caso: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Assistente do gateway (WS `wizard.start`/`wizard.next`, grava config + auth aplicada): `src/gateway/gateway.test.ts` (caso: "runs wizard over ws and writes auth token config")

## Evals de confiabilidade do agente (Skills)

Já temos alguns testes seguros para CI que se comportam como “evals de confiabilidade do agente”:

- Chamada de ferramenta mockada pelo gateway real + loop do agente (`src/gateway/gateway.test.ts`).
- Fluxos end-to-end do assistente que validam wiring de sessão e efeitos de configuração (`src/gateway/gateway.test.ts`).

O que ainda falta para Skills (veja [Skills](/tools/skills)):

- **Tomada de decisão:** quando Skills estão listadas no prompt, o agente escolhe a Skill certa (ou evita as irrelevantes)?
- **Conformidade:** o agente lê `SKILL.md` antes de usar e segue etapas/args obrigatórios?
- **Contratos de fluxo:** cenários de múltiplos turnos que verificam ordem de ferramentas, continuidade do histórico de sessão e limites de sandbox.

Evals futuras devem permanecer determinísticas primeiro:

- Um scenario runner usando provedores mockados para verificar chamadas de ferramenta + ordem, leituras de arquivo de Skill e wiring de sessão.
- Uma pequena suíte de cenários focados em Skill (usar vs evitar, bloqueio, injeção de prompt).
- Evals live opcionais (opt-in, controladas por env) somente depois que a suíte segura para CI estiver pronta.

## Testes de contrato (forma de plugin e canal)

Testes de contrato verificam se todo plugin e canal registrado está em conformidade com seu
contrato de interface. Eles iteram por todos os plugins descobertos e executam uma suíte de
verificações de forma e comportamento. A lane unit padrão de `pnpm test` intencionalmente
ignora esses arquivos compartilhados de seam e smoke; execute os comandos de contrato explicitamente
quando mexer em superfícies compartilhadas de canal ou provedor.

### Comandos

- Todos os contratos: `pnpm test:contracts`
- Apenas contratos de canal: `pnpm test:contracts:channels`
- Apenas contratos de provedor: `pnpm test:contracts:plugins`

### Contratos de canal

Localizados em `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Forma básica do plugin (id, nome, capabilities)
- **setup** - Contrato do assistente de configuração
- **session-binding** - Comportamento de binding de sessão
- **outbound-payload** - Estrutura do payload de mensagem
- **inbound** - Tratamento de mensagem recebida
- **actions** - Handlers de ação do canal
- **threading** - Tratamento de ID de thread
- **directory** - API de diretório/lista
- **group-policy** - Aplicação de política de grupo

### Contratos de status de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`.

- **status** - Sondas de status de canal
- **registry** - Forma do registro de plugins

### Contratos de provedor

Localizados em `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Contrato do fluxo de autenticação
- **auth-choice** - Escolha/seleção de autenticação
- **catalog** - API de catálogo de modelos
- **discovery** - Descoberta de plugin
- **loader** - Carregamento de plugin
- **runtime** - Runtime de provedor
- **shape** - Forma/interface do plugin
- **wizard** - Assistente de configuração

### Quando executar

- Após alterar exports ou subpaths do plugin-sdk
- Após adicionar ou modificar um plugin de canal ou provedor
- Após refatorar registro ou descoberta de plugin

Testes de contrato rodam em CI e não exigem chaves de API reais.

## Adicionando regressões (orientação)

Quando você corrige um problema de provedor/modelo descoberto em live:

- Adicione uma regressão segura para CI se possível (provedor mockado/stubado ou capture a transformação exata do formato da solicitação)
- Se for inerentemente live-only (rate limits, políticas de autenticação), mantenha o teste live restrito e opt-in por variáveis de ambiente
- Prefira mirar a menor camada que captura o bug:
  - bug de conversão/replay de solicitação do provedor → teste de modelos diretos
  - bug no pipeline de sessão/histórico/ferramenta do gateway → gateway live smoke ou teste mockado do gateway seguro para CI
- Guardrail de travessia de SecretRef:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` deriva um alvo amostrado por classe de SecretRef a partir de metadados do registro (`listSecretTargetRegistryEntries()`), depois verifica se IDs exec de segmento de travessia são rejeitados.
  - Se você adicionar uma nova família de alvo SecretRef `includeInPlan` em `src/secrets/target-registry-data.ts`, atualize `classifyTargetClass` nesse teste. O teste falha intencionalmente em IDs de alvo não classificados para que novas classes não possam ser ignoradas silenciosamente.
