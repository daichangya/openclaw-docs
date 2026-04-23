---
read_when:
    - Instalando ou configurando Plugins
    - Entendendo descoberta de Plugins e regras de carregamento
    - Trabalhando com bundles de Plugin compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar Plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-23T05:44:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 120c96e5b80b6dc9f6c842f9d04ada595f32e21a311128ae053828747a793033
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins ampliam o OpenClaw com novas capacidades: canais, provedores de modelo,
ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
entendimento de mídia, geração de imagem, geração de vídeo, busca na web, pesquisa
na web e muito mais. Alguns Plugins são **core** (enviados com o OpenClaw), outros
são **externos** (publicados no npm pela comunidade).

## Início rápido

<Steps>
  <Step title="Veja o que está carregado">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Instale um Plugin">
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

Se você preferir controle nativo por chat, habilite `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>` explícito ou especificação simples de pacote (primeiro ClawHub, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma segura e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho estreito de
reinstalação de Plugin incluído para Plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a árvore de
dependências de runtime de cada Plugin incluído. Quando um Plugin incluído de propriedade do OpenClaw está ativo a partir da
configuração de Plugin, configuração legada de canal ou um manifesto habilitado por padrão,
a correção de inicialização repara apenas as dependências de runtime declaradas desse Plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por meio de
`openclaw plugins install`.

## Tipos de Plugin

O OpenClaw reconhece dois formatos de Plugin:

| Formato    | Como funciona                                                   | Exemplos                                               |
| ---------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; executa no processo | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Veja [Bundles de Plugin](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um Plugin Native, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de Plugin](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                | Documentação                        |
| --------------- | --------------------- | ----------------------------------- |
| Matrix          | `@openclaw/matrix`    | [Matrix](/pt-BR/channels/matrix)          |
| Microsoft Teams | `@openclaw/msteams`   | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`     | [Nostr](/pt-BR/channels/nostr)            |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)  |
| Zalo            | `@openclaw/zalo`      | [Zalo](/pt-BR/channels/zalo)              |
| Zalo Personal   | `@openclaw/zalouser`  | [Zalo Personal](/pt-BR/plugins/zalouser)  |

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
    - `memory-core` — pesquisa de memória incluída (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, auto-recall/capture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (habilitados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — Plugin de navegador incluído para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle de navegador (habilitado por padrão; desabilite antes de substituí-lo)
    - `copilot-proxy` — bridge do VS Code Copilot Proxy (desabilitado por padrão)
  </Accordion>
</AccordionGroup>

Procurando Plugins de terceiros? Veja [Plugins da comunidade](/pt-BR/plugins/community).

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

| Campo            | Descrição                                                  |
| ---------------- | ---------------------------------------------------------- |
| `enabled`        | Alternância mestre (padrão: `true`)                        |
| `allow`          | Allowlist de Plugin (opcional)                             |
| `deny`           | Denylist de Plugin (opcional; negar vence)                 |
| `load.paths`     | Arquivos/diretórios extras de Plugin                       |
| `slots`          | Seletores de slot exclusivos (ex.: `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias + configuração por Plugin                     |

Mudanças de configuração **exigem reinicialização do gateway**. Se o Gateway estiver em execução com
watch de configuração + reinicialização no processo habilitada (o caminho padrão `openclaw gateway`),
essa reinicialização normalmente é feita automaticamente um instante após a gravação da configuração.

<Accordion title="Estados do Plugin: desabilitado vs ausente vs inválido">
  - **Desabilitado**: o Plugin existe, mas as regras de habilitação o desligaram. A configuração é preservada.
  - **Ausente**: a configuração faz referência a um id de Plugin que a descoberta não encontrou.
  - **Inválido**: o Plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura Plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos para arquivo ou diretório.
  </Step>

  <Step title="Extensões do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensões globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Enviados com o OpenClaw. Muitos são habilitados por padrão (provedores de modelo, fala).
    Outros exigem habilitação explícita.
  </Step>
</Steps>

### Regras de habilitação

- `plugins.enabled: false` desabilita todos os Plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desabilita esse Plugin
- Plugins de origem no workspace ficam **desabilitados por padrão** (devem ser habilitados explicitamente)
- Plugins incluídos seguem o conjunto padrão interno de habilitados, salvo override
- Slots exclusivos podem forçar a habilitação do Plugin selecionado para aquele slot

## Slots de Plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desabilitar
      contextEngine: "legacy", // ou um id de Plugin
    },
  },
}
```

| Slot            | O que controla             | Padrão              |
| --------------- | -------------------------- | ------------------- |
| `memory`        | Plugin de memória ativo    | `memory-core`       |
| `contextEngine` | Engine de contexto ativa   | `legacy` (integrada) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas Plugins carregados
openclaw plugins list --verbose            # linhas de detalhe por Plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instala (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instala apenas do ClawHub
openclaw plugins install <spec> --force    # sobrescreve instalação existente
openclaw plugins install <path>            # instala de caminho local
openclaw plugins install -l <path>         # faz link (sem cópia) para dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registra a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualiza um Plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualiza todos
openclaw plugins uninstall <id>          # remove registros de configuração/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos são enviados com o OpenClaw. Muitos são habilitados por padrão (por exemplo
provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador
incluído). Outros Plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um Plugin instalado existente ou um pacote de hooks no lugar. Use
`openclaw plugins update <id-or-npm-spec>` para upgrades de rotina de Plugins npm
rastreados. Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez
de copiar para um destino de instalação gerenciado.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com uma dist-tag ou versão exata resolve o nome do pacote
de volta para o registro de Plugin rastreado e grava a nova especificação para atualizações futuras.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de release padrão do registro. Se o Plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou regravar configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da fonte do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é um override break-glass para falsos
positivos do scanner integrado de código perigoso. Ele permite que instalações
e atualizações de Plugin continuem apesar de achados integrados `critical`, mas ainda
não contorna bloqueios de política `before_install` do Plugin nem bloqueios por falha de varredura.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de Plugin. Instalações de
dependências de Skill respaldadas pelo Gateway usam o override de solicitação correspondente
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skill do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de Plugin.
O suporte atual de runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` e `lspServers` declarados em manifesto do Claude, command-skills do Cursor e diretórios de hook compatíveis com Codex.

