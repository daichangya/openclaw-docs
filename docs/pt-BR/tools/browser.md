---
read_when:
    - Adicionando automação de browser controlada por agente
    - Depurando por que o OpenClaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do browser no app macOS
summary: Serviço integrado de controle do browser + comandos de ação
title: Browser (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-23T05:44:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 865b0020d66366a62939f8ed28b9cda88d56ee7f5245b1b24a4e804ce55ea42d
    source_path: tools/browser.md
    workflow: 15
---

# Browser (gerenciado pelo openclaw)

O OpenClaw pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu browser pessoal e é gerenciado por um pequeno
serviço local de controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nele como um **browser separado, somente para o agente**.
- O perfil `openclaw` **não** toca no perfil do seu browser pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma faixa segura.
- O perfil integrado `user` se conecta à sua sessão real do Chrome autenticada via Chrome MCP.

## O que você recebe

- Um perfil de browser separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este browser **não** é o seu browser de uso diário. Ele é uma superfície segura e isolada para
automação e verificação pelo agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Browser disabled”, habilite-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de browser
não está disponível, vá para [Comando ou ferramenta de browser ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle por Plugin

A ferramenta padrão `browser` agora é um Plugin incluído que vem habilitado por
padrão. Isso significa que você pode desativá-lo ou substituí-lo sem remover o restante do
sistema de Plugins do OpenClaw:

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

Desative o Plugin incluído antes de instalar outro Plugin que forneça o
mesmo nome de ferramenta `browser`. A experiência padrão de browser precisa de ambos:

- `plugins.entries.browser.enabled` não desabilitado
- `browser.enabled=true`

Se você desativar apenas o Plugin, a CLI de browser incluída (`openclaw browser`),
o método do gateway (`browser.request`), a ferramenta do agente e o serviço padrão de controle de browser desaparecerão juntos. Sua configuração `browser.*` permanece intacta para ser reutilizada por um Plugin substituto.

O Plugin de browser incluído agora também é o proprietário da implementação de runtime do browser.
O core mantém apenas helpers compartilhados do SDK de Plugin mais reexportações de compatibilidade para
caminhos de importação internos antigos. Na prática, remover ou substituir o pacote do Plugin de browser
remove o conjunto de recursos do browser em vez de deixar para trás um segundo runtime pertencente ao core.

Mudanças na configuração do browser ainda exigem reinicialização do Gateway para que o Plugin incluído
possa registrar novamente seu serviço de browser com as novas configurações.

## Comando ou ferramenta de browser ausente

Se `openclaw browser` de repente se tornar um comando desconhecido após uma atualização, ou
se o agente informar que a ferramenta de browser está ausente, a causa mais comum é uma
lista restritiva `plugins.allow` que não inclui `browser`.

Exemplo de configuração com problema:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrija adicionando `browser` à allowlist de Plugins:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Observações importantes:

- `browser.enabled=true` por si só não é suficiente quando `plugins.allow` está definido.
- `plugins.entries.browser.enabled=true` por si só também não é suficiente quando `plugins.allow` está definido.
- `tools.alsoAllow: ["browser"]` **não** carrega o Plugin de browser incluído. Apenas ajusta a política da ferramenta depois que o Plugin já foi carregado.
- Se você não precisa de uma allowlist restritiva de Plugins, remover `plugins.allow` também restaura o comportamento padrão do browser incluído.

Sintomas típicos:

- `openclaw browser` é um comando desconhecido.
- `browser.request` está ausente.
- O agente informa que a ferramenta de browser está indisponível ou ausente.

## Perfis: `openclaw` vs `user`

- `openclaw`: browser gerenciado e isolado (nenhuma extensão necessária).
- `user`: perfil integrado de conexão ao Chrome MCP para a sua **sessão real do Chrome autenticada**.

Para chamadas da ferramenta de browser pelo agente:

- Padrão: use o browser isolado `openclaw`.
- Prefira `profile="user"` quando sessões autenticadas existentes importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo de browser específico.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do browser ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ative somente para acesso confiável à rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP remoto de CDP (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout remoto do handshake WebSocket de CDP (ms)
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

- O serviço de controle do browser faz bind em loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é gateway + 2).
- Se você substituir a porta do Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  as portas derivadas do browser mudam para permanecer na mesma “família”.
- `cdpUrl` usa por padrão a porta local gerenciada de CDP quando não está definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance de CDP remoto (não loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de alcance do handshake WebSocket de CDP remoto.
- A navegação/abertura de aba no browser é protegida por SSRF antes da navegação e verificada novamente, no melhor esforço, na URL final `http(s)` após a navegação.
- No modo SSRF estrito, a descoberta/sondas de endpoint CDP remoto (`cdpUrl`, incluindo buscas em `/json/version`) também são verificadas.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vem desabilitado por padrão. Defina como `true` somente quando você confiar intencionalmente no acesso do browser à rede privada.
- `browser.ssrfPolicy.allowPrivateNetwork` continua sendo suportado como alias legado para compatibilidade.
- `attachOnly: true` significa “nunca iniciar um browser local; apenas conectar se ele já estiver em execução”.
- `color` + `color` por perfil tingem a interface do browser para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (browser autônomo gerenciado pelo OpenClaw). Use `defaultProfile: "user"` para optar pelo browser autenticado do usuário.
- Ordem de autodetecção: browser padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- Perfis locais `openclaw` recebem `cdpPort`/`cdpUrl` automaticamente — defina-os apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil `existing-session`
  precisar se conectar a um perfil de usuário Chromium não padrão, como Brave ou Edge.

## Usar Brave (ou outro browser baseado em Chromium)

Se o seu browser **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para substituir a
autodetecção:

Exemplo na CLI:

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

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um browser local.
- **Controle remoto (host Node):** execute um host Node na máquina que tem o browser; o Gateway faz proxy das ações do browser para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um browser remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um browser local.

O comportamento de parada difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do browser que
  o OpenClaw iniciou
- perfis `attach-only` e perfis CDP remotos: `openclaw browser stop` fecha a
  sessão de controle ativa e libera substituições de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de browser tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens em query (por exemplo, `https://provider.example?token=<token>`)
- HTTP Basic auth (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao conectar
ao WebSocket de CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de confirmá-los em arquivos de configuração.

## Proxy de browser Node (padrão sem configuração)

Se você executar um **host Node** na máquina que tem o seu browser, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de browser para esse Node sem nenhuma configuração extra de browser.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host Node expõe seu servidor local de controle de browser por meio de um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do Node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados permanecem acessíveis por meio do proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw trata isso como um limite de menor privilégio: somente perfis na allowlist podem ser alvo, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se você não quiser isso:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço Chromium hospedado que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer uma das formas, mas
para um perfil de browser remoto a opção mais simples é a URL WebSocket direta
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
- Escolha o endpoint de região que corresponde à sua conta do Browserless (consulte a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Providers CDP WebSocket diretos

Alguns serviços de browser hospedados expõem um endpoint **WebSocket direto** em vez
da descoberta padrão de CDP baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por um handshake WebSocket e ignora
  `/json/version` completamente.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  um caminho `/devtools/...` (por exemplo [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  em `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Isso cobre
  tanto portas remotas de depuração no estilo Chrome quanto providers somente WebSocket.

`ws://host:port` / `wss://host:port` simples sem um caminho `/devtools/...`
apontando para uma instância local do Chrome é suportado por meio do
fallback com descoberta primeiro — o Chrome só aceita upgrades WebSocket no caminho específico por browser
ou por alvo retornado por `/json/version`, então um handshake apenas na raiz simples
falharia.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
browsers headless com resolução integrada de CAPTCHA, modo furtivo e
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
  do [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de browser ao conectar por WebSocket, então
  nenhuma etapa manual de criação de sessão é necessária.
- O nível gratuito permite uma sessão simultânea e uma hora de browser por mês.
  Consulte [pricing](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa da
  API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do browser é somente por loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento do node.
- A API HTTP autônoma de browser em loopback usa **somente autenticação por segredo compartilhado**:
  autenticação bearer por token do gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha configurada do gateway.
- Headers de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API autônoma de browser em loopback.
- Se o controle do browser estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera esse token automaticamente quando `gateway.auth.mode` já está em
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens remotos de CDP como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite embutir tokens de longa duração diretamente em arquivos de configuração.

## Perfis (multi-browser)

O OpenClaw oferece suporte a múltiplos perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo openclaw**: uma instância dedicada de browser baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL explícita de CDP (browser baseado em Chromium executando em outro lugar)
- **sessão existente**: seu perfil existente do Chrome por meio da conexão automática via Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão de sessão existente do Chrome MCP.
- Perfis de sessão existente são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas locais de CDP são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil em execução de browser baseado em Chromium por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de browser.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do browser diferentes.

Comportamento padrão:

- O perfil integrado `user` usa conexão automática do Chrome MCP, que tem como alvo o
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

Então, no browser correspondente:

1. Abra a página de inspeção desse browser para depuração remota.
2. Habilite a depuração remota.
3. Mantenha o browser em execução e aprove o prompt de conexão quando o OpenClaw se conectar.

Páginas de inspeção comuns:

- Chrome: `chrome://inspect/#remote-debugging`
- Brave: `brave://inspect/#remote-debugging`
- Edge: `edge://inspect/#remote-debugging`

Teste rápido de conexão ao vivo:

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
- `tabs` lista suas abas de browser já abertas
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o browser alvo baseado em Chromium está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse browser
- o browser exibiu e você aceitou o prompt de consentimento de conexão
- `openclaw doctor` migra configurações antigas de browser baseadas em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas não pode
  habilitar a depuração remota no lado do browser para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do browser autenticado do usuário.
- Se você usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha esse modo somente quando o usuário estiver no computador para aprovar o prompt
  de conexão.
- o Gateway ou host node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Este caminho é de maior risco do que o perfil isolado `openclaw` porque ele pode
  agir dentro da sua sessão autenticada de browser.
- O OpenClaw não inicia o browser para este driver; ele se conecta apenas a uma
  sessão existente.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, o OpenClaw o repassa para direcionar aquele diretório explícito
  de dados de usuário do Chromium.
- Capturas de tela em sessão existente oferecem suporte a capturas de página e capturas de elemento por `--ref`
  a partir de snapshots, mas não a seletores CSS `--element`.
- Capturas de tela de página em sessão existente funcionam sem Playwright por meio do Chrome MCP.
  Capturas de elemento baseadas em ref (`--ref`) também funcionam ali, mas `--full-page`
  não pode ser combinado com `--ref` ou `--element`.
- Ações em sessão existente ainda são mais limitadas do que o caminho do browser
  gerenciado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem
    refs de snapshot em vez de seletores CSS
  - `click` é somente com o botão esquerdo (sem substituições de botão ou modificadores)
  - `type` não oferece suporte a `slowly=true`; use `fill` ou `press`
  - `press` não oferece suporte a `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não
    oferecem suporte a substituições de timeout por chamada
  - `select` atualmente oferece suporte a um único valor apenas
- `wait --url` em sessão existente oferece suporte a padrões exatos, por substring e glob
  como outros drivers de browser. `wait --load networkidle` ainda não é suportado.
- Hooks de upload em sessão existente exigem `ref` ou `inputRef`, oferecem suporte a um arquivo de cada vez
  e não oferecem suporte a direcionamento CSS por `element`.
- Hooks de diálogo em sessão existente não oferecem suporte a substituições de timeout.
- Alguns recursos ainda exigem o caminho do browser gerenciado, incluindo ações
  em lote, exportação em PDF, interceptação de download e `responsebody`.
- A sessão existente pode se conectar no host selecionado ou por meio de um node de browser conectado. Se
  o Chrome estiver em outro lugar e nenhum node de browser estiver conectado, use
  CDP remoto ou um host node.

## Garantias de isolamento

- **Diretório dedicado de dados do usuário**: nunca toca no perfil do seu browser pessoal.
- **Portas dedicadas**: evita `9222` para prevenir colisões com fluxos de desenvolvimento.
- **Controle determinístico de abas**: direciona abas por `targetId`, não pela “última aba”.

## Seleção de browser

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura `google-chrome`, `brave`, `microsoft-edge`, `chromium` etc.
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Somente para integrações locais, o Gateway expõe uma pequena API HTTP em loopback:

- Status/iniciar/parar: `GET /`, `POST /start`, `POST /stop`
- Abas: `GET /tabs`, `POST /tabs/open`, `POST /tabs/focus`, `DELETE /tabs/:targetId`
- Snapshot/captura de tela: `GET /snapshot`, `POST /screenshot`
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

Se a autenticação do gateway por segredo compartilhado estiver configurada, as rotas HTTP do browser também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API autônoma de browser em loopback **não** consome headers de identidade de proxy confiável nem do Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de browser em loopback
  não herdam esses modos com identidade; mantenha-as somente em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para falhas de validação em nível de rota e
de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação não suportado.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado por configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote entra em conflito com o alvo da requisição.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é suportada para perfis de sessão existente.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/snapshot AI/role snapshot, capturas de tela de elemento,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Capturas de tela da página para o browser gerenciado `openclaw` quando um WebSocket
  CDP por aba está disponível
- Capturas de tela da página para perfis `existing-session` / Chrome MCP
- Capturas de tela em sessão existente baseadas em ref (`--ref`) a partir da saída de snapshot

O que ainda exige Playwright:

- `navigate`
- `act`
- Snapshots AI / role snapshots
- Capturas de tela de elemento por seletor CSS (`--element`)
- Exportação completa de PDF do browser

Capturas de tela de elemento também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, repare as dependências de runtime do Plugin de browser incluído para que `playwright-core` seja instalado
e então reinicie o gateway. Para instalações empacotadas, execute `openclaw doctor --fix`.
Para Docker, instale também os binários do browser Chromium conforme mostrado abaixo.

#### Instalação do Playwright no Docker

Se o seu Gateway estiver em execução no Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI incluída:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads do browser, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Consulte [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Fluxo de alto nível:

- Um pequeno **servidor de controle** aceita requisições HTTP.
- Ele se conecta a browsers baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (click/type/snapshot/PDF), ele usa **Playwright** sobre
  o CDP.
- Quando o Playwright está ausente, somente operações sem Playwright ficam disponíveis.

Esse design mantém o agente em uma interface estável e determinística, ao mesmo tempo que permite
trocar browsers e perfis locais/remotos.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar um perfil específico.
Todos os comandos também aceitam `--json` para saída legível por máquina (payloads estáveis).

Básico:

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

- Para perfis `attach-only` e perfis CDP remotos, `openclaw browser stop` ainda é o
  comando correto de limpeza após testes. Ele fecha a sessão de controle ativa e
  limpa substituições temporárias de emulação em vez de matar o browser
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

- `upload` e `dialog` são chamadas de **armamento**; execute-as antes do click/press
  que aciona o seletor/dialog.
- Caminhos de saída de download e trace são limitados às raízes temporárias do OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Caminhos de upload são limitados a uma raiz temporária de uploads do OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` também pode definir inputs de arquivo diretamente via `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando o Playwright está instalado): retorna um snapshot AI com refs numéricas (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; somente inspeção).
  - `--efficient` (ou `--mode efficient`): preset compacto de role snapshot (interactive + compact + depth + maxChars menor).
  - Padrão de configuração (somente tool/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passar um modo (consulte [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
  - Opções de role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em papel com refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita role snapshots a um iframe (combina com refs de papel como `e12`).
  - `--interactive` produz uma lista plana e fácil de escolher de elementos interativos (melhor para conduzir ações).
  - `--labels` adiciona uma captura de tela somente da viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `click`/`type`/etc exigem um `ref` de `snapshot` (numérico `12` ou ref de papel `e12`).
  Seletores CSS intencionalmente não são suportados para ações.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **AI snapshot (refs numéricas)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricas.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, a ref é resolvida via `aria-ref` do Playwright.

- **Role snapshot (refs de papel como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em papel com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, a ref é resolvida via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela da viewport com rótulos `e12` sobrepostos.

Comportamento de ref:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use uma ref nova.
- Se o role snapshot foi feito com `--frame`, as refs de papel ficam limitadas àquele iframe até o próximo role snapshot.

## Recursos avançados de espera

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs suportados pelo Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar que um seletor se torne visível:
  - `openclaw browser wait "#main"`

Esses podem ser combinados:

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
2. Use `click <ref>` / `type <ref>` (prefira refs de papel no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está mirando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração profunda: grave um trace:
   - `openclaw browser trace start`
   - reproduza o problema
   - `openclaw browser trace stop` (imprime `TRACE:<path>`)

## Saída JSON

`--json` serve para scripts e ferramentas estruturadas.

Exemplos:

```bash
openclaw browser status --json
openclaw browser snapshot --interactive --json
openclaw browser requests --filter api --json
openclaw browser cookies --json
```

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Ajustes de estado e ambiente

Eles são úteis para fluxos do tipo “fazer o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Armazenamento: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua suportado)
- HTTP Basic auth: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de browser do openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode direcionar
  isso. Desative com `browser.evaluateEnabled=false` se não precisar disso.
- Para logins e observações sobre anti-bot (X/Twitter etc.), consulte [Login no browser + postagem em X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o Gateway/host node privado (somente loopback ou tailnet).
- Endpoints remotos de CDP são poderosos; faça túnel e proteja-os.

Exemplo de modo estrito (bloquear destinos privados/internos por padrão):

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

Para problemas específicos do Linux (especialmente Chromium via snap), consulte
[Solução de problemas do browser](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações de host dividido entre Gateway no WSL2 + Chrome no Windows, consulte
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do browser está saudável.
- **Bloqueio SSRF de navegação** significa que o plano de controle do browser está saudável, mas um alvo de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou abertura de aba falham com um erro de política de browser/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois casos:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro depure a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda está não saudável. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falhar, o plano de controle do browser está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do browser gerenciado está saudável.

Detalhes importantes de comportamento:

- A configuração do browser usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local em loopback `openclaw`, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcance SSRF do browser para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um alvo posterior de `open` ou `navigate` será permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do browser por padrão.
- Prefira exceções estreitas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` somente em ambientes intencionalmente confiáveis onde o acesso do browser à rede privada seja necessário e revisado.

Exemplo: navegação bloqueada, plano de controle saudável

- `start` tem sucesso
- `tabs` tem sucesso
- `open http://internal.example` falha

Isso geralmente significa que a inicialização do browser está ok e o alvo de navegação precisa de revisão de política.

Exemplo: inicialização bloqueada antes de a navegação importar

- `start` falha com `not reachable after start`
- `tabs` também falha ou não pode ser executado

Isso aponta para inicialização do browser ou alcance do CDP, não para um problema de allowlist da URL da página.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de browser:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso é mapeado:

- `browser snapshot` retorna uma árvore estável de interface (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de browser nomeado (`openclaw`, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o browser está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões fora de sandbox usam `host` por padrão.
  - Se um node com capacidade de browser estiver conectado, a ferramenta pode rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do browser em ambientes com sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e reforço do controle do browser
