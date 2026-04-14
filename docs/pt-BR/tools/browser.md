---
read_when:
    - Adicionando automação de navegador controlada por agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações do navegador + ciclo de vida no app para macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-14T13:04:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae9ef725f544d4236d229f498c7187871c69bd18d31069b30a7e67fac53166a2
    source_path: tools/browser.md
    workflow: 15
---

# Navegador (gerenciado pelo openclaw)

O OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por meio de um pequeno
serviço local de controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, apenas para o agente**.
- O perfil `openclaw` **não** interfere no perfil do seu navegador pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma área segura.
- O perfil `user` integrado se conecta à sua sessão real do Chrome autenticada via Chrome MCP.

## O que você obtém

- Um perfil de navegador separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador principal do dia a dia. Ele é uma superfície segura e isolada para
automação e verificação pelo agente.

## Início rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Browser disabled”, ative-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver ausente por completo, ou se o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle por Plugin

A ferramenta `browser` padrão agora é um Plugin incluído que vem habilitado por
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

Desative o Plugin incluído antes de instalar outro Plugin que forneça o
mesmo nome de ferramenta `browser`. A experiência padrão do navegador precisa de ambos:

- `plugins.entries.browser.enabled` não desativado
- `browser.enabled=true`

Se você desligar apenas o Plugin, a CLI de navegador incluída (`openclaw browser`),
o método do gateway (`browser.request`), a ferramenta do agente e o serviço padrão de controle do navegador
desaparecem juntos. Sua configuração `browser.*` permanece intacta para ser reutilizada por um
Plugin substituto.

O Plugin de navegador incluído agora também é responsável pela implementação do runtime do navegador.
O core mantém apenas helpers compartilhados do Plugin SDK, além de reexports de compatibilidade para
caminhos internos de importação mais antigos. Na prática, remover ou substituir o pacote do Plugin de navegador
remove o conjunto de recursos do navegador em vez de deixar um segundo runtime controlado pelo
core para trás.

