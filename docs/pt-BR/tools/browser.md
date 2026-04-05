---
read_when:
    - Adicionando automação de navegador controlada pelo agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações + ciclo de vida do navegador no app macOS
summary: Serviço integrado de controle de navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-05T12:55:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: a41162efd397ea918469e16aa67e554bcbb517b3112df1d3e7927539b6a0926a
    source_path: tools/browser.md
    workflow: 15
---

# Navegador (gerenciado pelo openclaw)

O OpenClaw pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por meio de um pequeno
serviço local de controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, só para o agente**.
- O perfil `openclaw` **não** toca no seu perfil pessoal do navegador.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil `user` integrado se conecta à sua sessão real do Chrome já autenticada via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador do dia a dia. É uma superfície segura e isolada para
automação e verificação por agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se aparecer “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver completamente ausente, ou se o agente disser que a ferramenta de navegador
está indisponível, vá para [Missing browser command or tool](/tools/browser#missing-browser-command-or-tool).

## Controle por plugin

A ferramenta padrão `browser` agora é um plugin empacotado que já vem habilitado por
padrão. Isso significa que você pode desativá-lo ou substituí-lo sem remover o restante do
sistema de plugins do OpenClaw:

```json5
{
  plugins: {
    entries: {
      browser: {
        enabled: false,
      },
    },
  },
}
```

Desative o plugin empacotado antes de instalar outro plugin que ofereça o
mesmo nome de ferramenta `browser`. A experiência padrão de navegador precisa de ambos:

- `plugins.entries.browser.enabled` não desabilitado
- `browser.enabled=true`

Se você desativar apenas o plugin, a CLI de navegador empacotada (`openclaw browser`),
o método do gateway (`browser.request`), a ferramenta do agente e o serviço padrão de controle
do navegador desaparecem juntos. Sua configuração `browser.*` permanece intacta para que um
plugin substituto a reutilize.

O plugin empacotado de navegador agora também é dono da implementação de runtime do navegador.
O núcleo mantém apenas helpers compartilhados do Plugin SDK mais reexports de compatibilidade para
caminhos internos antigos de importação. Na prática, remover ou substituir o pacote do plugin de navegador
remove o conjunto de recursos do navegador em vez de deixar um segundo runtime
pertencente ao núcleo.

Alterações na configuração do navegador ainda exigem reinício do Gateway para que o plugin empacotado
possa registrar novamente seu serviço de navegador com as novas configurações.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` de repente virar um comando desconhecido após uma atualização, ou
se o agente relatar que a ferramenta de navegador está ausente, a causa mais comum é uma
lista restritiva `plugins.allow` que não inclui `browser`.

Exemplo de configuração quebrada:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrija adicionando `browser` à allowlist de plugins:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Observações importantes:

- `browser.enabled=true` não basta sozinho quando `plugins.allow` está definido.
- `plugins.entries.browser.enabled=true` também não basta sozinho quando `plugins.allow` está definido.
- `tools.alsoAllow: ["browser"]` **não** carrega o plugin empacotado de navegador. Apenas ajusta a política de ferramentas depois que o plugin já foi carregado.
- Se você não precisa de uma allowlist restritiva de plugins, remover `plugins.allow` também restaura o comportamento padrão do navegador empacotado.

Sintomas típicos:

- `openclaw browser` é um comando desconhecido.
- `browser.request` está ausente.
- O agente relata a ferramenta de navegador como indisponível ou ausente.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (não requer extensão).
- `user`: perfil embutido de conexão Chrome MCP para sua **sessão real do Chrome já autenticada**.

Para chamadas da ferramenta de navegador pelo agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões já autenticadas existentes importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é o override explícito quando você quer um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // modo padrão de rede confiável
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // override legado de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP remoto do CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout do handshake WebSocket remoto do CDP (ms)
    defaultProfile: "openclaw",
    color: "#FF4500",
    headless: false,
    noSandbox: false,
    attachOnly: false,
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: {
        driver: "existing-session",
        attachOnly: true,
        color: "#00AA00",
      },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
  },
}
```

Observações:

- O serviço de controle do navegador faz bind em loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é gateway + 2).
- Se você sobrescrever a porta do Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  as portas derivadas do navegador mudam para permanecer na mesma “família”.
- `cdpUrl` assume por padrão a porta CDP local gerenciada quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance de CDP remoto (não loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de alcance do handshake WebSocket do CDP remoto.
- Navegação/abertura de aba no navegador é protegida contra SSRF antes da navegação e verificada novamente, no melhor esforço, na URL final `http(s)` após a navegação.
- No modo estrito de SSRF, descoberta/sondas de endpoint CDP remoto (`cdpUrl`, incluindo buscas em `/json/version`) também são verificadas.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` tem padrão `true` (modelo de rede confiável). Defina como `false` para navegação pública estrita.
- `browser.ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado para compatibilidade.
- `attachOnly: true` significa “nunca iniciar um navegador local; apenas conectar se ele já estiver em execução.”
- `color` + `color` por perfil tingem a UI do navegador para que você veja qual perfil está ativo.
- O perfil padrão é `openclaw` (navegador independente gerenciado pelo OpenClaw). Use `defaultProfile: "user"` para optar pelo navegador autenticado do usuário.
- Ordem de autodetecção: navegador padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl` — defina-os apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session
  deve se conectar a um perfil de usuário Chromium não padrão, como Brave ou Edge.

## Use Brave (ou outro navegador baseado em Chromium)

Se o seu navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para sobrescrever a
autodetecção:

Exemplo via CLI:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

```json5
// macOS
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  }
}

