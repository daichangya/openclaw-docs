---
read_when:
    - Você precisa da semântica exata da configuração em nível de campo ou dos valores padrão
    - Você está validando blocos de configuração de canal, modelo, Gateway ou ferramenta
summary: Referência de configuração do Gateway para chaves principais do OpenClaw, padrões e links para referências dedicadas de subsistemas
title: Referência de configuração
x-i18n:
    generated_at: "2026-04-24T08:57:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc0d9feea2f2707f267d50ec83aa664ef503db8f9132762345cc80305f8bef73
    source_path: gateway/configuration-reference.md
    workflow: 15
---

Referência de configuração principal para `~/.openclaw/openclaw.json`. Para uma visão geral orientada a tarefas, consulte [Configuração](/pt-BR/gateway/configuration).

Esta página cobre as principais superfícies de configuração do OpenClaw e aponta para referências separadas quando um subsistema tem sua própria referência mais detalhada. Ela **não** tenta incluir em linha todo catálogo de comandos pertencentes a canais/Plugins nem todos os ajustes profundos de memória/QMD em uma única página.

Fonte da verdade no código:

- `openclaw config schema` imprime o JSON Schema em uso para validação e para a UI de Controle, com os metadados de Plugins/canais incluídos no pacote ou instalados mesclados quando disponíveis
- `config.schema.lookup` retorna um nó do schema com escopo de caminho para ferramentas de exploração detalhada
- `pnpm config:docs:check` / `pnpm config:docs:gen` validam o hash de baseline da documentação de configuração em relação à superfície atual do schema

Referências detalhadas dedicadas:

- [Referência de configuração de memória](/pt-BR/reference/memory-config) para `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` e configuração de Dreaming em `plugins.entries.memory-core.config.dreaming`
- [Comandos Slash](/pt-BR/tools/slash-commands) para o catálogo atual de comandos integrados + incluídos no pacote
- páginas do canal/Plugin proprietário para superfícies de comando específicas de canal

O formato de configuração é **JSON5** (comentários + vírgulas à direita permitidos). Todos os campos são opcionais — o OpenClaw usa padrões seguros quando são omitidos.

---

## Canais

As chaves de configuração por canal foram movidas para uma página dedicada — consulte
[Configuração — canais](/pt-BR/gateway/config-channels) para `channels.*`,
incluindo Slack, Discord, Telegram, WhatsApp, Matrix, iMessage e outros
canais incluídos no pacote (autenticação, controle de acesso, múltiplas contas, controle por menção).

## Padrões de agente, multiagente, sessões e mensagens

Movido para uma página dedicada — consulte
[Configuração — agentes](/pt-BR/gateway/config-agents) para:

- `agents.defaults.*` (workspace, modelo, thinking, Heartbeat, memória, mídia, Skills, sandbox)
- `multiAgent.*` (roteamento e vínculos multiagente)
- `session.*` (ciclo de vida da sessão, Compaction, poda)
- `messages.*` (entrega de mensagens, TTS, renderização de Markdown)
- `talk.*` (modo Talk)
  - `talk.silenceTimeoutMs`: quando não definido, o Talk mantém a janela de pausa padrão da plataforma antes de enviar a transcrição (`700 ms no macOS e Android, 900 ms no iOS`)

## Ferramentas e provedores personalizados

Política de ferramentas, alternâncias experimentais, configuração de ferramentas
baseadas em provedor e configuração de provedor / URL base personalizada foram movidas para uma página dedicada — consulte
[Configuração — ferramentas e provedores personalizados](/pt-BR/gateway/config-tools).

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // or plaintext string
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist opcional apenas para Skills incluídas no pacote (Skills gerenciadas/do workspace não são afetadas).
- `load.extraDirs`: raízes compartilhadas extras de Skills (menor precedência).
- `install.preferBrew`: quando `true`, prefere instaladores Homebrew quando `brew` estiver
  disponível, antes de recorrer a outros tipos de instalador.
- `install.nodeManager`: preferência de instalador Node para especificações `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` desativa uma Skill mesmo que esteja incluída no pacote/instalada.
- `entries.<skillKey>.apiKey`: conveniência para Skills que declaram uma variável de ambiente principal (string em texto simples ou objeto SecretRef).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Carregados de `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions`, além de `plugins.load.paths`.
- A descoberta aceita Plugins nativos do OpenClaw, além de bundles compatíveis do Codex e do Claude, incluindo bundles do Claude sem manifesto no layout padrão.
- **Alterações de configuração exigem reinicialização do Gateway.**
- `allow`: allowlist opcional (somente os Plugins listados são carregados). `deny` tem prioridade.
- `plugins.entries.<id>.apiKey`: campo de conveniência para chave de API no nível do Plugin (quando suportado pelo Plugin).
- `plugins.entries.<id>.env`: mapa de variáveis de ambiente com escopo do Plugin.
- `plugins.entries.<id>.hooks.allowPromptInjection`: quando `false`, o núcleo bloqueia `before_prompt_build` e ignora campos de mutação de prompt do `before_agent_start` legado, preservando ao mesmo tempo os campos legados `modelOverride` e `providerOverride`. Aplica-se a hooks de Plugin nativos e a diretórios de hooks fornecidos por bundles compatíveis.
- `plugins.entries.<id>.subagent.allowModelOverride`: confia explicitamente neste Plugin para solicitar substituições por execução de `provider` e `model` para execuções de subagente em segundo plano.
- `plugins.entries.<id>.subagent.allowedModels`: allowlist opcional de destinos canônicos `provider/model` para substituições confiáveis de subagente. Use `"*"` apenas quando você realmente quiser permitir qualquer modelo.
- `plugins.entries.<id>.config`: objeto de configuração definido pelo Plugin (validado pelo schema nativo de Plugin OpenClaw quando disponível).
- `plugins.entries.firecrawl.config.webFetch`: configurações do provedor de busca web do Firecrawl.
  - `apiKey`: chave de API do Firecrawl (aceita SecretRef). Usa como fallback `plugins.entries.firecrawl.config.webSearch.apiKey`, o legado `tools.web.fetch.firecrawl.apiKey` ou a variável de ambiente `FIRECRAWL_API_KEY`.
  - `baseUrl`: URL base da API Firecrawl (padrão: `https://api.firecrawl.dev`).
  - `onlyMainContent`: extrai apenas o conteúdo principal das páginas (padrão: `true`).
  - `maxAgeMs`: idade máxima do cache em milissegundos (padrão: `172800000` / 2 dias).
  - `timeoutSeconds`: tempo limite da requisição de scraping em segundos (padrão: `60`).