`openclaw plugins inspect <id>` também informa capacidades de bundle detectadas, além de
entradas de servidor MCP e LSP compatíveis ou não compatíveis para Plugins respaldados por bundle.

Fontes de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou
um caminho para `marketplace.json`, uma forma abreviada do GitHub como `owner/repo`, uma URL de repositório do GitHub ou uma URL git. Para marketplaces remotos, entradas de Plugin devem permanecer dentro do repositório de marketplace clonado e usar apenas fontes de caminho relativo.

Veja a [referência da CLI `openclaw plugins`](/cli/plugins) para detalhes completos.

## Visão geral da API de Plugin

Plugins Native exportam um objeto de entrada que expõe `register(api)`. Plugins mais antigos
ainda podem usar `activate(api)` como alias legado, mas Plugins novos devem
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

O OpenClaw carrega o objeto de entrada e chama `register(api)` durante a ativação
do Plugin. O loader ainda faz fallback para `activate(api)` em Plugins mais antigos,
mas Plugins incluídos e novos Plugins externos devem tratar `register` como o contrato público.

Métodos comuns de registro:

| Método                                  | O que ele registra          |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta de agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Texto para fala / STT       |
| `registerRealtimeTranscriptionProvider` | STT em streaming            |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagem           |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de busca/scrape web |
| `registerWebSearchProvider`             | Pesquisa na web             |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos CLI                |
| `registerContextEngine`                 | Engine de contexto          |
| `registerService`                       | Serviço em segundo plano    |

Comportamento de proteção de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_tool_call`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `before_install`: `{ block: false }` é um no-op e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade mais baixa são ignorados.
- `message_sending`: `{ cancel: false }` é um no-op e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, veja [Visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio Plugin
- [Bundles de Plugin](/pt-BR/plugins/bundles) — compatibilidade com bundles Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um Plugin
- [Componentes internos de Plugin](/pt-BR/plugins/architecture) — modelo de capacidade e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