// Windows
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe"
  }
}

// Linux
{
  browser: {
    executablePath: "/usr/bin/brave-browser"
  }
}
```

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (node host):** execute um node host na máquina que tem o navegador; o Gateway faz proxy das ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.

O comportamento ao parar difere por modo de perfil:

- perfis gerenciados locais: `openclaw browser stop` para o processo do navegador que
  o OpenClaw iniciou
- perfis attach-only e CDP remoto: `openclaw browser stop` fecha a sessão ativa de
  controle e libera overrides de emulação Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens em query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de gravá-los em arquivos de configuração.

## Proxy de navegador por node (padrão zero-config)

Se você executar um **node host** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de navegador para esse node sem nenhuma configuração extra de navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O node host expõe seu servidor local de controle de navegador por meio de um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de menor privilégio: apenas perfis na allowlist podem ser direcionados, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se não quiser isso:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer formato, mas
para um perfil de navegador remoto a opção mais simples é a URL WebSocket direta
da documentação de conexão do Browserless.

Exemplo:

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserless",
    remoteCdpTimeoutMs: 2000,
    remoteCdpHandshakeTimeoutMs: 4000,
    profiles: {
      browserless: {
        cdpUrl: "wss://production-sfo.browserless.io?token=<BROWSERLESS_API_KEY>",
        color: "#00AA00",
      },
    },
  },
}
```

Observações:

- Substitua `<BROWSERLESS_API_KEY>` pelo seu token real do Browserless.
- Escolha o endpoint de região que corresponda à sua conta Browserless (veja a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar que o OpenClaw
  descubra `/json/version`.

## Provedores CDP WebSocket diretos

Alguns serviços de navegador hospedado expõem um endpoint **WebSocket direto** em vez de
descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw suporta ambos:

- **Endpoints HTTP(S)** — o OpenClaw chama `/json/version` para descobrir a
  URL WebSocket do depurador e então se conecta.
- **Endpoints WebSocket** (`ws://` / `wss://`) — o OpenClaw se conecta diretamente,
  ignorando `/json/version`. Use isso para serviços como
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com), ou qualquer provedor que forneça uma
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução de CAPTCHA integrada, modo stealth e
proxies residenciais.

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "browserbase",
    remoteCdpTimeoutMs: 3000,
    remoteCdpHandshakeTimeoutMs: 5000,
    profiles: {
      browserbase: {
        cdpUrl: "wss://connect.browserbase.com?apiKey=<BROWSERBASE_API_KEY>",
        color: "#F97316",
      },
    },
  },
}
```

Observações:

- [Cadastre-se](https://www.browserbase.com/sign-up) e copie sua **API Key**
  do [dashboard Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador ao conectar o WebSocket, então
  não é necessária nenhuma etapa manual de criação de sessão.
- O nível gratuito permite uma sessão concorrente e uma hora de navegador por mês.
  Consulte [pricing](https://www.browserbase.com/pricing) para limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a
  referência completa da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente loopback; o acesso flui pela autenticação do Gateway ou pelo pareamento do node.
- A API HTTP independente de navegador em loopback usa **somente autenticação por segredo compartilhado**:
  autenticação bearer do token do gateway, `x-openclaw-password`, ou HTTP Basic auth com a
  senha configurada do gateway.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam essa API independente de navegador em loopback.
- Se o controle do navegador estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já for
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer node hosts em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens CDP remotos como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração sempre que possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (múltiplos navegadores)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo openclaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remotos**: uma URL CDP explícita (navegador baseado em Chromium rodando em outro lugar)
- **sessão existente**: seu perfil existente do Chrome por conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é embutido para conexão existing-session do Chrome MCP.
- Perfis existing-session são opt-in além do `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas por padrão em **18800–18899**.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Existing-session via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium já em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil embutido:

