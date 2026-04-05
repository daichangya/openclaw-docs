---
read_when:
    - Você precisa do comportamento detalhado de `openclaw onboard`
    - Você está depurando resultados do onboarding ou integrando clientes de onboarding
sidebarTitle: CLI reference
summary: Referência completa do fluxo de configuração da CLI, configuração de autenticação/modelo, saídas e detalhes internos
title: Referência de configuração da CLI
x-i18n:
    generated_at: "2026-04-05T12:54:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9ec4e685e3237e450d11c45826c2bb34b82c0bba1162335f8fbb07f51ba00a70
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referência de configuração da CLI

Esta página é a referência completa para `openclaw onboard`.
Para o guia curto, consulte [Onboarding (CLI)](/pt-BR/start/wizard).

## O que o assistente faz

O modo local (padrão) guia você por:

- Configuração de modelo e autenticação (OAuth da assinatura OpenAI Code, Anthropic Claude CLI ou chave de API, além de opções para MiniMax, GLM, Ollama, Moonshot, StepFun e AI Gateway)
- Localização do workspace e arquivos de bootstrap
- Configurações do Gateway (porta, bind, autenticação, tailscale)
- Canais e provedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles e outros plugins de canal empacotados)
- Instalação do daemon (LaunchAgent, unidade de usuário do systemd ou Tarefa Agendada nativa do Windows com fallback para a pasta Startup)
- Verificação de integridade
- Configuração de Skills

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.
Ele não instala nem modifica nada no host remoto.

## Detalhes do fluxo local