- `plugins.entries.xai.config.xSearch`: configurações do X Search do xAI (busca web do Grok).
  - `enabled`: ativa o provedor X Search.
  - `model`: modelo Grok a ser usado para busca (por exemplo, `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: configurações de Dreaming da memória. Consulte [Dreaming](/pt-BR/concepts/dreaming) para fases e limites.
  - `enabled`: chave mestra de Dreaming (padrão `false`).
  - `frequency`: cadência Cron para cada varredura completa de Dreaming (por padrão, `"0 3 * * *"`).
  - política de fases e limites são detalhes de implementação (não são chaves de configuração voltadas ao usuário).
- A configuração completa de memória está em [Referência de configuração de memória](/pt-BR/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Plugins de bundle do Claude ativados também podem contribuir com padrões incorporados de Pi a partir de `settings.json`; o OpenClaw os aplica como configurações de agente higienizadas, não como patches brutos de configuração do OpenClaw.
- `plugins.slots.memory`: escolhe o id do Plugin de memória ativo, ou `"none"` para desativar Plugins de memória.
- `plugins.slots.contextEngine`: escolhe o id do Plugin de mecanismo de contexto ativo; o padrão é `"legacy"` a menos que você instale e selecione outro mecanismo.
- `plugins.installs`: metadados de instalação gerenciados pela CLI usados por `openclaw plugins update`.
  - Inclui `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Trate `plugins.installs.*` como estado gerenciado; prefira comandos da CLI em vez de edições manuais.

Consulte [Plugins](/pt-BR/tools/plugin).

---

## Navegador

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in only for trusted private-network access
      // allowPrivateNetwork: true, // legacy alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` desativa `act:evaluate` e `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado quando não definido, então a navegação do navegador permanece estrita por padrão.
- Defina `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` apenas quando você confiar intencionalmente na navegação do navegador em rede privada.
- No modo estrito, endpoints remotos de perfil CDP (`profiles.*.cdpUrl`) estão sujeitos ao mesmo bloqueio de rede privada durante verificações de alcance/descoberta.
- `ssrfPolicy.allowPrivateNetwork` continua com suporte como alias legado.
- No modo estrito, use `ssrfPolicy.hostnameAllowlist` e `ssrfPolicy.allowedHostnames` para exceções explícitas.
- Perfis remotos são somente de anexação (iniciar/parar/redefinir desativados).
- `profiles.*.cdpUrl` aceita `http://`, `https://`, `ws://` e `wss://`.
  Use HTTP(S) quando quiser que o OpenClaw descubra `/json/version`; use WS(S)
  quando seu provedor fornecer uma URL WebSocket direta do DevTools.
- Perfis `existing-session` usam Chrome MCP em vez de CDP e podem se anexar no
  host selecionado ou por meio de um Node de navegador conectado.
- Perfis `existing-session` podem definir `userDataDir` para direcionar um perfil
  específico de navegador baseado em Chromium, como Brave ou Edge.
- Perfis `existing-session` mantêm os limites atuais de rota do Chrome MCP:
  ações guiadas por snapshot/ref em vez de seleção por seletor CSS, hooks de upload de um único arquivo, sem substituições de timeout de diálogo, sem `wait --load networkidle`, e sem `responsebody`, exportação para PDF, interceptação de download ou ações em lote.
- Perfis `openclaw` gerenciados localmente atribuem automaticamente `cdpPort` e `cdpUrl`; defina
  `cdpUrl` explicitamente apenas para CDP remoto.
- Ordem de detecção automática: navegador padrão se for baseado em Chromium → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Serviço de controle: somente loopback local (porta derivada de `gateway.port`, padrão `18791`).
- `extraArgs` acrescenta flags extras de inicialização à inicialização local do Chromium (por exemplo,
  `--disable-gpu`, dimensionamento da janela ou flags de depuração).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, short text, image URL, or data URI
    },
  },
}
```

- `seamColor`: cor de destaque para o chrome da UI do aplicativo nativo (matiz da bolha do modo Talk etc.).
- `assistant`: substituição de identidade da UI de Controle. Usa como fallback a identidade do agente ativo.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // or OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // for mode=trusted-proxy; see /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // dangerous: allow absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // required for non-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // dangerous Host-header origin fallback mode
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Default false.
    allowRealIpFallback: false,
    tools: {
      // Additional /tools/invoke HTTP denies
      deny: ["browser"],
      // Remove tools from the default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Detalhes dos campos do Gateway">

- `mode`: `local` (executa o gateway) ou `remote` (conecta a um gateway remoto). O Gateway se recusa a iniciar a menos que esteja em `local`.
- `port`: porta multiplexada única para WS + HTTP. Precedência: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (padrão), `lan` (`0.0.0.0`), `tailnet` (somente IP do Tailscale) ou `custom`.
- **Aliases legados de bind**: use valores de modo de bind em `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), não aliases de host (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Observação sobre Docker**: o bind `loopback` padrão escuta em `127.0.0.1` dentro do contêiner. Com rede bridge do Docker (`-p 18789:18789`), o tráfego chega em `eth0`, então o gateway fica inacessível. Use `--network host` ou defina `bind: "lan"` (ou `bind: "custom"` com `customBindHost: "0.0.0.0"`) para escutar em todas as interfaces.
- **Auth**: exigida por padrão. Binds fora de loopback exigem auth do gateway. Na prática, isso significa um token/senha compartilhado ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`. O assistente de onboarding gera um token por padrão.
- Se `gateway.auth.token` e `gateway.auth.password` estiverem configurados ao mesmo tempo (incluindo SecretRefs), defina `gateway.auth.mode` explicitamente como `token` ou `password`. Fluxos de inicialização e de instalação/reparo de serviço falham quando ambos estão configurados e o modo não está definido.
- `gateway.auth.mode: "none"`: modo explícito sem auth. Use apenas para configurações confiáveis de local loopback; isso intencionalmente não é oferecido pelos prompts de onboarding.
- `gateway.auth.mode: "trusted-proxy"`: delega auth a um proxy reverso com reconhecimento de identidade e confia nos cabeçalhos de identidade vindos de `gateway.trustedProxies` (consulte [Auth com proxy confiável](/pt-BR/gateway/trusted-proxy-auth)). Esse modo espera uma origem de proxy **fora de loopback**; proxies reversos em loopback na mesma máquina não satisfazem a auth de trusted-proxy.
- `gateway.auth.allowTailscale`: quando `true`, cabeçalhos de identidade do Tailscale Serve podem satisfazer a auth da UI de Controle/WebSocket (verificados via `tailscale whois`). Endpoints da API HTTP **não** usam essa auth por cabeçalho do Tailscale; eles seguem o modo normal de auth HTTP do gateway. Esse fluxo sem token pressupõe que o host do gateway seja confiável. O padrão é `true` quando `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: limitador opcional de falhas de auth. Aplica-se por IP de cliente e por escopo de auth (segredo compartilhado e token de dispositivo são rastreados de forma independente). Tentativas bloqueadas retornam `429` + `Retry-After`.
  - No caminho assíncrono da UI de Controle do Tailscale Serve, tentativas falhas para o mesmo `{scope, clientIp}` são serializadas antes do registro da falha. Assim, tentativas inválidas concorrentes do mesmo cliente podem acionar o limitador na segunda requisição em vez de ambas passarem como simples incompatibilidades.
  - `gateway.auth.rateLimit.exemptLoopback` tem padrão `true`; defina `false` quando você intencionalmente quiser limitar por taxa também o tráfego localhost (para ambientes de teste ou implantações estritas com proxy).
- Tentativas de auth WS com origem em navegador são sempre limitadas com a isenção de loopback desativada (defesa em profundidade contra força bruta em localhost baseada em navegador).
- Em loopback, esses bloqueios de origem de navegador são isolados por valor `Origin`
  normalizado, para que falhas repetidas de uma origem localhost não bloqueiem
  automaticamente uma origem diferente.
- `tailscale.mode`: `serve` (somente tailnet, bind em loopback) ou `funnel` (público, exige auth).
- `controlUi.allowedOrigins`: allowlist explícita de origens de navegador para conexões WebSocket do Gateway. Obrigatória quando clientes de navegador são esperados a partir de origens fora de loopback.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: modo perigoso que ativa fallback de origem pelo cabeçalho Host para implantações que dependem intencionalmente de política de origem baseada em cabeçalho Host.
- `remote.transport`: `ssh` (padrão) ou `direct` (ws/wss). Para `direct`, `remote.url` precisa ser `ws://` ou `wss://`.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: substituição de emergência do ambiente
  do processo no lado do cliente que permite `ws://` em texto simples para IPs
  confiáveis de rede privada; o padrão continua sendo apenas loopback para texto simples. Não existe equivalente em `openclaw.json`,
  e configurações de rede privada do navegador, como
  `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`, não afetam clientes
  WebSocket do Gateway.
- `gateway.remote.token` / `.password` são campos de credenciais do cliente remoto. Eles não configuram a auth do gateway por si só.
- `gateway.push.apns.relay.baseUrl`: URL base HTTPS para o relay APNs externo usado por compilações oficiais/TestFlight do iOS depois que elas publicam registros com suporte de relay no gateway. Essa URL precisa corresponder à URL de relay compilada na build do iOS.
- `gateway.push.apns.relay.timeoutMs`: tempo limite em milissegundos para envio do gateway ao relay. Padrão: `10000`.
- Registros com suporte de relay são delegados a uma identidade específica do gateway. O app iOS pareado busca `gateway.identity.get`, inclui essa identidade no registro do relay e encaminha ao gateway uma concessão de envio com escopo do registro. Outro gateway não pode reutilizar esse registro armazenado.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: substituições temporárias por env para a configuração de relay acima.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch somente para desenvolvimento para URLs de relay HTTP em loopback. URLs de relay de produção devem permanecer em HTTPS.
- `gateway.channelHealthCheckMinutes`: intervalo do monitor de integridade dos canais em minutos. Defina `0` para desativar globalmente reinicializações do monitor de integridade. Padrão: `5`.
- `gateway.channelStaleEventThresholdMinutes`: limite de socket obsoleto em minutos. Mantenha esse valor maior ou igual a `gateway.channelHealthCheckMinutes`. Padrão: `30`.
- `gateway.channelMaxRestartsPerHour`: número máximo de reinicializações do monitor de integridade por canal/conta em uma hora móvel. Padrão: `10`.
- `channels.<provider>.healthMonitor.enabled`: desativação por canal das reinicializações do monitor de integridade, mantendo o monitor global ativo.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: substituição por conta para canais com múltiplas contas. Quando definido, tem precedência sobre a substituição em nível de canal.
- Caminhos de chamada do gateway local podem usar `gateway.remote.*` como fallback somente quando `gateway.auth.*` não estiver definido.
- Se `gateway.auth.token` / `gateway.auth.password` estiver explicitamente configurado via SecretRef e não for resolvido, a resolução falha em modo fechado (sem mascaramento por fallback remoto).
- `trustedProxies`: IPs de proxies reversos que terminam TLS ou injetam cabeçalhos de cliente encaminhado. Liste apenas proxies sob seu controle. Entradas de loopback ainda são válidas para configurações de proxy na mesma máquina/detecção local (por exemplo, Tailscale Serve ou um proxy reverso local), mas **não** tornam requisições em loopback elegíveis para `gateway.auth.mode: "trusted-proxy"`.
- `allowRealIpFallback`: quando `true`, o gateway aceita `X-Real-IP` se `X-Forwarded-For` estiver ausente. Padrão `false` para comportamento fail-closed.
- `gateway.tools.deny`: nomes extras de ferramentas bloqueados para HTTP `POST /tools/invoke` (estende a lista padrão de bloqueio).
- `gateway.tools.allow`: remove nomes de ferramentas da lista padrão de bloqueio HTTP.

</Accordion>

### Endpoints compatíveis com OpenAI

- Chat Completions: desativado por padrão. Ative com `gateway.http.endpoints.chatCompletions.enabled: true`.
- API Responses: `gateway.http.endpoints.responses.enabled`.
- Endurecimento de entrada por URL para Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Allowlists vazias são tratadas como não definidas; use `gateway.http.endpoints.responses.files.allowUrl=false`
    e/ou `gateway.http.endpoints.responses.images.allowUrl=false` para desativar a busca por URL.
- Cabeçalho opcional de endurecimento de resposta:
  - `gateway.http.securityHeaders.strictTransportSecurity` (defina apenas para origens HTTPS sob seu controle; consulte [Auth com proxy confiável](/pt-BR/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolamento de múltiplas instâncias

Execute vários gateways no mesmo host com portas e diretórios de estado exclusivos:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Flags de conveniência: `--dev` (usa `~/.openclaw-dev` + porta `19001`), `--profile <name>` (usa `~/.openclaw-<name>`).

Consulte [Múltiplos Gateways](/pt-BR/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: ativa a terminação TLS no listener do gateway (HTTPS/WSS) (padrão: `false`).
- `autoGenerate`: gera automaticamente um par local de certificado/chave autoassinado quando arquivos explícitos não estão configurados; apenas para uso local/desenvolvimento.
- `certPath`: caminho no sistema de arquivos para o arquivo de certificado TLS.
- `keyPath`: caminho no sistema de arquivos para a chave privada TLS; mantenha com permissões restritas.
- `caPath`: caminho opcional do bundle de CAs para verificação do cliente ou cadeias de confiança personalizadas.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: controla como edições de configuração são aplicadas em tempo de execução.
  - `"off"`: ignora edições ao vivo; alterações exigem reinicialização explícita.
  - `"restart"`: sempre reinicia o processo do gateway quando a configuração muda.
  - `"hot"`: aplica alterações no processo sem reiniciar.
  - `"hybrid"` (padrão): tenta hot reload primeiro; faz fallback para reinicialização se necessário.
- `debounceMs`: janela de debounce em ms antes que alterações de configuração sejam aplicadas (inteiro não negativo).
- `deferralTimeoutMs`: tempo máximo em ms para aguardar operações em andamento antes de forçar uma reinicialização (padrão: `300000` = 5 minutos).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` ou `x-openclaw-token: <token>`.
Tokens de hook em query string são rejeitados.

Observações de validação e segurança:

- `hooks.enabled=true` exige um `hooks.token` não vazio.
- `hooks.token` deve ser **distinto** de `gateway.auth.token`; reutilizar o token do Gateway é rejeitado.
- `hooks.path` não pode ser `/`; use um subcaminho dedicado, como `/hooks`.
- Se `hooks.allowRequestSessionKey=true`, restrinja `hooks.allowedSessionKeyPrefixes` (por exemplo `["hook:"]`).
- Se um mapeamento ou preset usar um `sessionKey` com template, defina `hooks.allowedSessionKeyPrefixes` e `hooks.allowRequestSessionKey=true`. Chaves estáticas de mapeamento não exigem esse opt-in.

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` da carga da requisição é aceito somente quando `hooks.allowRequestSessionKey=true` (padrão: `false`).
- `POST /hooks/<name>` → resolvido via `hooks.mappings`
  - Valores `sessionKey` renderizados por template em mapeamentos são tratados como fornecidos externamente e também exigem `hooks.allowRequestSessionKey=true`.

<Accordion title="Detalhes do mapeamento">

- `match.path` corresponde ao subcaminho após `/hooks` (por exemplo, `/hooks/gmail` → `gmail`).
- `match.source` corresponde a um campo da carga para caminhos genéricos.
- Templates como `{{messages[0].subject}}` leem da carga.
- `transform` pode apontar para um módulo JS/TS que retorna uma ação de hook.
  - `transform.module` deve ser um caminho relativo e permanecer dentro de `hooks.transformsDir` (caminhos absolutos e travessia de diretórios são rejeitados).
- `agentId` roteia para um agente específico; IDs desconhecidos usam o padrão como fallback.
- `allowedAgentIds`: restringe o roteamento explícito (`*` ou omitido = permite todos, `[]` = nega todos).
- `defaultSessionKey`: chave de sessão fixa opcional para execuções de agente por hook sem `sessionKey` explícito.
- `allowRequestSessionKey`: permite que chamadores de `/hooks/agent` e chaves de sessão de mapeamentos guiados por template definam `sessionKey` (padrão: `false`).
- `allowedSessionKeyPrefixes`: allowlist opcional de prefixos para valores explícitos de `sessionKey` (requisição + mapeamento), por exemplo `["hook:"]`. Passa a ser obrigatória quando qualquer mapeamento ou preset usa `sessionKey` com template.
- `deliver: true` envia a resposta final para um canal; `channel` usa `last` como padrão.
- `model` substitui o LLM para esta execução do hook (deve ser permitido se o catálogo de modelos estiver definido).

</Accordion>

### Integração com Gmail

- O preset integrado do Gmail usa `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Se você mantiver esse roteamento por mensagem, defina `hooks.allowRequestSessionKey: true` e restrinja `hooks.allowedSessionKeyPrefixes` para corresponder ao namespace do Gmail, por exemplo `["hook:", "hook:gmail:"]`.
- Se você precisar de `hooks.allowRequestSessionKey: false`, substitua o preset por um `sessionKey` estático em vez do padrão com template.

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- O Gateway inicia automaticamente `gog gmail watch serve` na inicialização quando configurado. Defina `OPENCLAW_SKIP_GMAIL_WATCHER=1` para desativar.
- Não execute um `gog gmail watch serve` separado junto com o Gateway.

---

## Host do canvas

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // or OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Serve HTML/CSS/JS editáveis pelo agente e A2UI por HTTP na porta do Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Somente local: mantenha `gateway.bind: "loopback"` (padrão).
- Binds fora de loopback: rotas do canvas exigem auth do Gateway (token/senha/trusted-proxy), assim como as outras superfícies HTTP do Gateway.
- Normalmente, Node WebViews não enviam cabeçalhos de auth; depois que um Node é pareado e conectado, o Gateway anuncia URLs de capacidade com escopo de Node para acesso ao canvas/A2UI.
- URLs de capacidade são vinculadas à sessão WS ativa do Node e expiram rapidamente. Fallback baseado em IP não é usado.
- Injeta o cliente de live reload no HTML servido.
- Cria automaticamente um `index.html` inicial quando estiver vazio.
- Também serve A2UI em `/__openclaw__/a2ui/`.
- Alterações exigem reinicialização do gateway.
- Desative o live reload para diretórios grandes ou erros `EMFILE`.

---

## Descoberta

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (padrão): omite `cliPath` + `sshPort` dos registros TXT.
- `full`: inclui `cliPath` + `sshPort`.
- O hostname usa `openclaw` como padrão. Substitua com `OPENCLAW_MDNS_HOSTNAME`.

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Grava uma zona DNS-SD unicast em `~/.openclaw/dns/`. Para descoberta entre redes, combine com um servidor DNS (CoreDNS recomendado) + split DNS do Tailscale.

Configuração: `openclaw dns setup --apply`.

---

## Ambiente

### `env` (variáveis de ambiente inline)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Variáveis de ambiente inline só são aplicadas se o ambiente do processo não tiver a chave.
- Arquivos `.env`: `.env` do diretório de trabalho atual + `~/.openclaw/.env` (nenhum substitui variáveis existentes).
- `shellEnv`: importa chaves esperadas ausentes do perfil do seu shell de login.
- Consulte [Ambiente](/pt-BR/help/environment) para a precedência completa.

### Substituição de variáveis de ambiente

Referencie variáveis de ambiente em qualquer string de configuração com `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Apenas nomes em maiúsculas são reconhecidos: `[A-Z_][A-Z0-9_]*`.
- Variáveis ausentes/vazias geram erro ao carregar a configuração.
- Escape com `$${VAR}` para um literal `${VAR}`.
- Funciona com `$include`.

---

## Secrets

Referências de Secret são aditivas: valores em texto simples continuam funcionando.

### `SecretRef`

Use um formato de objeto:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validação:

- padrão de `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- padrão de id para `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: ponteiro JSON absoluto (por exemplo `"/providers/openai/apiKey"`)
- padrão de id para `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids de `source: "exec"` não devem conter segmentos de caminho `.` ou `..` delimitados por barras (por exemplo, `a/../b` é rejeitado)

### Superfície de credenciais suportada

- Matriz canônica: [Superfície de credenciais SecretRef](/pt-BR/reference/secretref-credential-surface)
- `secrets apply` tem como alvo caminhos de credenciais suportados em `openclaw.json`.
- Referências em `auth-profiles.json` estão incluídas na resolução em tempo de execução e na cobertura de auditoria.

### Configuração de provedores de Secret

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optional explicit env provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Observações:

- O provedor `file` oferece suporte a `mode: "json"` e `mode: "singleValue"` (`id` deve ser `"value"` no modo singleValue).
- Caminhos de provedores file e exec falham em modo fechado quando a verificação de ACL do Windows não está disponível. Defina `allowInsecurePath: true` apenas para caminhos confiáveis que não podem ser verificados.
- O provedor `exec` exige um caminho absoluto em `command` e usa cargas de protocolo em stdin/stdout.
- Por padrão, caminhos de comando que são links simbólicos são rejeitados. Defina `allowSymlinkCommand: true` para permitir caminhos simbólicos enquanto valida o caminho real resolvido.
- Se `trustedDirs` estiver configurado, a verificação de diretório confiável se aplica ao caminho real resolvido.
- O ambiente do processo-filho de `exec` é mínimo por padrão; passe explicitamente as variáveis necessárias com `passEnv`.
- Referências de Secret são resolvidas no momento da ativação em um snapshot em memória; depois disso, os caminhos de requisição leem apenas o snapshot.
- A filtragem de superfícies ativas se aplica durante a ativação: referências não resolvidas em superfícies ativas fazem a inicialização/reload falhar, enquanto superfícies inativas são ignoradas com diagnósticos.

---

## Armazenamento de auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Perfis por agente são armazenados em `<agentDir>/auth-profiles.json`.
- `auth-profiles.json` oferece suporte a referências em nível de valor (`keyRef` para `api_key`, `tokenRef` para `token`) para modos de credenciais estáticas.
- Perfis em modo OAuth (`auth.profiles.<id>.mode = "oauth"`) não oferecem suporte a credenciais de perfil de auth baseadas em SecretRef.
- Credenciais estáticas em tempo de execução vêm de snapshots resolvidos em memória; entradas estáticas legadas de `auth.json` são removidas quando detectadas.
- Importações legadas de OAuth vêm de `~/.openclaw/credentials/oauth.json`.
- Consulte [OAuth](/pt-BR/concepts/oauth).
- Comportamento em tempo de execução de Secrets e ferramentas `audit/configure/apply`: [Gerenciamento de Secrets](/pt-BR/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff base em horas quando um perfil falha devido a erros reais de cobrança/crédito insuficiente (padrão: `5`). Texto explícito de cobrança ainda pode cair aqui mesmo em respostas `401`/`403`, mas correspondências de texto específicas do provedor permanecem limitadas ao provedor ao qual pertencem (por exemplo, OpenRouter `Key limit exceeded`). Mensagens de janela de uso `402` HTTP repetíveis ou de limite de gastos de organização/workspace permanecem no caminho `rate_limit`.
- `billingBackoffHoursByProvider`: substituições opcionais por provedor para horas de backoff de cobrança.
- `billingMaxHours`: limite máximo em horas para o crescimento exponencial do backoff de cobrança (padrão: `24`).
- `authPermanentBackoffMinutes`: backoff base em minutos para falhas `auth_permanent` de alta confiança (padrão: `10`).
- `authPermanentMaxMinutes`: limite máximo em minutos para o crescimento do backoff de `auth_permanent` (padrão: `60`).
- `failureWindowHours`: janela móvel em horas usada para contadores de backoff (padrão: `24`).
- `overloadedProfileRotations`: número máximo de rotações de perfil de auth do mesmo provedor para erros de sobrecarga antes de mudar para fallback de modelo (padrão: `1`). Formatos de provedor ocupado como `ModelNotReadyException` entram aqui.
- `overloadedBackoffMs`: atraso fixo antes de tentar novamente uma rotação de provedor/perfil sobrecarregado (padrão: `0`).
- `rateLimitedProfileRotations`: número máximo de rotações de perfil de auth do mesmo provedor para erros de limite de taxa antes de mudar para fallback de modelo (padrão: `1`). Esse bucket de limite de taxa inclui texto com formato de provedor, como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` e `resource exhausted`.

---

## Registro em log

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Arquivo de log padrão: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Defina `logging.file` para um caminho estável.
- `consoleLevel` sobe para `debug` com `--verbose`.
- `maxFileBytes`: tamanho máximo do arquivo de log em bytes antes que as gravações sejam suprimidas (inteiro positivo; padrão: `524288000` = 500 MB). Use rotação externa de logs para implantações de produção.

---

## Diagnósticos

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: chave mestra para saída de instrumentação (padrão: `true`).
- `flags`: array de strings de flag que ativam saída de log direcionada (oferece suporte a curingas como `"telegram.*"` ou `"*"`).
- `stuckSessionWarnMs`: limite de idade em ms para emitir avisos de sessão travada enquanto uma sessão permanece em estado de processamento.
- `otel.enabled`: ativa o pipeline de exportação OpenTelemetry (padrão: `false`).
- `otel.endpoint`: URL do coletor para exportação OTel.
- `otel.protocol`: `"http/protobuf"` (padrão) ou `"grpc"`.
- `otel.headers`: cabeçalhos extras de metadados HTTP/gRPC enviados com requisições de exportação OTel.
- `otel.serviceName`: nome do serviço para atributos de recurso.
- `otel.traces` / `otel.metrics` / `otel.logs`: ativam exportação de rastreamento, métricas ou logs.
- `otel.sampleRate`: taxa de amostragem de rastreamento `0`–`1`.
- `otel.flushIntervalMs`: intervalo periódico em ms para flush de telemetria.
- `cacheTrace.enabled`: registra snapshots de rastreamento de cache para execuções embutidas (padrão: `false`).
- `cacheTrace.filePath`: caminho de saída para o JSONL de rastreamento de cache (padrão: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: controlam o que é incluído na saída de rastreamento de cache (todos com padrão: `true`).

---

## Atualização

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: canal de lançamento para instalações npm/git — `"stable"`, `"beta"` ou `"dev"`.
- `checkOnStart`: verifica atualizações npm quando o gateway inicia (padrão: `true`).
- `auto.enabled`: ativa atualização automática em segundo plano para instalações de pacote (padrão: `false`).
- `auto.stableDelayHours`: atraso mínimo em horas antes da aplicação automática no canal estável (padrão: `6`; máximo: `168`).
- `auto.stableJitterHours`: janela extra de distribuição em horas para o canal estável (padrão: `12`; máximo: `168`).
- `auto.betaCheckIntervalHours`: com que frequência as verificações do canal beta são executadas em horas (padrão: `1`; máximo: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: chave global do recurso ACP (padrão: `false`).
- `dispatch.enabled`: chave independente para despacho de turnos de sessão ACP (padrão: `true`). Defina `false` para manter comandos ACP disponíveis enquanto bloqueia a execução.
- `backend`: id padrão do backend de runtime ACP (deve corresponder a um Plugin de runtime ACP registrado).
- `defaultAgent`: id do agente ACP de destino usado como fallback quando inicializações não especificam um destino explícito.
- `allowedAgents`: allowlist de IDs de agente permitidos para sessões de runtime ACP; vazio significa nenhuma restrição adicional.
- `maxConcurrentSessions`: número máximo de sessões ACP ativas simultaneamente.
- `stream.coalesceIdleMs`: janela de flush ocioso em ms para texto transmitido.
- `stream.maxChunkChars`: tamanho máximo do chunk antes de dividir a projeção do bloco transmitido.
- `stream.repeatSuppression`: suprime linhas repetidas de status/ferramenta por turno (padrão: `true`).
- `stream.deliveryMode`: `"live"` transmite incrementalmente; `"final_only"` faz buffer até eventos terminais do turno.
- `stream.hiddenBoundarySeparator`: separador antes do texto visível após eventos ocultos de ferramenta (padrão: `"paragraph"`).
- `stream.maxOutputChars`: número máximo de caracteres de saída do assistente projetados por turno ACP.
- `stream.maxSessionUpdateChars`: número máximo de caracteres para linhas projetadas de status/atualização ACP.
- `stream.tagVisibility`: registro de nomes de tags para substituições booleanas de visibilidade em eventos transmitidos.
- `runtime.ttlMinutes`: TTL ocioso em minutos para workers de sessão ACP antes de se tornarem elegíveis para limpeza.
- `runtime.installCommand`: comando de instalação opcional a ser executado ao inicializar um ambiente de runtime ACP.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` controla o estilo do slogan do banner:
  - `"random"` (padrão): slogans rotativos engraçados/sazonais.
  - `"default"`: slogan neutro fixo (`Todas as suas conversas, um só OpenClaw.`).
  - `"off"`: sem texto de slogan (o título/versão do banner ainda é exibido).
- Para ocultar o banner inteiro (não apenas os slogans), defina a env `OPENCLAW_HIDE_BANNER=1`.

---

## Assistente de configuração

Metadados gravados por fluxos guiados de configuração da CLI (`onboard`, `configure`, `doctor`):

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identidade

Consulte os campos de identidade de `agents.list` em [Padrões de agente](/pt-BR/gateway/config-agents#agent-defaults).

---

## Bridge (legado, removido)

As versões atuais não incluem mais a bridge TCP. Nodes se conectam pelo WebSocket do Gateway. Chaves `bridge.*` não fazem mais parte do schema de configuração (a validação falha até que sejam removidas; `openclaw doctor --fix` pode remover chaves desconhecidas).

<Accordion title="Configuração legada de bridge (referência histórica)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deprecated fallback for stored notify:true jobs
    webhookToken: "replace-with-dedicated-token", // optional bearer token for outbound webhook auth
    sessionRetention: "24h", // duration string or false
    runLog: {
      maxBytes: "2mb", // default 2_000_000 bytes
      keepLines: 2000, // default 2000
    },
  },
}
```

- `sessionRetention`: por quanto tempo manter sessões concluídas de execuções isoladas do Cron antes de removê-las de `sessions.json`. Também controla a limpeza de transcrições arquivadas e excluídas do Cron. Padrão: `24h`; defina `false` para desativar.
- `runLog.maxBytes`: tamanho máximo por arquivo de log de execução (`cron/runs/<jobId>.jsonl`) antes da poda. Padrão: `2_000_000` bytes.
- `runLog.keepLines`: linhas mais recentes mantidas quando a poda do log de execução é acionada. Padrão: `2000`.
- `webhookToken`: token bearer usado para entrega POST de Webhook do Cron (`delivery.mode = "webhook"`); se omitido, nenhum cabeçalho de auth é enviado.
- `webhook`: URL de Webhook legada e obsoleta (http/https) usada apenas para jobs armazenados que ainda tenham `notify: true`.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: número máximo de novas tentativas para jobs avulsos em erros transitórios (padrão: `3`; intervalo: `0`–`10`).
- `backoffMs`: array de atrasos de backoff em ms para cada tentativa de nova execução (padrão: `[30000, 60000, 300000]`; 1–10 entradas).
- `retryOn`: tipos de erro que disparam novas tentativas — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Omita para tentar novamente todos os tipos transitórios.

Aplica-se apenas a jobs avulsos do Cron. Jobs recorrentes usam tratamento de falha separado.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: ativa alertas de falha para jobs do Cron (padrão: `false`).
- `after`: falhas consecutivas antes de um alerta ser disparado (inteiro positivo, mín: `1`).
- `cooldownMs`: milissegundos mínimos entre alertas repetidos para o mesmo job (inteiro não negativo).
- `mode`: modo de entrega — `"announce"` envia por uma mensagem de canal; `"webhook"` publica no Webhook configurado.
- `accountId`: id opcional de conta ou canal para definir o escopo da entrega do alerta.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Destino padrão para notificações de falha do Cron em todos os jobs.
- `mode`: `"announce"` ou `"webhook"`; o padrão é `"announce"` quando existem dados de destino suficientes.
- `channel`: substituição de canal para entrega por announce. `"last"` reutiliza o último canal de entrega conhecido.
- `to`: destino explícito de announce ou URL de Webhook. Obrigatório para o modo webhook.
- `accountId`: substituição opcional de conta para entrega.
- `delivery.failureDestination` por job substitui esse padrão global.
- Quando nem o destino global nem o destino por job de falha estiverem definidos, jobs que já entregam via `announce` usam como fallback esse destino principal de announce em caso de falha.
- `delivery.failureDestination` só tem suporte para jobs com `sessionTarget="isolated"`, a menos que o `delivery.mode` principal do job seja `"webhook"`.

Consulte [Jobs do Cron](/pt-BR/automation/cron-jobs). Execuções isoladas do Cron são rastreadas como [tarefas em segundo plano](/pt-BR/automation/tasks).

---

## Variáveis de template de modelo de mídia

Placeholders de template expandidos em `tools.media.models[].args`:

| Variável           | Descrição                                         |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Corpo completo da mensagem de entrada             |
| `{{RawBody}}`      | Corpo bruto (sem wrappers de histórico/remetente) |
| `{{BodyStripped}}` | Corpo com menções de grupo removidas              |
| `{{From}}`         | Identificador do remetente                        |
| `{{To}}`           | Identificador de destino                          |
| `{{MessageSid}}`   | ID da mensagem do canal                           |
| `{{SessionId}}`    | UUID da sessão atual                              |
| `{{IsNewSession}}` | `"true"` quando uma nova sessão é criada          |
| `{{MediaUrl}}`     | Pseudo-URL da mídia de entrada                    |
| `{{MediaPath}}`    | Caminho local da mídia                            |
| `{{MediaType}}`    | Tipo de mídia (imagem/áudio/documento/…)          |
| `{{Transcript}}`   | Transcrição do áudio                              |
| `{{Prompt}}`       | Prompt de mídia resolvido para entradas da CLI    |
| `{{MaxChars}}`     | Máximo de caracteres resolvido para entradas da CLI |
| `{{ChatType}}`     | `"direct"` ou `"group"`                           |
| `{{GroupSubject}}` | Assunto do grupo (melhor esforço)                 |
| `{{GroupMembers}}` | Prévia dos membros do grupo (melhor esforço)      |
| `{{SenderName}}`   | Nome de exibição do remetente (melhor esforço)    |
| `{{SenderE164}}`   | Número de telefone do remetente (melhor esforço)  |
| `{{Provider}}`     | Dica do provedor (whatsapp, telegram, discord etc.) |

---

## Inclusões de configuração (`$include`)

Divida a configuração em vários arquivos:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Comportamento de mesclagem:**

- Arquivo único: substitui o objeto que o contém.
- Array de arquivos: mesclado profundamente em ordem (os posteriores substituem os anteriores).
- Chaves irmãs: mescladas após as inclusões (substituem os valores incluídos).
- Inclusões aninhadas: até 10 níveis de profundidade.
- Caminhos: resolvidos em relação ao arquivo que inclui, mas devem permanecer dentro do diretório de configuração de nível superior (`dirname` de `openclaw.json`). Formas absolutas/`../` são permitidas apenas quando ainda são resolvidas dentro desse limite.
- Gravações gerenciadas pelo OpenClaw que alteram apenas uma seção de nível superior respaldada por uma inclusão de arquivo único gravam diretamente nesse arquivo incluído. Por exemplo, `plugins install` atualiza `plugins: { $include: "./plugins.json5" }` em `plugins.json5` e deixa `openclaw.json` intacto.
- Inclusões na raiz, arrays de inclusões e inclusões com substituições por chaves irmãs são somente leitura para gravações gerenciadas pelo OpenClaw; essas gravações falham em modo fechado em vez de achatar a configuração.
- Erros: mensagens claras para arquivos ausentes, erros de parsing e inclusões circulares.

---

_Relacionado: [Configuração](/pt-BR/gateway/configuration) · [Exemplos de configuração](/pt-BR/gateway/configuration-examples) · [Doctor](/pt-BR/gateway/doctor)_

## Relacionado

- [Configuração](/pt-BR/gateway/configuration)
- [Exemplos de configuração](/pt-BR/gateway/configuration-examples)
