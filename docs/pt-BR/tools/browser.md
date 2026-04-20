---
read_when:
    - Adicionando automação de navegador controlada pelo agente
    - Depurando por que o openclaw está interferindo no seu próprio Chrome
    - Implementando configurações e ciclo de vida do navegador no app do macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-20T05:42:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3f7d37b34ba48dc7c38f8c2e77f8bb97af987eac6a874ebfc921f950fb59de4b
    source_path: tools/browser.md
    workflow: 15
---

# Navegador (gerenciado pelo openclaw)

O OpenClaw pode executar um **perfil dedicado do Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por meio de um pequeno
serviço de controle local dentro do Gateway (apenas loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, apenas para o agente**.
- O perfil `openclaw` **não** toca no perfil do seu navegador pessoal.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em uma área segura.
- O perfil integrado `user` se conecta à sua sessão real do Chrome com login feito via Chrome MCP.

## O que você recebe

- Um perfil de navegador separado chamado **openclaw** (com destaque laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Suporte opcional a múltiplos perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador do dia a dia. Ele é uma superfície
segura e isolada para automação e verificação por agentes.

## Início rápido

```bash
openclaw browser --browser-profile openclaw status
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

Se você receber “Navegador desativado”, ative-o na configuração (veja abaixo) e reinicie o
Gateway.

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle por Plugin

A ferramenta `browser` padrão agora é um Plugin incluído que vem habilitado por
padrão. Isso significa que você pode desativá-la ou substituí-la sem remover o restante do
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

Desative o Plugin incluído antes de instalar outro plugin que forneça o
mesmo nome de ferramenta `browser`. A experiência padrão de navegador precisa de ambos:

- `plugins.entries.browser.enabled` não desativado
- `browser.enabled=true`

Se você desativar apenas o plugin, a CLI de navegador incluída (`openclaw browser`),
o método do gateway (`browser.request`), a ferramenta do agente e o serviço padrão de controle do navegador
desaparecem juntos. Sua configuração `browser.*` permanece intacta para que um
plugin substituto a reutilize.

O Plugin de navegador incluído agora também é responsável pela implementação de runtime do navegador.
O núcleo mantém apenas helpers compartilhados do Plugin SDK, além de reexports de compatibilidade para
caminhos de importação internos mais antigos. Na prática, remover ou substituir o pacote do plugin de navegador
remove o conjunto de recursos do navegador, em vez de deixar para trás um segundo runtime controlado pelo
núcleo.

Alterações na configuração do navegador ainda exigem uma reinicialização do Gateway para que o Plugin incluído
registre novamente seu serviço de navegador com as novas configurações.

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

Corrija adicionando `browser` à allowlist de plugins:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

Observações importantes:

- `browser.enabled=true` não é suficiente por si só quando `plugins.allow` está definido.
- `plugins.entries.browser.enabled=true` também não é suficiente por si só quando `plugins.allow` está definido.
- `tools.alsoAllow: ["browser"]` **não** carrega o Plugin de navegador incluído. Ele apenas ajusta a política da ferramenta depois que o plugin já foi carregado.
- Se você não precisa de uma allowlist restritiva de plugins, remover `plugins.allow` também restaura o comportamento padrão do navegador incluído.

Sintomas típicos:

- `openclaw browser` é um comando desconhecido.
- `browser.request` está ausente.
- O agente informa que a ferramenta de navegador está indisponível ou ausente.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (não requer extensão).
- `user`: perfil integrado de conexão do Chrome MCP para sua **sessão real do Chrome**
  com login feito.

Para chamadas da ferramenta de navegador do agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões com login já existentes forem importantes e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você quer um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado por padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opte por isso apenas para acesso confiável a redes privadas
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // tempo limite HTTP do CDP remoto (ms)
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

- O serviço de controle do navegador faz bind em loopback em uma porta derivada de `gateway.port`
  (padrão: `18791`, que é gateway + 2).
- Se você substituir a porta do Gateway (`gateway.port` ou `OPENCLAW_GATEWAY_PORT`),
  as portas derivadas do navegador mudam para permanecer na mesma “família”.
- `cdpUrl` usa por padrão a porta CDP local gerenciada quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcançabilidade do CDP remoto (não loopback).
- `remoteCdpHandshakeTimeoutMs` se aplica a verificações de alcançabilidade do WebSocket do CDP remoto.
- A navegação/abertura de aba do navegador é protegida contra SSRF antes da navegação e é verificada novamente, na medida do possível, na URL final `http(s)` após a navegação.
- No modo estrito de SSRF, a descoberta/verificação do endpoint CDP remoto (`cdpUrl`, incluindo buscas em `/json/version`) também é verificada.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` vem desativado por padrão. Defina-o como `true` apenas quando você confiar intencionalmente no acesso do navegador à rede privada.
- `browser.ssrfPolicy.allowPrivateNetwork` continua compatível como alias legado para compatibilidade.
- `attachOnly: true` significa “nunca iniciar um navegador local; apenas conectar se ele já estiver em execução.”
- `color` + `color` por perfil tingem a interface do navegador para que você possa ver qual perfil está ativo.
- O perfil padrão é `openclaw` (navegador autônomo gerenciado pelo OpenClaw). Use `defaultProfile: "user"` para optar pelo navegador do usuário com login feito.
- Ordem de detecção automática: navegador padrão do sistema, se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl` — defina-os apenas para CDP remoto.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não
  defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session
  precisar se conectar a um perfil de usuário Chromium não padrão, como Brave ou Edge.

## Use Brave (ou outro navegador baseado em Chromium)

Se o navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usará automaticamente. Defina `browser.executablePath` para substituir a
detecção automática:

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

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode abrir um navegador local.
- **Controle remoto (host Node):** execute um host Node na máquina que tem o navegador; o Gateway faz proxy das ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.

O comportamento ao parar difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis attach-only e de CDP remoto: `openclaw browser stop` fecha a sessão de controle ativa
  e libera as substituições de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs CDP remotas podem incluir autenticação:

- Tokens na query (por exemplo, `https://provider.example?token=<token>`)
- Autenticação HTTP Basic (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket do CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de confirmá-los em arquivos de configuração.

## Proxy de navegador do Node (padrão sem configuração)

Se você executar um **host Node** na máquina que tem seu navegador, o OpenClaw pode
rotear automaticamente chamadas da ferramenta de navegador para esse node sem nenhuma configuração extra do navegador.
Esse é o caminho padrão para gateways remotos.

Observações:

- O host Node expõe seu servidor local de controle do navegador por meio de um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados continuam acessíveis pelo proxy, incluindo rotas de criar/excluir perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw o trata como um limite de menor privilégio: apenas perfis na allowlist podem ser usados como alvo, e rotas persistentes de criar/excluir perfil são bloqueadas na superfície do proxy.
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
- Escolha o endpoint de região que corresponda à sua conta Browserless (veja a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Provedores CDP de WebSocket direto

Alguns serviços de navegador hospedados expõem um endpoint **WebSocket direto** em vez
da descoberta padrão de CDP baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta por HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por um handshake WebSocket e ignora
  `/json/version` por completo.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a descoberta HTTP
  em `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Isso cobre
  tanto portas de depuração remota no estilo Chrome quanto provedores somente WebSocket.

`ws://host:port` / `wss://host:port` simples, sem um caminho `/devtools/...`,
apontando para uma instância local do Chrome, são compatíveis por meio do
fallback com descoberta primeiro — o Chrome só aceita upgrades WebSocket no caminho específico por navegador
ou por alvo retornado por `/json/version`, então um handshake apenas na raiz
falharia.

### Browserbase

[Browserbase](https://www.browserbase.com) é uma plataforma em nuvem para executar
navegadores headless com resolução integrada de CAPTCHA, modo furtivo e
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
- Substitua `<BROWSERBASE_API_KEY>` pela sua API key real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador na conexão WebSocket, então
  não é necessária uma etapa manual de criação de sessão.
- O plano gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Veja os [preços](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Veja a [documentação do Browserbase](https://docs.browserbase.com) para a
  referência completa da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é apenas loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento do node.
- A API HTTP autônoma do navegador em loopback usa **apenas autenticação por segredo compartilhado**:
  auth bearer com token do gateway, `x-openclaw-password` ou HTTP Basic auth com a
  senha configurada do gateway.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API autônoma do navegador em loopback.
- Se o controle do navegador estiver habilitado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera esse token automaticamente quando `gateway.auth.mode` já é
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts de node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (multi-browser)

O OpenClaw oferece suporte a múltiplos perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo openclaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados de usuário + porta CDP
- **remoto**: uma URL CDP explícita (navegador baseado em Chromium em execução em outro lugar)
- **sessão existente**: seu perfil atual do Chrome via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão a sessão existente do Chrome MCP.
- Perfis de sessão existente são opt-in além de `user`; crie-os com `--driver existing-session`.
- As portas CDP locais são alocadas de **18800–18899** por padrão.
- Excluir um perfil move seu diretório de dados local para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil em execução de navegador baseado em Chromium por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do navegador diferentes.

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

Depois, no navegador correspondente:

1. Abra a página de inspeção desse navegador para depuração remota.
2. Ative a depuração remota.
3. Mantenha o navegador em execução e aprove o prompt de conexão quando o OpenClaw se conectar.

Páginas comuns de inspeção:

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
- `snapshot` retorna refs da aba ao vivo selecionada

O que verificar se a conexão não funcionar:

- o navegador baseado em Chromium de destino está na versão `144+`
- a depuração remota está habilitada na página de inspeção desse navegador
- o navegador exibiu e você aceitou o prompt de consentimento de conexão
- `openclaw doctor` migra a configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão de conexão automática, mas ele não pode
  habilitar a depuração remota no lado do navegador para você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado do navegador do usuário com login feito.
- Se você usa um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha esse modo somente quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou host de node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho apresenta risco mais alto do que o perfil isolado `openclaw`, pois pode
  agir dentro da sua sessão de navegador com login feito.
- O OpenClaw não inicia o navegador para esse driver; ele se conecta apenas a uma
  sessão existente.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, o OpenClaw o repassa para ter como alvo esse diretório explícito
  de dados de usuário Chromium.
- Capturas de tela em sessão existente oferecem suporte a capturas de página e capturas de elemento com `--ref`
  a partir de snapshots, mas não a seletores CSS `--element`.
- Capturas de tela de página em sessão existente funcionam sem Playwright via Chrome MCP.
  Capturas de elemento baseadas em ref (`--ref`) também funcionam ali, mas `--full-page`
  não pode ser combinado com `--ref` ou `--element`.
- As ações em sessão existente ainda são mais limitadas do que no caminho de navegador
  gerenciado:
  - `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem
    refs de snapshot em vez de seletores CSS
  - `click` é apenas com o botão esquerdo (sem substituições de botão ou modificadores)
  - `type` não oferece suporte a `slowly=true`; use `fill` ou `press`
  - `press` não oferece suporte a `delayMs`
  - `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não
    oferecem suporte a substituições de timeout por chamada
  - `select` atualmente aceita apenas um valor
- `wait --url` em sessão existente oferece suporte a padrões exatos, de substring e glob
  como outros drivers de navegador. `wait --load networkidle` ainda não é compatível.
- Hooks de upload em sessão existente exigem `ref` ou `inputRef`, aceitam um arquivo
  por vez e não oferecem suporte a direcionamento de CSS `element`.
- Hooks de diálogo em sessão existente não oferecem suporte a substituições de timeout.
- Alguns recursos ainda exigem o caminho de navegador gerenciado, incluindo ações em lote,
  exportação para PDF, interceptação de download e `responsebody`.
- Sessão existente pode se conectar no host selecionado ou por meio de um node de navegador conectado. Se
  o Chrome estiver em outro lugar e nenhum node de navegador estiver conectado, use
  CDP remoto ou um host de node.

## Garantias de isolamento

- **Diretório dedicado de dados do usuário**: nunca toca no perfil do seu navegador pessoal.
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
- Windows: verifica locais comuns de instalação.

## API de controle (opcional)

Apenas para integrações locais, o Gateway expõe uma pequena API HTTP em loopback:

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
- `x-openclaw-password: <gateway password>` ou HTTP Basic auth com essa senha

Observações:

- Esta API autônoma do navegador em loopback **não** consome cabeçalhos de identidade de trusted-proxy ou
  Tailscale Serve.
- Se `gateway.auth.mode` for `none` ou `trusted-proxy`, essas rotas de navegador em loopback
  não herdam esses modos com identidade; mantenha-as apenas em loopback.

### Contrato de erro de `/act`

`POST /act` usa uma resposta de erro estruturada para validação em nível de rota e
falhas de política:

```json
{ "error": "<message>", "code": "ACT_*" }
```

Valores atuais de `code`:

- `ACT_KIND_REQUIRED` (HTTP 400): `kind` está ausente ou não é reconhecido.
- `ACT_INVALID_REQUEST` (HTTP 400): o payload da ação falhou na normalização ou validação.
- `ACT_SELECTOR_UNSUPPORTED` (HTTP 400): `selector` foi usado com um tipo de ação não compatível.
- `ACT_EVALUATE_DISABLED` (HTTP 403): `evaluate` (ou `wait --fn`) está desabilitado por configuração.
- `ACT_TARGET_ID_MISMATCH` (HTTP 403): `targetId` de nível superior ou em lote entra em conflito com o alvo da solicitação.
- `ACT_EXISTING_SESSION_UNSUPPORTED` (HTTP 501): a ação não é compatível com perfis de sessão existente.

Outras falhas de runtime ainda podem retornar `{ "error": "<message>" }` sem um
campo `code`.

### Requisito do Playwright

Alguns recursos (navigate/act/AI snapshot/role snapshot, capturas de tela de elementos,
PDF) exigem Playwright. Se o Playwright não estiver instalado, esses endpoints retornam
um erro 501 claro.

O que ainda funciona sem Playwright:

- Snapshots ARIA
- Capturas de tela de página para o navegador `openclaw` gerenciado quando um WebSocket
  CDP por aba está disponível
- Capturas de tela de página para perfis `existing-session` / Chrome MCP
- Capturas de tela baseadas em ref (`--ref`) em `existing-session` a partir da saída de snapshot

O que ainda exige Playwright:

- `navigate`
- `act`
- AI snapshots / role snapshots
- Capturas de tela de elementos por seletor CSS (`--element`)
- Exportação completa de PDF do navegador

Capturas de tela de elementos também rejeitam `--full-page`; a rota retorna `fullPage is
not supported for element screenshots`.

Se você vir `Playwright is not available in this gateway build`, instale o pacote completo
do Playwright (não `playwright-core`) e reinicie o gateway, ou reinstale o
OpenClaw com suporte a navegador.

#### Instalação do Playwright no Docker

Se o seu Gateway for executado no Docker, evite `npx playwright` (conflitos com overrides do npm).
Use a CLI incluída:

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

Para persistir downloads de navegador, defina `PLAYWRIGHT_BROWSERS_PATH` (por exemplo,
`/home/node/.cache/ms-playwright`) e garanta que `/home/node` seja persistido via
`OPENCLAW_HOME_VOLUME` ou um bind mount. Veja [Docker](/pt-BR/install/docker).

## Como funciona (interno)

Fluxo em alto nível:

- Um pequeno **servidor de controle** aceita solicitações HTTP.
- Ele se conecta a navegadores baseados em Chromium (Chrome/Brave/Edge/Chromium) via **CDP**.
- Para ações avançadas (click/type/snapshot/PDF), ele usa **Playwright** sobre
  o CDP.
- Quando o Playwright está ausente, apenas operações sem Playwright ficam disponíveis.

Esse design mantém o agente em uma interface estável e determinística, ao mesmo tempo em que permite
trocar navegadores e perfis locais/remotos.

## Referência rápida da CLI

Todos os comandos aceitam `--browser-profile <name>` para direcionar a um perfil específico.
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

- Para perfis attach-only e de CDP remoto, `openclaw browser stop` ainda é o
  comando de limpeza correto após testes. Ele fecha a sessão de controle ativa e
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

- `upload` e `dialog` são chamadas de **preparação**; execute-as antes do click/press
  que aciona o seletor/diálogo.
- Os caminhos de saída de download e trace são limitados às raízes temporárias do OpenClaw:
  - traces: `/tmp/openclaw` (fallback: `${os.tmpdir()}/openclaw`)
  - downloads: `/tmp/openclaw/downloads` (fallback: `${os.tmpdir()}/openclaw/downloads`)
- Os caminhos de upload são limitados a uma raiz temporária de uploads do OpenClaw:
  - uploads: `/tmp/openclaw/uploads` (fallback: `${os.tmpdir()}/openclaw/uploads`)
- `upload` também pode definir inputs de arquivo diretamente por `--input-ref` ou `--element`.
- `snapshot`:
  - `--format ai` (padrão quando o Playwright está instalado): retorna um AI snapshot com refs numéricos (`aria-ref="<n>"`).
  - `--format aria`: retorna a árvore de acessibilidade (sem refs; apenas inspeção).
  - `--efficient` (ou `--mode efficient`): preset compacto de role snapshot (interactive + compact + depth + maxChars menor).
  - Padrão de configuração (somente ferramenta/CLI): defina `browser.snapshotDefaults.mode: "efficient"` para usar snapshots eficientes quando o chamador não passar um modo (veja [Configuração do Gateway](/pt-BR/gateway/configuration-reference#browser)).
  - Opções de role snapshot (`--interactive`, `--compact`, `--depth`, `--selector`) forçam um snapshot baseado em função com refs como `ref=e12`.
  - `--frame "<iframe selector>"` limita role snapshots a um iframe (pareado com refs de função como `e12`).
  - `--interactive` produz uma lista plana e fácil de escolher de elementos interativos (melhor para conduzir ações).
  - `--labels` adiciona uma captura de tela somente da viewport com rótulos de ref sobrepostos (imprime `MEDIA:<path>`).
- `click`/`type`/etc exigem um `ref` de `snapshot` (numérico `12` ou ref de função `e12`).
  Seletores CSS intencionalmente não são compatíveis para ações.

## Snapshots e refs

O OpenClaw oferece suporte a dois estilos de “snapshot”:

- **AI snapshot (refs numéricos)**: `openclaw browser snapshot` (padrão; `--format ai`)
  - Saída: um snapshot em texto que inclui refs numéricos.
  - Ações: `openclaw browser click 12`, `openclaw browser type 23 "hello"`.
  - Internamente, o ref é resolvido via `aria-ref` do Playwright.

- **Role snapshot (refs de função como `e12`)**: `openclaw browser snapshot --interactive` (ou `--compact`, `--depth`, `--selector`, `--frame`)
  - Saída: uma lista/árvore baseada em função com `[ref=e12]` (e opcionalmente `[nth=1]`).
  - Ações: `openclaw browser click e12`, `openclaw browser highlight e12`.
  - Internamente, o ref é resolvido via `getByRole(...)` (mais `nth()` para duplicatas).
  - Adicione `--labels` para incluir uma captura de tela da viewport com rótulos `e12` sobrepostos.

Comportamento dos refs:

- Refs **não são estáveis entre navegações**; se algo falhar, execute `snapshot` novamente e use um ref novo.
- Se o role snapshot foi feito com `--frame`, os refs de função ficam limitados a esse iframe até o próximo role snapshot.

## Recursos avançados de wait

Você pode esperar por mais do que apenas tempo/texto:

- Esperar por URL (globs compatíveis com Playwright):
  - `openclaw browser wait --url "**/dash"`
- Esperar por estado de carregamento:
  - `openclaw browser wait --load networkidle`
- Esperar por um predicado JS:
  - `openclaw browser wait --fn "window.ready===true"`
- Esperar um seletor ficar visível:
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

Quando uma ação falha (por exemplo, “not visible”, “strict mode violation”, “covered”):

1. `openclaw browser snapshot --interactive`
2. Use `click <ref>` / `type <ref>` (prefira refs de função no modo interativo)
3. Se ainda falhar: `openclaw browser highlight <ref>` para ver o que o Playwright está direcionando
4. Se a página se comportar de forma estranha:
   - `openclaw browser errors --clear`
   - `openclaw browser requests --filter api --clear`
5. Para depuração aprofundada: grave um trace:
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

Role snapshots em JSON incluem `refs` mais um pequeno bloco `stats` (lines/chars/refs/interactive) para que ferramentas possam raciocinar sobre tamanho e densidade do payload.

## Controles de estado e ambiente

Eles são úteis para fluxos de trabalho do tipo “faça o site se comportar como X”:

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

- O perfil de navegador openclaw pode conter sessões com login feito; trate-o como sensível.
- `browser act kind=evaluate` / `openclaw browser evaluate` e `wait --fn`
  executam JavaScript arbitrário no contexto da página. Injeção de prompt pode influenciar
  isso. Desative com `browser.evaluateEnabled=false` se você não precisar disso.
- Para logins e observações anti-bot (X/Twitter etc.), veja [Login no navegador + postagem no X/Twitter](/pt-BR/tools/browser-login).
- Mantenha o Gateway/host de node privado (somente loopback ou tailnet).
- Endpoints CDP remotos são poderosos; faça túnel e proteja-os.

Exemplo de modo estrito (bloqueia destinos privados/internos por padrão):

```json5
{
  browser: {
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: false,
      hostnameAllowlist: ["*.example.com", "example.com"],
      allowedHostnames: ["localhost"], // permissão exata opcional
    },
  },
}
```

## Solução de problemas

Para problemas específicos do Linux (especialmente snap Chromium), veja
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações divididas entre Gateway no WSL2 + Chrome no Windows, veja
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha na inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes diferentes de falha e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está íntegro.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está íntegro, mas um alvo de navegação de página é rejeitado pela política.

Exemplos comuns:

- Falha na inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos de `open`, `navigate`, snapshot ou abertura de aba falham com um erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro solucione a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está íntegro. Trate isso como um problema de alcançabilidade do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está íntegro.

Detalhes importantes de comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local `openclaw` em loopback, as verificações de integridade do CDP ignoram intencionalmente a aplicação de alcançabilidade SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido em `start` ou `tabs` não significa que um alvo posterior de `open` ou `navigate` seja permitido.

Orientações de segurança:

- **Não** flexibilize a política SSRF do navegador por padrão.
- Prefira exceções estreitas de host, como `hostnameAllowlist` ou `allowedHostnames`, em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis nos quais o acesso do navegador à rede privada seja necessário e revisado.

Exemplo: navegação bloqueada, plano de controle íntegro

- `start` tem sucesso
- `tabs` tem sucesso
- `open http://internal.example` falha

Isso normalmente significa que a inicialização do navegador está correta e o alvo de navegação precisa de revisão de política.

Exemplo: inicialização bloqueada antes de a navegação importar

- `start` falha com `not reachable after start`
- `tabs` também falha ou não pode ser executado

Isso aponta para inicialização do navegador ou alcançabilidade do CDP, não para um problema de allowlist de URL de página.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso se mapeia:

- `browser snapshot` retorna uma árvore de UI estável (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil de navegador nomeado (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão, sessões fora de sandbox usam `host` por padrão.
  - Se um node com capacidade de navegador estiver conectado, a ferramenta poderá rotear automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionado

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do navegador em ambientes em sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e reforço de segurança do controle do navegador
