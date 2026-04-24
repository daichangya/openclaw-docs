---
read_when:
    - Instalar ou configurar plugins
    - Entender regras de descoberta e carregamento de plugins
    - Trabalhar com bundles de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instalar, configurar e gerenciar plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-24T09:01:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 83ab1218d6677ad518a4991ca546d55eed9648e1fa92b76b7433ecd5df569e28
    source_path: tools/plugin.md
    workflow: 15
---

Plugins ampliam o OpenClaw com novas capabilities: canais, provedores de modelo,
agent harnesses, ferramentas, Skills, fala, transcrição em tempo real,
voz em tempo real, entendimento de mídia, geração de imagem, geração de vídeo, busca na web, pesquisa
na web e muito mais. Alguns plugins são **core** (distribuídos com o OpenClaw), outros
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

    # De um diretório local ou arquivo
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Reinicie o Gateway">
    ```bash
    openclaw gateway restart
    ```

    Depois, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, ative `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor da CLI: caminho/arquivo local, `clawhub:<pkg>`
explícito ou especificação simples de pacote (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma fechada e aponta para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin incluído para plugins que aderem a
`openclaw.install.allowInvalidConfigRecovery`.

Instalações empacotadas do OpenClaw não instalam antecipadamente toda a árvore de dependências
de runtime de cada plugin incluído. Quando um plugin incluído controlado pelo OpenClaw está ativo a partir da
configuração do plugin, da configuração legada de canal ou de um manifesto ativado por padrão,
a inicialização repara apenas as dependências de runtime declaradas desse plugin antes de importá-lo.
Plugins externos e caminhos de carregamento personalizados ainda precisam ser instalados por meio de
`openclaw plugins install`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato    | Como funciona                                                    | Exemplos                                               |
| ---------- | ---------------------------------------------------------------- | ------------------------------------------------------ |
| **Nativo** | `openclaw.plugin.json` + módulo de runtime; executa no processo  | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Consulte [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin nativo, comece com [Criando Plugins](/pt-BR/plugins/building-plugins)
e a [Visão geral do SDK de plugins](/pt-BR/plugins/sdk-overview).

## Plugins oficiais

### Instaláveis (npm)

| Plugin          | Pacote                 | Documentação                         |
| --------------- | ---------------------- | ------------------------------------ |
| Matrix          | `@openclaw/matrix`     | [Matrix](/pt-BR/channels/matrix)           |
| Microsoft Teams | `@openclaw/msteams`    | [Microsoft Teams](/pt-BR/channels/msteams) |
| Nostr           | `@openclaw/nostr`      | [Nostr](/pt-BR/channels/nostr)             |
| Voice Call      | `@openclaw/voice-call` | [Voice Call](/pt-BR/plugins/voice-call)    |
| Zalo            | `@openclaw/zalo`       | [Zalo](/pt-BR/channels/zalo)               |
| Zalo Personal   | `@openclaw/zalouser`   | [Zalo Personal](/pt-BR/plugins/zalouser)   |

### Core (distribuídos com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (ativados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — busca de memória incluída (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda, auto-recall/capture (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador incluído para a ferramenta de navegador, CLI `openclaw browser`, método de gateway `browser.request`, runtime de navegador e serviço padrão de controle do navegador (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desativada por padrão)
  </Accordion>
</AccordionGroup>

Procurando plugins de terceiros? Consulte [Plugins da comunidade](/pt-BR/plugins/community).

## Configuração

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Campo           | Descrição                                                |
| --------------- | -------------------------------------------------------- |
| `enabled`       | Alternador mestre (padrão: `true`)                       |
| `allow`         | Allowlist de plugins (opcional)                          |
| `deny`          | Denylist de plugins (opcional; deny vence)               |
| `load.paths`    | Arquivos/diretórios extras de plugin                     |
| `slots`         | Seletores de slots exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternadores + configuração por plugin                  |

Mudanças na configuração **exigem reinicialização do gateway**. Se o Gateway estiver em execução com
observação de configuração + reinicialização no processo ativadas (o caminho padrão de `openclaw gateway`),
essa reinicialização normalmente é feita automaticamente logo após a gravação da configuração.

<Accordion title="Estados do plugin: desativado vs ausente vs inválido">
  - **Desativado**: o plugin existe, mas as regras de ativação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um id de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao schema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw procura plugins nesta ordem (a primeira correspondência vence):

<Steps>
  <Step title="Caminhos de configuração">
    `plugins.load.paths` — caminhos explícitos para arquivo ou diretório.
  </Step>

  <Step title="Plugins do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins incluídos">
    Distribuídos com o OpenClaw. Muitos são ativados por padrão (provedores de modelo, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

### Regras de ativação

- `plugins.enabled: false` desativa todos os plugins
- `plugins.deny` sempre vence sobre allow
- `plugins.entries.\<id\>.enabled: false` desativa esse plugin
- Plugins originados do workspace ficam **desativados por padrão** (devem ser ativados explicitamente)
- Plugins incluídos seguem o conjunto interno ativado por padrão, a menos que haja substituição
- Slots exclusivos podem forçar a ativação do plugin selecionado para esse slot
- Alguns plugins incluídos com opt-in são ativados automaticamente quando a configuração nomeia uma
  superfície controlada pelo plugin, como uma referência de modelo de provedor, configuração de canal ou runtime
  de harness
- Rotas Codex da família OpenAI mantêm limites separados de plugin:
  `openai-codex/*` pertence ao Plugin OpenAI, enquanto o Plugin incluído do
  servidor de aplicativo Codex é selecionado por `embeddedHarness.runtime: "codex"` ou por referências
  legadas de modelo `codex/*`

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desativar
      contextEngine: "legacy", // ou um id de plugin
    },
  },
}
```

| Slot            | O que controla               | Padrão              |
| --------------- | ---------------------------- | ------------------- |
| `memory`        | Plugin de Active Memory      | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo  | `legacy` (integrado) |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas detalhadas por plugin
openclaw plugins list --json               # inventário legível por máquina
openclaw plugins inspect <id>              # detalhes aprofundados
openclaw plugins inspect <id> --json       # legível por máquina
openclaw plugins inspect --all             # tabela de toda a frota
openclaw plugins info <id>                 # alias de inspect
openclaw plugins doctor                    # diagnósticos

openclaw plugins install <package>         # instalar (ClawHub primeiro, depois npm)
openclaw plugins install clawhub:<pkg>     # instalar somente do ClawHub
openclaw plugins install <spec> --force    # sobrescrever instalação existente
openclaw plugins install <path>            # instalar de caminho local
openclaw plugins install -l <path>         # linkar (sem cópia) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # atualizar um plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualizar todos
openclaw plugins uninstall <id>          # remover registros de config/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins incluídos são distribuídos com o OpenClaw. Muitos são ativados por padrão (por exemplo,
provedores de modelo incluídos, provedores de fala incluídos e o Plugin de navegador incluído).
Outros plugins incluídos ainda precisam de `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou um pacote de hooks no local. Use
`openclaw plugins update <id-or-npm-spec>` para atualizações rotineiras de plugins npm rastreados.
Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez de
copiar para um destino de instalação gerenciado.

Quando `plugins.allow` já está definido, `openclaw plugins install` adiciona o
id do plugin instalado a essa allowlist antes de ativá-lo, para que as instalações
possam ser carregadas imediatamente após a reinicialização.

`openclaw plugins update <id-or-npm-spec>` se aplica a instalações rastreadas. Passar
uma especificação de pacote npm com dist-tag ou versão exata resolve o nome do pacote
de volta para o registro de plugin rastreado e registra a nova especificação para atualizações futuras.
Passar o nome do pacote sem versão move uma instalação exata fixada de volta para
a linha de release padrão do registro. Se o plugin npm instalado já corresponder
à versão resolvida e à identidade de artefato registrada, o OpenClaw ignora a atualização
sem baixar, reinstalar ou regravar a configuração.

`--pin` é apenas para npm. Não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de emergência para falsos
positivos do scanner interno de código perigoso. Ele permite que instalações e atualizações de plugin
continuem apesar de achados internos `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem o bloqueio por falha de varredura.

Essa flag da CLI se aplica apenas a fluxos de instalação/atualização de plugin. Instalações de dependência
de Skills com suporte do Gateway usam a substituição de requisição correspondente `dangerouslyForceUnsafeInstall`,
enquanto `openclaw skills install` continua sendo o fluxo separado de download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable
de plugins. O suporte atual em runtime inclui Skills de bundle, command-skills do Claude,
padrões de `settings.json` do Claude, padrões de `.lsp.json` do Claude e `lspServers`
declarados no manifesto, command-skills do Cursor e diretórios de hooks compatíveis
do Codex.

`openclaw plugins inspect <id>` também informa capabilities de bundle detectadas, além de
entradas de servidor MCP e LSP compatíveis ou não compatíveis para plugins baseados em bundle.

Fontes de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz local de marketplace ou caminho para
`marketplace.json`, um atalho GitHub como `owner/repo`, uma URL de repositório GitHub
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório de marketplace clonado e usar apenas origens de caminho relativo.

Consulte a [referência da CLI `openclaw plugins`](/pt-BR/cli/plugins) para detalhes completos.

## Visão geral da API de plugins

Plugins nativos exportam um objeto de entrada que expõe `register(api)`. Plugins
mais antigos ainda podem usar `activate(api)` como alias legado, mas plugins novos devem
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
ativação do plugin. O carregador ainda recorre a `activate(api)` para plugins mais antigos,
mas plugins incluídos e novos plugins externos devem tratar `register` como o contrato público.

Métodos comuns de registro:

| Método                                  | O que registra              |
| --------------------------------------- | --------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)    |
| `registerChannel`                       | Canal de chat               |
| `registerTool`                          | Ferramenta de agente        |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida      |
| `registerSpeechProvider`                | Texto para fala / STT       |
| `registerRealtimeTranscriptionProvider` | STT por streaming           |
| `registerRealtimeVoiceProvider`         | Voz em tempo real duplex    |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio     |
| `registerImageGenerationProvider`       | Geração de imagem           |
| `registerMusicGenerationProvider`       | Geração de música           |
| `registerVideoGenerationProvider`       | Geração de vídeo            |
| `registerWebFetchProvider`              | Provedor de busca/scraping na web |
| `registerWebSearchProvider`             | Pesquisa na web             |
| `registerHttpRoute`                     | Endpoint HTTP               |
| `registerCommand` / `registerCli`       | Comandos de CLI             |
| `registerContextEngine`                 | Mecanismo de contexto       |
| `registerService`                       | Serviço em segundo plano    |

Comportamento de guarda de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de menor prioridade são ignorados.
- `before_install`: `{ block: false }` não faz nada e não limpa um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de menor prioridade são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não limpa um cancelamento anterior.

Para o comportamento completo de hooks tipados, consulte [Visão geral do SDK](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Criando Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade com bundles Codex/Claude/Cursor
- [Manifesto de Plugin](/pt-BR/plugins/manifest) — schema do manifesto
- [Registrando ferramentas](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Internos de Plugin](/pt-BR/plugins/architecture) — modelo de capability e pipeline de carregamento
- [Plugins da comunidade](/pt-BR/plugins/community) — listagens de terceiros
