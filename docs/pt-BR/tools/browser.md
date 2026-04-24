---
read_when:
    - Adição de automação de navegador controlada por agente
    - Depuração de por que o openclaw está interferindo no seu próprio Chrome
    - Implementação de configurações + ciclo de vida do navegador no app macOS
summary: Serviço integrado de controle do navegador + comandos de ação
title: Navegador (gerenciado pelo OpenClaw)
x-i18n:
    generated_at: "2026-04-24T09:01:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80805676213ef5195093163874a848955b3c25364b20045a8d759d03ac088e14
    source_path: tools/browser.md
    workflow: 15
---

O OpenClaw pode executar um **perfil dedicado de Chrome/Brave/Edge/Chromium** que o agente controla.
Ele é isolado do seu navegador pessoal e é gerenciado por meio de um pequeno
serviço local de controle dentro do Gateway (somente loopback).

Visão para iniciantes:

- Pense nele como um **navegador separado, exclusivo para o agente**.
- O perfil `openclaw` **não** toca no seu perfil pessoal do navegador.
- O agente pode **abrir abas, ler páginas, clicar e digitar** em um caminho seguro.
- O perfil `user` integrado se conecta à sua sessão real autenticada do Chrome por meio do Chrome MCP.

## O que você obtém

- Um perfil de navegador separado chamado **openclaw** (acento laranja por padrão).
- Controle determinístico de abas (listar/abrir/focar/fechar).
- Ações do agente (clicar/digitar/arrastar/selecionar), snapshots, capturas de tela, PDFs.
- Suporte opcional a vários perfis (`openclaw`, `work`, `remote`, ...).

Este navegador **não** é o seu navegador de uso diário. É uma superfície segura e isolada para
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