<Steps>
  <Step title="Detecção de configuração existente">
    - Se `~/.openclaw/openclaw.json` existir, escolha Manter, Modificar ou Redefinir.
    - Executar novamente o assistente não apaga nada, a menos que você escolha explicitamente Redefinir (ou passe `--reset`).
    - O padrão da CLI para `--reset` é `config+creds+sessions`; use `--reset-scope full` para também remover o workspace.
    - Se a configuração for inválida ou contiver chaves legadas, o assistente para e pede que você execute `openclaw doctor` antes de continuar.
    - A redefinição usa `trash` e oferece estes escopos:
      - Apenas configuração
      - Configuração + credenciais + sessões
      - Redefinição completa (também remove o workspace)
  </Step>
  <Step title="Modelo e autenticação">
    - A matriz completa de opções está em [Opções de autenticação e modelo](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Padrão `~/.openclaw/workspace` (configurável).
    - Inicializa os arquivos do workspace necessários para o ritual de bootstrap da primeira execução.
    - Layout do workspace: [Workspace do agente](/pt-BR/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita porta, bind, modo de autenticação e exposição via tailscale.
    - Recomendado: mantenha a autenticação por token habilitada mesmo para loopback, para que clientes WS locais precisem se autenticar.
    - No modo token, a configuração interativa oferece:
      - **Gerar/armazenar token em texto simples** (padrão)
      - **Usar SecretRef** (opt-in)
    - No modo senha, a configuração interativa também oferece armazenamento em texto simples ou SecretRef.
    - Caminho SecretRef de token no modo não interativo: `--gateway-token-ref-env <ENV_VAR>`.
      - Requer uma variável de ambiente não vazia no ambiente do processo de onboarding.
      - Não pode ser combinado com `--gateway-token`.
    - Desative a autenticação apenas se você confiar totalmente em todos os processos locais.
    - Binds fora de loopback ainda exigem autenticação.
  </Step>
  <Step title="Canais">
    - [WhatsApp](/pt-BR/channels/whatsapp): login opcional por QR
    - [Telegram](/pt-BR/channels/telegram): token do bot
    - [Discord](/pt-BR/channels/discord): token do bot
    - [Google Chat](/pt-BR/channels/googlechat): JSON de service account + audience do webhook
    - [Mattermost](/pt-BR/channels/mattermost): token do bot + base URL
    - [Signal](/pt-BR/channels/signal): instalação opcional do `signal-cli` + configuração de conta
    - [BlueBubbles](/pt-BR/channels/bluebubbles): recomendado para iMessage; URL do servidor + senha + webhook
    - [iMessage](/pt-BR/channels/imessage): caminho legado do CLI `imsg` + acesso ao banco de dados
    - Segurança de DM: o padrão é pareamento. A primeira DM envia um código; aprove via
      `openclaw pairing approve <channel> <code>` ou use allowlists.
  </Step>
  <Step title="Instalação do daemon">
    - macOS: LaunchAgent
      - Requer sessão de usuário conectada; para modo headless, use um LaunchDaemon personalizado (não incluído).
    - Linux e Windows via WSL2: unidade de usuário do systemd
      - O assistente tenta `loginctl enable-linger <user>` para que o gateway continue ativo após logout.
      - Pode solicitar sudo (grava em `/var/lib/systemd/linger`); ele tenta primeiro sem sudo.
    - Windows nativo: Tarefa Agendada primeiro
      - Se a criação da tarefa for negada, o OpenClaw recorre a um item de login por usuário na pasta Startup e inicia o gateway imediatamente.
      - Tarefas Agendadas continuam sendo preferidas porque fornecem melhor status do supervisor.
    - Seleção de runtime: Node (recomendado; necessário para WhatsApp e Telegram). Bun não é recomendado.
  </Step>
  <Step title="Verificação de integridade">
    - Inicia o gateway (se necessário) e executa `openclaw health`.
    - `openclaw status --deep` adiciona a sonda de integridade do gateway ativo à saída de status, incluindo sondas de canal quando compatíveis.
  </Step>
  <Step title="Skills">
    - Lê as Skills disponíveis e verifica requisitos.
    - Permite escolher o gerenciador de Node: npm, pnpm ou bun.
    - Instala dependências opcionais (algumas usam Homebrew no macOS).
  </Step>
  <Step title="Finalizar">
    - Resumo e próximos passos, incluindo opções de app para iOS, Android e macOS.
  </Step>
</Steps>

<Note>
Se nenhuma GUI for detectada, o assistente imprime instruções de encaminhamento de porta SSH para a UI de controle em vez de abrir um navegador.
Se os assets da UI de controle estiverem ausentes, o assistente tenta gerá-los; o fallback é `pnpm ui:build` (instala automaticamente as dependências da UI).
</Note>

## Detalhes do modo remoto

O modo remoto configura esta máquina para se conectar a um gateway em outro lugar.

<Info>
O modo remoto não instala nem modifica nada no host remoto.
</Info>

O que você define:

- URL do gateway remoto (`ws://...`)
- Token, se a autenticação do gateway remoto for obrigatória (recomendado)

<Note>
- Se o gateway estiver restrito a loopback, use túnel SSH ou uma tailnet.
- Dicas de descoberta:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opções de autenticação e modelo

<AccordionGroup>
  <Accordion title="Chave de API da Anthropic">
    Usa `ANTHROPIC_API_KEY` se estiver presente ou solicita uma chave, depois a salva para uso pelo daemon.
  </Accordion>
  <Accordion title="Anthropic Claude CLI">
    Reutiliza um login local do Claude CLI no gateway host e muda a seleção
    do modelo para uma ref canônica `claude-cli/claude-*`.

    Este é um caminho de fallback local disponível em `openclaw onboard` e
    `openclaw configure`. Para produção, prefira uma chave de API da Anthropic.

    - macOS: verifica o item do Keychain "Claude Code-credentials"
    - Linux e Windows: reutiliza `~/.claude/.credentials.json` se estiver presente

    No macOS, escolha "Always Allow" para que inicializações pelo launchd não bloqueiem.

  </Accordion>
  <Accordion title="Assinatura OpenAI Code (reutilização do Codex CLI)">
    Se `~/.codex/auth.json` existir, o assistente pode reutilizá-lo.
    Credenciais reutilizadas do Codex CLI continuam sendo gerenciadas pelo Codex CLI; ao expirar, o OpenClaw
    relê primeiro essa fonte e, quando o provedor consegue atualizá-la, grava
    a credencial atualizada de volta no armazenamento do Codex em vez de assumir
    a gestão diretamente.
  </Accordion>
  <Accordion title="Assinatura OpenAI Code (OAuth)">
    Fluxo no navegador; cole `code#state`.

    Define `agents.defaults.model` como `openai-codex/gpt-5.4` quando o modelo não está definido ou é `openai/*`.

  </Accordion>
  <Accordion title="Chave de API da OpenAI">
    Usa `OPENAI_API_KEY` se estiver presente ou solicita uma chave, depois armazena a credencial em perfis de autenticação.

    Define `agents.defaults.model` como `openai/gpt-5.4` quando o modelo não está definido, é `openai/*` ou `openai-codex/*`.

  </Accordion>
  <Accordion title="Chave de API do xAI (Grok)">
    Solicita `XAI_API_KEY` e configura o xAI como provedor de modelo.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (ou `OPENCODE_ZEN_API_KEY`) e permite escolher o catálogo Zen ou Go.
    URL de configuração: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Chave de API (genérica)">
    Armazena a chave para você.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Mais detalhes: [Vercel AI Gateway](/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita account ID, gateway ID e `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Mais detalhes: [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    A configuração é gravada automaticamente. O padrão hospedado é `MiniMax-M2.7`; a configuração por chave de API usa
    `minimax/...`, e a configuração por OAuth usa `minimax-portal/...`.
    Mais detalhes: [MiniMax](/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    A configuração é gravada automaticamente para o endpoint padrão do StepFun ou para Step Plan em endpoints da China ou globais.
    O padrão atualmente inclui `step-3.5-flash`, e o Step Plan também inclui `step-3.5-flash-2603`.
    Mais detalhes: [StepFun](/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatível com Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Mais detalhes: [Synthetic](/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (modelos abertos em Cloud e local)">
    Solicita a base URL (padrão `http://127.0.0.1:11434`), depois oferece o modo Cloud + Local ou Local.
    Descobre modelos disponíveis e sugere padrões.
    Mais detalhes: [Ollama](/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot e Kimi Coding">
    As configurações de Moonshot (Kimi K2) e Kimi Coding são gravadas automaticamente.
    Mais detalhes: [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot).
  </Accordion>
  <Accordion title="Provedor personalizado">
    Funciona com endpoints compatíveis com OpenAI e com Anthropic.

    O onboarding interativo oferece as mesmas opções de armazenamento de chave de API que outros fluxos de chave de API de provedor:
    - **Colar chave de API agora** (texto simples)
    - **Usar referência de segredo** (env ref ou ref de provedor configurado, com validação prévia)

    Flags não interativas:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como fallback)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; padrão `openai`)

  </Accordion>
  <Accordion title="Ignorar">
    Deixa a autenticação sem configuração.
  </Accordion>
</AccordionGroup>

Comportamento do modelo:

- Escolha o modelo padrão entre as opções detectadas ou informe provedor e modelo manualmente.
- Quando o onboarding começa a partir de uma escolha de autenticação de provedor, o seletor de modelo passa a preferir
  esse provedor automaticamente. Para Volcengine e BytePlus, essa mesma preferência
  também corresponde às variantes de coding-plan (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Se esse filtro de provedor preferido ficar vazio, o seletor volta para
  o catálogo completo em vez de não mostrar modelos.
- O assistente executa uma verificação do modelo e avisa se o modelo configurado é desconhecido ou se falta autenticação.

Caminhos de credenciais e perfis:

- Perfis de autenticação (chaves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importação OAuth legada: `~/.openclaw/credentials/oauth.json`

Modo de armazenamento de credenciais:

- O comportamento padrão do onboarding persiste chaves de API como valores em texto simples nos perfis de autenticação.
- `--secret-input-mode ref` habilita o modo de referência em vez do armazenamento da chave em texto simples.
  Na configuração interativa, você pode escolher:
  - ref de variável de ambiente (por exemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - ref de provedor configurado (`file` ou `exec`) com alias + id do provedor
- O modo de referência interativo executa uma validação prévia rápida antes de salvar.
  - Refs de env: valida nome da variável + valor não vazio no ambiente atual do onboarding.
  - Refs de provedor: valida a configuração do provedor e resolve o id solicitado.
  - Se a validação prévia falhar, o onboarding mostra o erro e permite tentar de novo.
- No modo não interativo, `--secret-input-mode ref` é compatível apenas com env.
  - Defina a variável de ambiente do provedor no ambiente do processo de onboarding.
  - Flags de chave inline (por exemplo `--openai-api-key`) exigem que essa variável esteja definida; caso contrário, o onboarding falha rapidamente.
  - Para provedores personalizados, o modo `ref` não interativo armazena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - Nesse caso de provedor personalizado, `--custom-api-key` exige que `CUSTOM_API_KEY` esteja definido; caso contrário, o onboarding falha rapidamente.
- Credenciais de autenticação do Gateway oferecem opções de texto simples e SecretRef na configuração interativa:
  - Modo token: **Gerar/armazenar token em texto simples** (padrão) ou **Usar SecretRef**.
  - Modo senha: texto simples ou SecretRef.
- Caminho SecretRef de token não interativo: `--gateway-token-ref-env <ENV_VAR>`.
- Configurações existentes em texto simples continuam funcionando sem mudanças.

<Note>
Dica para headless e servidor: conclua o OAuth em uma máquina com navegador e depois copie
o `auth-profiles.json` desse agente (por exemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, ou o caminho correspondente em
`$OPENCLAW_STATE_DIR/...`) para o gateway host. `credentials/oauth.json`
é apenas uma fonte legada de importação.
</Note>

## Saídas e detalhes internos

Campos típicos em `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (se MiniMax for escolhido)
- `tools.profile` (o onboarding local usa `"coding"` por padrão quando não definido; valores explícitos existentes são preservados)
- `gateway.*` (modo, bind, autenticação, tailscale)
- `session.dmScope` (o onboarding local define isso como `per-channel-peer` por padrão quando não definido; valores explícitos existentes são preservados)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Allowlists de canal (Slack, Discord, Matrix, Microsoft Teams) quando você opta por elas durante os prompts (nomes são resolvidos para IDs quando possível)
- `skills.install.nodeManager`
  - A flag `setup --node-manager` aceita `npm`, `pnpm` ou `bun`.
  - A configuração manual ainda pode definir `skills.install.nodeManager: "yarn"` depois.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` grava `agents.list[]` e `bindings` opcionais.

As credenciais do WhatsApp ficam em `~/.openclaw/credentials/whatsapp/<accountId>/`.
As sessões são armazenadas em `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Alguns canais são entregues como plugins. Quando selecionado durante a configuração, o assistente
solicita a instalação do plugin (npm ou caminho local) antes da configuração do canal.
</Note>

RPC do assistente do Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Clientes (app do macOS e UI de controle) podem renderizar etapas sem reimplementar a lógica do onboarding.

Comportamento da configuração do Signal:

- Baixa o asset de release apropriado
- Armazena em `~/.openclaw/tools/signal-cli/<version>/`
- Grava `channels.signal.cliPath` na configuração
- Builds JVM exigem Java 21
- Builds nativas são usadas quando disponíveis
- O Windows usa WSL2 e segue o fluxo do signal-cli do Linux dentro do WSL

## Documentação relacionada

- Hub do onboarding: [Onboarding (CLI)](/pt-BR/start/wizard)
- Automação e scripts: [Automação da CLI](/start/wizard-cli-automation)
- Referência de comando: [`openclaw onboard`](/cli/onboard)
