---
read_when:
    - Consultar uma etapa ou flag específica do onboarding
    - Automatizar o onboarding com o modo não interativo
    - Depurar o comportamento do onboarding
sidebarTitle: Onboarding Reference
summary: 'Referência completa do onboarding da CLI: cada etapa, flag e campo de configuração'
title: Referência de onboarding
x-i18n:
    generated_at: "2026-04-05T12:53:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae6c76a31885c0678af2ac71254c5baf08f6de5481f85f6cfdf44d473946fdb8
    source_path: reference/wizard.md
    workflow: 15
---

# Referência de onboarding

Esta é a referência completa de `openclaw onboard`.
Para uma visão geral de alto nível, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## Detalhes do fluxo (modo local)

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha **Manter / Modificar / Redefinir**.
    - Executar o onboarding novamente **não** apaga nada, a menos que você escolha explicitamente **Redefinir**
      (ou passe `--reset`).
    - O padrão da CLI para `--reset` é `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` (nunca `rm`) e oferece estes escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)
  </Step>
  <Step title="Modelo/Autenticação">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave, depois a salva para uso pelo daemon.
    - **Anthropic Claude CLI**: opção preferida de assistente Anthropic em onboarding/configuração. No macOS, o onboarding verifica o item do Keychain "Claude Code-credentials" (escolha "Always Allow" para que inicializações pelo launchd não bloqueiem); no Linux/Windows, ele reutiliza `~/.claude/.credentials.json` se existir e muda a seleção de modelo para uma ref canônica `claude-cli/claude-*`.
    - **Anthropic setup-token (legado/manual)**: voltou a ficar disponível em onboarding/configuração, mas a Anthropic informou aos usuários do OpenClaw que o caminho de login do Claude do OpenClaw conta como uso de harness de terceiros e exige **Extra Usage** na conta Claude.
    - **Assinatura OpenAI Code (Codex) (Codex CLI)**: se `~/.codex/auth.json` existir, o onboarding pode reutilizá-lo. Credenciais reutilizadas do Codex CLI continuam sendo gerenciadas pelo Codex CLI; ao expirarem, o OpenClaw relê primeiro essa fonte e, quando o provedor consegue atualizá-la, grava a credencial atualizada de volta no armazenamento do Codex em vez de assumir sua gestão.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo no navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo não está definido ou é `openai/*`.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave, depois a armazena em perfis de autenticação.
      - Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.
    - **Chave de API do xAI (Grok)**: solicita `XAI_API_KEY` e configura xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: solicita a base URL do Ollama, oferece o modo **Cloud + Local** ou **Local**, descobre os modelos disponíveis e faz `pull` automático do modelo local selecionado quando necessário.
    - Mais detalhes: [Ollama](/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      A configuração por chave de API usa `minimax/...`, e a configuração por OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para o endpoint padrão do StepFun ou para Step Plan, em endpoints da China ou globais.
    - O padrão atualmente inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
    - **Ignorar**: nenhuma autenticação configurada ainda.
    - Escolha um modelo padrão entre as opções detectadas (ou informe `provider/model` manualmente). Para melhor qualidade e menor risco de prompt injection, escolha o modelo mais forte e mais recente disponível na sua pilha de provedores.
    - O onboarding executa uma verificação do modelo e avisa se o modelo configurado é desconhecido ou se falta autenticação.
    - O modo padrão de armazenamento de chave de API usa valores em texto simples no perfil de autenticação. Use `--secret-input-mode ref` para armazenar refs baseadas em env em vez disso (por exemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é apenas fonte legada de importação.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para headless/servidor: conclua o OAuth em uma máquina com navegador e depois copie
    o `auth-profiles.json` desse agente (por exemplo,
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente em
    `$OPENCLAW_STATE_DIR/...`) para o gateway host. `credentials/oauth.json`
    é apenas uma fonte legada de importação.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos do workspace necessários para o ritual de bootstrap do agente.
    - Layout completo do workspace + guia de backup: [Workspace do agente](/pt-BR/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais ainda precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
      - O Quickstart reutiliza SecretRefs existentes de `gateway.auth.token` nos provedores `env`, `file` e `exec` para bootstrap de sonda/dashboard do onboarding.
      - Se esse SecretRef estiver configurado, mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção, em vez de degradar silenciosamente a autenticação em runtime.
    - No modo senha, a configuração interativa também oferece armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token em modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinada com `--gateway-token`.
    - Desative a autenticação apenas se você confiar totalmente em todos os processos locais.
    - Binds fora de loopback ainda exigem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON de service account + audiência do webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token do bot + base URL.
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração de conta.
    - [BlueBubbles](/pt-BR/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + webhook.
    - [iMessage](/pt-BR/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados.
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove com `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Busca na web">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou ignore).
    - Provedores baseados em API podem usar variáveis de ambiente ou configuração existente para configuração rápida; provedores sem chave usam seus próprios pré-requisitos específicos.
    - Ignore com `--skip-search`.
    - Configure depois com: `openclaw configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer uma sessão de usuário logada; para modo headless, use um LaunchDaemon personalizado (não enviado).
    - Linux (e Windows via WSL2): unidade systemd de usuário
      - O onboarding tenta habilitar linger via `loginctl enable-linger <user>` para que o Gateway continue ativo após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta primeiro sem sudo.
    - **Seleção de runtime:** Node (recomendado; necessário para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores resolvidos de token em texto simples nos metadados de ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e o token SecretRef configurado não estiver resolvido, a instalação do daemon é bloqueada com orientações acionáveis.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` adiciona a sonda de integridade do gateway ativo à saída de status, incluindo sondas de canal quando compatíveis (requer um gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica requisitos.
    - Permite escolher um gerenciador de Node: **npm / pnpm** (bun não recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo + próximos passos, incluindo apps para iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a UI de controle em vez de abrir um navegador.
Se os assets da UI de controle estiverem ausentes, o onboarding tenta gerá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Modo não interativo

Use `--non-interactive` para automatizar ou criar scripts de onboarding:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Adicione `--json` para um resumo legível por máquina.

Gateway token SecretRef no modo não interativo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` e `--gateway-token-ref-env` são mutuamente exclusivos.

<Note>
`--json` **não** implica modo não interativo. Use `--non-interactive` (e `--workspace`) para scripts.
</Note>

Exemplos de comando específicos de provedor ficam em [Automação da CLI](/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para a semântica das flags e a ordem das etapas.

### Adicionar agente (não interativo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC do assistente do Gateway

O Gateway expõe o fluxo de onboarding por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Clientes (app do macOS, UI de controle) podem renderizar etapas sem reimplementar a lógica de onboarding.

## Configuração do Signal (signal-cli)

O onboarding pode instalar `signal-cli` a partir das releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativas são usadas quando disponíveis.
- O Windows usa WSL2; a instalação do signal-cli segue o fluxo Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (detalhes de comportamento: [Referência de configuração da CLI](/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) quando você opta por elas durante os prompts (nomes são resolvidos para IDs quando possível).
- `skills.install.nodeManager`
  - `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode usar `yarn` definindo `skills.install.nodeManager` diretamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

Alguns canais são entregues como plugins. Quando você escolhe um deles durante a configuração, o onboarding
solicita a instalação dele (npm ou caminho local) antes que possa ser configurado.

## Documentação relacionada

- Visão geral do onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Onboarding do app macOS: [Onboarding](/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [BlueBubbles](/pt-BR/channels/bluebubbles) (iMessage), [iMessage](/pt-BR/channels/imessage) (legado)
- Skills: [Skills](/tools/skills), [Configuração de Skills](/tools/skills-config)