Alterações na configuração do navegador ainda exigem um reinício do Gateway para que o Plugin incluído
possa registrar novamente seu serviço de navegador com as novas configurações.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` de repente se tornar um comando desconhecido após uma atualização, ou
se o agente informar que a ferramenta de navegador está ausente, a causa mais comum é uma
lista restritiva em `plugins.allow` que não inclui `browser`.

Exemplo de configuração com problema:

```json5
{
  plugins: {
    allow: ["telegram"],
  },
}
```

Corrija isso adicionando `browser` à allowlist de plugins:

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
- `tools.alsoAllow: ["browser"]` **não** carrega o Plugin de navegador incluído. Ele apenas ajusta a política da ferramenta depois que o Plugin já foi carregado.
- Se você não precisa de uma allowlist restritiva de plugins, remover `plugins.allow` também restaura o comportamento padrão do navegador incluído.

Sintomas típicos:

- `openclaw browser` é um comando desconhecido.
- `browser.request` está ausente.
- O agente informa que a ferramenta de navegador está indisponível ou ausente.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (nenhuma extensão necessária).
- `user`: perfil integrado de conexão ao Chrome MCP para sua **sessão real do Chrome autenticada**.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões autenticadas já existentes forem importantes e o usuário
  estiver no computador para clicar/aprovar qualquer solicitação de conexão.
- `profile` é a substituição explícita quando você quiser um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opte por isso apenas para acesso confiável à rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // tempo limite de HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // tempo limite do handshake WebSocket do CDP remoto (ms)
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

- O serviço de controle do navegador se vincula ao loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é a porta do gateway + 2).
- Se você substituir a porta do Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  as portas derivadas do navegador mudam para permanecer na mesma “família”.
- `cdpUrl` assume por padrão a porta CDP local gerenciada quando não está definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance do CDP remoto (não loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de alcance do WebSocket do CDP remoto.
- A navegação/abertura de aba do navegador é protegida contra SSRF antes da navegação e verificada novamente, na medida do possível, na URL final `http(s)` após a navegação.
- No modo SSRF estrito, a descoberta/sondas de endpoint CDP remoto (`cdpUrl`, incluindo buscas em `/json/version`) também são verificadas.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado por padrão. Defina-o como `true` apenas quando você confiar intencionalmente no acesso do navegador à rede privada.
- `browser.ssrfPolicy.allowPrivateNetwork` continua com suporte como alias legado para compatibilidade.
- `attachOnly: true` significa “nunca iniciar um navegador local; apenas conectar se ele já estiver em execução”.
- `color` + `color` por perfil tingem a interface do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (navegador independente gerenciado pelo OpenClaw). Use `defaultProfile: "user"` para optar pelo navegador do usuário autenticado.
- Ordem de autodetecção: navegador padrão do sistema se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- Perfis `openclaw` locais atribuem automaticamente `cdpPort`/`cdpUrl` — defina esses valores apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session
  precisar se conectar a um perfil de usuário Chromium não padrão, como Brave ou Edge.

## Usar Brave (ou outro navegador baseado em Chromium)

Se o navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usa automaticamente. Defina `browser.executablePath` para substituir a
autodetecção:

Exemplo de CLI:

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
- **Controle remoto (host do node):** execute um host do node na máquina que tem o navegador; o Gateway encaminha as ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.

O comportamento de parada difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis somente conexão e perfis CDP remotos: `openclaw browser stop` fecha a sessão de
  controle ativa e libera as substituições de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estados semelhantes), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

As URLs de CDP remoto podem incluir autenticação:

- Tokens de query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de registrá-los em arquivos de configuração.

## Proxy de navegador do Node (padrão sem configuração)

Se você executar um **host do node** na máquina que tem o seu navegador, o OpenClaw pode
encaminhar automaticamente as chamadas da ferramenta de navegador para esse node sem nenhuma configuração adicional de navegador.
Este é o caminho padrão para gateways remotos.

Observações:

- O host do node expõe seu servidor local de controle do navegador por meio de um **comando proxy**.
- Os perfis vêm da configuração `browser.profiles` do próprio node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe-o vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis por meio do proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de menor privilégio: apenas perfis na allowlist podem ser direcionados, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se não quiser isso:
  - No node: `nodeHost.browserProxy.enabled=false`
  - No gateway: `gateway.nodes.browser.mode="off"`

## Browserless (CDP remoto hospedado)

[Browserless](https://browserless.io) é um serviço hospedado de Chromium que expõe
URLs de conexão CDP por HTTPS e WebSocket. O OpenClaw pode usar qualquer uma das formas, mas
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
- Escolha o endpoint regional que corresponde à sua conta do Browserless (consulte a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Provedores CDP WebSocket diretos

Alguns serviços hospedados de navegador expõem um endpoint **WebSocket direto** em vez
da descoberta CDP padrão baseada em HTTP (`/json/version`). O OpenClaw oferece suporte a ambos:

- **Endpoints HTTP(S)** — o OpenClaw chama `/json/version` para descobrir a
  URL do depurador WebSocket e então se conecta.
- **Endpoints WebSocket** (`ws://` / `wss://`) — o OpenClaw se conecta diretamente,
  ignorando `/json/version`. Use isso para serviços como
  [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com) ou qualquer provedor que forneça uma
  URL WebSocket.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução de CAPTCHA integrada, modo furtivo e
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
  no [painel Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador ao conectar por WebSocket, então
  não é necessária nenhuma etapa manual de criação de sessão.
- O plano gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Consulte os [preços](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a
  referência completa da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente loopback; o acesso flui pela autenticação do Gateway ou pelo pareamento de node.
- A API HTTP de navegador em loopback independente usa **somente autenticação por segredo compartilhado**:
  autenticação bearer por token do gateway, `x-openclaw-password` ou autenticação HTTP Basic com a
  senha configurada do gateway.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API de navegador em loopback independente.
- Se o controle do navegador estiver ativado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera esse token automaticamente quando `gateway.auth.mode` já está em
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remotos como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas de CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (vários navegadores)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo openclaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados do usuário + porta CDP
- **remotos**: uma URL CDP explícita (navegador baseado em Chromium em execução em outro lugar)
- **sessão existente**: seu perfil existente do Chrome via autoconexão do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão existing-session do Chrome MCP.
- Perfis existing-session são opt-in além de `user`; crie-os com `--driver existing-session`.
- Portas CDP locais são alocadas em **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Existing-session via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium já em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil do navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [README do Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil existing-session personalizado se quiser um
nome, cor ou diretório de dados do navegador diferentes.

Comportamento padrão:

- O perfil integrado `user` usa autoconexão do Chrome MCP, que tem como alvo o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil do Chrome que não seja o padrão:

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
2. Ative a depuração remota.
3. Mantenha o navegador em execução e aprove a solicitação de conexão quando o OpenClaw se conectar.

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
- `tabs` lista as abas do navegador que já estão abertas
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador baseado em Chromium de destino está na versão `144+`
- a depuração remota está ativada na página de inspeção desse navegador
- o navegador exibiu e você aceitou o prompt de consentimento de conexão
- `openclaw doctor` migra a configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de autoconexão, mas ele não pode
  ativar a depuração remota do lado do navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador autenticado do usuário.
- Se você usar um perfil existing-session personalizado, passe esse nome de perfil explícito.
- Escolha esse modo apenas quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou host de node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho tem risco maior que o perfil isolado `openclaw`, porque ele pode
  agir dentro da sua sessão de navegador autenticada.
- O OpenClaw não inicia o navegador para esse driver; ele se conecta apenas a uma
  sessão existente.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, o OpenClaw o repassa para direcionar aquele diretório
  explícito de dados do usuário do Chromium.
- Capturas de tela em existing-session oferecem suporte a capturas de página e capturas
  de elemento com `--ref` a partir de snapshots, mas não a seletores CSS `--element`.
- Capturas de tela de página em existing-session funcionam sem Playwright via Chrome MCP.
  Capturas de elemento baseadas em ref (`--ref`) também funcionam ali, mas `--full-page`
  não pode ser combinado com `--ref` ou `--element`.
- As ações de existing-session ainda são mais limitadas que o caminho do navegador
  gerenciado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem
    refs de snapshot em vez de seletores CSS
  - `click` é apenas com botão esquerdo (sem substituições de botão ou modificadores)
  - `type` não oferece suporte a `slowly=true`; use `fill` ou `press`
  - `press` não oferece suporte a `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não
    oferecem suporte a substituições de timeout por chamada
  - `select` atualmente oferece suporte a apenas um único valor
- `wait --url` em existing-session oferece suporte a padrões exatos, por substring e glob
  como outros drivers de navegador. `wait --load networkidle` ainda não é compatível.
- Hooks de upload em existing-session exigem `ref` ou `inputRef`, oferecem suporte a um arquivo
  por vez e não oferecem suporte a direcionamento CSS `element`.
- Hooks de diálogo em existing-session não oferecem suporte a substituições de timeout.
- Alguns recursos ainda exigem o caminho do navegador gerenciado, incluindo ações
  em lote, exportação em PDF, interceptação de download e `responsebody`.
- Existing-session é local ao host. Se o Chrome estiver em outra máquina ou em um
  namespace de rede diferente, use CDP remoto ou um host de node.

## Garantias de isolamento

- **Diretório de dados do usuário dedicado**: nunca toca o perfil do seu navegador pessoal.
- **Portas dedicadas**: evita `9222` para prevenir colisões com fluxos de trabalho de desenvolvimento.
- **Controle determinístico de abas**: direciona abas por `targetId`, não pela “última aba”.

## Seleção do navegador

Ao iniciar localmente, o OpenClaw escolhe o primeiro disponível:

1. Chrome
2. Brave
3. Edge
4. Chromium
5. Chrome Canary

Você pode substituir isso com `browser.executablePath`.

Plataformas:

- macOS: verifica `/Applications` e `~/Applications`.
- Linux: procura `google-chrome`, `brave`, `microsoft-edge`, `chromium` etc.
- Windows: verifica locais de instalação comuns.

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

Se a autenticação do gateway por segredo compartilhado estiver configurada, as rotas HTTP do navegador também exigirão autenticação:

- `Authorization: Bearer <gateway token>`
- `x-openclaw-password: <gateway password>` ou autenticação HTTP Basic com essa senha

Observações:

- Esta API de navegador em loopback independente **não** consome `trusted-proxy` nem
  cabeçalhos de identidade do Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de navegador em loopback
  não herdam esses modos baseados em identidade; mantenha-as somente em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para falhas de validação e
política no nível da rota:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação não compatível.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desativado pela configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` no nível superior ou em lote entra em conflito com o alvo da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis existing-session.

Outras falhas em runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/AI snapshot/role snapshot, capturas de tela de elementos,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornarão
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Capturas de tela de página para o navegador `openclaw` gerenciado quando um WebSocket
  CDP por aba estiver disponível
- Capturas de tela de página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em `--ref` em `existing-session` a partir da saída de snapshot

O que ainda precisa de Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Capturas de tela de elemento por seletor CSS (`--element`)
- Exportação completa de PDF do navegador

Capturas de tela de elemento também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, instale o pacote completo do
Playwright (não `playwright-core`) e reinicie o gateway, ou reinstale o
OpenClaw com suporte a navegador.

#### Instalação do Playwright no Docker

Se o seu Gateway estiver em execução no Docker, evite `npx playwright` (conflitos de override do npm).
Use a CLI incluída:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir os downloads do navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Veja [Docker](/pt-BR/install/docker).

## Como funciona (internamente)

Fluxo de alto nível:

- Um pequeno **servidor de controle** aceita requisições HTTP.
- Ele se conecta a navegadores baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (clicar/digitar/snapshot/PDF), ele usa **Playwright** sobre
  o CDP.
- Quando o Playwright está ausente, apenas operações que não usam Playwright ficam disponíveis.

Esse design mantém o agente em uma interface estável e determinística, ao mesmo tempo em que permite
trocar navegadores e perfis locais/remotos.

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

- Para perfis somente conexão e perfis CDP remotos, `openclaw browser stop` ainda é o
  comando correto de limpeza após testes. Ele fecha a sessão de controle ativa e
  limpa substituições temporárias de emulação em vez de encerrar o navegador
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

- `upload` e `dialog` são chamadas de **preparação**; execute-as antes do clique/pressionamento
  que aciona o seletor/diálogo.
- Os caminhos de saída de download e trace são restritos às raízes temporárias do OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Os caminhos de upload são restritos a uma raiz temporária de uploads do OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` também pode definir diretamente entradas de arquivo via `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando o Playwright está instalado): retorna um snapshot de IA com refs numéricos (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; apenas inspeção).
  - `--efficient` (ou `--mode efficient`): preset compacto de snapshot por role (interactive + compact + depth + maxChars menor).
  - Padrão de configuração (somente ferramenta/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passar um modo (veja [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
  - Opções de snapshot por role (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em role com refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita snapshots por role a um iframe (em conjunto com refs por role como `e12`).
  - `--interactive` produz uma lista plana e fácil de escolher de elementos interativos (melhor para executar ações).
  - `--labels` adiciona uma captura de tela somente da viewport com labels de ref sobrepostos (imprime `MEDIA:<path>`).
- `click`/`type`/etc exigem um `ref` de `snapshot` (seja numérico `12` ou ref por role `e12`).
  Seletores CSS intencionalmente não são compatíveis para ações.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **Snapshot de IA (refs numéricos)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot de texto que inclui refs numéricos.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, o ref é resolvido via `aria-ref` do Playwright.

- **Snapshot por role (refs por role como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em role com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, o ref é resolvido via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela da viewport com labels `e12` sobrepostos.

Comportamento dos refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use um ref novo.
- Se o snapshot por role foi feito com `--frame`, os refs por role ficam limitados àquele iframe até o próximo snapshot por role.

## Recursos avançados de espera

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs compatíveis com Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar por um seletor ficar visível:
  - `openclaw browser wait "#main"`

Eles podem ser combinados:

```bash
openclaw browser wait "#main" \
  --url "**/dash" \
  --load networkidle \
  --fn "window.ready===true" \
  --timeout-ms 15000
```

## Fluxos de depuração

Quando uma ação falhar (por exemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs por role no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está direcionando
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

Snapshots por role em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos de trabalho do tipo “faça o site se comportar como X”:

- Cookies: `cookies`, `cookies set`, `cookies clear`
- Storage: `storage local|session get|set|clear`
- Offline: `set offline on|off`
- Headers: `set headers --headers-json '{"X-Debug":"1"}'` (o legado `set headers --json '{"X-Debug":"1"}'` continua compatível)
- Autenticação HTTP Basic: `set credentials user pass` (ou `--clear`)
- Geolocalização: `set geo <lat> <lon> --origin "https://example.com"` (ou `--clear`)
- Mídia: `set media dark|light|no-preference|none`
- Fuso horário / localidade: `set timezone ...`, `set locale ...`
- Dispositivo / viewport:
  - `set device "iPhone 14"` (presets de dispositivo do Playwright)
  - `set viewport 1280 720`

## Segurança e privacidade

- O perfil de navegador openclaw pode conter sessões autenticadas; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode direcionar
  isso. Desative com `browser.evaluateEnabled=false` se você não precisar disso.
- Para logins e observações sobre anti-bot (X/Twitter etc.), veja [Login no navegador + postagem no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o Gateway/host de node privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; faça tunnel e proteja-os.

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

Para problemas específicos do Linux (especialmente snap Chromium), veja
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações divididas entre Gateway no WSL2 + Chrome no Windows em hosts separados, veja
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está íntegro, mas um destino de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou de abertura de aba falham com um erro de política de navegador/rede, enquanto `start` e `tabs` continuam funcionando

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro resolva o problema de prontidão do CDP.
- Se `start` tiver êxito, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem êxito, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem êxito, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes de comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local em loopback `openclaw`, as verificações de integridade do CDP intencionalmente ignoram a imposição de alcance SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido em `start` ou `tabs` não significa que um alvo posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do navegador por padrão.
- Prefira exceções restritas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis em que o acesso do navegador à rede privada seja necessário e revisado.

Exemplo: navegação bloqueada, plano de controle íntegro

- `start` tem êxito
- `tabs` tem êxito
- `open http://internal.example` falha

Isso normalmente significa que a inicialização do navegador está correta e o destino de navegação precisa de revisão da política.

Exemplo: inicialização bloqueada antes que a navegação importe

- `start` falha com `not reachable after start`
- `tabs` também falha ou não pode ser executado

Isso aponta para inicialização do navegador ou alcance do CDP, não para um problema de allowlist de URL de página.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação do navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso se mapeia:

- `browser snapshot` retorna uma árvore de UI estável (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão; sessões sem sandbox usam `host` por padrão.
  - Se um node com capacidade de navegador estiver conectado, a ferramenta poderá encaminhar automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do navegador em ambientes com sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e reforço de segurança do controle do navegador