- `user`

Opcional: crie seu próprio perfil existing-session personalizado se quiser um
nome, cor ou diretório de dados do navegador diferentes.

Comportamento padrão:

- O perfil `user` embutido usa conexão automática Chrome MCP, que mira o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil não padrão do Chrome:

```json5
{
  browser: {
    profiles: {
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
    },
  },
}
```

Então, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Habilite a depuração remota.
3. Mantenha o navegador em execução e aprove o prompt de conexão quando o OpenClaw se conectar.

Páginas de inspeção comuns:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Teste rápido de conexão ativa:

```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user status
openclaw browser --browser-profile user tabs
openclaw browser --browser-profile user snapshot --format ai
```

Como é o sucesso:

- `status` mostra `driver: existing-session`
- `status` mostra `transport: chrome-mcp`
- `status` mostra `running: true`
- `tabs` lista suas abas já abertas no navegador
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador-alvo baseado em Chromium está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador mostrou e você aceitou o prompt de consentimento da conexão
- `openclaw doctor` migra configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas ele não consegue
  habilitar a depuração remota no lado do navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador autenticado do usuário.
- Se você usa um perfil existing-session personalizado, passe esse nome de perfil explícito.
- Escolha esse modo apenas quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou node host pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho é de risco mais alto do que o perfil isolado `openclaw`, porque ele pode
  agir dentro da sua sessão autenticada do navegador.
- O OpenClaw não inicia o navegador para esse driver; ele se conecta apenas a uma
  sessão existente.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, o OpenClaw o repassa para mirar esse diretório
  explícito de dados de usuário do Chromium.
- Capturas de tela em existing-session suportam capturas da página e capturas de elemento com `--ref`
  a partir de snapshots, mas não seletores CSS `--element`.
- Capturas de tela de página em existing-session funcionam sem Playwright via Chrome MCP.
  Capturas de elemento baseadas em ref (`--ref`) também funcionam ali, mas `--full-page`
  não pode ser combinado com `--ref` nem com `--element`.
