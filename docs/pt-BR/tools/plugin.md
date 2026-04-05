---
read_when:
    - Ao instalar ou configurar plugins
    - Ao entender a descoberta de plugins e as regras de carregamento
    - Ao trabalhar com pacotes de plugins compatíveis com Codex/Claude
sidebarTitle: Install and Configure
summary: Instale, configure e gerencie plugins do OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-04-05T12:56:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 707bd3625596f290322aeac9fecb7f4c6f45d595fdfb82ded7cbc8e04457ac7f
    source_path: tools/plugin.md
    workflow: 15
---

# Plugins

Plugins estendem o OpenClaw com novos recursos: canais, provedores de modelo,
ferramentas, Skills, fala, transcrição em tempo real, voz em tempo real,
media-understanding, geração de imagem, geração de vídeo, busca na web, pesquisa
na web e muito mais. Alguns plugins são **core** (fornecidos com o OpenClaw),
outros são **external** (publicados no npm pela comunidade).

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

    Em seguida, configure em `plugins.entries.\<id\>.config` no seu arquivo de configuração.

  </Step>
</Steps>

Se você preferir controle nativo por chat, ative `commands.plugins: true` e use:

```text
/plugin install clawhub:@openclaw/voice-call
/plugin show voice-call
/plugin enable voice-call
```

O caminho de instalação usa o mesmo resolvedor que a CLI: caminho/arquivo local, `clawhub:<pkg>` explícito ou especificação de pacote simples (ClawHub primeiro, depois fallback para npm).

Se a configuração for inválida, a instalação normalmente falha de forma segura e aponta você para
`openclaw doctor --fix`. A única exceção de recuperação é um caminho restrito de
reinstalação de plugin empacotado para plugins que optam por
`openclaw.install.allowInvalidConfigRecovery`.

## Tipos de plugin

O OpenClaw reconhece dois formatos de plugin:

| Formato   | Como funciona                                                  | Exemplos                                               |
| --------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + módulo de runtime; executa no processo | Plugins oficiais, pacotes npm da comunidade            |
| **Bundle** | Layout compatível com Codex/Claude/Cursor; mapeado para recursos do OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Ambos aparecem em `openclaw plugins list`. Veja [Plugin Bundles](/pt-BR/plugins/bundles) para detalhes sobre bundles.

Se você estiver escrevendo um plugin nativo, comece com [Building Plugins](/pt-BR/plugins/building-plugins)
e a [Plugin SDK Overview](/pt-BR/plugins/sdk-overview).

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

### Core (fornecidos com o OpenClaw)

<AccordionGroup>
  <Accordion title="Provedores de modelo (ativados por padrão)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de memória">
    - `memory-core` — pesquisa de memória empacotada (padrão via `plugins.slots.memory`)
    - `memory-lancedb` — memória de longo prazo com instalação sob demanda e recuperação/captura automáticas (defina `plugins.slots.memory = "memory-lancedb"`)
  </Accordion>

  <Accordion title="Provedores de fala (ativados por padrão)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Outros">
    - `browser` — plugin de navegador empacotado para a ferramenta de navegador, a CLI `openclaw browser`, o método de gateway `browser.request`, o runtime do navegador e o serviço de controle de navegador padrão (ativado por padrão; desative antes de substituí-lo)
    - `copilot-proxy` — ponte VS Code Copilot Proxy (desativada por padrão)
  </Accordion>
</AccordionGroup>

Está procurando plugins de terceiros? Veja [Community Plugins](/pt-BR/plugins/community).

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

| Campo            | Descrição                                                 |
| ---------------- | --------------------------------------------------------- |
| `enabled`        | Alternância principal (padrão: `true`)                    |
| `allow`          | Lista de permissão de plugins (opcional)                  |
| `deny`           | Lista de bloqueio de plugins (opcional; `deny` prevalece) |
| `load.paths`     | Arquivos/diretórios extras de plugins                     |
| `slots`          | Seletores de slot exclusivos (por exemplo, `memory`, `contextEngine`) |
| `entries.\<id\>` | Alternâncias e configuração por plugin                    |

