---
read_when:
    - Instalar ou configurar plugins
    - Entender regras de descoberta e carregamento de plugins
    - Trabalhar com bundles de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-21T05:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a34995fe8a27b7c96fb2abd9ef55bea38ea7ba2ff4e867977683e09f799e9e8f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins estendem o OpenClaw com novas capabilities: canais, provedores de modelo,
ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
media-understanding, geração de imagem, geração de vídeo, web fetch, web
search e muito mais. Alguns plugins são **core** (enviados com o OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um plugin">
    ```bash
    # Do npm
    openclaw plugins install @openclaw/voice-call

    # De um diretório ou arquivo local
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>` explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma fechada e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a
árvore de dependências de runtime de cada plugin empacotado. Quando um plugin empacotado de propriedade do OpenClaw está ativo a partir da configuração de plugin, configuração legada de canal ou manifesto padrão habilitado, a inicialização repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                    | Exemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; executa em processo  | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes de bundles.

Se você está escrevendo um plugin nativo, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e [Plugin SDK Overview](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Docs                                 |
| --------------- | --------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call`| [Voice Call](/pt-BR/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (enviados com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (habilitados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, auto-recall/capture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — Plugin de navegador empacotado para a ferramenta browser, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle do navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desabilitado por padrão)
  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Community Plugins](/pt-BR/plugins/community).

## Configuração

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descrição                                                 |
| ----------------| --------------------------------------------------------- |
| `enabled`       | Toggle mestre (padrão: `true`)                            |
| `allow`         | Allowlist de plugin (opcional)                            |
| `deny`          | Denylist de plugin (opcional; deny vence)                 |
| `load.paths`    | Arquivos/diretórios extras de plugin                      |
| `slots`         | Seletores exclusivos de slot (por exemplo `memory`, `contextEngine`) |
| `entries.\<id\>`| Toggles + configuração por plugin                         |

Mudanças de configuração **exigem reinício do gateway**. Se o Gateway estiver em execução com
watch de config + reinício em processo habilitado (o caminho padrão `openclaw gateway`), esse
reinício normalmente é feito automaticamente pouco depois de a gravação da configuração ocorrer.

<Accordion title="Estados do plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o plugin existe, mas as regras de habilitação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração faz referência a um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
  </Step>

  <Step title="Extensões do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensões globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empacotados">
    Enviados com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse plugin
- Plugins originados do workspace ficam **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins empacotados seguem o conjunto interno padrão de habilitados, a menos que sejam sobrescritos
- Slots exclusivos podem forçar a habilitação do plugin selecionado para esse slot

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (somente uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar
      contextEngine: "legacy", // ou um id de plugin
    },
  },
}
```

| Slot            | O que controla         | Padrão              |
| ----------------| ---------------------- | ------------------- |
| `memory`        | Plugin de memória ativo| `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas de detalhe por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes completos
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instalar somente do ClawHub
openclaw plugins install <spec> --force    # sobrescrever instalação existente
openclaw plugins install <path>            # instalar de caminho local
openclaw plugins install -l <path>         # linkar (sem copiar) para dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar especificação npm resolvida exata
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # atualizar um plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualizar todos
openclaw plugins uninstall <id>          # remover registros de config/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins empacotados vêm com o OpenClaw. Muitos são habilitados por padrão (por exemplo
provedores de modelo empacotados, provedores de fala empacotados e o Plugin de navegador empacotado). Outros plugins empacotados ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou hook pack no local.
Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez de
copiar para um alvo de instalação gerenciado.

`--pin` é exclusivo do npm. Não é compatível com `--marketplace`, porque
instalações por marketplace persistem metadados da fonte do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma sobrescrita de emergência para falsos
positivos do scanner interno de código perigoso. Ele permite que instalações
e atualizações de plugin continuem apesar de achados internos `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueio por falha de varredura.

Essa flag de CLI se aplica apenas a fluxos de instalação/atualização de plugin. Instalações de dependências de Skills apoiadas pelo Gateway usam a sobrescrita correspondente de requisição `dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de plugins. O suporte atual de runtime inclui Skills de bundle, command-Skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e `lspServers` declarados em manifesto, command-Skills do Cursor e diretórios de hooks compatíveis do Codex.

`openclaw plugins inspect <id>` também informa capabilities detectadas do bundle mais entradas de servidor MCP e LSP compatíveis ou incompatíveis para plugins baseados em bundle.

Fontes de marketplace podem ser um nome de marketplace conhecido do Claude de
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho `marketplace.json`, uma forma abreviada GitHub como `owner/repo`, uma URL de repositório GitHub ou uma URL git. Para marketplaces remotos, entradas de plugin devem permanecer dentro do repositório clonado do marketplace e usar apenas fontes de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/cli/plugins) para detalhes completos.

## Visão geral da API de plugins

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins
mais antigos ainda podem usar `activate(api)` como alias legado, mas novos plugins devem
usar `register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

O OpenClaw carrega o objeto de entrada e chama `register(api)` durante a
ativação do plugin. O loader ainda recorre a `activate(api)` para plugins mais antigos,
mas plugins empacotados e novos plugins externos devem tratar `register` como
o contrato público.

Métodos comuns de registro:

| Método                                  | O que registra              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta do agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Texto para fala / STT       |
| `registerRealtimeTranscriptionProvider` | STT por streaming           |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagem           |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de web fetch / scraping |
| `registerWebSearchProvider`             | Web search                  |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI             |
| `registerContextEngine`                 | Mecanismo de contexto       |
| `registerService`                       | Serviço em segundo plano    |

Comportamento de guard de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, consulte [SDK Overview](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade com bundles Codex/Claude/Cursor
- [Plugin Manifest](/pt-BR/plugins/manifest) — schema do manifesto
- [Registering Tools](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas do agente em um plugin
- [Plugin Internals](/pt-BR/plugins/architecture) — modelo de capability e pipeline de carregamento
- [Community Plugins](/pt-BR/plugins/community) — listagens de terceiros