- Ações em existing-session ainda são mais limitadas do que no caminho de navegador gerenciado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem
    refs de snapshot em vez de seletores CSS
  - `click` é somente com botão esquerdo (sem overrides de botão ou modificadores)
  - `type` não suporta `slowly=true`; use `fill` ou `press`
  - `press` não suporta `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não
    suportam overrides de timeout por chamada
  - `select` atualmente suporta apenas um único valor
- Existing-session `wait --url` suporta padrões exatos, substring e glob
  como outros drivers de navegador. `wait --load networkidle` ainda não é compatível.
- Hooks de upload em existing-session exigem `ref` ou `inputRef`, suportam um arquivo
  por vez e não suportam direcionamento CSS `element`.
- Hooks de diálogo em existing-session não suportam overrides de timeout.
- Alguns recursos ainda exigem o caminho de navegador gerenciado, incluindo
  ações em lote, exportação de PDF, interceptação de download e `responsebody`.
- Existing-session é local ao host. Se o Chrome estiver em outra máquina ou em outro
  namespace de rede, use CDP remoto ou um node host.

## Garantias de isolamento

- **Diretório de dados de usuário dedicado**: nunca toca no seu perfil pessoal do navegador.
- **Portas dedicadas**: evita `9222` para impedir colisões com fluxos de desenvolvimento.
- **Controle determinístico de abas**: mira abas por `targetId`, não pela “última aba”.

## Seleção do navegador

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode sobrescrever com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura `google-chrome`, `brave`, `microsoft-edge`, `chromium` etc.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP em loopback:

- Status/start/stop: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/screenshot: `GET /snapshot`, `POST /screenshot`
- Ações: `POST /navigate`, `POST /act`
- Hooks: `POST /hooks/file-chooser`, `POST /hooks/dialog`
- Downloads: `POST /download`, `POST /wait/download`
- Depuração: `GET /console`, `POST /pdf`
- Depuração: `GET /errors`, `GET /requests`, `POST /trace/start`, `POST /trace/stop`, `POST /highlight`
- Rede: `POST /response/body`
- Estado: `GET /cookies`, `POST /cookies/set`, `POST /cookies/clear`
- Estado: `GET /storage/:kind`, `POST /storage/:kind/set`, `POST /storage/:kind/clear`
- Configurações: `POST /set/offline`, `POST /set/headers`, `POST /set/credentials`, `POST /set/geolocation`, `POST /set/media`, `POST /set/timezone`, `POST /set/locale`, `POST /set/device`

Todos os endpoints aceitam `?profile=<name>`.

Se a autenticação por segredo compartilhado do gateway estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou HTTP Basic auth com essa senha

Observações:

- Esta API independente de navegador em loopback **não** consome cabeçalhos de identidade de trusted-proxy nem
  de Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, estas rotas de navegador em loopback
  não herdam esses modos com identidade; mantenha-as somente em loopback.

### Exigência do Playwright

Alguns recursos (`navigate`/`act`/snapshot AI/role snapshot, screenshots de elemento,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Capturas de tela de página para o navegador gerenciado `openclaw` quando um WebSocket
  CDP por aba estiver disponível
- Capturas de tela de página para perfis `existing-session` / Chrome MCP
- Capturas de tela `--ref` baseadas em existing-session a partir da saída de snapshot

O que ainda precisa do Playwright:

- `navigate`
- `act`
- Snapshots AI / role snapshots
- Capturas de tela de elemento por seletor CSS (`--element`)
- Exportação completa de PDF do navegador

Capturas de tela de elemento também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, instale o pacote
completo do Playwright (não `playwright-core`) e reinicie o gateway, ou reinstale
o OpenClaw com suporte a navegador.

#### Instalação do Playwright no Docker

Se o Gateway estiver rodando em Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI empacotada em vez disso:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads de navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Fluxo de alto nível:

- Um pequeno **servidor de controle** aceita requisições HTTP.
- Ele se conecta a navegadores baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (clicar/digitar/snapshot/PDF), usa **Playwright** por cima
  do CDP.
- Quando o Playwright está ausente, apenas operações sem Playwright ficam disponíveis.

Esse design mantém o agente em uma interface estável e determinística, ao mesmo tempo que permite
trocar navegadores/perfis locais ou remotos.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para mirar um perfil específico.
Todos os comandos também aceitam `--json` para saída legível por máquina (payloads estáveis).

Noções básicas:

- `openclaw browser status`
- `openclaw browser start`
- `openclaw browser stop`
- `openclaw browser tabs`
- `openclaw browser tab`
- `openclaw browser tab new`
- `openclaw browser tab select 2`
- `openclaw browser tab close 2`
- `openclaw browser open https://example.com`
- `openclaw browser focus abcd1234`
- `openclaw browser close abcd1234`

Inspeção:

- `openclaw browser screenshot`
- `openclaw browser screenshot --full-page`
- `openclaw browser screenshot --ref 12`
- `openclaw browser screenshot --ref e12`
- `openclaw browser snapshot`
- `openclaw browser snapshot --format aria --limit 200`
- `openclaw browser snapshot --interactive --compact --depth 6`
- `openclaw browser snapshot --efficient`
- `openclaw browser snapshot --labels`
- `openclaw browser snapshot --selector "#main" --interactive`
- `openclaw browser snapshot --frame "iframe#main" --interactive`
- `openclaw browser console --level error`

Observação sobre ciclo de vida:

- Para perfis attach-only e CDP remoto, `openclaw browser stop` ainda é o
  comando correto de limpeza após testes. Ele fecha a sessão ativa de controle e
  limpa overrides temporários de emulação em vez de encerrar o navegador
  subjacente.
- `openclaw browser errors --clear`
- `openclaw browser requests --filter api --clear`
- `openclaw browser pdf`
- `openclaw browser responsebody "**/api" --max-chars 5000`

Ações:

- `openclaw browser navigate https://example.com`
- `openclaw browser resize 1280 720`
- `openclaw browser click 12 --double`
- `openclaw browser click e12 --double`
- `openclaw browser type 23 "hello" --submit`
- `openclaw browser press Enter`
- `openclaw browser hover 44`
- `openclaw browser scrollintoview e12`
- `openclaw browser drag 10 11`
- `openclaw browser select 9 OptionA OptionB`
- `openclaw browser download e12 report.pdf`
- `openclaw browser waitfordownload report.pdf`
- `openclaw browser upload /tmp/openclaw/uploads/file.pdf`
- `openclaw browser fill --fields '[{"ref":"1","type":"text","value":"Ada"}]'`
- `openclaw browser dialog --accept`
- `openclaw browser wait --text "Done"`
- `openclaw browser wait "#main" --url "**/dash" --load networkidle --fn "window.ready===true"`
- `openclaw browser evaluate --fn '(el) => el.textContent' --ref 7`
- `openclaw browser highlight e12`
- `openclaw browser trace start`
- `openclaw browser trace stop`