Alterações de configuração **exigem reinicialização do gateway**. Se o Gateway estiver em execução com observação de configuração + reinicialização no processo ativadas (o caminho padrão `openclaw gateway`), essa
reinicialização geralmente é feita automaticamente pouco depois que a gravação da configuração é concluída.

<Accordion title="Estados do plugin: desativado vs ausente vs inválido">
  - **Desativado**: o plugin existe, mas as regras de ativação o desativaram. A configuração é preservada.
  - **Ausente**: a configuração referencia um ID de plugin que a descoberta não encontrou.
  - **Inválido**: o plugin existe, mas sua configuração não corresponde ao esquema declarado.
</Accordion>

## Descoberta e precedência

O OpenClaw examina plugins nesta ordem (a primeira correspondência prevalece):

<Steps>
  <Step title="Caminhos da configuração">
    `plugins.load.paths` — caminhos explícitos de arquivo ou diretório.
  </Step>

  <Step title="Extensões do workspace">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` e `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Extensões globais">
    `~/.openclaw/<plugin-root>/*.ts` e `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins empacotados">
    Fornecidos com o OpenClaw. Muitos são ativados por padrão (provedores de modelo, fala).
    Outros exigem ativação explícita.
  </Step>
</Steps>

### Regras de ativação

- `plugins.enabled: false` desativa todos os plugins
- `plugins.deny` sempre prevalece sobre `allow`
- `plugins.entries.\<id\>.enabled: false` desativa esse plugin
- Plugins originados no workspace ficam **desativados por padrão** (devem ser ativados explicitamente)
- Plugins empacotados seguem o conjunto interno ativado por padrão, salvo substituição
- Slots exclusivos podem forçar a ativação do plugin selecionado para esse slot

## Slots de plugin (categorias exclusivas)

Algumas categorias são exclusivas (apenas uma ativa por vez):

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // ou "none" para desativar
      contextEngine: "legacy", // ou um ID de plugin
    },
  },
}
```

| Slot            | O que controla              | Padrão              |
| --------------- | --------------------------- | ------------------- |
| `memory`        | Plugin de memória ativo     | `memory-core`       |
| `contextEngine` | Mecanismo de contexto ativo | `legacy` (interno)  |

## Referência da CLI

