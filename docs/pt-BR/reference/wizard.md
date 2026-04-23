---
read_when:
    - Consultando uma etapa ou flag específica do onboarding
    - Automatizando o onboarding com modo não interativo
    - Depurando o comportamento do onboarding
sidebarTitle: Onboarding Reference
summary: 'Referência completa do onboarding da CLI: cada etapa, flag e campo de configuração'
title: Referência de onboarding
x-i18n:
    generated_at: "2026-04-23T05:43:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 51405f5d9ba3d9553662fd0a03254a709d5eb4b27339c5edfe1da1111629d0dd
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
    - A CLI `--reset` usa por padrão `config+creds+sessions`; use `--reset-scope full`
      para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede
      que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` (nunca `rm`) e oferece escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)
  </Step>
  <Step title="Modelo/Auth">
    - **Chave de API da Anthropic**: usa `ANTHROPIC_API_KEY` se presente ou solicita uma chave, depois a salva para uso pelo daemon.
    - **Chave de API da Anthropic**: escolha preferida de assistente Anthropic em onboarding/configuração.
    - **setup-token da Anthropic**: ainda disponível em onboarding/configuração, embora o OpenClaw agora prefira reutilizar Claude CLI quando disponível.
    - **Assinatura OpenAI Code (Codex) (OAuth)**: fluxo via navegador; cole o `code#state`.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo não estiver definido ou for `openai/*`.
    - **Assinatura OpenAI Code (Codex) (pareamento de dispositivo)**: fluxo de pareamento no navegador com um código de dispositivo de curta duração.
      - Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo não estiver definido ou for `openai/*`.
    - **Chave de API da OpenAI**: usa `OPENAI_API_KEY` se presente ou solicita uma chave, depois a armazena em perfis de autenticação.
      - Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo não estiver definido, for `openai/*` ou `openai-codex/*`.
    - **Chave de API do xAI (Grok)**: solicita `XAI_API_KEY` e configura o xAI como provedor de modelo.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`, obtenha em https://opencode.ai/auth) e permite escolher o catálogo Zen ou Go.
    - **Ollama**: primeiro oferece **Cloud + Local**, **Apenas Cloud** ou **Apenas local**. `Apenas Cloud` solicita `OLLAMA_API_KEY` e usa `https://ollama.com`; os modos com host solicitam a URL base do Ollama, descobrem os modelos disponíveis e fazem auto-pull do modelo local selecionado quando necessário; `Cloud + Local` também verifica se esse host do Ollama está autenticado para acesso à nuvem.
    - Mais detalhes: [Ollama](/pt-BR/providers/ollama)
    - **Chave de API**: armazena a chave para você.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Vercel AI Gateway](/pt-BR/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Mais detalhes: [Cloudflare AI Gateway](/pt-BR/providers/cloudflare-ai-gateway)
    - **MiniMax**: a configuração é gravada automaticamente; o padrão hospedado é `MiniMax-M2.7`.
      O setup por chave de API usa `minimax/...`, e o setup por OAuth usa
      `minimax-portal/...`.
    - Mais detalhes: [MiniMax](/pt-BR/providers/minimax)
    - **StepFun**: a configuração é gravada automaticamente para StepFun padrão ou Step Plan em endpoints da China ou globais.
    - O padrão atualmente inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    - Mais detalhes: [StepFun](/pt-BR/providers/stepfun)
    - **Synthetic (compatível com Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Mais detalhes: [Synthetic](/pt-BR/providers/synthetic)
    - **Moonshot (Kimi K2)**: a configuração é gravada automaticamente.
    - **Kimi Coding**: a configuração é gravada automaticamente.
    - Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/pt-BR/providers/moonshot)
    - **Pular**: ainda não configura autenticação.
    - Escolha um modelo padrão entre as opções detectadas (ou insira manualmente provider/model). Para melhor qualidade e menor risco de injeção de prompt, escolha o modelo mais forte e de geração mais recente disponível na sua pilha de provedores.
    - O onboarding executa uma verificação do modelo e avisa se o modelo configurado for desconhecido ou estiver sem autenticação.
    - O modo de armazenamento de chave de API usa por padrão valores em texto simples em perfis de autenticação. Use `--secret-input-mode ref` para armazenar refs apoiadas por variáveis de ambiente em vez disso (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Os perfis de autenticação ficam em `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (chaves de API + OAuth). `~/.openclaw/credentials/oauth.json` é legado e usado apenas para importação.
    - Mais detalhes: [/concepts/oauth](/pt-BR/concepts/oauth)
    <Note>
    Dica para ambiente headless/servidor: conclua o OAuth em uma máquina com navegador e depois copie
    o `auth-profiles.json` desse agente (por exemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente
    `$OPENCLAW_STATE_DIR/...`) para o host do Gateway. `credentials/oauth.json`
    é apenas uma fonte legada de importação.
    </Note>
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Preenche os arquivos de workspace necessários para o ritual de bootstrap do agente.
    - Guia completo de layout e backup do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Porta, bind, modo de autenticação, exposição via Tailscale.
    - Recomendação de autenticação: mantenha **Token** mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, o setup interativo oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opcional)
      - O início rápido reutiliza SecretRefs existentes de `gateway.auth.token` nos provedores `env`, `file` e `exec` para bootstrap de probe/dashboard no onboarding.
      - Se esse SecretRef estiver configurado, mas não puder ser resolvido, o onboarding falha cedo com uma mensagem clara de correção em vez de degradar silenciosamente a autenticação do runtime.
    - No modo senha, o setup interativo também oferece armazenamento em texto simples ou SecretRef.
    - Caminho de SecretRef de token no modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Exige uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação apenas se você confiar totalmente em todos os processos locais.
    - Binds fora de loopback ainda exigem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR.
    - [Telegram](/pt-BR/channels/telegram): token do bot.
    - [Discord](/pt-BR/channels/discord): token do bot.
    - [Google Chat](/pt-BR/channels/googlechat): JSON de conta de serviço + audience do Webhook.
    - [Mattermost](/pt-BR/channels/mattermost) (plugin): token do bot + URL base.
    - [Signal](/pt-BR/channels/signal): instalação opcional de `signal-cli` + configuração da conta.
    - [BlueBubbles](/pt-BR/channels/bluebubbles): **recomendado para iMessage**; URL do servidor + senha + Webhook.
    - [iMessage](/pt-BR/channels/imessage): caminho legado do CLI `imsg` + acesso ao DB.
    - Segurança de DM: o padrão é pareamento. O primeiro DM envia um código; aprove com `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Busca na web">
    - Escolha um provedor compatível, como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG ou Tavily (ou pule).
    - Provedores com API podem usar variáveis de ambiente ou configuração existente para setup rápido; provedores sem chave usam seus pré-requisitos específicos.
    - Pule com `--skip-search`.
    - Configure depois: `openclaw configure --section web`.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Exige uma sessão de usuário conectada; para headless, use um LaunchDaemon personalizado (não incluído).
    - Linux (e Windows via WSL2): unidade systemd de usuário
      - O onboarding tenta ativar lingering via `loginctl enable-linger <user>` para que o Gateway permaneça ativo após logout.
      - Pode pedir sudo (escreve em `/var/lib/systemd/linger`); ele tenta primeiro sem sudo.
    - **Seleção de runtime:** Node (recomendado; exigido para WhatsApp/Telegram). Bun **não é recomendado**.
    - Se a autenticação por token exigir um token e `gateway.auth.token` for gerenciado por SecretRef, a instalação do daemon o valida, mas não persiste valores resolvidos de token em texto simples nos metadados do ambiente do serviço supervisor.
    - Se a autenticação por token exigir um token e o SecretRef de token configurado estiver sem resolução, a instalação do daemon é bloqueada com orientação acionável.
    - Se `gateway.auth.token` e `gateway.auth.password` estiverem ambos configurados e `gateway.auth.mode` não estiver definido, a instalação do daemon será bloqueada até que o modo seja definido explicitamente.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o Gateway (se necessário) e executa `openclaw health`.
    - Dica: `openclaw status --deep` acrescenta a probe de integridade ao vivo do Gateway à saída de status, incluindo probes de canal quando houver suporte (exige um Gateway acessível).
  </Step>
  <Step title="Skills (recomendado)">
    - Lê as Skills disponíveis e verifica os requisitos.
    - Permite escolher um gerenciador de Node: **npm / pnpm** (bun não é recomendado).
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo + próximos passos, incluindo apps iOS/Android/macOS para recursos extras.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o onboarding imprime instruções de encaminhamento de porta SSH para a Control UI em vez de abrir um navegador.
Se os assets da Control UI estiverem ausentes, o onboarding tenta compilá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
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

SecretRef de token do Gateway no modo não interativo:

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

Exemplos de comandos específicos por provedor ficam em [Automação de CLI](/pt-BR/start/wizard-cli-automation#provider-specific-examples).
Use esta página de referência para a semântica das flags e a ordem das etapas.

### Adicionar agente (modo não interativo)

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
Clientes (app macOS, Control UI) podem renderizar etapas sem reimplementar a lógica de onboarding.

## Setup do Signal (`signal-cli`)

O onboarding pode instalar `signal-cli` a partir de releases do GitHub:

- Baixa o asset de release apropriado.
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`.
- Grava `channels.signal.cliPath` na sua configuração.

Observações:

- Builds JVM exigem **Java 21**.
- Builds nativas são usadas quando disponíveis.
- No Windows, usa WSL2; a instalação de `signal-cli` segue o fluxo do Linux dentro do WSL.

## O que o assistente grava

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa por padrão `"coding"` quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (mode, bind, auth, Tailscale)
- `session.dmScope` (detalhes do comportamento: [Referência de setup da CLI](/pt-BR/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack/Discord/Matrix/Microsoft Teams) quando você opta por isso durante os prompts (nomes são resolvidos para IDs quando possível).
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

Alguns canais são entregues como Plugins. Quando você escolhe um deles durante o setup, o onboarding
solicita a instalação (npm ou um caminho local) antes que ele possa ser configurado.

## Documentação relacionada

- Visão geral do onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Onboarding do app macOS: [Onboarding](/pt-BR/start/onboarding)
- Referência de configuração: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Provedores: [WhatsApp](/pt-BR/channels/whatsapp), [Telegram](/pt-BR/channels/telegram), [Discord](/pt-BR/channels/discord), [Google Chat](/pt-BR/channels/googlechat), [Signal](/pt-BR/channels/signal), [BlueBubbles](/pt-BR/channels/bluebubbles) (iMessage), [iMessage](/pt-BR/channels/imessage) (legado)
- Skills: [Skills](/pt-BR/tools/skills), [Configuração de Skills](/pt-BR/tools/skills-config)