Estado:

- `openclaw browser cookies`
- `openclaw browser cookies set session abc123 --url "https://example.com"`
- `openclaw browser cookies clear`
- `openclaw browser storage local get`
- `openclaw browser storage local set theme dark`
- `openclaw browser storage session clear`
- `openclaw browser set offline on`
- `openclaw browser set headers --headers-json '{"X-Debug":"1"}'`
- `openclaw browser set credentials user pass`
- `openclaw browser set credentials --clear`
- `openclaw browser set geo 37.7749 -122.4194 --origin "https://example.com"`
- `openclaw browser set geo --clear`
- `openclaw browser set media dark`
- `openclaw browser set timezone America/New_York`
- `openclaw browser set locale en-US`
- `openclaw browser set device "iPhone 14"`

Observações:

- `upload` e `dialog` são chamadas de **preparo**; execute-as antes do click/press
  que dispara o seletor/diálogo.
- Caminhos de saída de download e trace são restritos às raízes temporárias do OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Caminhos de upload são restritos a uma raiz temporária de uploads do OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando o Playwright está instalado): retorna um snapshot AI com refs numéricos (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; apenas inspeção).
  - `--efficient` (ou `--mode efficient`): preset compacto de role snapshot (interactive + compact + depth + maxChars menor).
  - Padrão de configuração (somente ferramenta/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passar um modo (consulte [Gateway configuration](/pt-BR/gateway/configuration-reference#browser)).
  - Opções de role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em papel com refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita role snapshots a um iframe (combina com refs de role como `e12`).
  - `--interactive` gera uma lista plana e fácil de escolher de elementos interativos (melhor para conduzir ações).
  - `--labels` adiciona uma captura de tela somente do viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `click`/`type`/etc exigem um `ref` de `snapshot` (numérico `12` ou role ref `e12`).
  Seletores CSS são intencionalmente não suportados para ações.

## Snapshots e refs

O OpenClaw suporta dois estilos de “snapshot”:

- **AI snapshot (refs numéricos)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot em texto que inclui refs numéricos.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, o ref é resolvido via `aria-ref` do Playwright.

- **Role snapshot (refs de role como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em papel com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, o ref é resolvido via `getByRole(...)` (mais `nth()` para duplicados).
  - Adicione `--labels` para incluir uma captura do viewport com rótulos `e12` sobrepostos.

Comportamento dos refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute novamente `snapshot` e use um ref novo.
- Se o role snapshot foi tirado com `--frame`, os refs de role ficam limitados àquele iframe até o próximo role snapshot.

## Melhorias de espera

Você pode esperar mais do que apenas tempo/texto:

- Esperar por URL (globs suportados pelo Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar um seletor ficar visível:
  - `openclaw browser wait "#main"`

Esses itens podem ser combinados:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Fluxos de depuração

Quando uma ação falha (por exemplo “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de role no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` é para scripts e ferramentas estruturadas.

Exemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (linhas/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos “faça o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua compatível)
- HTTP basic auth: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de navegador openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Prompt injection pode
  conduzir isso. Desabilite com `browser.evaluateEnabled=false` se você não precisar.
- Para observações sobre logins e anti-bot (X/Twitter etc.), consulte [Browser login + X/Twitter posting](/tools/browser-login).
- Mantenha o Gateway/node host privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; faça túnel e proteja-os.

Exemplo de modo estrito (bloqueia destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // allow exato opcional
    },
  },
}
```

## Solução de problemas

Para problemas específicos de Linux (especialmente Chromium via snap), consulte
[Browser troubleshooting](/tools/browser-linux-troubleshooting).

Para configurações divididas WSL2 Gateway + Windows Chrome em hosts diferentes, consulte
[WSL2 + Windows + remote Chrome CDP troubleshooting](/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso é mapeado:

- `browser snapshot` retorna uma árvore de UI estável (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil nomeado de navegador (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador vive.
  - Em sessões sandboxed, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões sandboxed usam `sandbox` por padrão, sessões sem sandbox usam `host` por padrão.
  - Se um node com capacidade de navegador estiver conectado, a ferramenta pode rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionado

- [Tools Overview](/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle de navegador em ambientes sandboxed
- [Security](/pt-BR/gateway/security) — riscos e endurecimento do controle de navegador