Se `openclaw browser` estiver totalmente ausente, ou se o agente disser que a ferramenta de navegador
não está disponível, vá para [Comando ou ferramenta de navegador ausente](/pt-BR/tools/browser#missing-browser-command-or-tool).

## Controle do Plugin

A ferramenta `browser` padrão é um Plugin incluído. Desative-a para substituí-la por outro Plugin que registre o mesmo nome de ferramenta `browser`:

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

Os padrões exigem tanto `plugins.entries.browser.enabled` **quanto** `browser.enabled=true`. Desativar apenas o Plugin remove a CLI `openclaw browser`, o método de gateway `browser.request`, a ferramenta do agente e o serviço de controle como uma unidade; sua configuração `browser.*` permanece intacta para uma substituição.

Mudanças na configuração do navegador exigem reinicialização do Gateway para que o Plugin possa registrar novamente seu serviço.

## Comando ou ferramenta de navegador ausente

Se `openclaw browser` for desconhecido após uma atualização, `browser.request` estiver ausente ou o agente relatar que a ferramenta de navegador está indisponível, a causa usual é uma lista `plugins.allow` que omite `browser`. Adicione-o:

```json5
{
  plugins: {
    allow: ["telegram", "browser"],
  },
}
```

`browser.enabled=true`, `plugins.entries.browser.enabled=true` e `tools.alsoAllow: ["browser"]` não substituem a presença na allowlist — a allowlist controla o carregamento do Plugin, e a política de ferramentas só é executada após o carregamento. Remover `plugins.allow` por completo também restaura o padrão.

## Perfis: `openclaw` vs `user`

- `openclaw`: navegador gerenciado e isolado (não requer extensão).
- `user`: perfil integrado de conexão do Chrome MCP para sua **sessão real do Chrome autenticada**.

Para chamadas da ferramenta de navegador pelo agente:

- Padrão: use o navegador isolado `openclaw`.
- Prefira `profile="user"` quando sessões já autenticadas importarem e o usuário
  estiver no computador para clicar/aprovar qualquer prompt de conexão.
- `profile` é a substituição explícita quando você deseja um modo específico de navegador.

Defina `browser.defaultProfile: "openclaw"` se quiser o modo gerenciado como padrão.

## Configuração

As configurações do navegador ficam em `~/.openclaw/openclaw.json`.

```json5
{
  browser: {
    enabled: true, // padrão: true
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // ative apenas para acesso confiável a rede privada
      // allowPrivateNetwork: true, // alias legado
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    // cdpUrl: "http://127.0.0.1:18792", // substituição legada de perfil único
    remoteCdpTimeoutMs: 1500, // timeout HTTP do CDP remoto (ms)
    remoteCdpHandshakeTimeoutMs: 3000, // timeout do handshake WebSocket do CDP remoto (ms)
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

<AccordionGroup>

<Accordion title="Portas e alcance">

- O serviço de controle faz bind em loopback em uma porta derivada de `gateway.port` (padrão `18791` = gateway + 2). Substituir `gateway.port` ou `OPENCLAW_GATEWAY_PORT` desloca as portas derivadas na mesma família.
- Perfis locais `openclaw` atribuem automaticamente `cdpPort`/`cdpUrl`; defina-os apenas para CDP remoto. `cdpUrl` usa por padrão a porta CDP local gerenciada quando não definido.
- `remoteCdpTimeoutMs` se aplica a verificações de alcance HTTP de CDP remoto (fora de loopback); `remoteCdpHandshakeTimeoutMs` se aplica a handshakes WebSocket de CDP remoto.

</Accordion>

<Accordion title="Política de SSRF">

- Navegação do navegador e open-tab são protegidos por SSRF antes da navegação e verificados novamente em melhor esforço na URL final `http(s)` depois disso.
- No modo estrito de SSRF, descoberta de endpoint CDP remoto e probes em `/json/version` (`cdpUrl`) também são verificados.
- `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork` fica desativado por padrão; ative apenas quando o acesso do navegador à rede privada for intencionalmente confiável.
- `browser.ssrfPolicy.allowPrivateNetwork` continua com suporte como alias legado.

</Accordion>

<Accordion title="Comportamento do perfil">

- `attachOnly: true` significa nunca iniciar um navegador local; apenas conectar se já houver um em execução.
- `color` (no nível superior e por perfil) colore a UI do navegador para que você veja qual perfil está ativo.
- O perfil padrão é `openclaw` (gerenciado e independente). Use `defaultProfile: "user"` para optar pelo navegador autenticado do usuário.
- Ordem de autodetecção: navegador padrão do sistema, se for baseado em Chromium; caso contrário Chrome → Brave → Edge → Chromium → Chrome Canary.
- `driver: "existing-session"` usa Chrome DevTools MCP em vez de CDP bruto. Não defina `cdpUrl` para esse driver.
- Defina `browser.profiles.<name>.userDataDir` quando um perfil existing-session precisar se conectar a um perfil de usuário Chromium não padrão (Brave, Edge etc.).

</Accordion>

</AccordionGroup>

## Usar Brave (ou outro navegador baseado em Chromium)

Se o seu navegador **padrão do sistema** for baseado em Chromium (Chrome/Brave/Edge/etc),
o OpenClaw o usará automaticamente. Defina `browser.executablePath` para substituir a
autodetecção:

```bash
openclaw config set browser.executablePath "/usr/bin/google-chrome"
```

Ou defina-o na configuração, por plataforma:

<Tabs>
  <Tab title="macOS">
```json5
{
  browser: {
    executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  },
}
```
  </Tab>
  <Tab title="Windows">
```json5
{
  browser: {
    executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  },
}
```
  </Tab>
  <Tab title="Linux">
```json5
{
  browser: {
    executablePath: "/usr/bin/brave-browser",
  },
}
```
  </Tab>
</Tabs>

## Controle local vs remoto

- **Controle local (padrão):** o Gateway inicia o serviço de controle em loopback e pode iniciar um navegador local.
- **Controle remoto (host Node):** execute um host Node na máquina que tem o navegador; o Gateway faz proxy das ações do navegador para ele.
- **CDP remoto:** defina `browser.profiles.<name>.cdpUrl` (ou `browser.cdpUrl`) para
  se conectar a um navegador remoto baseado em Chromium. Nesse caso, o OpenClaw não iniciará um navegador local.

O comportamento de parada difere por modo de perfil:

- perfis locais gerenciados: `openclaw browser stop` interrompe o processo do navegador que
  o OpenClaw iniciou
- perfis somente conexão e CDP remoto: `openclaw browser stop` fecha a sessão ativa
  de controle e libera substituições de emulação do Playwright/CDP (viewport,
  esquema de cores, localidade, fuso horário, modo offline e estado semelhante), mesmo
  que nenhum processo de navegador tenha sido iniciado pelo OpenClaw

URLs de CDP remoto podem incluir autenticação:

- Tokens em query (por exemplo, `https://provider.example?token=<token>`)
- HTTP Basic auth (por exemplo, `https://user:pass@provider.example`)

O OpenClaw preserva a autenticação ao chamar endpoints `/json/*` e ao se conectar
ao WebSocket CDP. Prefira variáveis de ambiente ou gerenciadores de segredos para
tokens em vez de salvá-los em arquivos de configuração.

## Proxy de navegador do Node (padrão zero-config)

Se você executar um **host Node** na máquina que tem o navegador, o OpenClaw pode
encaminhar automaticamente chamadas da ferramenta de navegador para esse Node sem configuração extra de navegador.
Este é o caminho padrão para gateways remotos.

Observações:

- O host Node expõe seu servidor local de controle do navegador por meio de um **comando proxy**.
- Os perfis vêm da própria configuração `browser.profiles` do Node (igual ao local).
- `nodeHost.browserProxy.allowProfiles` é opcional. Deixe vazio para o comportamento legado/padrão: todos os perfis configurados permanecem acessíveis pelo proxy, incluindo rotas de criação/exclusão de perfil.
- Se você definir `nodeHost.browserProxy.allowProfiles`, o OpenClaw tratará isso como um limite de menor privilégio: apenas perfis na allowlist podem ser usados como alvo, e rotas persistentes de criação/exclusão de perfil são bloqueadas na superfície do proxy.
- Desative se você não quiser isso:
  - No Node: `nodeHost.browserProxy.enabled=false`
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
- Escolha o endpoint regional que corresponda à sua conta Browserless (consulte a documentação deles).
- Se o Browserless fornecer uma URL base HTTPS, você pode convertê-la para
  `wss://` para uma conexão CDP direta ou manter a URL HTTPS e deixar o OpenClaw
  descobrir `/json/version`.

## Providers de CDP WebSocket direto

Alguns serviços de navegador hospedado expõem um endpoint **WebSocket direto** em vez da
descoberta padrão de CDP baseada em HTTP (`/json/version`). O OpenClaw aceita três
formatos de URL CDP e escolhe automaticamente a estratégia de conexão correta:

- **Descoberta HTTP(S)** — `http://host[:port]` ou `https://host[:port]`.
  O OpenClaw chama `/json/version` para descobrir a URL do depurador WebSocket e então
  se conecta. Sem fallback para WebSocket.
- **Endpoints WebSocket diretos** — `ws://host[:port]/devtools/<kind>/<id>` ou
  `wss://...` com um caminho `/devtools/browser|page|worker|shared_worker|service_worker/<id>`.
  O OpenClaw se conecta diretamente por handshake WebSocket e ignora
  `/json/version` por completo.
- **Raízes WebSocket simples** — `ws://host[:port]` ou `wss://host[:port]` sem
  caminho `/devtools/...` (por exemplo, [Browserless](https://browserless.io),
  [Browserbase](https://www.browserbase.com)). O OpenClaw tenta primeiro a
  descoberta HTTP em `/json/version` (normalizando o esquema para `http`/`https`);
  se a descoberta retornar um `webSocketDebuggerUrl`, ele será usado; caso contrário, o OpenClaw
  recorre a um handshake WebSocket direto na raiz simples. Isso permite que um
  `ws://` simples apontando para um Chrome local ainda se conecte, já que o Chrome só
  aceita upgrades WebSocket no caminho específico por alvo vindo de
  `/json/version`.

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
  no [dashboard Overview](https://www.browserbase.com/overview).
- Substitua `<BROWSERBASE_API_KEY>` pela sua chave de API real do Browserbase.
- O Browserbase cria automaticamente uma sessão de navegador ao conectar via WebSocket, então
  não é necessária nenhuma etapa manual de criação de sessão.
- O plano gratuito permite uma sessão simultânea e uma hora de navegador por mês.
  Consulte [pricing](https://www.browserbase.com/pricing) para os limites dos planos pagos.
- Consulte a [documentação do Browserbase](https://docs.browserbase.com) para a referência completa
  da API, guias de SDK e exemplos de integração.

## Segurança

Ideias principais:

- O controle do navegador é somente loopback; o acesso passa pela autenticação do Gateway ou pelo pareamento de Node.
- A API HTTP autônoma do navegador em loopback usa **apenas autenticação por segredo compartilhado**:
  autenticação bearer com token do gateway, `x-openclaw-password` ou HTTP Basic auth com a
  senha configurada do gateway.
- Cabeçalhos de identidade do Tailscale Serve e `gateway.auth.mode: "trusted-proxy"` **não**
  autenticam esta API autônoma do navegador em loopback.
- Se o controle do navegador estiver ativado e nenhuma autenticação por segredo compartilhado estiver configurada, o OpenClaw
  gera automaticamente `gateway.auth.token` na inicialização e o persiste na configuração.
- O OpenClaw **não** gera automaticamente esse token quando `gateway.auth.mode` já está em
  `password`, `none` ou `trusted-proxy`.
- Mantenha o Gateway e quaisquer hosts Node em uma rede privada (Tailscale); evite exposição pública.
- Trate URLs/tokens de CDP remoto como segredos; prefira variáveis de ambiente ou um gerenciador de segredos.

Dicas para CDP remoto:

- Prefira endpoints criptografados (HTTPS ou WSS) e tokens de curta duração quando possível.
- Evite incorporar tokens de longa duração diretamente em arquivos de configuração.

## Perfis (multi-browser)

O OpenClaw oferece suporte a vários perfis nomeados (configurações de roteamento). Os perfis podem ser:

- **gerenciados pelo openclaw**: uma instância dedicada de navegador baseado em Chromium com seu próprio diretório de dados do usuário + porta CDP
- **remoto**: uma URL CDP explícita (navegador baseado em Chromium em outro local)
- **sessão existente**: seu perfil existente do Chrome via conexão automática do Chrome DevTools MCP

Padrões:

- O perfil `openclaw` é criado automaticamente se estiver ausente.
- O perfil `user` é integrado para conexão de sessão existente do Chrome MCP.
- Perfis de sessão existente são opt-in além de `user`; crie-os com `--driver existing-session`.
- As portas CDP locais são alocadas em **18800–18899** por padrão.
- Excluir um perfil move seu diretório local de dados para a Lixeira.

Todos os endpoints de controle aceitam `?profile=<name>`; a CLI usa `--browser-profile`.

## Sessão existente via Chrome DevTools MCP

O OpenClaw também pode se conectar a um perfil de navegador baseado em Chromium já em execução por meio do
servidor oficial Chrome DevTools MCP. Isso reutiliza as abas e o estado de login
já abertos nesse perfil de navegador.

Referências oficiais de contexto e configuração:

- [Chrome for Developers: Use Chrome DevTools MCP with your browser session](https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session)
- [Chrome DevTools MCP README](https://github.com/ChromeDevTools/chrome-devtools-mcp)

Perfil integrado:

- `user`

Opcional: crie seu próprio perfil personalizado de sessão existente se quiser um
nome, cor ou diretório de dados do navegador diferente.

Comportamento padrão:

- O perfil integrado `user` usa conexão automática do Chrome MCP, que tem como alvo o
  perfil local padrão do Google Chrome.

Use `userDataDir` para Brave, Edge, Chromium ou um perfil Chrome não padrão:

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

Teste rápido de conexão em tempo real:

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
- `tabs` lista as abas já abertas no navegador
- `snapshot` retorna refs da aba ativa selecionada

O que verificar se a conexão não funcionar:

- o navegador baseado em Chromium de destino está na versão `144+`
- a depuração remota está ativada na página de inspeção desse navegador
- o navegador exibiu e você aceitou o prompt de consentimento da conexão
- `openclaw doctor` migra configuração antiga de navegador baseada em extensão e verifica se
  o Chrome está instalado localmente para perfis padrão com conexão automática, mas não pode
  ativar a depuração remota no lado do navegador por você

Uso pelo agente:

- Use `profile="user"` quando precisar do estado de navegador autenticado do usuário.
- Se usar um perfil personalizado de sessão existente, passe esse nome de perfil explícito.
- Escolha esse modo apenas quando o usuário estiver no computador para aprovar o
  prompt de conexão.
- o Gateway ou host Node pode iniciar `npx chrome-devtools-mcp@latest --autoConnect`

Observações:

- Esse caminho tem risco maior do que o perfil isolado `openclaw`, porque pode
  agir dentro da sua sessão autenticada do navegador.
- O OpenClaw não inicia o navegador para esse driver; ele apenas se conecta.
- O OpenClaw usa aqui o fluxo oficial `--autoConnect` do Chrome DevTools MCP. Se
  `userDataDir` estiver definido, ele é repassado para direcionar esse diretório de dados do usuário.
- A sessão existente pode se conectar no host selecionado ou por meio de um
  browser node conectado. Se o Chrome estiver em outro lugar e nenhum browser node estiver conectado, use
  CDP remoto ou um host Node.

<Accordion title="Limitações de recursos da sessão existente">

Em comparação com o perfil gerenciado `openclaw`, drivers de sessão existente têm mais restrições:

- **Capturas de tela** — capturas de página e capturas de elemento com `--ref` funcionam; seletores CSS `--element` não. `--full-page` não pode ser combinado com `--ref` ou `--element`. O Playwright não é necessário para capturas de tela de página ou de elementos baseadas em ref.
- **Ações** — `click`, `type`, `hover`, `scrollIntoView`, `drag` e `select` exigem refs de snapshot (sem seletores CSS). `click` é apenas com o botão esquerdo. `type` não oferece suporte a `slowly=true`; use `fill` ou `press`. `press` não oferece suporte a `delayMs`. `type`, `hover`, `scrollIntoView`, `drag`, `select`, `fill` e `evaluate` não oferecem suporte a timeouts por chamada. `select` aceita um único valor.
- **Espera / upload / diálogo** — `wait --url` oferece suporte a padrões exatos, substring e glob; `wait --load networkidle` não é suportado. Hooks de upload exigem `ref` ou `inputRef`, um arquivo por vez, sem `element` CSS. Hooks de diálogo não oferecem suporte a substituições de timeout.
- **Recursos apenas do modo gerenciado** — ações em lote, exportação em PDF, interceptação de download e `responsebody` ainda exigem o caminho de navegador gerenciado.

</Accordion>

## Garantias de isolamento

- **Diretório de dados do usuário dedicado**: nunca toca no seu perfil pessoal do navegador.
- **Portas dedicadas**: evita `9222` para prevenir conflitos com fluxos de desenvolvimento.
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

Para scripting e depuração, o Gateway expõe uma pequena **API HTTP de controle somente loopback**
mais uma CLI correspondente `openclaw browser` (snapshots, refs, aprimoramentos de wait,
saída JSON, fluxos de depuração). Consulte
[API de controle do navegador](/pt-BR/tools/browser-control) para a referência completa.

## Solução de problemas

Para problemas específicos de Linux (especialmente snap Chromium), consulte
[Solução de problemas do navegador](/pt-BR/tools/browser-linux-troubleshooting).

Para configurações divididas entre Gateway no WSL2 + Chrome no Windows, consulte
[Solução de problemas de WSL2 + Windows + CDP remoto do Chrome](/pt-BR/tools/browser-wsl2-windows-remote-cdp-troubleshooting).

### Falha de inicialização do CDP vs bloqueio SSRF de navegação

Essas são classes de falha diferentes e apontam para caminhos de código diferentes.

- **Falha de inicialização ou prontidão do CDP** significa que o OpenClaw não consegue confirmar que o plano de controle do navegador está saudável.
- **Bloqueio SSRF de navegação** significa que o plano de controle do navegador está saudável, mas um alvo de navegação de página foi rejeitado pela política.

Exemplos comuns:

- Falha de inicialização ou prontidão do CDP:
  - `Chrome CDP websocket for profile "openclaw" is not reachable after start`
  - `Remote CDP for profile "<name>" is not reachable at <cdpUrl>`
- Bloqueio SSRF de navegação:
  - fluxos `open`, `navigate`, snapshot ou abertura de aba falham com um erro de política de navegador/rede enquanto `start` e `tabs` ainda funcionam

Use esta sequência mínima para separar os dois:

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw tabs
openclaw browser --browser-profile openclaw open https://example.com
```

Como interpretar os resultados:

- Se `start` falhar com `not reachable after start`, primeiro investigue a prontidão do CDP.
- Se `start` tiver sucesso, mas `tabs` falhar, o plano de controle ainda não está saudável. Trate isso como um problema de alcance do CDP, não como um problema de navegação de página.
- Se `start` e `tabs` tiverem sucesso, mas `open` ou `navigate` falhar, o plano de controle do navegador está ativo e a falha está na política de navegação ou na página de destino.
- Se `start`, `tabs` e `open` tiverem sucesso, o caminho básico de controle do navegador gerenciado está saudável.

Detalhes importantes de comportamento:

- A configuração do navegador usa por padrão um objeto de política SSRF fail-closed mesmo quando você não configura `browser.ssrfPolicy`.
- Para o perfil gerenciado local `openclaw` em loopback, verificações de integridade do CDP intencionalmente ignoram a aplicação de alcance SSRF do navegador para o próprio plano de controle local do OpenClaw.
- A proteção de navegação é separada. Um resultado bem-sucedido de `start` ou `tabs` não significa que um alvo posterior de `open` ou `navigate` seja permitido.

Orientação de segurança:

- **Não** relaxe a política SSRF do navegador por padrão.
- Prefira exceções específicas de host como `hostnameAllowlist` ou `allowedHostnames` em vez de acesso amplo à rede privada.
- Use `dangerouslyAllowPrivateNetwork: true` apenas em ambientes intencionalmente confiáveis nos quais o acesso do navegador à rede privada seja necessário e revisado.

## Ferramentas do agente + como o controle funciona

O agente recebe **uma ferramenta** para automação de navegador:

- `browser` — status/start/stop/tabs/open/focus/close/snapshot/screenshot/navigate/act

Como isso se mapeia:

- `browser snapshot` retorna uma árvore estável de UI (AI ou ARIA).
- `browser act` usa os IDs `ref` do snapshot para clicar/digitar/arrastar/selecionar.
- `browser screenshot` captura pixels (página inteira ou elemento).
- `browser` aceita:
  - `profile` para escolher um perfil nomeado de navegador (openclaw, chrome ou CDP remoto).
  - `target` (`sandbox` | `host` | `node`) para selecionar onde o navegador está.
  - Em sessões em sandbox, `target: "host"` exige `agents.defaults.sandbox.browser.allowHostControl=true`.
  - Se `target` for omitido: sessões em sandbox usam `sandbox` por padrão, sessões sem sandbox usam `host` por padrão.
  - Se um node com capacidade de navegador estiver conectado, a ferramenta poderá encaminhar automaticamente para ele, a menos que você fixe `target="host"` ou `target="node"`.

Isso mantém o agente determinístico e evita seletores frágeis.

## Relacionados

- [Visão geral das ferramentas](/pt-BR/tools) — todas as ferramentas de agente disponíveis
- [Sandboxing](/pt-BR/gateway/sandboxing) — controle do navegador em ambientes com sandbox
- [Segurança](/pt-BR/gateway/security) — riscos e hardening do controle do navegador