```bash
openclaw plugins list                       # inventário compacto
openclaw plugins list --enabled            # apenas plugins carregados
openclaw plugins list --verbose            # linhas de detalhe por plugin
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
openclaw plugins install -l <path>         # vincular (sem copiar) para desenvolvimento
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # registrar a especificação npm exata resolvida
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id>             # atualizar um plugin
openclaw plugins update <id> --dangerously-force-unsafe-install
openclaw plugins update --all            # atualizar todos
openclaw plugins uninstall <id>          # remover registros de configuração/instalação
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Plugins empacotados são fornecidos com o OpenClaw. Muitos são ativados por padrão (por exemplo,
provedores de modelo empacotados, provedores de fala empacotados e o plugin de navegador
empacotado). Outros plugins empacotados ainda exigem `openclaw plugins enable <id>`.

`--force` sobrescreve um plugin instalado existente ou um pacote de hooks no lugar.
Ele não é compatível com `--link`, que reutiliza o caminho de origem em vez de
copiar para um destino de instalação gerenciado.

`--pin` é apenas para npm. Ele não é compatível com `--marketplace`, porque
instalações de marketplace persistem metadados da origem do marketplace em vez de uma especificação npm.

`--dangerously-force-unsafe-install` é uma substituição de último recurso para falsos
positivos do scanner interno de código perigoso. Ele permite que instalações e
atualizações de plugins continuem apesar de achados internos `critical`, mas ainda
não ignora bloqueios de política `before_install` do plugin nem bloqueios por falha na verificação.

Essa flag da CLI se aplica apenas aos fluxos de instalação/atualização de plugins. Instalações de dependências
de Skills com suporte do Gateway usam, em vez disso, a substituição correspondente de solicitação
`dangerouslyForceUnsafeInstall`, enquanto `openclaw skills install` continua sendo o fluxo separado de
download/instalação de Skills do ClawHub.

Bundles compatíveis participam do mesmo fluxo de list/inspect/enable/disable de plugins.
O suporte de runtime atual inclui Skills de bundle, command-skills do Claude,
padrões do Claude `settings.json`, padrões do Claude `.lsp.json` e
`lspServers` declarados no manifesto, command-skills do Cursor e diretórios de hook
compatíveis do Codex.

`openclaw plugins inspect <id>` também informa recursos de bundle detectados, além de
entradas de servidor MCP e LSP compatíveis ou incompatíveis para plugins baseados em bundle.

As origens de marketplace podem ser um nome de marketplace conhecido do Claude em
`~/.claude/plugins/known_marketplaces.json`, uma raiz de marketplace local ou um caminho
`marketplace.json`, uma abreviação do GitHub como `owner/repo`, uma URL de repositório do GitHub
ou uma URL git. Para marketplaces remotos, as entradas de plugin devem permanecer dentro do
repositório clonado do marketplace e usar apenas origens de caminho relativo.

Veja a [referência da CLI `openclaw plugins`](/cli/plugins) para detalhes completos.

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
ativação do plugin. O carregador ainda recorre a `activate(api)` para plugins mais antigos,
mas plugins empacotados e novos plugins externos devem tratar `register` como o
contrato público.

Métodos de registro comuns:

| Método                                  | O que registra             |
| --------------------------------------- | -------------------------- |
| `registerProvider`                      | Provedor de modelo (LLM)   |
| `registerChannel`                       | Canal de chat              |
| `registerTool`                          | Ferramenta de agente       |
| `registerHook` / `on(...)`              | Hooks de ciclo de vida     |
| `registerSpeechProvider`                | Texto para fala / STT      |
| `registerRealtimeTranscriptionProvider` | STT por streaming          |
| `registerRealtimeVoiceProvider`         | Voz duplex em tempo real   |
| `registerMediaUnderstandingProvider`    | Análise de imagem/áudio    |
| `registerImageGenerationProvider`       | Geração de imagem          |
| `registerVideoGenerationProvider`       | Geração de vídeo           |
| `registerWebFetchProvider`              | Provedor de busca/coleta na web |
| `registerWebSearchProvider`             | Pesquisa na web            |
| `registerHttpRoute`                     | Endpoint HTTP              |
| `registerCommand` / `registerCli`       | Comandos de CLI            |
| `registerContextEngine`                 | Mecanismo de contexto      |
| `registerService`                       | Serviço em segundo plano   |

Comportamento de guarda de hook para hooks tipados de ciclo de vida:

- `before_tool_call`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_tool_call`: `{ block: false }` não faz nada e não remove um bloqueio anterior.
- `before_install`: `{ block: true }` é terminal; handlers de prioridade inferior são ignorados.
- `before_install`: `{ block: false }` não faz nada e não remove um bloqueio anterior.
- `message_sending`: `{ cancel: true }` é terminal; handlers de prioridade inferior são ignorados.
- `message_sending`: `{ cancel: false }` não faz nada e não remove um cancelamento anterior.

Para o comportamento completo de hooks tipados, veja [SDK Overview](/pt-BR/plugins/sdk-overview#hook-decision-semantics).

## Relacionado

- [Building Plugins](/pt-BR/plugins/building-plugins) — crie seu próprio plugin
- [Plugin Bundles](/pt-BR/plugins/bundles) — compatibilidade de bundle com Codex/Claude/Cursor
- [Plugin Manifest](/pt-BR/plugins/manifest) — esquema do manifesto
- [Registering Tools](/pt-BR/plugins/building-plugins#registering-agent-tools) — adicione ferramentas de agente em um plugin
- [Plugin Internals](/pt-BR/plugins/architecture) — modelo de capacidades e pipeline de carregamento
- [Community Plugins](/pt-BR/plugins/community) — listagens de terceiros
